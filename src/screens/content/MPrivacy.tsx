"use client";

import Link from "next/link";
import { MLegalDetails, MLegalMain, MLegalTabs } from "@/components/content/Legal";
import { MBackHeader } from "@/components/layout/MBackHeader";
import { usePrivacy } from "@/features/content/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const MOBILE_HIGHLIGHT_COUNT = 2;

export function MPrivacy() {
  const { data } = usePrivacy();

  return (
    <div className="bg-surface text-text flex min-h-screen w-full flex-col">
      <MBackHeader title="개인정보처리방침" backHref={routes.me} />
      <MLegalMain>
        <MLegalTabs current="privacy" />
        <span className="text-text-sub text-[14px]">{data.effective}</span>
        <Link
          href={data.upcoming.href}
          className="rounded-control bg-check-bg text-check-text hover:text-check-text px-[14px] py-[12px] text-[14px] leading-[1.5] font-bold no-underline"
        >
          {data.upcoming.mobile}
        </Link>
        <div className="flex flex-col gap-[8px]">
          {data.highlights.slice(0, MOBILE_HIGHLIGHT_COUNT).map((h) => (
            <div
              key={h.title}
              className={cn(
                "rounded-control flex flex-col gap-[2px] px-[14px] py-[12px]",
                h.brand ? "bg-brand-soft" : "bg-bg",
              )}
            >
              <span
                className={cn(
                  "text-[15px] font-extrabold",
                  h.brand ? "text-brand-strong" : "text-text",
                )}
              >
                {h.title}
              </span>
              <span className={cn("text-[13px] leading-[1.6]", h.brand && "text-text")}>
                {h.text}
              </span>
            </div>
          ))}
        </div>
        {data.mobileSections.map((s) => (
          <MLegalDetails key={s.title} section={s} />
        ))}
        <section className="bg-bg rounded-tile flex flex-col gap-[6px] p-[16px]">
          <span className="text-text text-[16px] font-extrabold">{data.officer.title}</span>
          <span className="text-[14px]">{data.officer.line}</span>
          <span className="text-text-sub text-[13px] leading-[1.6]">{data.officer.note}</span>
        </section>
      </MLegalMain>
    </div>
  );
}
