import { useQuery } from "@tanstack/react-query";
import {
  useApiBusinessSummary,
  useApiSpaceDetail,
  useApiSupportDetail,
  useApiSupportList,
} from "@/features/business/api";
import { mockQuery } from "@/features/mock-query";
import { USE_MOCKS } from "@/lib/api/config";
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

function useMockBusinessSummary() {
  const { data } = useQuery(mockQuery(businessKeys.summary, businessSummary));
  return { data, loading: false, error: false };
}

// USE_MOCKS는 빌드 때 정해지는 값이라 훅 순서가 바뀌지 않아요
export const useBusinessSummary = USE_MOCKS ? useMockBusinessSummary : useApiBusinessSummary;

function useMockSupportList() {
  const { data } = useQuery(mockQuery(businessKeys.support, supportList));
  return { data, loading: false, error: false };
}

export const useSupportList = USE_MOCKS ? useMockSupportList : useApiSupportList;

/** 목업 단계: 사업 지원 상세는 공간 예시를 보여줘요 */
function useMockSupportDetail(id: string) {
  return useMockSpaceDetail(id);
}

export const useSupportDetail = USE_MOCKS ? useMockSupportDetail : useApiSupportDetail;

/** 목업 단계: 없는 id면 첫 공간을 보여줘요 */
function useMockSpaceDetail(id: string) {
  const detail = spaceDetails.find((s) => s.id === id) ?? spaceDetails[0];
  const { data } = useQuery(mockQuery(businessKeys.space(id), detail));
  return { data, loading: false, error: false };
}

export const useSpaceDetail = USE_MOCKS ? useMockSpaceDetail : useApiSpaceDetail;

export function useBizOnboarding() {
  return useQuery(mockQuery(businessKeys.onboarding, bizOnboarding));
}
