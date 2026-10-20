"use client";

import { useEffect, useState } from "react";
import { getPushSubscription, isPushSupported, subscribePush, unsubscribePush } from "@/lib/push";

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저에서만 알 수 있는 값
    setSupported(true);
    getPushSubscription().then((sub) => setSubscribed(sub !== null));
  }, []);

  if (!supported) return null;

  async function toggle() {
    setPending(true);
    setError(null);
    try {
      if (subscribed) {
        await unsubscribePush();
        setSubscribed(false);
      } else {
        await subscribePush();
        setSubscribed(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림 설정에 실패했어요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-4">
      <h2 className="font-semibold">새 공고 알림</h2>
      <p className="mt-1 text-sm text-neutral-500">
        {subscribed ? "알림을 받고 있어요." : "지원 가능한 공고가 올라오면 알려드려요."}
      </p>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {subscribed ? "알림 끄기" : "알림 켜기"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
