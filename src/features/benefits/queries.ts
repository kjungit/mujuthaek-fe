import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import { benefitsSummary } from "@/mocks/benefits";

export const benefitKeys = {
  summary: ["benefits", "summary"] as const,
};

export function useBenefits() {
  return useQuery(mockQuery(benefitKeys.summary, benefitsSummary));
}

/** 목업 단계: 없는 id면 첫 혜택을 보여줘요 */
export function useBenefit(id: string) {
  const { data } = useBenefits();
  return data.items.find((b) => b.id === id) ?? data.items[0];
}
