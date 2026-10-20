"use client";

import { useState } from "react";
import type { RankCriteria } from "@/mocks/profile";
import { useProfileFormData } from "./queries";

export type Head = "head" | "member";
export type Marry = "single" | "married" | "planned";

export const headOptions: { key: Head; label: string }[] = [
  { key: "head", label: "세대주예요" },
  { key: "member", label: "세대원이에요" },
];

export const marryOptions: { key: Marry; label: string }[] = [
  { key: "single", label: "미혼" },
  { key: "married", label: "기혼" },
  { key: "planned", label: "결혼 예정" },
];

/** 체크한 세부 요건으로 가장 높은 순위를 찾아요. 없으면 null */
export function estimateRank(criteria: RankCriteria[], checked: string[]) {
  const sorted = [...criteria].sort((a, b) => a.rank - b.rank);
  const hit = sorted.find((c) =>
    c.rule === "any"
      ? c.items.some((i) => checked.includes(i.key))
      : c.items.every((i) => checked.includes(i.key)),
  );
  return hit?.rank ?? null;
}

const toggle = (xs: string[], x: string) =>
  xs.includes(x) ? xs.filter((v) => v !== x) : [...xs, x];

/** 조건 입력 3단계 상태 (PC/모바일 공통) */
export function useProfileForm() {
  const { data } = useProfileFormData();
  const [step, setStep] = useState(1);
  const [head, setHead] = useState<Head>("head");
  const [marry, setMarry] = useState<Marry>("single");
  const [kids, setKids] = useState(0);
  const [prios, setPrios] = useState<string[]>(data.defaultPriorities);
  const [anon, setAnon] = useState(true);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [rankChecks, setRankChecks] = useState<string[]>([]);

  return {
    data,
    step,
    goTo: setStep,
    prev: () => setStep((s) => Math.max(1, s - 1)),
    next: () => setStep((s) => Math.min(3, s + 1)),
    isLast: step === 3,
    preview: data.previewByStep[step - 1],
    head,
    setHead,
    marry,
    setMarry,
    kids,
    kidsDown: () => setKids((k) => Math.max(0, k - 1)),
    kidsUp: () => setKids((k) => Math.min(9, k + 1)),
    prios,
    togglePrio: (p: string) =>
      setPrios((xs) => (xs.includes(p) ? xs.filter((x) => x !== p) : [...xs, p])),
    statuses,
    toggleStatus: (s: string) => setStatuses((xs) => toggle(xs, s)),
    rankChecks,
    toggleRankCheck: (key: string) => setRankChecks((xs) => toggle(xs, key)),
    estimatedRank: estimateRank(data.rankCriteria, rankChecks),
    anon,
    setAnon,
  };
}

export type ProfileForm = ReturnType<typeof useProfileForm>;
