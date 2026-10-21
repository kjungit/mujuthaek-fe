"use client";

import { useProfileFormData } from "@/features/profile/queries";
import { conditionChips, conditionRows, shortConditionChips } from "./format";
import { useConditions } from "./store";

/** 저장한 조건을 화면용으로. loading이면 아직 브라우저 저장소를 못 읽은 상태 */
export function useConditionSummary() {
  const stored = useConditions();
  const { data } = useProfileFormData();
  if (stored.status === "loading") return { status: "loading" as const };
  const device = stored.device;
  return {
    status: "ready" as const,
    hasConditions: device !== null,
    chips: device ? conditionChips(device, stored.session, data.rankCriteria) : [],
    shortChips: device ? shortConditionChips(device) : [],
    rows: device ? conditionRows(device) : [],
    saveOnDevice: stored.saveOnDevice,
    savedAt: stored.savedAt,
  };
}
