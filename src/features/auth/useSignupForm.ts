"use client";

import { useState } from "react";

export const signupTerms = [
  { key: "age", required: true, label: "만 14세 이상이에요" },
  { key: "tos", required: true, label: "이용약관 동의" },
  { key: "privacy", required: true, label: "개인정보 수집·이용 동의" },
  { key: "alert", required: false, label: "공고·마감 알림 받기" },
  { key: "marketing", required: false, label: "이벤트·소식 받기" },
] as const;

export type TermKey = (typeof signupTerms)[number]["key"];

const initialAgree: Record<TermKey, boolean> = {
  age: false,
  tos: false,
  privacy: false,
  alert: true,
  marketing: false,
};

/** 가입 마무리(약관 동의) 화면 상태 (PC/모바일 공통) */
export function useSignupForm() {
  const [agree, setAgree] = useState(initialAgree);

  const all = signupTerms.every((t) => agree[t.key]);
  const requiredOk = signupTerms.filter((t) => t.required).every((t) => agree[t.key]);

  return {
    agree,
    all,
    ready: requiredOk,
    toggle: (key: TermKey) => setAgree((a) => ({ ...a, [key]: !a[key] })),
    toggleAll: () =>
      setAgree(
        Object.fromEntries(signupTerms.map((t) => [t.key, !all])) as Record<TermKey, boolean>,
      ),
    // 백엔드 동의 기록(POST /api/v1/me/consents)이 생기면 여기서 보내요
    submitText: requiredOk ? "동의하고 시작하기" : "필수 약관에 동의해 주세요",
  };
}
