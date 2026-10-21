// 화면용 예시 데이터 (디자인 WebMe · MMe). 실제 값은 API에서 받아요.

export type MeFavorite = {
  /** 공고 id */
  id: string;
  title: string;
  meta: string;
  dday: string;
  urgent: boolean;
};

export type MeNotifKey = "newPost" | "d3" | "d1" | "start" | "change" | "notice";
export type MeChannelKey = "push" | "email" | "kakao";

export type MeData = {
  account: { name: string; email: string; provider: string };
  favorites: MeFavorite[];
  notif: Record<MeNotifKey, boolean>;
  channels: Record<MeChannelKey, boolean>;
  quiet: { startOptions: string[]; endOptions: string[] };
  report: { targets: string[]; kinds: string[] };
  /** 모바일 메뉴 오른쪽 값 */
  mobileMenu: { notif: string; business: string; reportReplies: number };
};

export const meData: MeData = {
  account: { name: "준님", email: "jun@example.com", provider: "카카오" },
  favorites: [
    {
      id: "n1",
      title: "○○지구 행복주택",
      meta: "LH · 공공임대 월세형 · 접수 10월 31일까지",
      dday: "D-12",
      urgent: false,
    },
    { id: "n2", title: "○○ 행복주택", meta: "LH · 접수 10월 21일까지", dday: "D-2", urgent: true },
    {
      id: "n3",
      title: "○○ 장기전세",
      meta: "SH · 공공임대 전세형 · 확인 필요",
      dday: "D-9",
      urgent: false,
    },
  ],
  notif: { newPost: true, d3: true, d1: true, start: true, change: true, notice: false },
  channels: { push: true, email: false, kakao: true },
  quiet: { startOptions: ["밤 10시", "밤 11시"], endOptions: ["아침 8시", "아침 9시"] },
  report: {
    targets: [
      "○○지구 행복주택 (최근 본 공고)",
      "청년 월세 지원 (최근 본 혜택)",
      "빠진 정책 · 공고 알려주기",
    ],
    kinds: ["자격 조건", "금액", "일정", "링크", "빠진 정보"],
  },
  mobileMenu: { notif: "푸시 · 이메일", business: "예비 창업", reportReplies: 1 },
};
