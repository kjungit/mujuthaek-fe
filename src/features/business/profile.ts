"use client";

// 사업 정보 (사업공간 · 사업 지원 판정 입력). 조건 입력과 같이 이 기기에 저장하고, 매출은 이번 탭에서만 써요
import { useSyncExternalStore } from "react";
import { snapshotRegions } from "@/lib/regions";
import type { BizStage } from "@/mocks/business";

/** 이 기기에 저장하는 사업 정보. 매출은 넣지 않아요 */
export type BizProfileInput = {
  stage: BizStage;
  /** 사업 중일 때 개인 · 법인 (모르면 "") */
  applicantType: "" | "INDIVIDUAL" | "CORPORATION";
  /** industries의 key (모르면 "") */
  industry: string;
  /** 업력 개월 (사업 중일 때) */
  months: string;
  /** 직원 수 (나 포함). 판정에는 아직 쓰지 않아요 */
  employees: string;
  /** 예비 창업은 희망 지역, 사업 중은 사업장 소재지 (시·도 2자리 또는 시·군·구 5자리, 모르면 "") */
  regionCode: string;
  /** 필요한 공간 (STARTUP_SPACE · SHOP_RENTAL · MEETING_ROOM) */
  needs: string[];
};

export type BizProfileSnapshot =
  { status: "loading" } | { status: "ready"; profile: BizProfileInput | null; revenue: string };

/**
 * 업종 선택지 → 한국표준산업분류(11차) 세세분류 대표 코드. 판정 엔진은 공고의 업종 코드(2~5자리)가 이 코드의 앞부분이면 해당한다고 봐요.
 * 묶음(group)으로 나눠 보여주고, 코드 하나로 정할 수 없는 "그 밖의 제조" · "기타"만 코드를 보내지 않아 업종 조건을 확인 필요로 둬요.
 * key는 저장값이라 바꾸지 않아요 (예전 선택지 SOFTWARE · CONTENT 등도 그대로 읽혀요)
 */
export const industries = [
  { group: "IT · 소프트웨어", key: "SOFTWARE", label: "소프트웨어 개발", code: "58222" },
  { group: "IT · 소프트웨어", key: "GAME", label: "게임 개발", code: "58211" },
  { group: "IT · 소프트웨어", key: "IT_SERVICE", label: "IT 서비스 · 외주 개발", code: "62010" },
  { group: "IT · 소프트웨어", key: "PLATFORM", label: "플랫폼 · 앱 서비스", code: "63120" },
  { group: "IT · 소프트웨어", key: "DATA_AI", label: "데이터 · AI", code: "62090" },
  { group: "음식점 · 카페", key: "FOOD", label: "음식점", code: "56111" },
  { group: "음식점 · 카페", key: "CAFE", label: "카페", code: "56221" },
  { group: "음식점 · 카페", key: "BAKERY", label: "제과점 · 베이커리", code: "56191" },
  {
    group: "판매 · 유통",
    key: "ONLINE_SALES",
    label: "온라인 판매 (쇼핑몰 · 스마트스토어)",
    code: "47912",
  },
  { group: "판매 · 유통", key: "RETAIL", label: "종합 소매 (매장)", code: "47190" },
  { group: "판매 · 유통", key: "RETAIL_FOOD", label: "식품 소매", code: "47219" },
  { group: "판매 · 유통", key: "RETAIL_CLOTH", label: "의류 소매", code: "47419" },
  { group: "판매 · 유통", key: "RETAIL_COSMETIC", label: "화장품 소매", code: "47813" },
  { group: "콘텐츠 · 디자인", key: "DESIGN", label: "디자인", code: "73203" },
  { group: "콘텐츠 · 디자인", key: "CONTENT", label: "영상 · 콘텐츠 제작", code: "59111" },
  { group: "콘텐츠 · 디자인", key: "PUBLISH", label: "출판 · 웹툰", code: "58119" },
  { group: "콘텐츠 · 디자인", key: "MUSIC", label: "음악 · 오디오", code: "59201" },
  { group: "콘텐츠 · 디자인", key: "AD", label: "광고 · 마케팅 대행", code: "71310" },
  { group: "제조", key: "MFG_FOOD", label: "식품 제조", code: "10799" },
  { group: "제조", key: "MFG_COSMETIC", label: "화장품 제조", code: "20423" },
  { group: "제조", key: "MFG_CLOTH", label: "의류 제조", code: "14199" },
  { group: "제조", key: "MFG_ELECTRONIC", label: "전자부품 제조", code: "26299" },
  { group: "제조", key: "MFG_MACHINE", label: "기계 제조", code: "29199" },
  { group: "제조", key: "MANUFACTURING", label: "그 밖의 제조", code: null },
  { group: "서비스", key: "EDU", label: "교육 · 학원", code: "85669" },
  { group: "서비스", key: "BEAUTY", label: "미용", code: "96112" },
  { group: "서비스", key: "CONSULT", label: "경영 컨설팅", code: "71531" },
  { group: "서비스", key: "LAUNDRY", label: "세탁", code: "96911" },
  { group: "농림 · 기타", key: "AGRI", label: "농업", code: "01110" },
  { group: "농림 · 기타", key: "OTHER", label: "기타", code: null },
] as const;

/** 업종 선택지를 묶음별로 (select의 optgroup) */
export const industryGroups = Array.from(new Set(industries.map((i) => i.group))).map((group) => ({
  group,
  items: industries.filter((i) => i.group === group),
}));

