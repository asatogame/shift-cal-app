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
