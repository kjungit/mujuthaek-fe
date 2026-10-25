import type { Criteria } from "@/features/eligibility/criteria";
import type { DeviceConditions, SessionConditions } from "./types";

/**
 * 판정 입력 (POST 본문의 applicant). 서버로는 정확한 값 대신 구간만 보내요:
 * 생년월일 → 출생 연월, 기간 → 구간, 소득 → 기준 대비 % 구간(10% 단위), 자산 → 기준표 금액 사이.
 * 쓸 수 있는 돈은 보내지 않아요 (준비할 돈과 비교는 화면에서)
 */
export type Applicant = {
  birthMonth?: string;
  regionCode?: string;
  householdHead?: boolean;
  householdSize?: number;
  targetGroups?: string[];
  marital?: "SINGLE" | "MARRIED" | "ENGAGED";
  children?: number;
  homeOwner?: boolean;
  homelessYears?: HomelessYears;
  subscription?: { months?: SubscriptionMonths; payments?: number };
  welfareStatuses?: string[];
  income?: Partial<Record<IncomeStandard, PercentRange>>;
  incomeYear?: number;
  assets?: WonRange;
  rankChecks?: string[];
};

export type HomelessYears = "LT_1" | "1_3" | "3_5" | "5_PLUS";
export type SubscriptionMonths = "NONE" | "LT_6" | "6_12" | "12_24" | "24_PLUS";
export type IncomeStandard = "MEDIAN_INCOME" | "URBAN_WORKER_INCOME";
/** year: 이 구간을 계산한 기준값의 연도 */
export type PercentRange = { gtPct?: number; lePct?: number; year?: number };
export type WonRange = { gtWon?: number; leWon?: number };

/** 조건 입력 선택지 → 판정 입력 코드 */
const homelessYears: Record<string, HomelessYears> = {
  "1년 미만": "LT_1",
  "1년 이상 3년 미만": "1_3",
  "3년 이상 5년 미만": "3_5",
  "5년 이상": "5_PLUS",
};

/** 예전 선택지 "1년 미만"은 6개월 기준을 몰라서 보내지 않아요 (화면에 그대로 보여서 다시 고를 수 있어요) */
export const subscriptionMonths: Record<string, SubscriptionMonths> = {
  없어요: "NONE",
  "6개월 미만": "LT_6",
  "6개월~1년": "6_12",
  "1~2년": "12_24",
  "2년 이상": "24_PLUS",
};

const targetGroups: Record<string, string> = {
  대학생: "UNIVERSITY_STUDENT",
  취업준비생: "JOB_SEEKER",
  청년: "YOUTH",
  신혼부부: "NEWLYWED",
};

/** 1순위 세부 요건은 수급 여부 칸으로 보내요 */
const welfare: Record<string, string> = {
  "r1-basic": "BASIC_LIVELIHOOD",
  "r1-near": "NEAR_POOR",
  "r1-single": "SINGLE_PARENT",
};

const marital = { single: "SINGLE", married: "MARRIED", planned: "ENGAGED" } as const;

/** 소득 % 구간 단위 */
const PCT_STEP = 10;
/** 이보다 크면 "이 % 초과"로만 보내요 */
const PCT_MAX = 300;

/** "3,200" (만 원) → 원. 비었으면 null */
const manWon = (v: string) => {
  const digits = v.replace(/\D/g, "");
  return digits ? Number(digits) * 10_000 : null;
};

/** 쓸 수 있는 돈 (원). 준비할 돈과 비교하는 데만 쓰고 서버로 보내지 않아요 */
export function availableCashWon(session: SessionConditions | null) {
  return session ? manWon(session.available) : null;
}

/** "1997.03.15" → "1997-03". 해·달을 다 모르면 없음 */
export function birthMonthOf(birth: string) {
  const [y = "", m = ""] = birth.split(".");
  return /^\d{4}$/.test(y) && /^(0[1-9]|1[0-2])$/.test(m) ? `${y}-${m}` : undefined;
}

