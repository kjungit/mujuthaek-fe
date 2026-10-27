"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { Building, Heart, House } from "lucide-react";
import { WebHeader } from "@/components/layout/WebHeader";
import { WebMain, WebPage } from "@/components/layout/Responsive";
import { RankChip, VerdictBadge } from "@/components/ui/Badge";
import { InfoTag } from "@/components/ui/Chip";
import {
  defaultChecked,
  defaultMode,
  defaultSort,
  filterGroups,
  moveInModes,
  sortOptions,
  tenureParam,
  type FilterKey,
  type SortOption,
} from "@/features/homes/filters";
import { HomesMap } from "@/components/homes/HomesMap";
import { RegionSelect } from "@/components/homes/RegionSelect";
import { useHomeList } from "@/features/homes/list";
import { useRegionFilter } from "@/features/homes/region";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { HomeListing } from "@/mocks/homes";

function ListingCard({
  item,
  regionLabel,
  liked,
  onToggleLike,
}: {
  item: HomeListing;
  regionLabel: string;
  liked: boolean;
  onToggleLike: () => void;
}) {
  const Icon = item.findYourOwn ? House : Building;
  return (
    <article className="rounded-card bg-surface flex flex-col overflow-hidden">
      <div
        className={cn(
          "relative flex h-[148px] items-center justify-center",
          item.findYourOwn ? "bg-brand-soft text-brand" : "bg-placeholder-bg text-off",
        )}
      >
        <Icon size={44} strokeWidth={1.4} aria-hidden />
        <span className="absolute top-[14px] left-[14px] flex gap-[4px]">
          {item.findYourOwn ? (
            <span className="rounded-badge bg-surface text-ok-text px-[10px] py-[5px] text-[13px] font-bold">
              지원 가능
            </span>
          ) : (
            <VerdictBadge verdict={item.verdict} />
          )}
          {item.rank && <RankChip rank={item.rank} />}
        </span>
        <button
          type="button"
          aria-label={liked ? "관심 해제" : "관심 등록"}
          aria-pressed={liked}
          onClick={onToggleLike}
          className={cn(
            "rounded-pill bg-surface absolute top-[10px] right-[10px] flex size-[40px] cursor-pointer items-center justify-center border-0",
            liked ? "text-brand" : "text-text-sub",
          )}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} aria-hidden />
        </button>
      </div>
      <Link
        href={routes.notice(item.id)}
        className="text-text hover:text-text flex flex-col gap-[8px] px-[20px] pt-[18px] pb-[20px] no-underline"
      >
        <span className="text-text-tertiary text-[13px]">
          {item.org} · {regionLabel}
        </span>
        <span className="tracking-title text-[18px] font-extrabold">{item.title}</span>
        {item.price && <span className="text-[15px] font-semibold">{item.price}</span>}
        <span className="flex flex-wrap gap-[4px]">
          {item.life && <InfoTag>{item.life}</InfoTag>}
          {item.tags.map((t) => (
            <InfoTag key={t}>{t}</InfoTag>
          ))}
        </span>
        <span className="border-line-soft mt-[4px] flex items-center justify-between border-t border-solid pt-[12px]">
          <span className="text-text-sub text-[13px]">
            {item.prepAmount ? (
              <>
                준비할 돈 <strong className="text-text">{item.prepAmount}</strong>
              </>
            ) : (
              item.prepNote
            )}
          </span>
          <span className="text-[14px] font-extrabold">{item.dueLong ?? item.due}</span>
        </span>
      </Link>
    </article>
  );
}

