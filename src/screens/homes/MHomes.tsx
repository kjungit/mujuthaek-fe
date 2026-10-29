"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Building, SlidersHorizontal } from "lucide-react";
import { MTabBar } from "@/components/layout/MTabBar";
import { MTopBar } from "@/components/layout/MTopBar";
import { MPage } from "@/components/layout/Responsive";
import { RankChip, VerdictBadge } from "@/components/ui/Badge";
import {
  activeFilterGroupCount,
  defaultMode,
  defaultSort,
  tenureParam,
} from "@/features/homes/filters";
import { useHomeList } from "@/features/homes/list";
import { HomesMap } from "@/components/homes/HomesMap";
import { EditConditionsLink } from "@/components/homes/EditConditionsLink";
import { RegionSelect } from "@/components/homes/RegionSelect";
import { useRegionFilter } from "@/features/homes/region";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/** 지도 모드에서 목록에 남기는 개수 */
const MAP_LIST_COUNT = 2;

export function MHomes() {
  const [view, setView] = useState<"list" | "map">("list");
  const [includeIneligible, setIncludeIneligible] = useState(false);
  const isMap = view === "map";
  const region = useRegionFilter();
  const list = useHomeList({
    region,
    mode: defaultMode,
    sort: defaultSort,
    includeIneligible,
    showOk: true,
    showCheck: true,
  });
  const visible = list.listings;
  const verdicts = useMemo(() => new Map(visible.map((l) => [l.id, l.verdict])), [visible]);
  const verdictOf = useCallback((id: string) => verdicts.get(id), [verdicts]);
  const items = isMap ? visible.slice(0, MAP_LIST_COUNT) : visible;

  const viewButton = (v: "list" | "map", label: string) => (
    <button
      type="button"
      aria-pressed={view === v}
      onClick={() => setView(v)}
      className={cn(
        "min-h-[38px] cursor-pointer rounded-[9px] border-0 px-[12px] text-[14px] font-bold",
        view === v ? "bg-text text-white" : "text-text-sub bg-transparent",
      )}
    >
      {label}
    </button>
  );

  return (
    <MPage>
      <MTopBar mode="home" />
      <main className="flex flex-1 flex-col gap-[14px] px-[16px] pt-[20px] pb-[28px]">
        <div className="flex items-end justify-between gap-[10px] px-[4px]">
          <div className="flex flex-col gap-[4px]">
            <h1 className="tracking-h1 m-0 text-[26px] font-extrabold">내 집</h1>
            <span className="text-text-sub flex flex-wrap items-center gap-x-[10px] text-[15px]">
              <span>
                지원할 수 있는 곳{" "}
                <strong className="text-brand-strong">{list.eligibleCount}곳</strong>
              </span>
              <EditConditionsLink />
            </span>
          </div>
          <div role="group" aria-label="보기 방식" className="bg-surface flex rounded-sm p-[3px]">
            {viewButton("list", "목록")}
            {viewButton("map", "지도")}
          </div>
        </div>

        <section aria-label="지역" className="px-[4px]">
          <RegionSelect filter={region} compact />
        </section>

        <div className="flex gap-[6px] overflow-x-auto px-[4px] pb-[2px]">
          <button
            type="button"
            className="rounded-pill bg-text inline-flex min-h-[40px] flex-none cursor-pointer items-center gap-[6px] border-0 px-[14px] text-[14px] font-bold text-white"
          >
            <SlidersHorizontal size={16} aria-hidden />
            필터 {activeFilterGroupCount}
          </button>
          <span className="rounded-pill bg-surface text-text-sub inline-flex min-h-[40px] flex-none items-center px-[14px] text-[14px] font-semibold">
            {defaultMode}
          </span>
          <span className="rounded-pill bg-surface text-text-sub inline-flex min-h-[40px] flex-none items-center px-[14px] text-[14px] font-semibold">
            {defaultSort}
          </span>
          <Link
            href={routes.score}
            className="rounded-pill bg-brand-soft text-brand-strong hover:text-brand-strong inline-flex min-h-[40px] flex-none items-center px-[14px] text-[14px] font-bold no-underline"
          >
            청약 가점 계산
          </Link>
        </div>

        {isMap && (
          <HomesMap
            regionCodes={region.codes}
            tenure={tenureParam[defaultMode]}
            verdictOf={verdictOf}
            className="h-[340px]"
          />
        )}

        {list.loading && (
          <div className="rounded-card bg-surface text-text-sub px-[20px] py-[36px] text-center text-[15px]">
            내 조건으로 공고를 판정하는 중이에요
          </div>
        )}
        {list.error && (
          <div
            role="alert"
            className="rounded-card bg-surface text-text-sub px-[20px] py-[36px] text-center text-[15px]"
          >
            공고를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요
          </div>
        )}
        {!list.loading && !list.error && visible.length === 0 && (
          <div className="rounded-card bg-surface text-text-sub flex flex-col items-center gap-[12px] px-[20px] py-[36px] text-center text-[15px]">
            고른 지역에는 지금 지원할 수 있는 공고가 없어요
            <button
              type="button"
              onClick={region.reset}
              className="bg-fill text-text min-h-[44px] cursor-pointer rounded-sm border-0 px-[16px] text-[14px] font-bold"
            >
              전체 지역 보기
            </button>
          </div>
        )}

        {items.map((h) => (
          <Link
            key={h.id}
            href={routes.notice(h.id)}
            className="bg-surface text-text hover:text-text flex gap-[14px] rounded-[22px] p-[16px] no-underline"
          >
            <span className="rounded-tile bg-placeholder-bg text-placeholder-icon relative flex size-[84px] flex-none items-center justify-center">
              <Building size={32} strokeWidth={1.4} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <span className="flex items-center justify-between gap-[6px]">
                <span className="flex gap-[4px]">
                  <VerdictBadge verdict={h.verdict} size="xs" />
                  {h.rank && <RankChip rank={h.rank} size="xs" />}
                </span>
                <span className="text-[13px] font-extrabold">{h.due}</span>
              </span>
              <span className="text-[16px] font-extrabold tracking-[-0.02em]">{h.title}</span>
              <span className="text-text-tertiary text-[12px]">
                {[h.org, region.regionLabelOf(h), h.life].filter(Boolean).join(" · ")}
              </span>
              {h.price && <span className="text-[14px] font-semibold">{h.price}</span>}
              <span className="text-text-sub text-[13px]">
                {h.prepAmount ? `준비할 돈 ${h.prepAmount}` : h.prepNote}
              </span>
            </span>
          </Link>
        ))}
        {list.hasMore && (
          <button
            type="button"
            onClick={list.loadMore}
            disabled={list.loadingMore}
            className="rounded-control bg-surface text-text min-h-[52px] cursor-pointer self-stretch border-0 text-[15px] font-bold disabled:cursor-default disabled:opacity-60"
          >
            {list.loadingMore ? "불러오는 중" : "더 보기"}
          </button>
        )}
        {!includeIneligible && (
          <button
            type="button"
            onClick={() => setIncludeIneligible(true)}
            className="text-text-sub inline-flex min-h-[44px] cursor-pointer items-center self-center border-0 bg-transparent p-0 text-[14px] font-semibold"
          >
            지원 불가 공고까지 모두 보기
            {list.ineligibleCount ? ` (${list.ineligibleCount}곳)` : ""}
          </button>
        )}
      </main>
      <MTabBar mode="home" current={routes.homes} />
    </MPage>
  );
}
