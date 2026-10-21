"use client";

import { useState } from "react";
import { passwordOk } from "./password";

export type SaveMode = "basic" | "full";

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

/** 회원가입 화면 상태 (PC/모바일 공통) */
export function useSignupForm() {
  const [pw, setPw] = useState("");
  const [save, setSave] = useState<SaveMode>("basic");
  const [agree, setAgree] = useState(initialAgree);

  const all = signupTerms.every((t) => agree[t.key]);
  const requiredOk = signupTerms.filter((t) => t.required).every((t) => agree[t.key]);
  const ready = requiredOk && passwordOk(pw);

  return {
    pw,
    setPw,
    save,
    setSave,
    agree,
    all,
    ready,
    toggle: (key: TermKey) => setAgree((a) => ({ ...a, [key]: !a[key] })),
    toggleAll: () =>
      setAgree(
        Object.fromEntries(signupTerms.map((t) => [t.key, !all])) as Record<TermKey, boolean>,
      ),
    submitText: ready
      ? "가입하기"
      : requiredOk
        ? "비밀번호 규칙을 확인해 주세요"
        : "필수 약관에 동의해 주세요",
  };
}
