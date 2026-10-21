"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  clearConditions,
  saveConditions,
  setSaveOnDevice,
  useConditions,
} from "@/features/conditions/store";
import type { DeviceConditions, SessionConditions } from "@/features/conditions/types";
import { routes } from "@/lib/routes";
import type { ProfileFormData, RankCriteria } from "@/mocks/profile";
import { useProfileFormData } from "./queries";

export type Head = "head" | "member";
export type Marry = "single" | "married" | "planned";

export const headOptions: { key: Head; label: string }[] = [
  { key: "head", label: "세대주예요" },
  { key: "member", label: "세대원이에요" },
];

export const marryOptions: { key: Marry; label: string }[] = [
  { key: "single", label: "미혼" },
  { key: "married", label: "기혼" },
  { key: "planned", label: "결혼 예정" },
];

/** 체크한 세부 요건으로 가장 높은 순위를 찾아요. 없으면 null */
export function estimateRank(criteria: RankCriteria[], checked: string[]) {
  const sorted = [...criteria].sort((a, b) => a.rank - b.rank);
  const hit = sorted.find((c) =>
    c.rule === "any"
      ? c.items.some((i) => checked.includes(i.key))
      : c.items.every((i) => checked.includes(i.key)),
  );
  return hit?.rank ?? null;
}

const toggle = (xs: string[], x: string) =>
  xs.includes(x) ? xs.filter((v) => v !== x) : [...xs, x];

function defaultDevice(data: ProfileFormData): DeviceConditions {
  const { options } = data;
  return {
    birth: "",
    sido: options.sido[0],
    sigungu: options.sigungu[0],
    head: "head",
    statuses: [],
    marry: "single",
    kids: 0,
    householdSize: options.householdSize[0],
    homelessPeriod: options.homelessPeriod[0],
    bankbookPeriod: options.bankbookPeriod[0],
    paymentCount: "",
    workplace: "",
    priorities: data.defaultPriorities,
  };
}

const emptySession: SessionConditions = {
  income: "",
  asset: "",
  assetUnknown: false,
  available: "",
  rankChecks: [],
};

type TextKey =
  | "birth"
  | "sido"
  | "sigungu"
  | "householdSize"
  | "homelessPeriod"
  | "bankbookPeriod"
  | "paymentCount"
  | "workplace";
type SessionTextKey = "income" | "asset" | "available";

/** 조건 입력 3단계 상태 (PC/모바일 공통). 처음 값은 이 기기에 저장한 조건에서 가져와요 */
export function useProfileForm() {
  const { data } = useProfileFormData();
  const router = useRouter();
  const stored = useConditions();
  const [step, setStep] = useState(1);
  const [device, setDevice] = useState<DeviceConditions>(() => defaultDevice(data));
  const [sess, setSess] = useState<SessionConditions>(emptySession);
  const [loaded, setLoaded] = useState(false);

  // 저장소를 읽을 수 있게 되면 한 번만 이어서 채워요 (렌더 중 상태 맞추기)
  if (!loaded && stored.status === "ready") {
    setLoaded(true);
    if (stored.device) setDevice({ ...defaultDevice(data), ...stored.device });
    if (stored.session) setSess({ ...emptySession, ...stored.session });
  }

  const patch = (p: Partial<DeviceConditions>) => setDevice((d) => ({ ...d, ...p }));
  const patchSess = (p: Partial<SessionConditions>) => setSess((v) => ({ ...v, ...p }));

  /** 글자·선택 칸 연결: value + onChange */
  const field = (key: TextKey) => ({
    value: device[key],
    onChange: (e: { target: { value: string } }) => patch({ [key]: e.target.value }),
  });
  const sessionField = (key: SessionTextKey) => ({
    value: sess[key],
    onChange: (e: { target: { value: string } }) => patchSess({ [key]: e.target.value }),
  });

  return {
    data,
    step,
    goTo: setStep,
    prev: () => setStep((s) => Math.max(1, s - 1)),
    next: () => setStep((s) => Math.min(3, s + 1)),
    isLast: step === 3,
    preview: data.previewByStep[step - 1],
    field,
    sessionField,
    head: device.head,
    setHead: (head: Head) => patch({ head }),
    marry: device.marry,
    setMarry: (marry: Marry) => patch({ marry }),
    kids: device.kids,
    kidsDown: () => setDevice((d) => ({ ...d, kids: Math.max(0, d.kids - 1) })),
    kidsUp: () => setDevice((d) => ({ ...d, kids: Math.min(9, d.kids + 1) })),
    prios: device.priorities,
    togglePrio: (p: string) => setDevice((d) => ({ ...d, priorities: toggle(d.priorities, p) })),
    statuses: device.statuses,
    toggleStatus: (s: string) => setDevice((d) => ({ ...d, statuses: toggle(d.statuses, s) })),
    assetUnknown: sess.assetUnknown,
    setAssetUnknown: (assetUnknown: boolean) => patchSess({ assetUnknown }),
    rankChecks: sess.rankChecks,
    toggleRankCheck: (key: string) =>
      setSess((v) => ({ ...v, rankChecks: toggle(v.rankChecks, key) })),
    estimatedRank: estimateRank(data.rankCriteria, sess.rankChecks),
    saveOnDevice: stored.status === "ready" ? stored.saveOnDevice : true,
    setSaveOnDevice,
    hasSaved: stored.status === "ready" && stored.device !== null,
    clearSaved: () => {
      clearConditions();
      setDevice(defaultDevice(data));
      setSess(emptySession);
    },
    /** 확인하기: 저장하고 결과(홈)로 */
    submit: () => {
      saveConditions(device, sess);
      router.push(routes.home);
    },
  };
}

export type ProfileForm = ReturnType<typeof useProfileForm>;
