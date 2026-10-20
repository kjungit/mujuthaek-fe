"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 브라우저에서만 알 수 있는 값
    setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
    setIsStandalone(window.matchMedia("(display-mode: standalone)").matches);

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (isStandalone) return null;

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }

  return (
    <section className="rounded-xl border border-neutral-200 p-4">
      <h2 className="font-semibold">앱으로 설치하기</h2>
      {deferred && (
        <button
          type="button"
          onClick={install}
          className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          홈 화면에 추가
        </button>
      )}
      {isIOS && (
        <p className="mt-2 text-sm text-neutral-500">
          Safari 하단의 공유 버튼을 누른 뒤 &quot;홈 화면에 추가&quot;를 선택해 주세요.
        </p>
      )}
    </section>
  );
}
