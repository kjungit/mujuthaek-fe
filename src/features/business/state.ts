"use client";

import { useState } from "react";
import type { BizStage } from "@/mocks/business";
import { useBizOnboarding } from "./queries";

/** 종류 필터: 전체 + 종류별 개수 */
export function useTypeFilter<K extends string, T extends { type: K }>(items: T[]) {
  const [filter, setFilter] = useState<"all" | K>("all");
  const count = (key: "all" | K) =>
    key === "all" ? items.length : items.filter((i) => i.type === key).length;
  const visible = items.filter((i) => filter === "all" || i.type === filter);
  return { filter, setFilter, count, visible };
}

/** 사업 정보 입력: 창업 상태 · 필요한 공간 */
export function useBizOnboardingForm() {
  const { data } = useBizOnboarding();
  const [stage, setStage] = useState<BizStage>("pre");
  const [needs, setNeeds] = useState<string[]>(data.initialNeeds);
  const pre = stage === "pre";
  const toggleNeed = (n: string) =>
    setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));
  return {
    data,
    stage,
    setStage,
    pre,
    needs,
    toggleNeed,
    preview: data.preview[stage],
  };
}

/** 준비 서류 체크 */
export function useDocChecks(initial: boolean[]) {
  const [checks, setChecks] = useState(initial);
  const toggle = (i: number) => setChecks((cur) => cur.map((v, j) => (j === i ? !v : v)));
  return { checks, toggle, done: checks.filter(Boolean).length };
}
