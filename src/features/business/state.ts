"use client";

import { useState } from "react";
import { ageOf } from "@/features/conditions/format";
import { useConditions } from "@/features/conditions/store";
import { useRegions } from "@/features/regions/queries";
import type { BizStage } from "@/mocks/business";
import {
  emptyBizProfile,
  saveBizProfile,
  useBizProfileInput,
  type BizProfileInput,
} from "./profile";
import { useBusinessPreview } from "./queries";

/** 종류 필터: 전체 + 종류별 개수 */
export function useTypeFilter<K extends string, T extends { type: K }>(items: T[]) {
  const [filter, setFilter] = useState<"all" | K>("all");
  const count = (key: "all" | K) =>
    key === "all" ? items.length : items.filter((i) => i.type === key).length;
  const visible = items.filter((i) => filter === "all" || i.type === filter);
  return { filter, setFilter, count, visible };
}

/**
 * 사업 정보 입력: 저장한 값(없으면 빈 값)에서 시작해 고치고, 저장하면 사업공간 · 사업 지원 판정에 써요.
 * 지역은 전국 시·도 → 시·군·구, 공통 정보(나이 · 사는 곳)는 조건 입력에서 가져와요
 */
export function useBizOnboardingForm() {
  const stored = useBizProfileInput();
  const conditions = useConditions();
  const regions = useRegions();
  const [edit, setEdit] = useState<{ draft: BizProfileInput; revenue: string } | null>(null);
  const saved =
    stored.status === "ready"
      ? { draft: stored.profile ?? emptyBizProfile, revenue: stored.revenue }
      : { draft: emptyBizProfile, revenue: "" };
  const { draft, revenue } = edit ?? saved;
  const set = (patch: Partial<BizProfileInput>) =>
    setEdit({ draft: { ...draft, ...patch }, revenue });
  const pre = draft.stage === "pre";
  const preview = useBusinessPreview(draft, revenue);
  const device = conditions.status === "ready" ? conditions.device : null;
  const age = device ? ageOf(device.birth) : null;
  const sidoCode = draft.regionCode.slice(0, 2);
  return {
    draft,
    stage: draft.stage,
    setStage: (stage: BizStage) => set({ stage }),
    pre,
    set,
    revenue,
    setRevenue: (v: string) => setEdit({ draft, revenue: v }),
    needs: draft.needs,
    toggleNeed: (n: string) =>
      set({
        needs: draft.needs.includes(n) ? draft.needs.filter((x) => x !== n) : [...draft.needs, n],
      }),
    preview,
    /** 공통 정보 한 줄. 조건을 아직 안 넣었으면 null */
    common: device
      ? [
          age !== null && `만 ${age}세`,
          device.regionCode && `${regions.label(device.regionCode)} 거주`,
        ]
          .filter(Boolean)
          .join(" · ") || null
      : null,
    sidos: regions.sidos,
    sidoCode,
    sigungus: sidoCode ? (regions.sido(sidoCode)?.sigungus ?? []) : [],
    save: () => saveBizProfile(draft, pre ? "" : revenue),
  };
}

/** 준비 서류 체크 */
export function useDocChecks(initial: boolean[]) {
  const [checks, setChecks] = useState(initial);
  const toggle = (i: number) => setChecks((cur) => cur.map((v, j) => (j === i ? !v : v)));
  return { checks, toggle, done: checks.filter(Boolean).length };
}
