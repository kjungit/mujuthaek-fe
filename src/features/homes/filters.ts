// 내 집 목록 필터 · 정렬 (지역 · 입주 방식 · 정렬 · 지원 불가 보기는 맞춤 목록 API로 보내요)

export const moveInModes = ["빌려서 들어가기", "사서 들어가기"] as const;
export type MoveInMode = (typeof moveInModes)[number];

export const sortOptions = ["추천순", "마감 임박순", "준비할 돈 적은순", "생활권 점수순"] as const;
export type SortOption = (typeof sortOptions)[number];

/** 정렬 → 맞춤 목록 API의 sort. 추천순 = 지원 가능 → 확인 필요 → 마감 임박 → 생활권 */
export const sortParam = {
  추천순: "RECOMMENDED",
  "마감 임박순": "DEADLINE",
  "준비할 돈 적은순": "PREPARE_COST",
  "생활권 점수순": "AREA_SCORE",
} as const satisfies Record<SortOption, string>;

export const tenureParam = {
  "빌려서 들어가기": "RENT",
  "사서 들어가기": "BUY",
} as const;

export const filterGroups = [
  {
    key: "type",
    legend: "유형",
    options: [
      { key: "rentMonthly", label: "공공임대 월세형" },
      { key: "rentJeonse", label: "공공임대 전세형" },
      { key: "private", label: "민간임대" },
    ],
  },
  {
    key: "org",
    legend: "공급 기관",
    options: [
      { key: "lh", label: "LH" },
      { key: "local", label: "지방 공사 (SH · GH · iH 등)" },
      { key: "applyhome", label: "청약홈" },
    ],
  },
  {
    key: "verdict",
    legend: "내 판정",
    options: [
      { key: "ok", label: "지원 가능" },
      { key: "check", label: "확인 필요" },
      { key: "ineligible", label: "지원 불가도 보기" },
    ],
  },
] as const;

export type FilterKey = (typeof filterGroups)[number]["options"][number]["key"];

export const defaultChecked: Record<FilterKey, boolean> = {
  rentMonthly: true,
  rentJeonse: true,
  private: false,
  lh: true,
  local: true,
  applyhome: true,
  ok: true,
  check: true,
  ineligible: false,
};

export const defaultMode: MoveInMode = "빌려서 들어가기";
export const defaultSort: SortOption = "추천순";

/** 모바일 '필터 N': 기본값에서 켜 둔 필터 묶음 수 */
export const activeFilterGroupCount = filterGroups.length;
