import type { Head, Marry } from "@/features/profile/useProfileForm";

/** 이 기기(localStorage)에 30일 동안 저장하는 조건. 소득·자산은 넣지 않아요 */
export type DeviceConditions = {
  birth: string;
  sido: string;
  sigungu: string;
  head: Head;
  statuses: string[];
  marry: Marry;
  kids: number;
  householdSize: string;
  homelessPeriod: string;
  bankbookPeriod: string;
  paymentCount: string;
  workplace: string;
  priorities: string[];
};

/** 저장하지 않는 값. 탭을 닫으면 지워지는 sessionStorage에만 둬요 */
export type SessionConditions = {
  income: string;
  asset: string;
  assetUnknown: boolean;
  available: string;
  rankChecks: string[];
};

export type ConditionsSnapshot =
  | { status: "loading" }
  | {
      status: "ready";
      device: DeviceConditions | null;
      session: SessionConditions | null;
      saveOnDevice: boolean;
      /** 이 기기에 저장한 시각 (ms). 이 기기 저장이 꺼져 있으면 null */
      savedAt: number | null;
    };
