"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { PasswordRules, authInput, authLabel } from "@/components/auth/parts";
import { useAuthSession } from "@/features/auth/queries";
import type { useFindPassword } from "@/features/auth/useFindPassword";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

type Flow = ReturnType<typeof useFindPassword>;

/** PC/모바일 차이: 제목 크기·입력칸 높이·문구 일부 */
type Variant = {
  h1: string;
  input: string;
  codeInput: string;
  codePad: string;
  socialNote: string;
  resendNote: string;
  newPwDesc: string;
  pwId: string;
  doneClass: string;
  loginClass?: string;
};

export const findPwWeb: Variant = {
  h1: "text-[28px]",
  input: "min-h-[56px]",
  codeInput: "min-h-[60px]",
  codePad: "pr-[72px]",
  socialNote:
    "카카오·네이버·Google로 가입했다면 비밀번호가 없어요. 로그인 화면에서 그 방법으로 로그인해 주세요.",
  resendNote: "메일이 안 왔나요? 스팸함도 확인해 주세요",
  newPwDesc: "예전에 쓰던 비밀번호와 다르게 정해 주세요",
  pwId: "np",
  doneClass: "py-[12px]",
};

export const findPwMobile: Variant = {
  h1: "text-[26px]",
  input: "min-h-[54px]",
  codeInput: "min-h-[58px]",
  codePad: "pr-[64px]",
  socialNote: "카카오·네이버·Google로 가입했다면 비밀번호가 없어요. 그 방법으로 로그인해 주세요.",
  resendNote: "메일이 안 왔나요?",
  newPwDesc: "예전 비밀번호와 다르게 정해 주세요",
  pwId: "mnp",
  doneClass: "pt-[60px]",
  loginClass: "mt-[12px]",
};

const primary =
  "rounded-control bg-brand min-h-[56px] cursor-pointer border-0 text-[17px] font-extrabold text-white";

function Head({ v, title, children }: { v: Variant; title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[8px]">
      <h1 className={cn("tracking-h1 m-0 font-extrabold", v.h1)}>{title}</h1>
      <span className="text-text-sub text-[16px] leading-[1.6]">{children}</span>
    </div>
  );
}

export function FindPwStep({ flow, v }: { flow: Flow; v: Variant }) {
  const { data } = useAuthSession();

  if (flow.step === 1)
    return (
      <div className="flex flex-col gap-[22px]">
        <Head v={v} title="비밀번호를 잊으셨나요?">
          가입한 이메일로 인증번호를 보내드려요
        </Head>
        <label className={authLabel}>
          이메일
          <input
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className={cn(authInput, v.input)}
          />
        </label>
        <button type="button" onClick={flow.next} className={primary}>
          인증번호 받기
        </button>
        <div className="bg-bg text-text-sub rounded-[16px] px-[16px] py-[14px] text-[14px] leading-[1.6]">
          {v.socialNote}
        </div>
      </div>
    );

  if (flow.step === 2)
    return (
      <div className="flex flex-col gap-[22px]">
        <Head v={v} title="메일을 확인해 주세요">
          <strong className="text-text">{data.maskedEmail}</strong>으로 6자리 인증번호를 보냈어요
        </Head>
        <label className={authLabel}>
          인증번호
          <span className="relative flex">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6자리 숫자"
              className={cn(
                authInput,
                "flex-1 text-[22px] font-bold tracking-[0.2em]",
                v.codeInput,
                v.codePad,
              )}
            />
            <span className="text-brand-strong absolute top-1/2 right-[16px] -translate-y-1/2 text-[15px] font-bold tracking-normal">
              {data.codeRemaining}
            </span>
          </span>
        </label>
        <button type="button" onClick={flow.next} className={primary}>
          확인
        </button>
        <div className="text-text-sub flex items-center justify-between text-[14px]">
          <span>{v.resendNote}</span>
          <button
            type="button"
            className="text-brand-strong min-h-[44px] cursor-pointer border-0 bg-transparent text-[14px] font-extrabold"
          >
            다시 받기
          </button>
        </div>
      </div>
    );

  if (flow.step === 3)
    return (
      <div className="flex flex-col gap-[22px]">
        <div className="flex flex-col gap-[8px]">
          <h1 className={cn("tracking-h1 m-0 font-extrabold", v.h1)}>새 비밀번호를 정해 주세요</h1>
          <span className="text-text-sub text-[16px]">{v.newPwDesc}</span>
        </div>
        <div className="flex flex-col gap-[8px]">
          <label htmlFor={v.pwId} className="text-[15px] font-bold">
            새 비밀번호
          </label>
          <input
            id={v.pwId}
            type="password"
            autoComplete="new-password"
            placeholder="새 비밀번호"
            value={flow.pw}
            onChange={(e) => flow.setPw(e.target.value)}
            className={cn(authInput, v.input)}
          />
          <PasswordRules pw={flow.pw} />
        </div>
        <label className={authLabel}>
          새 비밀번호 확인
          <input
            type="password"
            autoComplete="new-password"
            placeholder="한 번 더 입력"
            className={cn(authInput, v.input)}
          />
        </label>
        <button
          type="button"
          onClick={flow.next}
          aria-disabled={!flow.ready}
          className={cn(primary, !flow.ready && "bg-line text-text-sub")}
        >
          비밀번호 바꾸기
        </button>
      </div>
    );

  return (
    <div
      role="status"
      className={cn("flex flex-col items-center gap-[16px] text-center", v.doneClass)}
    >
      <span className="rounded-pill bg-brand-soft text-brand flex size-[72px] items-center justify-center">
        <Check size={38} strokeWidth={2.4} aria-hidden />
      </span>
      <h1 className={cn("tracking-h1 m-0 font-extrabold", v.h1)}>비밀번호를 바꿨어요</h1>
      <span className="text-text-sub text-[16px] leading-[1.6]">
        다른 기기에서는 로그아웃됐어요.
        <br />새 비밀번호로 다시 로그인해 주세요.
      </span>
      <Link
        href={routes.login}
        className={cn(
          "rounded-control bg-brand flex min-h-[56px] items-center justify-center self-stretch text-[17px] font-extrabold text-white no-underline hover:text-white",
          v.loginClass,
        )}
      >
        로그인하러 가기
      </Link>
      <button
        type="button"
        onClick={flow.restart}
        className="text-text-sub min-h-[44px] cursor-pointer border-0 bg-transparent text-[14px] font-semibold"
      >
        처음부터 다시 보기
      </button>
    </div>
  );
}
