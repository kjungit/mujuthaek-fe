"use client";

import { MapPin } from "lucide-react";
import type { RegionFilter } from "@/features/homes/region";
import { cn } from "@/lib/cn";
import { regionLabel, regions, sidoByName } from "@/lib/regions";

const select =
  "border-line bg-surface text-text min-h-[44px] min-w-0 rounded-sm border border-solid px-[12px] text-[15px] font-semibold disabled:text-text-sub disabled:bg-fill";

/** 지역 필터: 시·도 → 시·군·구 */
export function RegionSelect({ filter, compact }: { filter: RegionFilter; compact?: boolean }) {
  const { region, mine } = filter;
  const sigungu = sidoByName(region.sido)?.sigungu ?? [];

  return (
    <div className="flex flex-col gap-[8px]">
      <div className={cn("grid grid-cols-2", compact ? "gap-[6px]" : "gap-[8px]")}>
        <select
          aria-label="시·도"
          value={region.sido}
          onChange={(e) => filter.setSido(e.target.value)}
          className={select}
        >
          <option value="">전체 지역</option>
          {regions.map((r) => (
            <option key={r.name} value={r.name}>
              {r.name}
            </option>
          ))}
        </select>
        <select
          aria-label="시·군·구"
          value={region.sigungu}
          onChange={(e) => filter.setSigungu(e.target.value)}
          disabled={!region.sido}
          className={select}
        >
          <option value="">{region.sido ? "전체" : "시·군·구"}</option>
          {sigungu.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      {mine && (
        <button
          type="button"
          aria-pressed={filter.isMine}
          onClick={filter.pickMine}
          className={cn(
            "rounded-pill inline-flex min-h-[36px] cursor-pointer items-center gap-[4px] self-start border-0 px-[12px] text-[13px] font-bold",
            filter.isMine ? "bg-brand text-white" : "bg-brand-soft text-brand-strong",
          )}
        >
          <MapPin size={14} aria-hidden />내 지역 · {regionLabel(mine.sido, mine.sigungu)}
        </button>
      )}
    </div>
  );
}
