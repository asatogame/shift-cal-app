// Firebase Cloud Function: 予定表の写真をClaude APIで解析し、
// 構造化された予定リスト(JSON)を返す。
//
// デプロイ前の準備:
// 1. firebase-tools をインストール: npm install -g firebase-tools
// 2. functions フォルダで: npm install
// 3. Anthropic APIキーをシークレットとして登録:
//    firebase functions:secrets:set ANTHROPIC_API_KEY
//    （console.anthropic.com で取得したキーを貼り付ける）
// 4. デプロイ: firebase deploy --only functions

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");

admin.initializeApp();

const ANTHROPIC_API_KEY = defineSecret("ANTHROPIC_API_KEY");

const SYSTEM_PROMPT = `あなたは予定表の画像から予定を抽出するアシスタントです。
画像に写っている予定表・シフト表・手書きスケジュールなどを読み取り、
以下のJSON形式の配列だけを出力してください。説明文やコードブロックの記号(\`\`\`)は不要です。

[
  {
    "date": "YYYY-MM-DD",
    "title": "予定のタイトル",
    "startTime": "HH:mm または null",
    "endTime": "HH:mm または null",
    "memo": "補足があれば。なければ空文字"
  }
]

注意:
- 年が書かれていない場合は、画像を解析している「今日」に最も近い未来の日付として妥当な年を推定してください。
- 読み取れない・曖昧な項目は memo に「要確認」等と記載してください。
- 予定が1件も読み取れない場合は空配列 [] を返してください。`;

// 招待コードでカレンダーに参加（セキュリティルールをバイパスして検索・参加）
exports.joinByInviteCode = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const { inviteCode } = request.data || {};
    if (!inviteCode || typeof inviteCode !== "string") {
      throw new HttpsError("invalid-argument", "招待コードが必要です");
    }

    const uid = request.auth.uid;
    const firestore = admin.firestore();

    // 招待コードでカレンダーを検索（admin SDKなのでルールを回避）
    const snap = await firestore
      .collection("calendars")
      .where("inviteCode", "==", inviteCode.toUpperCase())
      .limit(1)
      .get();

    if (snap.empty) {
      throw new HttpsError("not-found", "招待コードが見つかりませんでした");
    }

    const calDoc = snap.docs[0];
    const data = calDoc.data();

    // 既にメンバーかチェック
    if (data.memberIds && data.memberIds.includes(uid)) {
      return { calendarId: calDoc.id, alreadyMember: true };
    }

    // メンバーに追加
    await calDoc.ref.update({
      memberIds: admin.firestore.FieldValue.arrayUnion(uid),
    });

    return { calendarId: calDoc.id, alreadyMember: false };
  }
);

exports.analyzeSchedulePhoto = onCall(
  { secrets: [ANTHROPIC_API_KEY], region: "asia-northeast1", memory: "512MiB" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "ログインが必要です");
    }

    const { imageBase64, mimeType } = request.data || {};
    if (!imageBase64 || !mimeType) {
      throw new HttpsError("invalid-argument", "imageBase64 と mimeType が必要です");
    }

    const apiKey = ANTHROPIC_API_KEY.value();

    const todayStr = new Date().toISOString().slice(0, 10);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mimeType,
                  data: imageBase64,
                },
              },
              {
                type: "text",
                text: `今日の日付は ${todayStr} です。この画像から予定を抽出してJSON配列のみを出力してください。`,
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error", response.status, errText);
      throw new HttpsError("internal", "画像解析に失敗しました");
    }

    const data = await response.json();
    const textBlock = (data.content || []).find((b) => b.type === "text");
    const raw = textBlock ? textBlock.text : "[]";

    let events = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      events = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (e) {
      console.error("JSON parse failed", raw);
      throw new HttpsError("internal", "解析結果の読み取りに失敗しました");
    }

    return { events };
  }
);
