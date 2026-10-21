// 화면용 예시 데이터 (디자인 WebProfile · MProfile). 실제 값은 API에서 받아요.

export type ProfilePreview = { homes: number; benefits: number; needCheck: number };

export type ProfileOptions = {
  sido: string[];
  sigungu: string[];
  householdSize: string[];
  homelessPeriod: string[];
  bankbookPeriod: string[];
  priorities: string[];
};

export type ProfileFormData = {
  options: ProfileOptions;
  /** 단계별 '지금 조건으로' 미리보기 (1·2·3단계) */
  previewByStep: [ProfilePreview, ProfilePreview, ProfilePreview];
  /** 처음 골라 둔 우선순위 */
  defaultPriorities: string[];
};

export const profileFormData: ProfileFormData = {
  options: {
    sido: ["서울특별시", "경기도", "인천광역시"],
    sigungu: ["마포구", "서대문구", "은평구"],
    householdSize: ["1명", "2명", "3명", "4명 이상"],
    homelessPeriod: [
      "3년 이상 5년 미만",
      "1년 미만",
      "1년 이상 3년 미만",
      "5년 이상",
      "집이 있어요",
    ],
    bankbookPeriod: ["2년 이상", "없어요", "1년 미만", "1~2년"],
    priorities: ["직장", "대중교통", "학군", "공원", "편의시설", "병원"],
  },
  previewByStep: [
    { homes: 3, benefits: 2, needCheck: 4 },
    { homes: 5, benefits: 4, needCheck: 3 },
    { homes: 7, benefits: 5, needCheck: 2 },
  ],
  defaultPriorities: ["직장", "대중교통"],
};
