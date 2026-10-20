import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}

export function isPushSupported() {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

export async function getPushSubscription() {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribePush() {
  if (!VAPID_PUBLIC_KEY) throw new Error("NEXT_PUBLIC_VAPID_PUBLIC_KEY가 설정되지 않았어요.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("알림 권한이 허용되지 않았어요.");

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  });
  await api.post(endpoints.pushSubscriptions, subscription.toJSON());
  return subscription;
}

export async function unsubscribePush() {
  const subscription = await getPushSubscription();
  if (!subscription) return;
  await api.delete(endpoints.pushSubscriptions, {
    body: { endpoint: subscription.endpoint },
  });
  await subscription.unsubscribe();
}
