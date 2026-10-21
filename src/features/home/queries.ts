import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import { homeSummary } from "@/mocks/home";

export const homeKeys = {
  summary: ["home", "summary"] as const,
};

export function useHomeSummary() {
  return useQuery(mockQuery(homeKeys.summary, homeSummary));
}
