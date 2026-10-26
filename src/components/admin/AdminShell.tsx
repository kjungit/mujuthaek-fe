"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardCheck,
  Database,
  ExternalLink,
  Flag,
  LayoutDashboard,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useAdminMe } from "@/components/admin/AdminGuard";
import { useAdminCounts } from "@/features/admin/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { adminOperator, type AdminCounts } from "@/mocks/admin";

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: { key: keyof AdminCounts; tone: "wait" | "fail" };
};

const menu: MenuItem[] = [
  { href: routes.admin, label: "개요", icon: LayoutDashboard },
  {
    href: routes.adminReview,
    label: "검수",
    icon: ClipboardCheck,
    count: { key: "reviewPending", tone: "wait" },
  },
  {
    href: routes.adminSources,
    label: "수집 현황",
    icon: Database,
    count: { key: "sourceIssues", tone: "fail" },
  },
  { href: routes.adminCriteria, label: "기준값", icon: SlidersHorizontal },
  {
    href: routes.adminReports,
    label: "제보",
    icon: Flag,
    count: { key: "newReports", tone: "wait" },
  },
];

/** 관리자 화면 틀: 왼쪽 232px 어두운 사이드바 + 본문 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: counts } = useAdminCounts();
  const me = useAdminMe(); // 실제 연결이면 로그인한 관리자 닉네임

  return (
    <div className="bg-bg text-text box-border flex min-h-screen w-full flex-wrap">
      <aside
        aria-label="관리자 메뉴"
        className="bg-brand-deep box-border flex flex-col gap-[28px] px-[16px] py-[24px] text-white"
        style={{ flex: "1 1 232px" }}
      >
        <Link
          href={routes.admin}
          className="inline-flex items-center gap-[9px] px-[8px] text-white no-underline hover:text-white"
        >
          <Logo size={30} inverted />
          <span className="tracking-logo text-[18px] font-extrabold">무주택자들</span>
          <span className="rounded-tag text-brand-deep-text-3 bg-white/12 px-[7px] py-[3px] text-[12px] font-bold">
            관리자
          </span>
        </Link>
        <nav aria-label="관리자 메뉴" className="flex flex-col gap-[4px]">
          {menu.map(({ href, label, icon: Icon, count }) => {
            const current = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-[46px] items-center gap-[10px] rounded-sm px-[12px] text-[15px] no-underline",
                  current
                    ? "bg-white/10 font-bold text-white hover:text-white"
                    : "text-brand-deep-text hover:text-brand-deep-text font-medium",
                )}
              >
                <Icon size={20} aria-hidden />
                <span className="flex-1">{label}</span>
                {count && (
                  <span
                    className={cn(
                      "rounded-pill px-[8px] py-[2px] text-[12px] font-extrabold",
                      count.tone === "fail"
                        ? "bg-danger-bg text-danger-text"
                        : "bg-check-bg text-check-text",
                    )}
                  >
                    {counts[count.key]}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <span className="flex-1" />
        <div className="flex flex-col gap-[6px] border-t border-solid border-white/12 pt-[16px]">
          <Link
            href={routes.home}
            className="text-brand-deep-text hover:text-brand-deep-text flex min-h-[44px] items-center gap-[8px] px-[12px] text-[14px] font-semibold no-underline"
          >
            <ExternalLink size={18} aria-hidden />
            서비스 화면 보기
          </Link>
          <span className="text-brand-deep-text px-[12px] text-[13px]">
            운영자 {me.data?.nickname ?? adminOperator}
          </span>
        </div>
      </aside>

      {/* 디자인의 버튼·입력칸은 브라우저 기본 자간(normal)을 써요 */}
      <main
        className="box-border flex min-w-0 flex-col gap-[20px] px-[40px] pt-[36px] pb-[56px] [&_button,&_input,&_select,&_textarea]:tracking-normal"
        style={{ flex: "999 1 640px" }}
      >
        {children}
      </main>
    </div>
  );
}

/** 페이지 제목 + 설명 */
export function AdminTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex flex-col gap-[6px]">
      <h1 className="tracking-h1 m-0 text-[30px] font-extrabold">{title}</h1>
      <span className="text-text-sub text-[15px]">{desc}</span>
    </div>
  );
}

/** 제목 줄: 왼쪽 제목, 오른쪽 탭·필터 */
export function AdminTitleRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-[12px]">{children}</div>;
}
