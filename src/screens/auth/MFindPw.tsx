"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { StepDots } from "@/components/auth/parts";
import { FindPwStep, findPwMobile } from "@/components/auth/FindPwSteps";
import { findPwSteps, useFindPassword } from "@/features/auth/useFindPassword";
import { routes } from "@/lib/routes";

export function MFindPw() {
  const flow = useFindPassword();
  return (
    <div className="bg-surface text-text flex min-h-screen w-full flex-col">
      <header className="flex h-[56px] items-center justify-between px-[8px]">
        <Link
          href={routes.login}
          aria-label="뒤로"
          className="text-text hover:text-text inline-flex size-[44px] items-center justify-center rounded-sm"
        >
          <ChevronLeft size={24} aria-hidden />
        </Link>
        <StepDots
          step={flow.step}
          labels={findPwSteps}
          className="mr-[12px] grid-cols-[repeat(4,28px)]"
          dotClassName="h-[5px]"
        />
      </header>
      <main
        aria-live="polite"
        className="flex flex-1 flex-col gap-[22px] px-[20px] pt-[16px] pb-[40px]"
      >
        <FindPwStep flow={flow} v={findPwMobile} />
      </main>
    </div>
  );
}
