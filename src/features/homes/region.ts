"use client";

import { useState } from "react";
import { useConditions } from "@/features/conditions/store";
import { regionLabel, sidoByName } from "@/lib/regions";
import type { HomeListing } from "@/mocks/homes";

/** 지역 필터. sido가 ""면 전체, sigungu가 ""면 그 시·도 전체 */
export type RegionValue = { sido: string; sigungu: string };

export const allRegions: RegionValue = { sido: "", sigungu: "" };

export function matchesRegion(item: HomeListing, region: RegionValue) {
  if (!region.sido || item.region === "nationwide") return true;
  if (item.region.sido !== region.sido) return false;
  return !region.sigungu || item.region.sigungu === region.sigungu;
}

export function listingRegionLabel(item: HomeListing) {
  return item.region === "nationwide" ? "전국" : regionLabel(item.region.sido, item.region.sigungu);
}

/** 지역 선택 상태 + 내 조건(사는 곳)으로 바로 고르기 */
export function useRegionFilter() {
  const [region, setRegion] = useState<RegionValue>(allRegions);
  const stored = useConditions();
  const mine =
    stored.status === "ready" && stored.device && sidoByName(stored.device.sido)
      ? { sido: stored.device.sido, sigungu: stored.device.sigungu }
      : null;

  return {
    region,
    setSido: (sido: string) => setRegion({ sido, sigungu: "" }),
    setSigungu: (sigungu: string) => setRegion((r) => ({ ...r, sigungu })),
    reset: () => setRegion(allRegions),
    /** 내 조건의 사는 곳. 조건을 저장하지 않았으면 null */
    mine,
    pickMine: () => mine && setRegion(mine),
    isMine: mine !== null && mine.sido === region.sido && mine.sigungu === region.sigungu,
    isAll: !region.sido,
  };
}

export type RegionFilter = ReturnType<typeof useRegionFilter>;
