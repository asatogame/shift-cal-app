import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// 予定表の写真(base64)をサーバー経由でClaude APIに送り、
// 予定リスト [{date, title, startTime, endTime, memo}, ...] を受け取る
export async function analyzeSchedulePhoto(imageBase64, mimeType) {
  const callable = httpsCallable(functions, "analyzeSchedulePhoto");
  const result = await callable({ imageBase64, mimeType });
  return result.data.events || [];
}
