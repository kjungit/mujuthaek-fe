// 화면용 예시 데이터 (디자인 WebMe · MMe). 실제 값은 API에서 받아요.

export type MeCondition = {
  k: string;
  v: string;
  /** 익명 모드면 저장하지 않는 값(소득·자산) */
  sensitive?: boolean;
};

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
  anon: boolean;
  conditions: MeCondition[];
  /** 익명 모드가 꺼졌을 때 보여줄 소득·자산 */
  savedSensitive: Record<string, string>;
  /** 모바일 조건 칩 */
  conditionChips: string[];
  missingChip: string;
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
  anon: true,
  conditions: [
    { k: "나이", v: "만 29세" },
    { k: "사는 곳", v: "서울 마포구" },
    { k: "세대", v: "세대주 · 1인 가구" },
    { k: "결혼 · 자녀", v: "미혼 · 자녀 없음" },
    { k: "지금 상황", v: "청년" },
    { k: "연소득", v: "저장 안 함", sensitive: true },
    { k: "자산", v: "저장 안 함", sensitive: true },
    // 순위 세부 조건은 소득·자산 수준이 드러나서 소득·자산처럼 다뤄요
    { k: "순위 세부 조건", v: "저장 안 함", sensitive: true },
    { k: "무주택 기간", v: "4년" },
    { k: "청약통장", v: "2년 이상 · 26회" },
    { k: "직장 위치", v: "여의도역" },
    { k: "중요한 것", v: "직장 · 대중교통" },
  ],
  savedSensitive: { 연소득: "3,200만 원", 자산: "4,500만 원", "순위 세부 조건": "2순위 해당" },
  conditionChips: ["만 29세", "서울 마포구", "미혼 · 1인", "청년", "무주택 4년"],
  missingChip: "자산 · 미입력",
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
