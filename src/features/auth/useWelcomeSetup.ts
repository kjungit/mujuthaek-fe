"use client";

import { useState } from "react";

export const interestOptions = ["청약 · 공공임대", "정부 혜택", "전월세", "사업공간"] as const;

/** 가입 완료 화면의 첫 설정 3가지 (PC/모바일 공통) */
export function useWelcomeSetup() {
  const [alert, setAlert] = useState(false);
  const [interests, setInterests] = useState<string[]>([]);
  const [cond, setCond] = useState(false);
  const interestDone = interests.length > 0;
  const done = [alert, interestDone, cond].filter(Boolean).length;

  return {
    alert,
    setAlert,
    interests,
    interestDone,
    toggleInterest: (label: string) =>
      setInterests((xs) => (xs.includes(label) ? xs.filter((x) => x !== label) : [...xs, label])),
    cond,
    confirmCond: () => setCond(true),
    done,
    progress: `${Math.round((done / 3) * 100)}%`,
  };
}
