"use client";

import Link from "next/link";
import { MBackHeader, MBottomActions } from "@/components/layout/MBackHeader";
import { MPage } from "@/components/layout/Responsive";
import { Badge, VerdictBadge } from "@/components/ui/Badge";
import { useBenefit } from "@/features/benefits/queries";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const eligLabel = { ok: "충족", check: "확인 필요" } as const;

export function MBenefitDetail({ id }: { id: string }) {
  const b = useBenefit(id);

  return (
    <MPage>
      <MBackHeader title={b.title} backHref={routes.benefits} />
      <main className="flex flex-1 flex-col gap-[12px] px-[16px] pt-[16px] pb-[24px]">
        <section className="rounded-card bg-surface flex flex-col gap-[12px] px-[20px] py-[22px]">
          <div className="flex flex-wrap gap-[6px]">
            <VerdictBadge verdict={b.verdict} size="md" />
            <Badge tone="neutral" size="md">
              {b.cat}
            </Badge>
            {b.budget && (
              <Badge tone="neutral" size="md" className="font-semibold">
                내 집 &apos;준비할 돈&apos;에 반영
              </Badge>
            )}
          </div>
          <h2 className="tracking-h1 m-0 text-[24px] font-extrabold">{b.title}</h2>
          <span className="text-text-sub text-[14px]">{b.org}</span>
          <dl className="m-0 grid grid-cols-2 gap-[8px]">
            <div className="rounded-tile bg-bg p-[14px]">
              <dt className="text-text-sub text-[12px]">지원 내용</dt>
              <dd className="m-0 mt-[4px] text-[15px] leading-[1.4] font-extrabold">{b.amount}</dd>
            </div>
            <div className="rounded-tile bg-bg p-[14px]">
              <dt className="text-text-sub text-[12px]">신청 기한</dt>
              <dd className="m-0 mt-[4px] text-[15px] leading-[1.4] font-extrabold">
                {b.deadline}
              </dd>
            </div>
          </dl>
          <div className="rounded-control bg-check-bg text-check-text px-[14px] py-[12px] text-[14px] leading-[1.5] font-semibold">
            {b.overlap}
          </div>
        </section>

        <section
          aria-labelledby="el-h"
          className="rounded-card bg-surface flex flex-col px-[20px] pt-[18px] pb-[8px]"
        >
          <div className="flex items-center justify-between">
            <h3 id="el-h" className="m-0 text-[17px] font-extrabold">
              내 자격
            </h3>
            <a
              href={b.sourceUrl}
              onClick={() => track("notice_source_open", { notice_kind: "benefit", via: "site" })}
              className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
            >
              근거 원문
            </a>
          </div>
          {b.elig.map((e, i) => (
            <div
              key={e.label}
              className={cn(
                "flex items-center justify-between gap-[10px] py-[12px] text-[15px]",
                i < b.elig.length - 1 && "border-line-soft border-b border-solid",
              )}
            >
              <span>{e.label}</span>
              <Badge tone={e.result} size="md" className="flex-none py-[3px]">
                {eligLabel[e.result]}
              </Badge>
            </div>
          ))}
        </section>

        <section
          aria-labelledby="how-h"
          className="rounded-card bg-surface flex flex-col gap-[12px] px-[20px] py-[18px]"
        >
          <h3 id="how-h" className="m-0 text-[17px] font-extrabold">
            신청 방법
          </h3>
          <ol className="m-0 flex list-none flex-col gap-[10px] p-0">
            {b.how.map((text, i) => (
              <li key={text} className="flex items-center gap-[10px] text-[15px]">
                <span className="rounded-badge bg-brand-soft text-brand-strong flex size-[26px] flex-none items-center justify-center text-[13px] font-extrabold">
                  {i + 1}
                </span>
                {text}
              </li>
            ))}
          </ol>
          <span className="text-text-sub text-[14px]">필요 서류 · {b.docs}</span>
        </section>
        <Link
          href={routes.me}
          className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center self-center text-[14px] font-semibold no-underline"
        >
          정보가 틀렸어요 · 제보하기
        </Link>
      </main>
      <MBottomActions>
        <a
          href={b.policyUrl}
          onClick={() => track("notice_source_open", { notice_kind: "benefit", via: "site" })}
          className="rounded-control bg-fill text-text hover:text-text flex min-h-[54px] min-w-0 flex-[1_1_0] items-center justify-center text-[15px] font-bold no-underline"
        >
          정책 원문
        </a>
        <a
          href={b.applyUrl}
          className="rounded-control bg-brand flex min-h-[54px] min-w-0 flex-[2_1_0] items-center justify-center text-[16px] font-extrabold text-white no-underline hover:text-white"
        >
          신청하러 가기
        </a>
      </MBottomActions>
    </MPage>
  );
}
