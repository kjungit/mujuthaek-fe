// 백엔드 경로 (mujuthaek-be services/api). 아직 없는 API는 설계 문서 경로로 둬요
export const endpoints = {
  authRefresh: "/api/auth/refresh",
  authLogout: "/api/auth/logout",
  /** 내 정보. 로그인하지 않았으면 401 (로그인 여부 확인에도 써요) */
  usersMe: "/api/users/me",
  regions: "/api/v1/regions",
  /** 판정 기준값 (기준 소득 월액, 자산·자동차 구간 경계, 순위 요건) */
  eligibilityCriteria: "/api/v1/eligibility/criteria",
  /** 맞춤 목록: 필터 + 판정 입력(구간 값)을 보내면 판정 결과가 붙은 공고 목록 */
  noticesSearch: "/api/v1/notices/search",
  /** 지도: 범위 안 공고 핀 (많으면 지역 묶음). 공개 정보라 판정은 없어요 */
  noticesMap: "/api/v1/notices/map",
  /** 혜택 맞춤 목록: 찾아볼 지역 + 판정 입력(구간 값) → 판정 결과가 붙은 혜택 */
  benefitsSearch: "/api/v1/benefits/search",
  /** 혜택 상세 (공개 정보) */
  benefitDetail: (id: string) => `/api/v1/benefits/${encodeURIComponent(id)}`,
  /** 혜택 하나의 판정 (조건 그룹별 결과) */
  benefitEvaluate: (id: string) => `/api/v1/benefits/${encodeURIComponent(id)}/evaluate`,
  /** 홈 요약: 내 조건으로 판정한 공고 개수 · 새 공고 · 마감 임박 · 생활권 */
  homeSummary: "/api/v1/home/summary",
  /** 공고 상세 (공개 정보) */
  noticeDetail: (id: string) => `/api/v1/notices/${encodeURIComponent(id)}`,
  /** 공고 주택목록 (호별, 커서) */
  noticeUnits: (id: string) => `/api/v1/notices/${encodeURIComponent(id)}/units`,
  /** 사업공간 맞춤 목록: 판정 입력(사는 곳 · 사업 입력) → 공간마다 판정, 종류별 개수 */
  spacesSearch: "/api/v1/spaces/search",
  /** 사업공간 하나의 판정 (상세 내용은 noticeDetail) */
  spaceEvaluate: (id: string) => `/api/v1/spaces/${encodeURIComponent(id)}/evaluate`,
  /** 사업 지원(창업지원 사업) 맞춤 목록: 판정 입력 → 사업마다 판정, 종류별 개수 */
  supportsSearch: "/api/v1/supports/search",
  /** 사업 지원 하나의 판정 (상세 API가 없어서 기간 · 지역 · 자격 조건도 여기서) */
  supportEvaluate: (id: string) => `/api/v1/supports/${encodeURIComponent(id)}/evaluate`,
  /** 단지 하나의 생활권 (항목 점수 · 가까운 시설 · 세권 태그). 공개 정보 */
  areaSite: (siteId: string) => `/api/v1/areas/sites/${encodeURIComponent(siteId)}`,
  /** 공고 하나의 판정 (조건별 결과) */
  noticeEvaluate: (id: string) => `/api/v1/eligibility/notices/${encodeURIComponent(id)}/evaluate`,
  /** 웹 푸시 기기 등록(PUT)·해제(DELETE). 본문은 subscription.toJSON() 그대로 */
  pushSubscriptions: "/api/users/me/push-subscriptions",
  /** 웹 푸시 VAPID 공개키 (로그인 없이) */
  pushPublicKey: "/api/v1/push/public-key",
  /** 알림함: 목록(GET ?cursor&size&unread) · /unread-count · /{id}/read · /read-all */
  notifications: "/api/users/me/notifications",
  notificationSettings: "/api/users/me/notification-settings",
} as const;
