// 모듈별 쿼리 키. 백엔드 모듈(notice, benefit, eligibility, area, user, notification)에 맞춰 추가
export const queryKeys = {
  notices: {
    all: ["notices"] as const,
    detail: (id: string) => ["notices", id] as const,
  },
} as const;
