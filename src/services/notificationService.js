import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// 通知ハンドラー設定（アプリがフォアグラウンドでも表示）
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 通知権限をリクエスト
export async function requestNotificationPermission() {
  if (Platform.OS !== "ios") return true;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// 前日リマインダーをスケジュール
// events: [{title, date("YYYY-MM-DD"), startTime("HH:mm"), calendarName}]
export async function scheduleShiftReminders(events) {
  // 既存のリマインダーをすべてキャンセル
  await Notifications.cancelAllScheduledNotificationsAsync();

  const now = new Date();
  let scheduled = 0;

  for (const event of events) {
    if (!event.date) continue;

    // 前日の20:00に通知
    const [year, month, day] = event.date.split("-").map(Number);
    const reminderDate = new Date(year, month - 1, day - 1, 20, 0, 0);

    // 過去の通知はスキップ
    if (reminderDate <= now) continue;

    const timeStr = event.startTime
      ? `${event.startTime}〜${event.endTime || ""}`
      : "";

    const body = timeStr
      ? `明日は「${event.title}」${timeStr} です`
      : `明日は「${event.title}」です`;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "📅 明日のシフト",
          body,
          data: { date: event.date },
        },
        trigger: {
          type: "date",
          date: reminderDate,
        },
      });
      scheduled++;
    } catch (e) {
      console.warn("通知スケジュール失敗:", e.message);
    }

    // iOS は最大64件まで
    if (scheduled >= 60) break;
  }

  return scheduled;
}

// スケジュール済み通知の件数を取得
export async function getScheduledCount() {
  const notifications = await Notifications.getAllScheduledNotificationsAsync();
  return notifications.length;
}
