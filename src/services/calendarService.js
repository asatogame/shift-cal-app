// Firestore データ構造
//
// users/{uid}
//   email, displayName, createdAt
//
// calendars/{calendarId}
//   name          : カレンダー名（例:「営業チーム」）
//   ownerId       : 作成者のuid
//   memberIds     : [uid, uid, ...] 参加メンバーのuid配列（自分も含む）
//   inviteCode    : 招待コード（6桁の英数字。これを知っている人が参加できる）
//   createdAt
//
// calendars/{calendarId}/events/{eventId}
//   title         : 予定タイトル
//   date          : "YYYY-MM-DD"
//   startTime     : "HH:mm" | null
//   endTime       : "HH:mm" | null
//   memo          : メモ（任意）
//   color         : 表示色（任意）
//   createdBy     : uid
//   createdAt
//
// calendars/{calendarId}/memos/{memoId}
//   date          : "YYYY-MM-DD"
//   text          : メモ/引き継ぎ内容
//   createdBy     : uid
//   createdByName : 投稿者名
//   createdAt
//
// calendars/{calendarId}/swapRequests/{requestId}
//   fromUid       : リクエスト元のuid
//   toUid         : リクエスト先のuid
//   fromEventId   : 交換元の予定ID
//   toEventId     : 交換先の予定ID（任意）
//   fromDate      : "YYYY-MM-DD"（元の日付）
//   toDate        : "YYYY-MM-DD"（交換希望日付）
//   fromTitle     : 元の予定タイトル
//   toTitle       : 交換先の予定タイトル（任意）
//   status        : "pending" | "accepted" | "rejected"
//   message       : メッセージ（任意）
//   fromName      : リクエスト元の名前
//   toName        : リクエスト先の名前
//   calendarName  : カレンダー名
//   createdAt

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { db } from "../firebase";

function randomInviteCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 紛らわしい文字を除外
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// 自分が参加しているカレンダー一覧をリアルタイム購読
export function subscribeMyCalendars(uid, callback) {
  const q = query(collection(db, "calendars"), where("memberIds", "array-contains", uid));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// 新しいカレンダーを作成
export async function createCalendar(uid, name) {
  const ref = await addDoc(collection(db, "calendars"), {
    name,
    ownerId: uid,
    memberIds: [uid],
    inviteCode: randomInviteCode(),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 招待コードでカレンダーに参加
export async function joinCalendarByCode(uid, inviteCode) {
  const q = query(collection(db, "calendars"), where("inviteCode", "==", inviteCode.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error("招待コードが見つかりませんでした");
  }
  const calDoc = snap.docs[0];
  await updateDoc(doc(db, "calendars", calDoc.id), {
    memberIds: arrayUnion(uid),
  });
  return calDoc.id;
}

// カレンダー内の予定をリアルタイム購読
export function subscribeEvents(calendarId, callback) {
  const q = collection(db, "calendars", calendarId, "events");
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// 予定を1件追加
export async function addEvent(calendarId, uid, event) {
  const ref = await addDoc(collection(db, "calendars", calendarId, "events"), {
    title: event.title,
    date: event.date,
    startTime: event.startTime || null,
    endTime: event.endTime || null,
    memo: event.memo || "",
    color: event.color || "#4F7CFF",
    createdBy: uid,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 複数の予定をまとめて追加（写真解析結果の一括登録用）
export async function addEventsBulk(calendarId, uid, events) {
  const results = [];
  for (const event of events) {
    const id = await addEvent(calendarId, uid, event);
    results.push(id);
  }
  return results;
}

export async function updateEvent(calendarId, eventId, patch) {
  await updateDoc(doc(db, "calendars", calendarId, "events", eventId), patch);
}

export async function deleteEvent(calendarId, eventId) {
  await deleteDoc(doc(db, "calendars", calendarId, "events", eventId));
}

export async function getCalendar(calendarId) {
  const snap = await getDoc(doc(db, "calendars", calendarId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// カレンダーの色を更新
export async function updateCalendarColor(calendarId, color) {
  await updateDoc(doc(db, "calendars", calendarId), { color });
}

// カレンダー名を更新
export async function updateCalendarName(calendarId, name) {
  await updateDoc(doc(db, "calendars", calendarId), { name });
}

// デフォルトカレンダーIDをユーザードキュメントに保存
export async function setDefaultCalendar(uid, calendarId) {
  const { setDoc: firestoreSetDoc } = await import("firebase/firestore");
  await firestoreSetDoc(doc(db, "users", uid), { defaultCalendarId: calendarId }, { merge: true });
}

// ユーザーのデフォルトカレンダーIDを取得
export async function getDefaultCalendar(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().defaultCalendarId || null : null;
}

// メンバー情報を取得（uid配列からユーザー名を引く）
export async function getMembers(memberIds) {
  const members = [];
  for (const uid of memberIds) {
    const snap = await getDoc(doc(db, "users", uid));
    if (snap.exists()) {
      members.push({ uid, ...snap.data() });
    } else {
      members.push({ uid, displayName: "不明", email: "" });
    }
  }
  return members;
}

// カレンダーから退出
export async function leaveCalendar(calendarId, uid) {
  const { arrayRemove } = await import("firebase/firestore");
  await updateDoc(doc(db, "calendars", calendarId), {
    memberIds: arrayRemove(uid),
  });
}

// カレンダーを削除（オーナーのみ）
export async function deleteCalendar(calendarId) {
  const { deleteDoc: firestoreDeleteDoc } = await import("firebase/firestore");
  await firestoreDeleteDoc(doc(db, "calendars", calendarId));
}

// ============================================================
// 日別メモ / 引き継ぎ
// ============================================================

// 日別メモをリアルタイム購読
export function subscribeMemos(calendarId, callback) {
  const q = collection(db, "calendars", calendarId, "memos");
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// 日別メモを追加
export async function addMemo(calendarId, { date, text, createdBy, createdByName }) {
  const ref = await addDoc(collection(db, "calendars", calendarId, "memos"), {
    date,
    text,
    createdBy,
    createdByName: createdByName || "",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 日別メモを削除
export async function deleteMemo(calendarId, memoId) {
  await deleteDoc(doc(db, "calendars", calendarId, "memos", memoId));
}

// ============================================================
// シフト交換リクエスト
// ============================================================

// 交換リクエストをリアルタイム購読（カレンダー単位）
export function subscribeSwapRequests(calendarId, callback) {
  const q = collection(db, "calendars", calendarId, "swapRequests");
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(list);
  });
}

// 交換リクエストを送信
export async function createSwapRequest(calendarId, request) {
  const ref = await addDoc(collection(db, "calendars", calendarId, "swapRequests"), {
    ...request,
    status: "pending",
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// 交換リクエストのステータスを更新
export async function updateSwapRequest(calendarId, requestId, status) {
  await updateDoc(doc(db, "calendars", calendarId, "swapRequests", requestId), { status });
}

// 交換リクエストに応じて予定を実際にスワップする
export async function executeSwap(calendarId, request) {
  // fromのイベントのcreatedByをtoUidに、toのイベントのcreatedByをfromUidに変更
  if (request.fromEventId) {
    await updateDoc(doc(db, "calendars", calendarId, "events", request.fromEventId), {
      createdBy: request.toUid,
    });
  }
  if (request.toEventId) {
    await updateDoc(doc(db, "calendars", calendarId, "events", request.toEventId), {
      createdBy: request.fromUid,
    });
  }
  // ステータスを承認済みに
  await updateSwapRequest(calendarId, request.id, "accepted");
}
