"use client";

import Link from "next/link";
import { CheckBox } from "@/components/auth/parts";
import { signupTerms, type useSignupForm } from "@/features/auth/useSignupForm";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

type Form = ReturnType<typeof useSignupForm>;

const termLinks: Partial<Record<(typeof signupTerms)[number]["key"], string>> = {
  tos: routes.terms,
  privacy: routes.privacy,
  marketing: routes.privacy,
};

/** 약관 동의 목록 */
export function TermsList({ form, allClassName }: { form: Form; allClassName?: string }) {
  return (
    <>
      <button
        type="button"
        role="checkbox"
        aria-checked={form.all}
        onClick={form.toggleAll}
        className={cn(
          "border-line-soft text-text flex min-h-[60px] cursor-pointer items-center gap-[12px] border-0 border-b border-solid bg-transparent p-0 text-left",
          allClassName,
        )}
      >
        <CheckBox checked={form.all} />
        <span className="text-[17px] font-extrabold">전체 동의</span>
      </button>
      {signupTerms.map((t) => {
        const on = form.agree[t.key];
        const href = termLinks[t.key];
        return (
          <div key={t.key} className="flex items-center justify-between gap-[8px]">
            <button
              type="button"
              role="checkbox"
              aria-checked={on}
              onClick={() => form.toggle(t.key)}
              className="text-text flex min-h-[48px] flex-1 cursor-pointer items-center gap-[12px] border-0 bg-transparent p-0 text-left"
            >
              <CheckBox checked={on} />
              <span className="text-[15px]">
                <span
                  className={cn("font-bold", t.required ? "text-brand-strong" : "text-text-sub")}
                >
                  {t.required ? "[필수]" : "[선택]"}
                </span>{" "}
                {t.label}
              </span>
            </button>
            {href && (
              <Link
                href={href}
                className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center text-[14px] font-semibold no-underline"
              >
                보기
              </Link>
            )}
          </div>
        );
      })}
    </>
  );
}

/** 가입 버튼: 준비되면 가입 완료로 */
export function SignupSubmit({ form, className }: { form: Form; className?: string }) {
  const cls = cn(
    "flex items-center justify-center rounded-[16px] font-extrabold no-underline",
    form.ready
      ? "bg-brand text-white hover:text-white"
      : "bg-line text-text-sub hover:text-text-sub cursor-default",
    className,
  );
  return form.ready ? (
    <Link href={routes.welcome} className={cls}>
      {form.submitText}
    </Link>
  ) : (
    <button type="button" aria-disabled="true" className={cn(cls, "w-full border-0")}>
      {form.submitText}
    </button>
  );
}
