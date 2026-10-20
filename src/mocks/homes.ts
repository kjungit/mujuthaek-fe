// 화면용 예시 데이터 (디자인 WebHomes · MHomes). 실제 값은 API에서 받아요.
import type { Verdict } from "@/components/ui/Badge";

export type HomeListing = {
  id: string;
  verdict: Verdict;
  /** 순위가 있는 공고만 */
  rank?: number;
  org: string;
  title: string;
  price: string;
  tags: string[];
  /** 준비할 돈. 없으면 note를 보여줘요 */
  prepAmount?: string;
  prepNote?: string;
  /** 모바일 · 지도에서 쓰는 짧은 마감 표시 */
  due: string;
  /** PC 카드에서 쓰는 마감 표시 (없으면 due) */
  dueLong?: string;
  /** 전세임대처럼 원하는 집을 직접 구하는 공고 */
  findYourOwn?: boolean;
  liked: boolean;
};

export type HomeMapPin = {
  id: string;
  label: string;
  left: string;
  top: string;
  tone: "brand" | "plain" | "check";
};

export type HomesSummary = {
  total: number;
  /** 첫 화면에 보여주는 개수 */
  pageSize: number;
  listings: HomeListing[];
  mapPins: HomeMapPin[];
};

export const homesSummary: HomesSummary = {
  total: 7,
  pageSize: 6,
  listings: [
    {
      id: "n1",
      verdict: "ok",
      rank: 1,
      org: "LH · 행복주택",
      title: "○○지구 행복주택",
      price: "보증금 2,400만 원 · 월 18만 원",
      tags: ["역세권", "편세권"],
      prepAmount: "960만 원",
      due: "D-12",
      liked: false,
    },
    {
      id: "n3",
      verdict: "check",
      org: "SH · 장기전세",
      title: "○○ 장기전세",
      price: "전세 2억 1,000만 원",
      tags: ["학세권", "숲세권"],
      prepNote: "자산 조건 확인 필요",
      due: "D-9",
      liked: true,
    },
    {
      id: "n5",
      verdict: "ok",
      org: "LH · 전세임대",
      title: "청년 전세임대",
      price: "지원 한도 1억 2,000만 원",
      tags: ["원하는 집 직접 구하기"],
      prepAmount: "240만 원부터",
      due: "상시",
      findYourOwn: true,
      liked: false,
    },
    {
      id: "n2",
      verdict: "ok",
      org: "GH · 국민임대",
      title: "○○ 국민임대",
      price: "보증금 1,800만 원 · 월 15만 원",
      tags: ["직주근접"],
      prepAmount: "720만 원",
      due: "D-20",
      liked: false,
    },
    {
      id: "n4",
      verdict: "ok",
      rank: 3,
      org: "iH · 매입임대",
      title: "○○구 청년 매입임대",
      price: "보증금 100만 원 · 월 12만 원",
      tags: ["역세권"],
      prepAmount: "100만 원",
      due: "D-15",
      liked: false,
    },
    {
      id: "n6",
      verdict: "check",
      org: "청약홈 · 공공분양",
      title: "○○ 공공분양",
      price: "분양가 3억 2,000만 원",
      tags: ["초품아", "공세권"],
      prepNote: "청약 가점 확인 필요",
      due: "11월 3일",
      dueLong: "11월 3일 접수",
      liked: false,
    },
  ],
  mapPins: [
    { id: "n1", label: "행복주택 D-12", left: "22%", top: "30%", tone: "brand" },
    { id: "n2", label: "국민임대 D-20", left: "58%", top: "62%", tone: "plain" },
    { id: "n3", label: "장기전세 D-9", left: "48%", top: "16%", tone: "check" },
    { id: "n4", label: "매입임대 D-15", left: "12%", top: "74%", tone: "brand" },
  ],
};
