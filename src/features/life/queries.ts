"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import { lifeData, type LifeArea, type LifeWeightKey, type LifeWeights } from "@/mocks/life";

export const lifeKeys = {
  areas: ["life", "areas"] as const,
};

export function useLifeData() {
  return useQuery(mockQuery(lifeKeys.areas, lifeData));
}

export const weightLabels: { key: LifeWeightKey; label: string }[] = [
  { key: "work", label: "직장 거리" },
  { key: "transit", label: "대중교통" },
  { key: "school", label: "학군" },
  { key: "park", label: "공원" },
  { key: "conv", label: "편의시설" },
];

export type ScoredArea = LifeArea & { score: number };

function scoreOf(area: LifeArea, w: LifeWeights) {
  const keys = Object.keys(w) as LifeWeightKey[];
  const sum = keys.reduce((a, k) => a + w[k], 0) || 1;
  return Math.round(keys.reduce((acc, k) => acc + w[k] * area.metrics[k], 0) / sum);
}

/** 선택한 동네와 중요도로 점수·순위를 계산해요 */
export function useLifeScores() {
  const { data } = useLifeData();
  const [selId, setSelId] = useState(data.areas[0]?.id ?? "");
  const [weights, setWeights] = useState<LifeWeights>(data.defaultWeights);

  const scored = useMemo<ScoredArea[]>(
    () => data.areas.map((a) => ({ ...a, score: scoreOf(a, weights) })),
    [data.areas, weights],
  );
  const ranked = useMemo(() => [...scored].sort((a, b) => b.score - a.score), [scored]);
  const selected = scored.find((a) => a.id === selId) ?? scored[0];

  return {
    workplace: data.workplace,
    scored,
    ranked,
    selected,
    select: setSelId,
    weights,
    setWeight: (key: LifeWeightKey, value: number) => setWeights((w) => ({ ...w, [key]: value })),
    resetWeights: () => setWeights(data.defaultWeights),
  };
}
