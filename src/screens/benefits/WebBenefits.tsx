"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, MessageSquareWarning } from "lucide-react";
import { WebHeader } from "@/components/layout/WebHeader";
import { WebMain, WebPage } from "@/components/layout/Responsive";
import { Badge, VerdictBadge } from "@/components/ui/Badge";
import { useBenefits } from "@/features/benefits/queries";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { benefitCategories, type Benefit, type BenefitCategory } from "@/mocks/benefits";

type CatFilter = "전체" | BenefitCategory;

const eligLabel = { ok: "충족", check: "확인 필요" } as const;

function BenefitDetail({ b }: { b: Benefit }) {
  return (
    <section
      aria-label="혜택 상세"
      aria-live="polite"
      className="rounded-card-lg bg-surface flex min-w-0 flex-col gap-[24px] p-[30px]"
      style={{ flex: "999 1 520px" }}
    >
      <div className="flex flex-col gap-[10px]">
        <div className="flex flex-wrap gap-[6px]">
          <VerdictBadge verdict={b.verdict} />
          <Badge tone="neutral">{b.cat}</Badge>
          {b.budget && (
            <Badge tone="neutral" className="font-semibold">
              내 집 &apos;준비할 돈&apos;에 반영
            </Badge>
          )}
        </div>
        <h2 className="tracking-h1 m-0 text-[28px] font-extrabold">{b.title}</h2>
        <span className="text-text-sub text-[15px]">{b.org}</span>
      </div>

      <dl
        className="m-0 grid gap-[10px]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}
      >
        <div className="rounded-tile bg-bg px-[18px] py-[16px]">
          <dt className="text-text-sub text-[13px]">지원 내용</dt>
          <dd className="m-0 mt-[6px] text-[17px] leading-[1.4] font-extrabold">{b.amount}</dd>
        </div>
        <div className="rounded-tile bg-bg px-[18px] py-[16px]">
          <dt className="text-text-sub text-[13px]">신청 기한</dt>
          <dd className="m-0 mt-[6px] text-[17px] leading-[1.4] font-extrabold">{b.deadline}</dd>
        </div>
        <div className="rounded-tile bg-bg px-[18px] py-[16px]">
          <dt className="text-text-sub text-[13px]">함께 못 받는 혜택</dt>
          <dd className="m-0 mt-[6px] text-[15px] leading-[1.5] font-semibold">{b.overlap}</dd>
        </div>
      </dl>

      <div className="flex flex-col">
        <div className="mb-[4px] flex items-center justify-between">
          <h3 className="tracking-title m-0 text-[19px] font-extrabold">내 자격</h3>
          <a
            href={b.sourceUrl}
            onClick={() => track("notice_source_open", { notice_kind: "benefit", via: "site" })}
            className="text-brand-strong hover:text-brand-strong inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
          >
            근거 원문
          </a>
        </div>
        {b.elig.map((e) => (
          <div
            key={e.label}
            className="border-line-soft flex items-center justify-between gap-[12px] border-b border-solid py-[12px]"
          >
            <span className="text-[15px]">{e.label}</span>
            <Badge
              tone={e.result}
              className="inline-flex flex-none items-center gap-[5px] px-[10px] py-[4px] text-[14px]"
            >
              {eligLabel[e.result]}
            </Badge>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-[12px]">
        <h3 className="tracking-title m-0 text-[19px] font-extrabold">신청 방법</h3>
        <ol className="m-0 flex list-none flex-col gap-[10px] p-0">
          {b.how.map((text, i) => (
            <li key={text} className="flex items-center gap-[12px]">
              <span className="bg-brand-soft text-brand-strong flex size-[28px] flex-none items-center justify-center rounded-[9px] text-[14px] font-extrabold">
                {i + 1}
              </span>
              <span className="text-[15px]">{text}</span>
            </li>
          ))}
        </ol>
        <span className="text-text-sub text-[14px]">필요 서류 · {b.docs}</span>
      </div>

      <div className="border-line-soft flex flex-wrap items-center justify-between gap-[12px] border-t border-solid pt-[20px]">
        <Link
          href={routes.me}
          className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center gap-[4px] text-[14px] font-semibold no-underline"
        >
          <MessageSquareWarning size={16} aria-hidden />
          정보가 틀렸어요
        </Link>
        <div className="flex gap-[8px]">
          <a
            href={b.policyUrl}
            onClick={() => track("notice_source_open", { notice_kind: "benefit", via: "site" })}
            className="rounded-control bg-fill text-text hover:text-text inline-flex min-h-[52px] items-center px-[18px] text-[15px] font-bold no-underline"
          >
            정책 원문
          </a>
          <a
            href={b.applyUrl}
            className="rounded-control bg-brand inline-flex min-h-[52px] items-center gap-[6px] px-[20px] text-[16px] font-extrabold text-white no-underline hover:text-white"
          >
            신청하러 가기
            <ArrowRight size={18} strokeWidth={2.2} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}

export function WebBenefits({ initialId }: { initialId?: string }) {
  const { data } = useBenefits();
  const [cat, setCat] = useState<CatFilter>("전체");
  const [selId, setSelId] = useState(initialId ?? data.items[0]?.id);

  const shown = cat === "전체" ? data.items : data.items.filter((b) => b.cat === cat);
  const sel = shown.find((b) => b.id === selId) ?? shown[0];
  const cats: CatFilter[] = ["전체", ...benefitCategories];

  return (
    <WebPage>
      <WebHeader mode="home" current={routes.benefits} unread={3} />
      <WebMain>
        <div className="flex flex-wrap items-end justify-between gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <h1 className="tracking-h1 m-0 text-[32px] font-extrabold">내 혜택</h1>
            <span className="text-text-sub text-[16px]">
              내 조건으로 받을 수 있는 혜택{" "}
              <strong className="text-brand-strong">{data.items.length}개</strong> · {data.asOf}{" "}
              기준
            </span>
          </div>
          <div role="group" aria-label="분야" className="flex flex-wrap gap-[6px]">
            {cats.map((c) => {
              const count =
                c === "전체" ? data.items.length : data.items.filter((b) => b.cat === c).length;
              const on = c === cat;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setCat(c)}
                  className={cn(
                    "rounded-pill min-h-[42px] cursor-pointer border-0 px-[16px] text-[15px] font-bold",
                    on ? "bg-text text-white" : "bg-surface text-text-sub",
                  )}
                >
                  {c} {count}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-start gap-[20px]">
          <section
            aria-label="혜택 목록"
            className="flex min-w-0 flex-col gap-[10px]"
            style={{ flex: "1 1 360px" }}
          >
            {shown.map((b) => {
              const on = b.id === sel?.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelId(b.id)}
                  className={cn(
                    "bg-surface text-text flex cursor-pointer flex-col gap-[8px] rounded-[22px] border-2 border-solid px-[20px] py-[18px] text-left",
                    on ? "border-brand" : "border-surface",
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-[8px]">
                    <span className="text-text-tertiary text-[13px]">
                      {b.cat} · {b.org}
                    </span>
                    <span className="text-text-sub text-[14px] font-extrabold">{b.dday}</span>
                  </span>
                  <span className="tracking-title text-[18px] font-extrabold">{b.title}</span>
                  <span className="flex w-full items-center justify-between gap-[8px]">
                    <span className="text-[15px] font-semibold">{b.amount}</span>
                    <VerdictBadge verdict={b.verdict} size="md" className="flex-none text-[12px]" />
                  </span>
                </button>
              );
            })}
          </section>

          {sel && <BenefitDetail b={sel} />}
        </div>
        <span className="text-text-sub text-[13px]">
          혜택 정보는 각 기관 공고를 정리한 거예요. 신청 전에 정책 원문을 꼭 확인해 주세요
        </span>
      </WebMain>
    </WebPage>
  );
}
