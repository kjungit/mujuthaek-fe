// 백엔드 경로 (mujuthaek-be services/api). 아직 없는 API는 설계 문서 경로로 둬요
export const endpoints = {
  authRefresh: "/api/auth/refresh",
  authLogout: "/api/auth/logout",
  regions: "/api/v1/regions",
  // 백엔드 알림 API 전 (설계: POST /api/v1/me/push-subscriptions)
  pushSubscriptions: "/api/v1/notifications/subscriptions",
} as const;
