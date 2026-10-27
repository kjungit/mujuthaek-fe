"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { ApiError, api } from "@/lib/api/client";
import { USE_MOCKS } from "@/lib/api/config";
import { routes } from "@/lib/routes";

/** 내 정보 (GET /api/users/me). 관리자 화면은 role만 봐요 */
export type AdminMe = { id: string; nickname: string; role: "USER" | "ADMIN" | "SUPER_ADMIN" };

/** 로그인한 회원 정보. 목업이면 부르지 않아요. 로그인 안 했으면 401 오류로 끝나요(다시 시도하지 않음) */
export function useAdminMe() {
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => api.get<AdminMe>("/api/users/me"),
    enabled: !USE_MOCKS,
    retry: false,
    staleTime: 5 * 60_000,
  });
}

/**
 * 관리자만 관리자 화면을 보게 해요. 데이터는 서버가 막지만(ADMIN만 /api/admin/**), 화면이 오류만 보이지 않게 먼저 확인해요.
 * 로그인 안 했으면 로그인 안내, 관리자가 아니면 「관리자만 볼 수 있어요」를 보여 줘요.
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const me = useAdminMe();
  if (USE_MOCKS) return <>{children}</>;
  if (me.isPending) return <Notice title="권한을 확인하고 있어요" />;
  if (me.isError) {
    const status = me.error instanceof ApiError ? me.error.status : 0;
    if (status === 401) {
      return (
        <Notice
          title="로그인이 필요해요"
          text="관리자 계정으로 로그인한 뒤 다시 들어와 주세요."
          action={{ href: routes.login, label: "로그인하기" }}
        />
      );
    }
    return (
      <Notice
        title="권한을 확인하지 못했어요"
        text="잠시 뒤 다시 시도해 주세요."
        action={{ href: routes.main, label: "처음 화면으로" }}
      />
    );
  }
  // 최상위 관리자(SUPER_ADMIN)도 관리자예요. 화면별 권한은 서버가 다시 막아요
  if (me.data.role !== "ADMIN" && me.data.role !== "SUPER_ADMIN") {
    return (
      <Notice
        title="관리자만 볼 수 있어요"
        text="관리자 권한이 필요한 화면이에요. 권한이 필요하면 운영 담당에게 요청해 주세요."
        action={{ href: routes.main, label: "처음 화면으로" }}
      />
    );
  }
  return <>{children}</>;
}

function Notice({
  title,
  text,
  action,
}: {
  title: string;
  text?: string;
  action?: { href: string; label: string };
}) {
  return (
    <main className="bg-bg text-text flex min-h-screen items-center justify-center px-[16px]">
      <section
        role={action ? "alert" : "status"}
        className="rounded-card bg-surface flex w-full max-w-[420px] flex-col items-center gap-[12px] px-[28px] py-[32px] text-center"
      >
        {action && <ShieldAlert size={36} className="text-text-sub" aria-hidden />}
        <h1 className="m-0 text-[20px] font-extrabold">{title}</h1>
        {text && <p className="text-text-sub m-0 text-[15px] leading-[1.6]">{text}</p>}
        {action && (
          <Link
            href={action.href}
            className="rounded-control bg-brand mt-[8px] flex min-h-[48px] items-center px-[20px] text-[15px] font-bold text-white no-underline hover:text-white"
          >
            {action.label}
          </Link>
        )}
      </section>
    </main>
  );
}
