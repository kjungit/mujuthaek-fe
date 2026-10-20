"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { MTabBar } from "@/components/layout/MTabBar";
import { MTopBar } from "@/components/layout/MTopBar";
import { MPage } from "@/components/layout/Responsive";
import { VerdictBadge } from "@/components/ui/Badge";
import { useHomeSummary } from "@/features/home/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { HomeNewsItem } from "@/mocks/home";

const newsHref = (item: HomeNewsItem) =>
  item.kind === "policy" ? routes.benefit(item.id) : routes.notice(item.id);

const MOBILE_NEWS_COUNT = 3;

export function MHome() {
  const { data } = useHomeSummary();

  return (
    <MPage>
      <MTopBar mode="home" unread={3} />
      <main className="flex flex-1 flex-col gap-[14px] px-[16px] pt-[20px] pb-[28px]">
        <div className="flex flex-col gap-[10px] px-[4px]">
          <h1 className="tracking-h1 m-0 text-[24px] font-extrabold">내 조건으로 찾은 결과예요</h1>
          <div className="flex gap-[6px] overflow-x-auto pb-[2px]">
            {data.conditions.map((c) => (
              <span
                key={c}
                className="rounded-pill bg-surface text-text-sub flex-none px-[12px] py-[6px] text-[13px] font-semibold"
              >
                {c}
              </span>
            ))}
            <Link
              href={routes.profile}
              className="rounded-pill bg-brand-soft text-brand-strong flex-none px-[12px] py-[6px] text-[13px] font-bold no-underline"
            >
              조건 수정
            </Link>
          </div>
        </div>

        <Link
          href={routes.homes}
          className="bg-brand-deep flex items-end justify-between gap-[12px] rounded-[26px] p-[22px] text-white no-underline hover:text-white"
        >
          <span className="flex flex-col gap-[6px]">
            <span className="text-brand-deep-text text-[14px] font-semibold">
              지원 가능한 청약·공공임대
            </span>
            <span className="tracking-h1 text-[36px] font-extrabold">{data.homes.count}곳</span>
            <span className="text-brand-deep-text text-[13px]">
              이번 주 새로 {data.homes.newThisWeek}곳 · 마감 임박 {data.homes.closingSoon}곳
            </span>
          </span>
          <span className="rounded-pill flex size-[40px] flex-none items-center justify-center bg-white/12">
            <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
          </span>
        </Link>

        <div className="grid grid-cols-2 gap-[10px]">
          <Link
            href={routes.benefits}
            className="bg-surface text-text hover:text-text flex flex-col gap-[6px] rounded-[22px] p-[18px] no-underline"
          >
            <span className="text-text-sub text-[13px] font-semibold">받을 수 있는 혜택</span>
            <span className="tracking-title text-[22px] font-extrabold">
              연 {data.benefits.yearlyAmount}
            </span>
            <span className="text-text-sub text-[13px]">
              {data.benefits.count}개 · 확인 필요 {data.benefits.needCheck}개
            </span>
          </Link>
          <Link
            href={routes.life}
            className="bg-surface text-text hover:text-text flex flex-col gap-[6px] rounded-[22px] p-[18px] no-underline"
          >
            <span className="text-text-sub text-[13px] font-semibold">내 생활권 점수</span>
            <span className="tracking-title text-[22px] font-extrabold">{data.life.score}점</span>
            <span className="text-text-sub text-[13px]">
              직장까지 평균 {data.life.commuteMinutes}분
            </span>
          </Link>
        </div>

        <section
          aria-labelledby="due-h"
          className="rounded-card bg-surface flex flex-col px-[18px] pt-[18px] pb-[8px]"
        >
          <div className="flex items-center justify-between">
            <h2 id="due-h" className="m-0 text-[17px] font-extrabold">
              마감 임박 관심 공고
            </h2>
            <Link
              href={routes.me}
              className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
            >
              전체
            </Link>
          </div>
          {data.deadlines.map((d, i) => (
            <Link
              key={d.id}
              href={routes.notice(d.id)}
              className={cn(
                "text-text hover:text-text flex items-center gap-[12px] py-[12px] no-underline",
                i < data.deadlines.length - 1 && "border-line-soft border-b border-solid",
              )}
            >
              <span className="flex flex-1 flex-col gap-[2px]">
                <span className="text-[16px] font-bold">{d.title}</span>
                <span className="text-text-sub text-[13px]">{d.meta}</span>
              </span>
              <span
                className={cn(
                  "rounded-badge px-[9px] py-[4px] text-[13px] font-extrabold",
                  d.dday <= 3 ? "bg-text text-white" : "bg-fill text-text",
                )}
              >
                D-{d.dday}
              </span>
            </Link>
          ))}
        </section>

        <section
          aria-labelledby="new-h"
          className="rounded-card bg-surface flex flex-col px-[18px] pt-[18px] pb-[8px]"
        >
          <div className="flex items-center justify-between">
            <h2 id="new-h" className="m-0 text-[17px] font-extrabold">
              이번 주 새 소식
            </h2>
            <Link
              href={routes.alerts}
              className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
            >
              전체
            </Link>
          </div>
          {data.news.slice(0, MOBILE_NEWS_COUNT).map((item, i, list) => (
            <Link
              key={item.id}
              href={newsHref(item)}
              className={cn(
                "text-text hover:text-text flex flex-col gap-[6px] py-[12px] no-underline",
                i < list.length - 1 && "border-line-soft border-b border-solid",
              )}
            >
              <span className="flex justify-between">
                <span className="text-text-sub text-[12px]">{item.meta}</span>
                <VerdictBadge verdict={item.verdict} size="xs" />
              </span>
              <span className="text-[15px] font-bold">{item.title}</span>
            </Link>
          ))}
        </section>

        <Link
          href={routes.benefit(data.suggestedBenefit.id)}
          className="bg-brand-soft text-text hover:text-text flex items-center gap-[12px] rounded-[22px] p-[18px] no-underline"
        >
          <span className="flex flex-1 flex-col gap-[4px]">
            <span className="text-brand-strong text-[13px] font-bold">이런 혜택도 있어요</span>
            <span className="text-[16px] font-extrabold">{data.suggestedBenefit.title}</span>
            <span className="text-brand-strong text-[13px]">
              받을 수 있는데 아직 안 본 혜택이에요
            </span>
          </span>
          <ChevronRight size={20} className="text-brand-strong" aria-hidden />
        </Link>
      </main>
      <MTabBar mode="home" current={routes.home} />
    </MPage>
  );
}
