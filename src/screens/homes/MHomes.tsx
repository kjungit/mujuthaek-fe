"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, SlidersHorizontal } from "lucide-react";
import { MTabBar } from "@/components/layout/MTabBar";
import { MTopBar } from "@/components/layout/MTopBar";
import { MPage } from "@/components/layout/Responsive";
import { RankChip, VerdictBadge } from "@/components/ui/Badge";
import { activeFilterGroupCount, defaultMode, defaultSort } from "@/features/homes/filters";
import { useHomes } from "@/features/homes/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { HomeMapPin } from "@/mocks/homes";

const pinTone: Record<HomeMapPin["tone"], string> = {
  brand: "bg-brand text-white",
  plain: "bg-surface text-text",
  check: "bg-surface text-check-text",
};

/** 지도 모드에서 목록에 남기는 개수 */
const MAP_LIST_COUNT = 2;

export function MHomes() {
  const { data } = useHomes();
  const [view, setView] = useState<"list" | "map">("list");
  const isMap = view === "map";
  const items = isMap ? data.listings.slice(0, MAP_LIST_COUNT) : data.listings;

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
      <MTopBar mode="home" unread={3} />
      <main className="flex flex-1 flex-col gap-[14px] px-[16px] pt-[20px] pb-[28px]">
        <div className="flex items-end justify-between gap-[10px] px-[4px]">
          <div className="flex flex-col gap-[4px]">
            <h1 className="tracking-h1 m-0 text-[26px] font-extrabold">내 집</h1>
            <span className="text-text-sub text-[15px]">
              지원할 수 있는 곳 <strong className="text-brand-strong">{data.total}곳</strong>
            </span>
          </div>
          <div role="group" aria-label="보기 방식" className="bg-surface flex rounded-sm p-[3px]">
            {viewButton("list", "목록")}
            {viewButton("map", "지도")}
          </div>
        </div>

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
          <div
            aria-label="공고 위치 지도"
            role="img"
            className="rounded-card bg-placeholder-bg relative h-[340px] overflow-hidden"
          >
            <span
              aria-hidden
              className="bg-map-water absolute top-[150px] left-[-20px] h-[26px] w-[460px] rotate-[-8deg]"
            />
            <span
              aria-hidden
              className="bg-map-park-2 absolute top-[40px] left-[30px] h-[70px] w-[90px] rounded-[18px]"
            />
            {data.mapPins.map((p) => (
              <span
                key={p.id}
                className={cn(
                  "rounded-pill absolute px-[10px] py-[6px] text-[13px] font-extrabold shadow-[0_4px_10px_rgba(25,31,40,0.2)]",
                  pinTone[p.tone],
                )}
                style={{ left: p.left, top: p.top }}
              >
                {p.label}
              </span>
            ))}
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
              <span className="text-text-tertiary text-[12px]">{h.org}</span>
              <span className="text-[14px] font-semibold">{h.price}</span>
              <span className="text-text-sub text-[13px]">
                {h.prepAmount ? `준비할 돈 ${h.prepAmount}` : h.prepNote}
              </span>
            </span>
          </Link>
        ))}
        <a
          href="#"
          className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center self-center text-[14px] font-semibold no-underline"
        >
          지원 불가 공고까지 모두 보기
        </a>
      </main>
      <MTabBar mode="home" current={routes.homes} />
    </MPage>
  );
}