/** 월 소득이 기준 월액의 몇 % 구간인지 (10% 단위: 90 초과 ~ 100 이하) */
export function percentBand(monthlyWon: number, baseWon: number): PercentRange {
  const pct = (monthlyWon / baseWon) * 100;
  if (pct > PCT_MAX) return { gtPct: PCT_MAX };
  const le = Math.max(PCT_STEP, Math.ceil(pct / PCT_STEP) * PCT_STEP);
  return le === PCT_STEP ? { lePct: le } : { gtPct: le - PCT_STEP, lePct: le };
}

/** 금액이 경계 금액 중 어디 사이인지 (앞 경계 초과 ~ 뒤 경계 이하) */
export function wonBand(won: number, cuts: number[]): WonRange {
  const sorted = [...cuts].sort((a, b) => a - b);
  const i = sorted.findIndex((c) => won <= c);
  if (i === -1) return sorted.length ? { gtWon: sorted[sorted.length - 1] } : {};
  return i === 0 ? { leWon: sorted[0] } : { gtWon: sorted[i - 1], leWon: sorted[i] };
}

/** 가구원 수 "1명" · "4명 이상" → 1 · 4 */
const householdSizeOf = (v: string) => {
  const n = Number(v.replace(/\D/g, ""));
  return n > 0 ? n : undefined;
};

/**
 * 저장한 조건 → 판정 입력. 기준값(criteria)이 없으면 소득·자산은 빼요 (그 조건은 확인 필요).
 * 정확한 소득·자산 금액은 이 함수 밖으로 나가지 않아요
 */
export function toApplicant(
  device: DeviceConditions | null,
  session: SessionConditions | null,
  criteria: Criteria | undefined,
): Applicant {
  if (!device) return {};
  const size = householdSizeOf(device.householdSize);
  const owner = device.homelessPeriod === "집이 있어요";
  const months = subscriptionMonths[device.bankbookPeriod];
  const payments = device.paymentCount.replace(/\D/g, "");
  const a: Applicant = {
    birthMonth: birthMonthOf(device.birth),
    regionCode: device.regionCode || undefined,
    householdHead: device.head === "head",
    householdSize: size,
    targetGroups: device.statuses.map((s) => targetGroups[s]).filter(Boolean),
    marital: marital[device.marry],
    children: device.kids,
    homeOwner: owner,
    homelessYears: owner ? undefined : homelessYears[device.homelessPeriod],
    subscription:
      months || payments
        ? { months, payments: payments ? Number(payments) : undefined }
        : undefined,
  };
  if (!session) return a;

  a.welfareStatuses = session.rankChecks.map((k) => welfare[k]).filter(Boolean);
  // 2·3순위 체크 키 "r2-income" → "R2_INCOME"
  a.rankChecks = session.rankChecks
    .filter((k) => /^r[23]-/.test(k))
    .map((k) => k.toUpperCase().replace(/-/g, "_"));
  if (!criteria) return a;

  const income = manWon(session.income);
  if (income !== null && size) {
    const monthly = income / 12;
    const bands: Applicant["income"] = {};
    const median = criteria.medianIncomeMonthlyWon?.[String(size)];
    const urban = criteria.urbanWorkerIncomeMonthlyWon?.[String(size)];
    if (median) bands.MEDIAN_INCOME = { ...percentBand(monthly, median), year: criteria.year };
    if (urban) {
      bands.URBAN_WORKER_INCOME = {
        ...percentBand(monthly, urban),
        year: criteria.urbanWorkerIncomeYear ?? criteria.year,
      };
    }
    if (Object.keys(bands).length) {
      a.income = bands;
      a.incomeYear = criteria.year;
    }
  }
  const asset = session.assetUnknown ? null : manWon(session.asset);
  if (asset !== null && criteria.assetCutsWon.length) {
    a.assets = wonBand(asset, criteria.assetCutsWon);
  }
  return a;
}
