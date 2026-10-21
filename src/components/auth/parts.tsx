import Link from "next/link";
import { Check } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { passwordRules } from "@/features/auth/password";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

/** 인증 화면 입력칸 (높이는 PC 56 · 모바일 54) */
export const authInput =
  "rounded-control border border-solid border-line bg-surface text-text px-[16px] text-[17px] font-medium min-h-[56px] min-w-0";

export const authLabel = "flex flex-col gap-[8px] text-[15px] font-bold";

/** PC 인증 화면 헤더: 로고 + 오른쪽 */
export function AuthWebHeader({ right }: { right?: React.ReactNode }) {
  return (
    <header className="border-line bg-surface border-b border-solid">
      <div className="mx-auto box-border flex min-h-[68px] w-full max-w-[1200px] items-center justify-between gap-[16px] px-[32px]">
        <Link
          href={routes.main}
          aria-label="무주택자들 소개"
          className="text-text hover:text-text inline-flex items-center gap-[9px] no-underline"
        >
          <Logo size={30} />
          <span className="tracking-logo text-[19px] font-extrabold">무주택자들</span>
        </Link>
        {right}
      </div>
    </header>
  );
}

/** 간편 로그인 버튼 (로고 없이 색만) */
export function SocialButtons({
  labels,
  className,
  buttonClassName,
}: {
  labels: [string, string, string];
  className?: string;
  buttonClassName?: string;
}) {
  const base = cn(
    "cursor-pointer rounded-control min-h-[56px] text-[16px] font-bold",
    buttonClassName,
  );
  return (
    <div className={className}>
      <button type="button" className={cn(base, "bg-kakao-bg text-kakao-text border-0")}>
        {labels[0]}
      </button>
      <button type="button" className={cn(base, "bg-naver-bg text-naver-text border-0")}>
        {labels[1]}
      </button>
      <button
        type="button"
        className={cn(base, "border-line bg-surface text-text border border-solid")}
      >
        {labels[2]}
      </button>
    </div>
  );
}

/** 비밀번호 규칙 표시 */
export function PasswordRules({ pw }: { pw: string }) {
  return (
    <div aria-live="polite" className="flex flex-wrap gap-x-[14px] gap-y-[6px]">
      {passwordRules(pw).map((r) => (
        <span
          key={r.label}
          className={cn(
            "inline-flex items-center gap-[4px] text-[14px] font-semibold",
            r.ok ? "text-brand-strong" : "text-text-tertiary",
          )}
        >
          <Check size={16} strokeWidth={2.4} aria-hidden />
          {r.label}
        </span>
      ))}
    </div>
  );
}

/** 이메일 구분선 */
export function OrDivider() {
  return (
    <div role="separator" className="text-text-tertiary flex items-center gap-[12px] text-[14px]">
      <span className="bg-line h-px flex-1" />
      또는 이메일로
      <span className="bg-line h-px flex-1" />
    </div>
  );
}

/** 체크 상자 모양 (24px, 둥글기 7) */
export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "flex size-[24px] flex-none items-center justify-center rounded-[7px] text-white",
        checked ? "bg-brand" : "bg-check-off",
      )}
    >
      <Check size={16} strokeWidth={3} aria-hidden />
    </span>
  );
}

/** 라디오 점 (22px) */
export function RadioDot({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "rounded-pill mt-px box-border size-[22px] flex-none border-solid",
        checked ? "border-brand border-[7px]" : "border-off border-2",
      )}
    />
  );
}

/** 단계 표시 막대 */
export function StepDots({
  step,
  labels,
  className,
  dotClassName,
}: {
  step: number;
  labels: readonly string[];
  className?: string;
  dotClassName?: string;
}) {
  return (
    <ol aria-label="진행 단계" className={cn("m-0 grid list-none gap-[6px] p-0", className)}>
      {labels.map((l, i) => (
        <li
          key={l}
          aria-current={i + 1 === step ? "step" : undefined}
          className={cn(
            "h-[6px] rounded-[3px]",
            i + 1 <= step ? "bg-brand" : "bg-line",
            dotClassName,
          )}
        >
          <span className="sr-only">
            {i + 1}단계 {l}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 약관 링크 안내 (로그인 아래) */
export function LegalNote() {
  return (
    <span className="text-text-tertiary text-center text-[13px] leading-[1.6]">
      계속하면{" "}
      <Link href={routes.terms} className="text-text-sub hover:text-text-sub font-semibold">
        이용약관
      </Link>
      과{" "}
      <Link href={routes.privacy} className="text-text hover:text-text font-bold">
        개인정보처리방침
      </Link>
      에 동의하는 것으로 봐요
    </span>
  );
}
