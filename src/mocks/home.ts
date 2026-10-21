// 화면용 예시 데이터 (디자인 WebHome · MHome). 실제 값은 API에서 받아요.
import type { Verdict } from "@/components/ui/Badge";

export type HomeNewsKind = "notice" | "policy" | "correction";

export type HomeNewsItem = {
  id: string;
  kind: HomeNewsKind;
  meta: string;
  title: string;
  due: string;
  verdict: Verdict;
};

export type HomeDeadline = { id: string; title: string; meta: string; dday: number };

export type HomeSummary = {
  conditions: string[];
  homes: { count: number; newThisWeek: number; closingSoon: number };
  benefits: { yearlyAmount: string; count: number; needCheck: number };
  life: { score: number; area: string; commuteMinutes: number };
  news: HomeNewsItem[];
  deadlines: HomeDeadline[];
  suggestedBenefit: { id: string; title: string };
};

export const homeSummary: HomeSummary = {
  conditions: [
    "만 29세",
    "서울 마포구",
    "연소득 3,200만 원",
    "미혼",
    "청년",
    "2순위",
    "무주택 4년",
  ],
  homes: { count: 7, newThisWeek: 2, closingSoon: 1 },
  benefits: { yearlyAmount: "480만 원", count: 5, needCheck: 1 },
  life: { score: 82, area: "마포구", commuteMinutes: 28 },
  news: [
    {
      id: "n1",
      kind: "notice",
      meta: "새 공고 · LH · 2시간 전",
      title: "○○지구 행복주택 입주자 모집",
      due: "D-12",
      verdict: "ok",
    },
    {
      id: "b1",
      kind: "policy",
      meta: "새 정책 · 서울시 · 어제",
      title: "청년 월세 지원",
      due: "상시",
      verdict: "check",
    },
    {
      id: "n2",
      kind: "notice",
      meta: "새 공고 · SH · 2일 전",
      title: "○○ 국민임대 예비입주자 모집",
      due: "D-20",
      verdict: "ok",
    },
    {
      id: "n3",
      kind: "correction",
      meta: "정정 공고 · GH · 3일 전",
      title: "○○ 장기전세 · 접수 기간 변경",
      due: "D-9",
      verdict: "ok",
    },
  ],
  deadlines: [
    { id: "n1", title: "○○ 행복주택", meta: "LH · 접수 10월 21일까지", dday: 2 },
    { id: "n3", title: "○○ 장기전세", meta: "SH · 접수 10월 28일까지", dday: 9 },
  ],
  suggestedBenefit: { id: "b2", title: "청년 전세자금 대출" },
};
