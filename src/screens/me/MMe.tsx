"use client";

import Link from "next/link";
import { ChevronRight, Lock, User } from "lucide-react";
import { MTabBar } from "@/components/layout/MTabBar";
import { MTopBar } from "@/components/layout/MTopBar";
import { MPage } from "@/components/layout/Responsive";
import { useMe } from "@/features/me/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const row =
  "rounded-tile text-text hover:text-text flex min-h-[56px] items-center gap-[12px] px-[14px] no-underline";

const supportLinks = [
  { label: "공지사항", href: routes.announcements },
  { label: "자주 묻는 질문", href: routes.faq },
  { label: "이용약관", href: routes.terms },
  { label: "개인정보처리방침", href: routes.privacy, strong: true },
];

function RowInner({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <>
      <span className="flex-1 text-[16px] font-semibold">{label}</span>
      <span className={cn("text-[14px]", accent ? "text-brand-strong font-bold" : "text-text-sub")}>
        {value}
      </span>
      <ChevronRight size={18} className="text-text-tertiary" aria-hidden />
    </>
  );
}

export function MMe() {
  const { data } = useMe();

  return (
    <MPage>
      <MTopBar mode="home" unread={3} />
      <main className="flex flex-1 flex-col gap-[12px] px-[16px] pt-[20px] pb-[28px]">
        <section
          aria-label="계정"
          className="rounded-card bg-surface flex items-center gap-[14px] p-[20px]"
        >
          <span className="rounded-pill bg-brand-soft text-brand flex size-[52px] flex-none items-center justify-center">
            <User size={26} aria-hidden />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[19px] font-extrabold">{data.account.name}</span>
            <span className="text-text-sub text-[14px]">
              {data.account.email} · {data.account.provider}
            </span>
          </span>
        </section>

        <section
          aria-labelledby="cond-h"
          className="rounded-card bg-surface flex flex-col gap-[12px] px-[20px] py-[18px]"
        >
          <div className="flex items-center justify-between">
            <h2 id="cond-h" className="m-0 text-[17px] font-extrabold">
              내 조건
            </h2>
            <Link
              href={routes.profile}
              className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
            >
              수정
            </Link>
          </div>
          <div className="flex flex-wrap gap-[6px]">
            {data.conditionChips.map((c) => (
              <span
                key={c}
                className="rounded-pill bg-fill text-text-sub px-[12px] py-[6px] text-[14px] font-semibold"
              >
                {c}
              </span>
            ))}
            <span className="rounded-pill bg-check-bg text-check-text px-[12px] py-[6px] text-[14px] font-bold">
              {data.missingChip}
            </span>
          </div>
          <span className="text-text-sub flex items-center gap-[6px] text-[13px]">
            <Lock size={15} aria-hidden />
            소득·자산은 익명 모드라 저장하지 않았어요
          </span>
        </section>

        <nav aria-label="내 정보 메뉴" className="rounded-card bg-surface flex flex-col p-[6px]">
          <Link href={routes.homes} className={row}>
            <RowInner label="관심 공고" value={String(data.favorites.length)} />
          </Link>
          <Link href={routes.alerts} className={row}>
            <RowInner label="알림 설정" value={data.mobileMenu.notif} />
          </Link>
          <Link href={routes.privacy} className={row}>
            <RowInner
              label="개인정보 · 익명 모드"
              value={data.anon ? "켜짐" : "꺼짐"}
              accent={data.anon}
            />
          </Link>
          <Link href={routes.bizOnboarding} className={row}>
            <RowInner label="사업 정보" value={data.mobileMenu.business} />
          </Link>
          {/* 내 제보 목록 화면은 아직 없어요 */}
          <button
            type="button"
            className={cn(row, "cursor-pointer border-0 bg-transparent text-left")}
          >
            <RowInner label="내 제보" value={`답변 ${data.mobileMenu.reportReplies}`} />
          </button>
        </nav>

        <nav aria-label="고객센터" className="rounded-card bg-surface flex flex-col p-[6px]">
          {supportLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={cn(
                "rounded-tile text-text hover:text-text flex min-h-[52px] items-center justify-between px-[14px] text-[15px] no-underline",
                l.strong && "font-bold",
              )}
            >
              {l.label}
              <ChevronRight size={18} className="text-text-tertiary" aria-hidden />
            </Link>
          ))}
        </nav>

        <div className="flex justify-between px-[8px]">
          <Link
            href={routes.main}
            className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center text-[14px] font-semibold no-underline"
          >
            로그아웃
          </Link>
          <button
            type="button"
            className="text-text-sub inline-flex min-h-[44px] cursor-pointer items-center border-0 bg-transparent p-0 text-[14px] font-semibold"
          >
            회원 탈퇴
          </button>
        </div>
      </main>
      <MTabBar mode="home" current={routes.me} />
    </MPage>
  );
}
