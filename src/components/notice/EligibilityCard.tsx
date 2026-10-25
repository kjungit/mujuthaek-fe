"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, CircleCheck, CircleX, FileText } from "lucide-react";
import { VerdictBadge } from "@/components/ui/Badge";
import type { JudgedItem, NoticeJudgment } from "@/features/notice/judgment";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

type Props = {
  judgment: NoticeJudgment | null;
  loading: boolean;
  error: boolean;
  variant: "web" | "mobile";
  /** 근거 원문 열기 (쪽) */
  onOpenOriginal: (page?: number) => void;
};

function Status({ item, web }: { item: JudgedItem; web: boolean }) {
  const text = web ? "text-[15px]" : "text-[14px]";
  if (item.status === "met") {
    return (
      <span
        className={cn(
          "text-brand-strong inline-flex flex-none items-center gap-[5px] font-bold",
          text,
        )}
      >
        {web && <CircleCheck size={19} aria-hidden />}
        충족
      </span>
    );
  }
  if (item.status === "notMet") {
    return (
      <span
        className={cn("text-text-sub inline-flex flex-none items-center gap-[5px] font-bold", text)}
      >
        {web && <CircleX size={19} aria-hidden />}
        해당 안 돼요
      </span>
    );
  }
  if (item.needsInput) {
    return (
      <Link
        href={routes.profile}
        className="bg-check-bg text-check-text hover:text-check-text inline-flex min-h-[40px] flex-none items-center gap-[5px] rounded-[10px] px-[12px] text-[14px] font-bold no-underline"
      >
        {web && <CircleAlert size={17} aria-hidden />}
        입력하고 확인
      </Link>
    );
  }
  return (
    <span className="text-check-text inline-flex flex-none items-center gap-[5px] text-[14px] font-bold">
      {web && <CircleAlert size={17} aria-hidden />}
      원문 확인
    </span>
  );
}

/** 공고 상세 › 내 자격: 공급 대상별 조건 체크 (✓ 충족 · ? 확인 필요 · ✗ 해당 안 됨) */
export function EligibilityCard({ judgment, loading, error, variant, onOpenOriginal }: Props) {
  const web = variant === "web";
  const [picked, setPicked] = useState<string | null>(null);
  const targets = judgment?.targets ?? [];
  const target = targets.find((t) => t.id === picked) ?? targets[0];
  const Heading = web ? "h2" : "h3";
  const firstPage = target?.items.find((i) => i.page)?.page;

  return (
    <section
      aria-labelledby="eligibility-h"
      className={cn(
        "bg-surface flex flex-col",
        web
          ? "rounded-card-lg px-[26px] pt-[26px] pb-[18px]"
          : "rounded-card mx-[16px] px-[20px] pt-[16px] pb-[6px]",
      )}
    >
      <div className={cn("flex items-center justify-between", web && "mb-[6px]")}>
        <Heading
          id="eligibility-h"
          className={cn("m-0 font-extrabold", web ? "tracking-title text-[20px]" : "text-[17px]")}
        >
          내 자격
        </Heading>
        <button
          type="button"
          onClick={() => onOpenOriginal(firstPage)}
          className={cn(
            "inline-flex min-h-[44px] cursor-pointer items-center gap-[4px] border-0 bg-transparent p-0 text-[14px] font-bold",
            web ? "text-brand-strong" : "text-brand",
          )}
        >
          {web && <FileText size={16} aria-hidden />}
          근거 원문
        </button>
      </div>

      {loading && (
        <p className="text-text-sub m-0 py-[12px] text-[15px]">내 조건으로 판정하는 중이에요</p>
      )}
      {error && (
        <p role="alert" className="text-text-sub m-0 py-[12px] text-[15px]">
          판정을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요
        </p>
      )}
      {judgment?.reason && (
        <p className="text-text-sub m-0 py-[12px] text-[15px] leading-[1.5]">{judgment.reason}</p>
      )}

      {targets.length > 1 && (
        <div
          role="group"
          aria-label="공급 대상"
          className={cn(
            "flex gap-[6px] pt-[4px] pb-[8px]",
            web ? "flex-wrap" : "-mx-[4px] overflow-x-auto px-[4px]",
          )}
        >
          {targets.map((t) => {
            const on = t.id === target?.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(t.id)}
                className={cn(
                  "rounded-pill inline-flex min-h-[36px] flex-none cursor-pointer items-center border-0 px-[14px] text-[13px] whitespace-nowrap",
                  on ? "bg-text font-bold text-white" : "bg-fill text-text-sub font-semibold",
                )}
              >
                {t.name}
              </button>
            );
          })}
        </div>
      )}

      {target && (targets.length > 1 || target.counts.notMet + target.counts.unknown > 0) && (
        <div className="flex flex-wrap items-center gap-[8px] pb-[4px]">
          <VerdictBadge verdict={target.verdict} size={web ? "md" : "sm"} />
          <span className="text-text-sub text-[13px]">
            {[
              `조건 ${target.items.length}개`,
              target.counts.met && `충족 ${target.counts.met}`,
              target.counts.unknown && `확인 필요 ${target.counts.unknown}`,
              target.counts.notMet && `해당 안 됨 ${target.counts.notMet}`,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      )}

      {target?.items.map((item, i) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center justify-between gap-[10px]",
            item.status === "met"
              ? web
                ? "py-[12px]"
                : "py-[11px]"
              : web
                ? "py-[12px]"
                : "py-[8px]",
            i < target.items.length - 1 && "border-line-soft border-b border-solid",
          )}
        >
          <span className="flex min-w-0 flex-col gap-[2px]">
            <span className="text-[15px]">
              {web ? item.label : (item.shortLabel ?? item.label)}
            </span>
            {item.reason && item.status !== "met" && (
              <span className="text-text-sub text-[13px] leading-[1.4]">{item.reason}</span>
            )}
          </span>
          <Status item={item} web={web} />
        </div>
      ))}
    </section>
  );
}
