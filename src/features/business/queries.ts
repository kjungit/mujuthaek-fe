import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import {
  bizOnboarding,
  bizProfile,
  businessSummary,
  spaceDetails,
  supportList,
} from "@/mocks/business";

export const businessKeys = {
  profile: ["business", "profile"] as const,
  summary: ["business", "summary"] as const,
  support: ["business", "support"] as const,
  space: (id: string) => ["business", "space", id] as const,
  onboarding: ["business", "onboarding"] as const,
};

export function useBizProfile() {
  return useQuery(mockQuery(businessKeys.profile, bizProfile));
}

export function useBusinessSummary() {
  return useQuery(mockQuery(businessKeys.summary, businessSummary));
}

export function useSupportList() {
  return useQuery(mockQuery(businessKeys.support, supportList));
}

/** 목업 단계: 없는 id면 첫 공간을 보여줘요 */
export function useSpaceDetail(id: string) {
  const detail = spaceDetails.find((s) => s.id === id) ?? spaceDetails[0];
  return useQuery(mockQuery(businessKeys.space(id), detail));
}

export function useBizOnboarding() {
  return useQuery(mockQuery(businessKeys.onboarding, bizOnboarding));
}
