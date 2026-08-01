import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../firebase";

// asia-northeast1 リージョンにデプロイしたFunctionを呼ぶ
const functions = getFunctions(app, "asia-northeast1");

// 予定表の写真(base64)をサーバー経由でClaude APIに送り、
// 予定リスト [{date, title, startTime, endTime, memo}, ...] を受け取る
export async function analyzeSchedulePhoto(imageBase64, mimeType) {
  const callable = httpsCallable(functions, "analyzeSchedulePhoto");
  const result = await callable({ imageBase64, mimeType });
  return result.data.events || [];
}
