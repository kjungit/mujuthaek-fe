// 내 집 목록 필터 · 정렬 (값은 API 파라미터로 넘길 예정)

export const moveInModes = ["빌려서 들어가기", "사서 들어가기"] as const;
export type MoveInMode = (typeof moveInModes)[number];

export const sortOptions = [
  "마감 임박순",
  "내 순위 높은순",
  "준비할 돈 적은순",
  "생활권 점수순",
] as const;
export type SortOption = (typeof sortOptions)[number];

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
export const defaultSort: SortOption = "마감 임박순";

/** 모바일 '필터 N': 기본값에서 켜 둔 필터 묶음 수 */
export const activeFilterGroupCount = filterGroups.length;
