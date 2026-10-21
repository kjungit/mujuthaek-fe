"use client";

import Link from "next/link";
import {
  AuthWebHeader,
  PasswordRules,
  SocialButtons,
  authInput,
  authLabel,
} from "@/components/auth/parts";
import { SaveOptions, SignupSubmit, TermsList } from "@/components/auth/SignupParts";
import { useAuthSession } from "@/features/auth/queries";
import { useSignupForm } from "@/features/auth/useSignupForm";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const saveOptions = [
  {
    key: "basic" as const,
    title: "나이·지역·가족만 저장",
    desc: "소득·자산은 저장하지 않아요. 판정할 때마다 다시 입력해요",
  },
  {
    key: "full" as const,
    title: "소득·자산까지 저장",
    desc: "다음부터 바로 결과를 볼 수 있어요. 내 정보에서 언제든 지울 수 있어요",
  },
];

export function WebSignup() {
  const form = useSignupForm();
  const { data } = useAuthSession();

  return (
    <div className="bg-bg text-text flex min-h-screen w-full flex-col">
      <AuthWebHeader
        right={
          <span className="text-text-sub inline-flex items-center gap-[6px] text-[15px]">
            이미 계정이 있나요?
            <Link
              href={routes.login}
              className="text-brand-strong hover:text-brand-strong inline-flex min-h-[44px] items-center font-extrabold no-underline"
            >
              로그인
            </Link>
          </span>
        }
      />

      <main className="mx-auto box-border flex w-full max-w-[600px] flex-1 flex-col gap-[16px] px-[24px] pt-[48px] pb-[72px]">
        <div className="flex flex-col gap-[8px] px-[4px] pb-[8px]">
          <h1 className="tracking-h1 m-0 text-[32px] font-extrabold">회원가입</h1>
          <span className="text-text-sub text-[16px]">
            관심 공고와 알림을 저장하려면 계정이 필요해요
          </span>
        </div>

        <section
          aria-label="간편 가입"
          className="rounded-card bg-surface flex flex-col gap-[10px] p-[24px]"
        >
          <span className="text-text-sub text-[15px] font-bold">간편 가입</span>
          <SocialButtons
            labels={["카카오", "네이버", "Google"]}
            className="grid grid-cols-3 gap-[8px]"
            buttonClassName="rounded-sm min-h-[52px] text-[15px]"
          />
        </section>

        <section
          aria-label="이메일로 가입"
          className="rounded-card bg-surface flex flex-col gap-[18px] px-[24px] py-[28px]"
        >
          <span className="text-text-sub text-[15px] font-bold">이메일로 가입</span>
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="su-email" className="text-[15px] font-bold">
              이메일
            </label>
            <div className="flex gap-[8px]">
              <input
                id="su-email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                className={cn(authInput, "flex-1")}
              />
              <button
                type="button"
                className="rounded-control bg-text min-h-[56px] flex-none cursor-pointer border-0 px-[16px] text-[15px] font-bold text-white"
              >
                인증번호 받기
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="su-code" className="text-[15px] font-bold">
              인증번호
            </label>
            <span className="relative flex">
              <input
                id="su-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6자리 숫자"
                aria-describedby="su-code-help"
                className={cn(authInput, "flex-1 pr-[72px]")}
              />
              <span className="text-brand-strong absolute top-1/2 right-[16px] -translate-y-1/2 text-[15px] font-bold">
                {data.codeRemaining}
              </span>
            </span>
            <span id="su-code-help" className="text-text-sub text-[13px]">
              메일이 안 왔다면 스팸함을 확인하거나 다시 받아주세요
            </span>
          </div>
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="su-pw" className="text-[15px] font-bold">
              비밀번호
            </label>
            <input
              id="su-pw"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호"
              value={form.pw}
              onChange={(e) => form.setPw(e.target.value)}
              className={authInput}
            />
            <PasswordRules pw={form.pw} />
          </div>
          <label className={authLabel}>
            비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              placeholder="한 번 더 입력"
              className={authInput}
            />
          </label>
        </section>

        <section
          aria-label="입력한 조건 저장"
          className="rounded-card bg-surface flex flex-col gap-[12px] p-[24px]"
        >
          <div className="flex flex-col gap-[4px]">
            <span className="text-[17px] font-extrabold">아까 입력한 조건, 어떻게 할까요?</span>
            <span className="text-text-sub text-[14px] leading-[1.6]">
              로그인 없이 입력한 조건을 계정에 이어서 쓸 수 있어요
            </span>
          </div>
          <SaveOptions form={form} options={saveOptions} optionClassName="px-[16px] py-[14px]" />
        </section>

        <section
          aria-label="약관 동의"
          className="rounded-card bg-surface flex flex-col px-[24px] pt-[12px] pb-[16px]"
        >
          <TermsList form={form} />
        </section>

        <SignupSubmit form={form} className="min-h-[60px] text-[18px]" />
      </main>
    </div>
  );
}
