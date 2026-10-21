"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, ChevronRight, Eye, Heart, ListChecks } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { LegalNote, OrDivider, SocialButtons, authInput, authLabel } from "@/components/auth/parts";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const perks = [
  { icon: Heart, title: "관심 공고 저장", desc: "어느 기기에서든 이어서 볼 수 있어요" },
  {
    icon: BellRing,
    title: "새 공고 · 마감 알림",
    desc: "내 조건에 맞는 공고가 나오면 바로 알려드려요",
  },
  {
    icon: ListChecks,
    title: "조건은 한 번만",
    desc: "로그인하지 않아도 이 기기에 30일 동안 저장해 둬요",
  },
];

export function WebLogin() {
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="bg-surface text-text flex min-h-screen w-full flex-wrap">
      <section
        aria-label="무주택자들 소개"
        className="bg-brand-deep box-border flex min-w-0 flex-col justify-between gap-[48px] px-[56px] py-[48px] text-white"
        style={{ flex: "1 1 480px" }}
      >
        <Link
          href={routes.main}
          aria-label="무주택자들 소개"
          className="inline-flex items-center gap-[10px] self-start text-white no-underline hover:text-white"
        >
          <Logo size={34} inverted />
          <span className="tracking-logo text-[22px] font-extrabold">무주택자들</span>
        </Link>
        <div className="flex flex-col gap-[32px]">
          <h1 className="tracking-h1 m-0 text-[40px] leading-[1.3] font-extrabold">
            로그인하면
            <br />
            마감을 놓치지 않아요
          </h1>
          <ul className="m-0 flex list-none flex-col gap-[20px] p-0">
            {perks.map(({ icon: Icon, title, desc }) => (
              <li key={title} className="flex items-center gap-[14px]">
                <span className="rounded-control text-brand-deep-text-2 flex size-[44px] flex-none items-center justify-center bg-white/10">
                  <Icon size={22} aria-hidden />
                </span>
                <span className="flex flex-col gap-[2px]">
                  <span className="text-[17px] font-bold">{title}</span>
                  <span className="text-brand-deep-text-2 text-[15px]">{desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <span className="text-brand-deep-text-2 text-[14px]">
          로그인하지 않아도 판정 결과는 볼 수 있어요
        </span>
      </section>

      <main
        className="box-border flex min-w-0 items-center justify-center px-[32px] py-[48px]"
        style={{ flex: "1 1 520px" }}
      >
        <div className="flex w-full max-w-[420px] flex-col gap-[24px]">
          <div className="flex flex-col gap-[8px]">
            <h2 className="tracking-h1 m-0 text-[30px] font-extrabold">로그인</h2>
            <span className="text-text-sub text-[16px]">간편하게 3초면 시작할 수 있어요</span>
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
                className={authInput}
              />
            </label>
            <label className={authLabel}>
              비밀번호
              <span className="relative flex">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="비밀번호"
                  className={cn(authInput, "flex-1 pr-[56px]")}
                />
                <button
                  type="button"
                  aria-label="비밀번호 보기"
                  aria-pressed={showPw}
                  onClick={() => setShowPw((v) => !v)}
                  className="text-text-tertiary absolute top-1/2 right-[6px] flex size-[44px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-[10px] border-0 bg-transparent"
                >
                  <Eye size={20} aria-hidden />
                </button>
              </span>
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
            className="rounded-control bg-fill text-text hover:text-text flex min-h-[52px] items-center justify-center gap-[4px] text-[15px] font-bold no-underline"
          >
            로그인 없이 계속하기
            <ChevronRight size={18} aria-hidden />
          </Link>

          <LegalNote />
        </div>
      </main>
    </div>
  );
}
