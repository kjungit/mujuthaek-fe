import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LegalNote, OrDivider, SocialButtons, authInput, authLabel } from "@/components/auth/parts";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export function MLogin() {
  return (
    <div className="bg-surface text-text flex min-h-screen w-full flex-col">
      <header className="flex h-[56px] items-center px-[8px]">
        <Link
          href={routes.main}
          aria-label="뒤로"
          className="text-text hover:text-text inline-flex size-[44px] items-center justify-center rounded-sm"
        >
          <ChevronLeft size={24} aria-hidden />
        </Link>
      </header>

      <main className="flex flex-1 flex-col gap-[22px] px-[20px] pt-[12px] pb-[40px]">
        <div className="flex flex-col gap-[14px]">
          <Logo size={44} />
          <h1 className="tracking-h1 m-0 text-[28px] leading-[1.35] font-extrabold">
            로그인하면
            <br />
            마감을 놓치지 않아요
          </h1>
          <span className="text-text-sub text-[15px]">
            관심 공고 저장 · 새 공고 알림 · 조건 저장
          </span>
        </div>

        <SocialButtons
          labels={["카카오로 계속하기", "네이버로 계속하기", "Google로 계속하기"]}
          className="flex flex-col gap-[10px]"
        />

        <OrDivider />

        <div className="flex flex-col gap-[14px]">
          <label className={authLabel}>
            이메일
            <input
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className={cn(authInput, "min-h-[54px]")}
            />
          </label>
          <label className={authLabel}>
            비밀번호
            <input
              type="password"
              autoComplete="current-password"
              placeholder="비밀번호"
              className={cn(authInput, "min-h-[54px]")}
            />
          </label>
          <div className="flex items-center justify-between">
            <label className="text-text-sub flex min-h-[44px] items-center gap-[8px] text-[15px]">
              <input type="checkbox" defaultChecked className="m-[3px_3px_3px_4px] size-[18px]" />{" "}
              로그인 유지
            </label>
            <Link
              href={routes.findPassword}
              className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center text-[15px] font-semibold no-underline"
            >
              비밀번호 찾기
            </Link>
          </div>
          <Link
            href={routes.home}
            className="rounded-control bg-brand flex min-h-[56px] items-center justify-center text-[17px] font-extrabold text-white no-underline hover:text-white"
          >
            로그인
          </Link>
        </div>

        <div className="text-text-sub flex items-center justify-center gap-[6px] text-[15px]">
          아직 계정이 없나요?
          <Link
            href={routes.signup}
            className="text-brand-strong hover:text-brand-strong inline-flex min-h-[44px] items-center font-extrabold no-underline"
          >
            회원가입
          </Link>
        </div>
        <Link
          href={routes.profile}
          className="rounded-control bg-fill text-text hover:text-text flex min-h-[52px] items-center justify-center text-[15px] font-bold no-underline"
        >
          로그인 없이 계속하기
        </Link>
        <LegalNote />
      </main>
    </div>
  );
}
