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
    if (!isPushSupported()) return false;
    setPending(true);
    try {
      await subscribePush();
      setEnabled(true);
      return true;
    } catch {
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

  return { enabled, pending, turnOn, turnOff };
}
