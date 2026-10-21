"use client";

import { useState } from "react";
import { passwordOk } from "./password";

export const findPwSteps = ["이메일 입력", "인증번호 확인", "새 비밀번호", "완료"] as const;

/** 비밀번호 찾기 4단계 (PC/모바일 공통) */
export function useFindPassword() {
  const [step, setStep] = useState(1);
  const [pw, setPw] = useState("");
  const ready = passwordOk(pw);
  return {
    step,
    pw,
    setPw,
    ready,
    next: () => {
      if (step === 3 && !ready) return;
      setStep((s) => Math.min(s + 1, 4));
    },
    restart: () => {
      setStep(1);
      setPw("");
    },
  };
}
