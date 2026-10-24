"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { refreshAccessToken } from "@/lib/api/client";
import { USE_MOCKS } from "@/lib/api/config";
import { routes } from "@/lib/routes";

/**
 * 간편 로그인을 마치고 돌아오는 곳. 백엔드가 refresh token 쿠키를 줬으니 access token을 받고,
 * 처음 가입했으면(?new=1) 약관 동의로, 아니면 홈으로 가요
 */
export function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const joined = params.get("new") === "1";

  useEffect(() => {
    let cancelled = false;
    (USE_MOCKS ? Promise.resolve("mock") : refreshAccessToken()).then((token) => {
      if (cancelled) return;
      if (!token) router.replace(`${routes.login}?error=social&reason=token`);
      else router.replace(joined ? routes.signup : routes.home);
    });
    return () => {
      cancelled = true;
    };
  }, [joined, router]);

  return (
    <main className="bg-bg text-text-sub flex min-h-screen items-center justify-center text-[16px] font-semibold">
      <span role="status">로그인하는 중이에요…</span>
    </main>
  );
}
