"use client";

import Link from "next/link";
import { BellRing } from "lucide-react";
import { usePush } from "@/features/alerts/usePush";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/** 홈의 「마감 전에 알려드릴까요?」: 이 브라우저 푸시 알림 켜기 (알림 화면과 같은 usePush). 켜져 있으면 숨겨요 */
export function HomePushCard({ variant }: { variant: "web" | "mobile" }) {
  const push = usePush();
  if (push.enabled) return null;
  const web = variant === "web";
  return (
    <section
      aria-label="알림 받기"
      className={cn(
        "bg-surface flex flex-col gap-[10px]",
        web ? "rounded-card px-[24px] py-[22px]" : "rounded-[22px] p-[18px]",
      )}
    >
      <div className="flex items-center gap-[14px]">
        <span className="rounded-control bg-fill text-text flex size-[44px] flex-none items-center justify-center">
          <BellRing size={22} strokeWidth={1.8} aria-hidden />
        </span>
        <span className="flex flex-1 flex-col gap-[2px]">
          <span className="text-[16px] font-bold">마감 전에 알려드릴까요?</span>
          <span className="text-text-sub text-[14px]">관심 공고 D-3, D-1에 알림</span>
        </span>
        <button
          type="button"
          onClick={() => void push.turnOn()}
          aria-disabled={push.pending || undefined}
          className="bg-brand min-h-[40px] flex-none cursor-pointer rounded-[10px] border-0 px-[14px] text-[14px] font-bold text-white aria-disabled:opacity-60"
        >
          {push.pending ? "켜는 중" : "켜기"}
        </button>
      </div>
      {push.error && (
        <span role="alert" className="text-danger-text text-[13px] font-bold">
          {push.error}
        </span>
      )}
      {!web && (
        <Link
          href={routes.install}
          className="text-brand-strong hover:text-brand-strong inline-flex min-h-[36px] items-center text-[13px] font-bold no-underline"
        >
          iPhone은 홈 화면에 추가해야 알림이 와요 · 방법 보기 ›
        </Link>
      )}
    </section>
  );
}
