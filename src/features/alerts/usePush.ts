"use client";

import { useCallback, useEffect, useState } from "react";
import { getPushSubscription, isPushSupported, subscribePush, unsubscribePush } from "@/lib/push";

/**
 * 이 브라우저의 푸시 알림 구독 상태.
 * 지원하지 않는 브라우저거나 구독에 실패하면 꺼진 상태로 남아요.
 */
export function usePush() {
  const [enabled, setEnabled] = useState(false);
  const [pending, setPending] = useState(false);
  /** 켜기에 실패한 이유 (화면에 보여 줘요) */
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    let alive = true;
    getPushSubscription()
      .then((sub) => {
        if (alive) setEnabled(!!sub);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const turnOn = useCallback(async () => {
    if (!isPushSupported()) {
      setError("이 브라우저는 웹 푸시 알림을 지원하지 않아요.");
      return false;
    }
    setPending(true);
    setError(null);
    try {
      await subscribePush();
      setEnabled(true);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "알림을 켜지 못했어요.");
      return false;
    } finally {
      setPending(false);
    }
  }, []);

  const turnOff = useCallback(async () => {
    if (!isPushSupported()) return;
    setPending(true);
    try {
      await unsubscribePush();
      setEnabled(false);
    } catch {
      // 해지에 실패하면 켜진 상태를 그대로 둬요
    } finally {
      setPending(false);
    }
  }, []);

  return { enabled, pending, error, turnOn, turnOff };
}
