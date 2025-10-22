export async function showLocalNotification(title: string, body?: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    try {
      await Notification.requestPermission();
    } catch {
      return;
    }
  }

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}
