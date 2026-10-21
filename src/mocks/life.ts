// 화면용 예시 데이터 (디자인 WebLife · MLife). 실제 값은 API에서 받아요.

export type LifeWeightKey = "work" | "transit" | "school" | "park" | "conv";

export type LifeWeights = Record<LifeWeightKey, number>;

export type LifeInfra = {
  k: string;
  v: string;
  /** 모바일에서 줄여 쓰는 값 */
  vShort?: string;
};

export type LifeArea = {
  id: string;
  name: string;
  /** 지도 위 위치(%) */
  web: { x: number; y: number };
  mobile: { x: number; y: number };
  commute: string;
  /** 항목별 점수(0~100) */
  metrics: LifeWeights;
  infra: LifeInfra[];
};

export type LifeData = {
  workplace: string;
  defaultWeights: LifeWeights;
  areas: LifeArea[];
};

export const lifeData: LifeData = {
  workplace: "여의도역",
  defaultWeights: { work: 8, transit: 6, school: 2, park: 4, conv: 5 },
  areas: [
    {
      id: "mw",
      name: "망원동",
      web: { x: 30, y: 58 },
      mobile: { x: 32, y: 60 },
      commute: "32분",
      metrics: { work: 72, transit: 85, school: 60, park: 90, conv: 88 },
      infra: [
        { k: "역세권", v: "망원역 도보 6분" },
        { k: "편세권", v: "편의점 도보 2분" },
        { k: "학세권", v: "초등학교 도보 9분" },
        { k: "숲세권", v: "한강공원 도보 12분" },
        { k: "의세권", v: "병원 14곳 · 약국 6곳" },
        { k: "몰세권", v: "대형마트 1.8km" },
      ],
    },
    {
      id: "sa",
      name: "상암동",
      web: { x: 26, y: 26 },
      mobile: { x: 30, y: 24 },
      commute: "38분",
      metrics: { work: 64, transit: 70, school: 82, park: 95, conv: 70 },
      infra: [
        { k: "역세권", v: "디지털미디어시티역 도보 9분", vShort: "DMC역 도보 9분" },
        { k: "편세권", v: "편의점 도보 4분" },
        { k: "학세권", v: "초등학교 도보 5분" },
        { k: "숲세권", v: "하늘공원 도보 8분" },
        { k: "의세권", v: "병원 9곳 · 약국 4곳" },
        { k: "몰세권", v: "대형마트 0.9km" },
      ],
    },
    {
      id: "gd",
      name: "공덕동",
      web: { x: 66, y: 56 },
      mobile: { x: 70, y: 52 },
      commute: "18분",
      metrics: { work: 95, transit: 96, school: 58, park: 55, conv: 90 },
      infra: [
        { k: "역세권", v: "공덕역 도보 4분" },
        { k: "편세권", v: "편의점 도보 1분" },
        { k: "학세권", v: "초등학교 도보 11분" },
        { k: "숲세권", v: "경의선숲길 도보 7분" },
        { k: "의세권", v: "병원 22곳 · 약국 9곳" },
        { k: "몰세권", v: "대형마트 1.2km" },
      ],
    },
  ],
};
