"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PasswordRules, SocialButtons, authInput, authLabel } from "@/components/auth/parts";
import { SignupSubmit, TermsList } from "@/components/auth/SignupParts";
import { useAuthSession } from "@/features/auth/queries";
import { useSignupForm } from "@/features/auth/useSignupForm";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const mInput = cn(authInput, "min-h-[54px]");

export function MSignup() {
  const form = useSignupForm();
  const { data } = useAuthSession();

  return (
    <div className="bg-bg text-text flex min-h-screen w-full flex-col">
      <header className="border-line-soft bg-surface flex h-[56px] items-center gap-[4px] border-b border-solid px-[8px]">
        <Link
          href={routes.login}
          aria-label="뒤로"
          className="text-text hover:text-text inline-flex size-[44px] items-center justify-center rounded-sm"
        >
          <ChevronLeft size={24} aria-hidden />
        </Link>
        <h1 className="m-0 text-[18px] font-extrabold">회원가입</h1>
      </header>

      <main className="flex flex-1 flex-col gap-[12px] px-[16px] pt-[20px] pb-[32px]">
        <section
          aria-label="간편 가입"
          className="rounded-card bg-surface flex flex-col gap-[10px] p-[20px]"
        >
          <span className="text-text-sub text-[15px] font-bold">간편 가입</span>
          <SocialButtons
            labels={["카카오", "네이버", "Google"]}
            className="grid grid-cols-3 gap-[8px]"
            buttonClassName="rounded-sm min-h-[50px] text-[15px]"
          />
        </section>

        <section
          aria-label="이메일로 가입"
          className="rounded-card bg-surface flex flex-col gap-[16px] px-[20px] py-[22px]"
        >
          <span className="text-text-sub text-[15px] font-bold">이메일로 가입</span>
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="m-email" className="text-[15px] font-bold">
              이메일
            </label>
            <input
              id="m-email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className={mInput}
            />
            <button
              type="button"
              className="rounded-control bg-text min-h-[50px] cursor-pointer border-0 text-[15px] font-bold text-white"
            >
              인증번호 받기
            </button>
          </div>
          <label className={authLabel}>
            인증번호
            <span className="relative flex">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6자리 숫자"
                className={cn(mInput, "flex-1 pr-[64px]")}
              />
              <span className="text-brand-strong absolute top-1/2 right-[16px] -translate-y-1/2 text-[15px] font-bold">
                {data.codeRemaining}
              </span>
            </span>
          </label>
          <div className="flex flex-col gap-[8px]">
            <label htmlFor="m-pw" className="text-[15px] font-bold">
              비밀번호
            </label>
            <input
              id="m-pw"
              type="password"
              autoComplete="new-password"
              placeholder="비밀번호"
              value={form.pw}
              onChange={(e) => form.setPw(e.target.value)}
              className={mInput}
            />
            <PasswordRules pw={form.pw} />
          </div>
          <label className={authLabel}>
            비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              placeholder="한 번 더 입력"
              className={mInput}
            />
          </label>
        </section>

        <section
          aria-label="저장하는 정보"
          className="rounded-card bg-surface flex flex-col gap-[12px] p-[20px]"
        >
          <span className="text-[17px] font-extrabold">어떤 정보를 저장하나요?</span>
          <ul className="text-text-sub m-0 flex list-none flex-col gap-[8px] p-0 text-[14px] leading-[1.6]">
            <li>계정에는 이메일과 관심 공고·알림 설정만 저장하고, 탈퇴하면 바로 지워요</li>
            <li>입력한 조건은 계정과 상관없이 이 기기에만 30일 동안 저장해요</li>
            <li className="text-brand-strong font-bold">소득·자산은 어디에도 저장하지 않아요</li>
          </ul>
        </section>

        <section
          aria-label="약관 동의"
          className="rounded-card bg-surface flex flex-col px-[20px] pt-[8px] pb-[12px]"
        >
          <TermsList form={form} allClassName="min-h-[58px]" />
        </section>
      </main>

      <div className="border-line bg-surface sticky bottom-0 border-t border-solid px-[16px] pt-[12px] pb-[28px]">
        <SignupSubmit form={form} className="min-h-[58px] text-[17px]" />
      </div>
    </div>
  );
}
