// 디자인 파일(X.dc.html) → 라우트
export const routes = {
  main: "/",
  login: "/login",
  /** 처음 간편 로그인한 뒤 약관 동의 (가입 마무리) */
  signup: "/signup",
  /** 간편 로그인 뒤 돌아오는 곳 (백엔드가 보내요) */
  authCallback: "/auth/callback",
  welcome: "/welcome",
  profile: "/profile",
  home: "/home",
  benefits: "/benefits",
  benefit: (id: string) => `/benefits/${id}`,
  homes: "/homes",
  notice: (id: string) => `/notices/${id}`,
  score: "/score",
  alerts: "/alerts",
  me: "/me",
  search: "/search",
  business: "/business",
  bizOnboarding: "/business/onboarding",
  space: (id: string) => `/business/spaces/${id}`,
  bizSupport: "/business/support",
  announcements: "/announcements",
  faq: "/faq",
  terms: "/terms",
  privacy: "/privacy",
  install: "/install",
  admin: "/admin",
  adminReview: "/admin/review",
  adminSources: "/admin/sources",
  adminCriteria: "/admin/criteria",
  adminReports: "/admin/reports",
  adminTraffic: "/admin/traffic",
} as const;

export type Mode = "home" | "business";
