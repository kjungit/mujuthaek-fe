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

/** 공개키: 설정 값이 있으면 그것, 없으면 백엔드에서 받아요 (백엔드에 키가 없으면 503) */
async function publicKey() {
  if (VAPID_PUBLIC_KEY) return VAPID_PUBLIC_KEY;
  const { publicKey } = await api.get<{ publicKey: string }>(endpoints.pushPublicKey);
  return publicKey;
}

export async function subscribePush() {
  const key = await publicKey().catch(() => "");
  if (!key) throw new Error("웹 푸시 공개키를 받지 못했어요.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("알림 권한이 허용되지 않았어요.");

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  // 기기 목록에 보여 줄 이름으로 브라우저 정보를 함께 보내요 (백엔드가 200자로 잘라요)
  await api.put(endpoints.pushSubscriptions, {
    ...subscription.toJSON(),
    userAgent: navigator.userAgent,
  });
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