export function WebHomes() {
  const [mode, setMode] = useState(defaultMode);
  const [sort, setSort] = useState<SortOption>(defaultSort);
  const [checked, setChecked] = useState(defaultChecked);
  const region = useRegionFilter();
  const list = useHomeList({
    region,
    mode,
    sort,
    includeIneligible: checked.ineligible,
    showOk: checked.ok,
    showCheck: checked.check,
  });
  const visible = list.listings;
  const [view, setView] = useState<"list" | "map">("list");
  const verdicts = useMemo(() => new Map(visible.map((l) => [l.id, l.verdict])), [visible]);
  const verdictOf = useCallback((id: string) => verdicts.get(id), [verdicts]);
  // 관심 공고는 로그인 연결 때 서버 값으로 바꿔요 (지금은 이 화면 안에서만)
  const [liked, setLiked] = useState(
    () => new Set(visible.filter((l) => l.liked).map((l) => l.id)),
  );

  const toggleLike = (id: string) =>
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resetFilters = () => {
    setMode(defaultMode);
    setChecked(defaultChecked);
    region.reset();
  };

  return (
    <WebPage>
      <WebHeader mode="home" current={routes.homes} unread={3} />
      <WebMain>
        <div className="flex flex-wrap items-end justify-between gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <h1 className="tracking-h1 m-0 text-[32px] font-extrabold">내 집</h1>
            <span className="text-text-sub text-[16px]">
              내 조건으로 지원할 수 있는 곳{" "}
              <strong className="text-brand-strong">{list.eligibleCount}곳</strong>
              {list.needsInputCount ? ` · 확인 필요 ${list.needsInputCount}곳` : ""}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-[10px]">
            <div role="group" aria-label="보기 방식" className="bg-surface flex rounded-sm p-[4px]">
              {(["list", "map"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={cn(
                    "min-h-[36px] cursor-pointer rounded-[9px] border-0 px-[14px] text-[14px]",
                    view === v
                      ? "bg-text font-bold text-white"
                      : "text-text-sub bg-transparent font-semibold",
                  )}
                >
                  {v === "list" ? "목록" : "지도"}
                </button>
              ))}
            </div>
            <label className="text-text-sub inline-flex items-center gap-[8px] text-[14px]">
              정렬
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-surface text-text min-h-[44px] rounded-sm border-0 px-[14px] text-[15px] font-semibold"
              >
                {sortOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-[24px]">
          <aside
            aria-label="필터"
            className="rounded-card bg-surface box-content flex min-w-0 flex-col gap-[22px] p-[22px]"
            style={{ flex: "1 1 250px" }}
          >
            <fieldset className="m-0 flex flex-col border-0 p-0">
              <legend className="mb-[8px] p-0 text-[15px] font-extrabold">지역</legend>
              <RegionSelect filter={region} />
            </fieldset>
            <div
              role="group"
              aria-label="입주 방식"
              className="bg-fill grid grid-cols-2 rounded-sm p-[4px]"
            >
              {moveInModes.map((m) => {
                const on = m === mode;
                return (
                  <button
                    key={m}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setMode(m)}
                    className={cn(
                      "min-h-[40px] cursor-pointer rounded-[9px] border-0 text-[14px]",
                      on
                        ? "bg-surface text-text shadow-seg font-bold"
                        : "text-text-sub bg-transparent font-semibold",
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            {filterGroups.map((g) => (
              <fieldset key={g.key} className="m-0 flex flex-col gap-[4px] border-0 p-0">
                <legend className="mb-[8px] p-0 text-[15px] font-extrabold">{g.legend}</legend>
                {g.options.map((o) => (
                  <label
                    key={o.key}
                    className="flex min-h-[40px] items-center gap-[10px] text-[15px]"
                  >
                    <input
                      type="checkbox"
                      checked={checked[o.key as FilterKey]}
                      onChange={(e) =>
                        setChecked((prev) => ({ ...prev, [o.key]: e.target.checked }))
                      }
                      className="m-0 size-[18px]"
                    />
                    {o.label}
                  </label>
                ))}
              </fieldset>
            ))}
            <button
              type="button"
              onClick={resetFilters}
              className="bg-fill text-text-sub min-h-[44px] cursor-pointer rounded-sm border-0 text-[14px] font-bold"
            >
              필터 초기화
            </button>
          </aside>

          <section
            aria-label="공고 목록"
            className="flex min-w-0 flex-col gap-[20px]"
            style={{ flex: "999 1 560px" }}
          >
            {view === "map" && (
              <HomesMap
                regionCodes={region.codes}
                tenure={tenureParam[mode]}
                verdictOf={verdictOf}
                className="h-[520px]"
              />
            )}
            <div
              className="grid gap-[16px]"
              style={{ gridTemplateColumns: "repeat(auto-fill, minmax(262px, 1fr))" }}
            >
              {list.loading && (
                <div className="rounded-card bg-surface text-text-sub col-span-full px-[24px] py-[48px] text-center text-[15px]">
                  내 조건으로 공고를 판정하는 중이에요
                </div>
              )}
              {list.error && (
                <div
                  role="alert"
                  className="rounded-card bg-surface text-text-sub col-span-full px-[24px] py-[48px] text-center text-[15px]"
                >
                  공고를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요
                </div>
              )}
              {!list.loading && !list.error && visible.length === 0 && (
                <div className="rounded-card bg-surface text-text-sub col-span-full flex flex-col items-center gap-[12px] px-[24px] py-[48px] text-center text-[15px]">
                  {region.label}에는 지금 지원할 수 있는 공고가 없어요
                  <button
                    type="button"
                    onClick={region.reset}
                    className="bg-fill text-text min-h-[44px] cursor-pointer rounded-sm border-0 px-[16px] text-[14px] font-bold"
                  >
                    전체 지역 보기
                  </button>
                </div>
              )}
              {visible.map((item) => (
                <ListingCard
                  key={item.id}
                  item={item}
                  regionLabel={region.regionLabelOf(item)}
                  liked={liked.has(item.id)}
                  onToggleLike={() => toggleLike(item.id)}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-[20px] gap-y-[12px]">
              {list.hasMore && (
                <button
                  type="button"
                  onClick={list.loadMore}
                  disabled={list.loadingMore}
                  className="rounded-control bg-surface text-text min-h-[52px] cursor-pointer border-0 px-[28px] text-[15px] font-bold disabled:cursor-default disabled:opacity-60"
                >
                  {list.loadingMore
                    ? "불러오는 중"
                    : list.remaining
                      ? `${list.remaining}곳 더 보기`
                      : "더 보기"}
                </button>
              )}
              {!checked.ineligible && (
                <button
                  type="button"
                  onClick={() => setChecked((prev) => ({ ...prev, ineligible: true }))}
                  className="text-text-sub inline-flex min-h-[44px] cursor-pointer items-center border-0 bg-transparent p-0 text-[14px] font-semibold"
                >
                  지원 불가 공고까지 모두 보기
                  {list.ineligibleCount ? ` (${list.ineligibleCount}곳)` : ""}
                </button>
              )}
            </div>
          </section>
        </div>
      </WebMain>
    </WebPage>
  );
}
