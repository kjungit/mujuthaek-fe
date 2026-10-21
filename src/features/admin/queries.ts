import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { mockQuery } from "@/features/mock-query";
import {
  adminCounts,
  adminCriteria,
  adminOverview,
  adminReports,
  adminSources,
  reviewQueue,
  type AdminCounts,
} from "@/mocks/admin";

export const adminKeys = {
  counts: ["admin", "counts"] as const,
  overview: ["admin", "overview"] as const,
  review: ["admin", "review"] as const,
  sources: ["admin", "sources"] as const,
  criteria: ["admin", "criteria"] as const,
  reports: ["admin", "reports"] as const,
};

/** 사이드바 메뉴 옆 숫자 */
export function useAdminCounts() {
  return useQuery(mockQuery(adminKeys.counts, adminCounts));
}

/** 화면에서 처리한 결과를 사이드바 숫자에 반영해요 (API가 생기면 invalidate로 바꿔요) */
export function useSetAdminCounts() {
  const queryClient = useQueryClient();
  return useCallback(
    (patch: Partial<AdminCounts>) =>
      queryClient.setQueryData<AdminCounts>(adminKeys.counts, (prev) => ({
        ...(prev ?? adminCounts),
        ...patch,
      })),
    [queryClient],
  );
}

export function useAdminOverview() {
  return useQuery(mockQuery(adminKeys.overview, adminOverview));
}

export function useReviewQueue() {
  return useQuery(mockQuery(adminKeys.review, reviewQueue));
}

export function useAdminSources() {
  return useQuery(mockQuery(adminKeys.sources, adminSources));
}

export function useAdminCriteria() {
  return useQuery(mockQuery(adminKeys.criteria, adminCriteria));
}

export function useAdminReports() {
  return useQuery(mockQuery(adminKeys.reports, adminReports));
}
