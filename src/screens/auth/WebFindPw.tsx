"use client";

import Link from "next/link";
import { AuthWebHeader, StepDots } from "@/components/auth/parts";
import { FindPwStep, findPwWeb } from "@/components/auth/FindPwSteps";
import { findPwSteps, useFindPassword } from "@/features/auth/useFindPassword";
import { routes } from "@/lib/routes";

export function WebFindPw() {
  const flow = useFindPassword();
  return (
    <div className="bg-bg text-text flex min-h-screen w-full flex-col">
      <AuthWebHeader
        right={
          <Link
            href={routes.login}
            className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center px-[12px] text-[15px] font-semibold no-underline"
          >
            로그인으로 돌아가기
          </Link>
        }
      />
      <main className="mx-auto box-border flex w-full max-w-[520px] flex-1 flex-col gap-[20px] px-[24px] pt-[64px] pb-[72px]">
        <StepDots step={flow.step} labels={findPwSteps} className="grid-cols-4" />
        <section
          aria-live="polite"
          className="rounded-card-lg bg-surface flex flex-col gap-[22px] px-[32px] py-[36px]"
        >
          <FindPwStep flow={flow} v={findPwWeb} />
        </section>
      </main>
    </div>
  );
}
