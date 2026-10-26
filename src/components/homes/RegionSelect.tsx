"use client";

import { MapPin } from "lucide-react";
import type { RegionFilter } from "@/features/homes/region";
import { useRegions } from "@/features/regions/queries";
import { cn } from "@/lib/cn";

const select =
  "border-line bg-surface text-text min-h-[44px] min-w-0 rounded-sm border border-solid px-[12px] text-[15px] font-semibold disabled:text-text-sub disabled:bg-fill";

const chip =
  "rounded-pill inline-flex min-h-[36px] min-w-0 cursor-pointer items-center gap-[4px] border-0 px-[12px] text-[13px] font-bold";

/** 지역 필터: 내 지역(찾아볼 지역 · 사는 곳) / 전체, 또는 시·도 → 시·군·구 */
export function RegionSelect({ filter, compact }: { filter: RegionFilter; compact?: boolean }) {
  const regions = useRegions();
  const { code, mine } = filter;
  const sidoCode = code.slice(0, 2);
  const sigungu = sidoCode ? (regions.sido(sidoCode)?.sigungus ?? []) : [];
  const mineLabel = mine.map(regions.label).join(" · ");

  return (
    <div className="flex flex-col gap-[8px]">
      {mine.length > 0 && (
        <div className="flex flex-wrap gap-[6px]">
          <button
            type="button"
            aria-pressed={filter.isMine}
            onClick={filter.pickMine}
            className={cn(
              chip,
              filter.isMine ? "bg-brand text-white" : "bg-brand-soft text-brand-strong",
            )}
          >
            <MapPin size={14} aria-hidden className="flex-none" />
            <span className="truncate">
              {filter.mineKind === "search" ? "찾아볼 지역" : "사는 곳"} · {mineLabel}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={filter.isAll}
            onClick={filter.reset}
            className={cn(chip, filter.isAll ? "bg-brand text-white" : "bg-fill text-text")}
          >
            전체
          </button>
        </div>
      )}
      <div className={cn("grid grid-cols-2", compact ? "gap-[6px]" : "gap-[8px]")}>
        <select
          aria-label="시·도"
          value={sidoCode}
          onChange={(e) => filter.pick(e.target.value)}
          className={select}
        >
          <option value="">{mine.length > 0 ? "다른 지역 고르기" : "전체 지역"}</option>
          {regions.sidos.map((r) => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          aria-label="시·군·구"
          value={code.length === 5 ? code : ""}
          onChange={(e) => filter.pick(e.target.value || sidoCode)}
          disabled={!sidoCode}
          className={select}
        >
          <option value="">{sidoCode ? "전체" : "시·군·구"}</option>
          {sigungu.map((g) => (
            <option key={g.code} value={g.code}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