export const needOptions = [
  { key: "STARTUP_SPACE", label: "사무실 · 창업 공간" },
  { key: "SHOP_RENTAL", label: "상가" },
  { key: "MEETING_ROOM", label: "회의실" },
] as const;

export const emptyBizProfile: BizProfileInput = {
  stage: "pre",
  applicantType: "",
  industry: "",
  months: "",
  employees: "",
  regionCode: "",
  needs: [],
};

const DEVICE_KEY = "mujuthaek:business:v1";
const REVENUE_KEY = "mujuthaek:business:revenue";
/** 조건 입력의 "이 기기에 저장" 설정을 같이 따라요 */
const SAVE_PREF_KEY = "mujuthaek:save-on-device";
const SESSION_DEVICE_KEY = "mujuthaek:business:device-session";

const LOADING: BizProfileSnapshot = { status: "loading" };

function read(storage: () => Storage, key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function write(storage: () => Storage, key: string, value: string | null) {
  try {
    if (value === null) storage().removeItem(key);
    else storage().setItem(key, value);
  } catch {
    // 저장소를 못 쓰면(사파리 프라이빗 등) 이번 화면에서만 써요
  }
}

const local = () => window.localStorage;
const session = () => window.sessionStorage;

function readSnapshot(): BizProfileSnapshot {
  const onDevice = read(local, SAVE_PREF_KEY) !== "false";
  const raw = read(onDevice ? local : session, onDevice ? DEVICE_KEY : SESSION_DEVICE_KEY);
  let profile: BizProfileInput | null = null;
  try {
    profile = raw ? { ...emptyBizProfile, ...(JSON.parse(raw) as Partial<BizProfileInput>) } : null;
  } catch {
    profile = null;
  }
  return { status: "ready", profile, revenue: read(session, REVENUE_KEY) ?? "" };
}

let snapshot: BizProfileSnapshot | null = null;
const listeners = new Set<() => void>();

function emit() {
  snapshot = readSnapshot();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key.startsWith("mujuthaek:")) emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  if (!snapshot) snapshot = readSnapshot();
  return snapshot;
}

export function useBizProfileInput(): BizProfileSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, () => LOADING);
}

export function saveBizProfile(profile: BizProfileInput, revenue: string) {
  const onDevice = read(local, SAVE_PREF_KEY) !== "false";
  write(
    onDevice ? local : session,
    onDevice ? DEVICE_KEY : SESSION_DEVICE_KEY,
    JSON.stringify(profile),
  );
  write(session, REVENUE_KEY, revenue || null);
  emit();
}

/** "3,200" → 3200. 비었거나 숫자가 없으면 null */
export function digits(v: string): number | null {
  const d = v.replace(/\D/g, "");
  return d ? Number(d) : null;
}

/** 판정 엔진의 사업 입력 (JudgmentApplicantRequest.business). 모르는 칸은 보내지 않아 확인 필요로 둬요 */
export type BusinessApplicant = {
  applicantType?: "INDIVIDUAL" | "CORPORATION";
  hasSite?: boolean;
  siteRegionCode?: string;
  /** 사업 이력. 예비 창업이면 빈 목록 (사업한 적 없음) */
  history?: { openedOn: string; closedOn?: string }[];
  industryCode?: string;
  /** 연도 → 매출 (원). 판정할 때만 보내고 저장하지 않아요 */
  revenueByYear?: Record<string, number>;
};

const ymd = (d: Date) => d.toISOString().slice(0, 10);

/** 사업 정보 → 판정 입력. 업력은 오늘에서 개월 수만큼 앞을 개업일로, 매출은 작년 매출로 봐요 */
export function toBusinessApplicant(
  p: BizProfileInput,
  revenueManWon: string,
  today = new Date(),
): BusinessApplicant {
  const code = industries.find((i) => i.key === p.industry)?.code ?? undefined;
  if (p.stage === "pre") {
    return { applicantType: "INDIVIDUAL", hasSite: false, history: [], industryCode: code };
  }
  const months = digits(p.months);
  const opened = new Date(today);
  if (months !== null) opened.setMonth(opened.getMonth() - months);
  const revenue = digits(revenueManWon);
  return {
    applicantType: p.applicantType || undefined,
    hasSite: p.regionCode ? true : undefined,
    siteRegionCode: p.regionCode || undefined,
    history: months !== null ? [{ openedOn: ymd(opened) }] : undefined,
    industryCode: code,
    revenueByYear:
      revenue !== null ? { [String(today.getFullYear() - 1)]: revenue * 10_000 } : undefined,
  };
}

/** 사업공간 홈 "내 사업 정보" 칩 */
export function profileChips(p: BizProfileInput | null): string[] {
  if (!p) return [];
  const industry = industries.find((i) => i.key === p.industry)?.label;
  const employees = digits(p.employees);
  const region = p.regionCode ? snapshotRegions.label(p.regionCode) : null;
  return [
    p.stage === "pre" ? "예비 창업" : "사업 중",
    industry,
    p.stage === "run" && digits(p.months) !== null ? `업력 ${digits(p.months)}개월` : null,
    employees !== null ? `${employees}인` : null,
    region && (p.stage === "pre" ? `희망 지역 ${region}` : `사업장 ${region}`),
  ].filter((c): c is string => Boolean(c));
}
