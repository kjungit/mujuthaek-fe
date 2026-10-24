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

/** 이사 갈 지역 중 하나에 들면 보여줘요 */
export function matchesAnyRegion(item: HomeListing, places: RegionValue[]) {
  return places.length === 0 || places.some((p) => matchesRegion(item, p));
}

/**
 * 지역 선택 상태. 처음엔 내 조건의 이사 갈 지역(없으면 사는 곳)으로 보여주고,
 * 시·도를 직접 고르면 그 지역으로 바꿔요
 */
export function useRegionFilter() {
  // null = 아직 안 고름 → 내 지역, "mine" = 내 지역 다시 고름
  const [picked, setPicked] = useState<RegionValue | "mine" | null>(null);
  const stored = useConditions();
  const device = stored.status === "ready" ? stored.device : null;
  const moving = device?.moveRegions.filter((r) => sidoByName(r.sido)) ?? [];
  const mine: RegionValue[] =
    moving.length > 0
      ? moving
      : device && sidoByName(device.sido)
        ? [{ sido: device.sido, sigungu: device.sigungu }]
        : [];
  const selected = picked && picked !== "mine" ? picked : null;
  const isMine = mine.length > 0 && !selected;
  const region = selected ?? allRegions;
  const places = isMine ? mine : region.sido ? [region] : [];

  return {
    /** 시·도 칸에 보이는 값. 내 지역을 보는 중이면 비어 있어요 */
    region,
    setSido: (sido: string) => setPicked({ sido, sigungu: "" }),
    setSigungu: (sigungu: string) => setPicked({ ...region, sigungu }),
    reset: () => setPicked(allRegions),
    /** 내 지역: 이사 갈 지역, 없으면 사는 곳. 조건을 저장하지 않았으면 빈 배열 */
    mine,
    mineKind: moving.length > 0 ? ("moving" as const) : ("residence" as const),
    pickMine: () => setPicked("mine"),
    isMine,
    isAll: places.length === 0,
    /** "부산 해운대구 · 부산 수영구" / "전체 지역" */
    label: places.length
      ? places.map((p) => regionLabel(p.sido, p.sigungu || undefined)).join(" · ")
      : "전체 지역",
    matches: (item: HomeListing) => matchesAnyRegion(item, places),
  };
}

export type RegionFilter = ReturnType<typeof useRegionFilter>;
