// 백엔드 경로 (mujuthaek-be services/api). 아직 없는 API는 설계 문서 경로로 둬요
export const endpoints = {
  authRefresh: "/api/auth/refresh",
  authLogout: "/api/auth/logout",
  regions: "/api/v1/regions",
  /** 판정 기준값 (기준 소득 월액, 자산·자동차 구간 경계, 순위 요건) */
  eligibilityCriteria: "/api/v1/eligibility/criteria",
  /** 맞춤 목록: 필터 + 판정 입력(구간 값)을 보내면 판정 결과가 붙은 공고 목록 */
  noticesSearch: "/api/v1/notices/search",
  /** 홈 요약: 내 조건으로 판정한 공고 개수 · 새 공고 · 마감 임박 · 생활권 */
  homeSummary: "/api/v1/home/summary",
  /** 공고 상세 (공개 정보) */
  noticeDetail: (id: string) => `/api/v1/notices/${encodeURIComponent(id)}`,
  /** 공고 하나의 판정 (조건별 결과) */
  noticeEvaluate: (id: string) => `/api/v1/eligibility/notices/${encodeURIComponent(id)}/evaluate`,
  // 백엔드 알림 API 전 (설계: POST /api/v1/me/push-subscriptions)
  pushSubscriptions: "/api/v1/notifications/subscriptions",
} as const;
