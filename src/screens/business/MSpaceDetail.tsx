"use client";

import Link from "next/link";
import { Building, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { MBackHeader, MBottomActions } from "@/components/layout/MBackHeader";
import { MPage } from "@/components/layout/Responsive";
import { Badge, VerdictBadge } from "@/components/ui/Badge";
import { useSpaceDetail } from "@/features/business/queries";
import { useDocChecks } from "@/features/business/state";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const card = "bg-surface mx-[16px] flex flex-col rounded-card px-[20px] py-[16px]";
const h3 = "m-0 text-[17px] font-extrabold";
const row = (last: boolean) =>
  cn("flex justify-between text-[15px]", last ? "" : "border-line-soft border-b border-solid");

export function MSpaceDetail({ id }: { id: string }) {
  const { data } = useSpaceDetail(id);
  const { checks, toggle, done } = useDocChecks(data.docs.map((d) => d.ready));
  const [fav, setFav] = useState(false);
  const met = data.rules.filter((r) => r.met).length;
  const unmet = data.rules.length - met;

  return (
    <MPage>
      <MBackHeader title="공간 공고 상세" backHref={routes.business} />
      <main className="flex flex-1 flex-col gap-[12px] pb-[24px]">
        <section className="bg-surface flex flex-col">
          <div className="bg-brand-soft text-brand flex h-[180px] items-center justify-center">
            <Building size={56} strokeWidth={1.2} aria-hidden />
          </div>
          <div className="flex flex-col gap-[10px] p-[20px]">
            <div className="flex flex-wrap gap-[6px]">
              <VerdictBadge verdict={data.verdict} size="md" />
              <Badge tone="neutral" size="md" className="bg-text text-white">
                {data.due}
              </Badge>
              <Badge tone="neutral" size="md" className="font-semibold">
                {data.tag}
              </Badge>
            </div>
            <h2 className="tracking-h1 m-0 text-[23px] leading-[1.35] font-extrabold">
              {data.title}
            </h2>
            <span className="text-text-sub text-[14px]">
              {data.host} · {data.area}
            </span>
            <dl className="m-0 grid grid-cols-2 gap-[8px]">
              {data.facts.map((f) => (
                <div key={f.label} className="rounded-control bg-bg px-[14px] py-[12px]">
                  <dt className="text-text-sub text-[12px]">{f.label}</dt>
                  <dd className="m-0 mt-[3px] text-[15px] font-extrabold">{f.mValue}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="me-h" className={cn(card, "gap-[6px]")}>
          <h3 id="me-h" className={h3}>
            내 자격
          </h3>
          <span className="bg-ok-bg text-ok-text my-[4px] rounded-sm px-[12px] py-[10px] text-[14px] font-bold">
            {data.rules.length}개 중 {met}개 충족 · {unmet}개 확인 필요
          </span>
          {data.rules.map((r, i) =>
            r.met ? (
              <div key={r.label} className={cn(row(i === data.rules.length - 1), "py-[10px]")}>
                <span>
                  {r.label} · {r.mRule}
                </span>
                <span className="text-ok-text font-bold">충족</span>
              </div>
            ) : (
              <div
                key={r.label}
                className={cn(row(i === data.rules.length - 1), "items-center py-[6px]")}
              >
                <span>{r.label}</span>
                <Link
                  href={routes.bizOnboarding}
                  className="bg-check-bg text-check-text hover:text-check-text inline-flex min-h-[40px] items-center rounded-[10px] px-[12px] text-[14px] font-bold no-underline"
                >
                  확인 필요 · 입력
                </Link>
              </div>
            ),
          )}
        </section>

        <section aria-labelledby="c-h" className={card}>
          <h3 id="c-h" className={cn(h3, "mb-[6px]")}>
            입주 조건
          </h3>
          {data.conditions.map((c, i) => (
            <div key={c.label} className={cn(row(i === data.conditions.length - 1), "py-[10px]")}>
              <span className="text-text-sub">{c.label}</span>
              <span className="font-bold">{c.mValue}</span>
            </div>
          ))}
        </section>

        <section aria-labelledby="d-h" className={cn(card, "gap-[8px]")}>
          <div className="flex items-baseline justify-between">
            <h3 id="d-h" className={h3}>
              준비 서류
            </h3>
            <span className="text-brand-strong text-[14px] font-bold">
              {done} / {data.docs.length} 준비
            </span>
          </div>
          {data.docs.map((d, i) => (
            <button
              key={d.name}
              type="button"
              role="checkbox"
              aria-checked={checks[i]}
              onClick={() => toggle(i)}
              className="rounded-control bg-bg text-text flex min-h-[56px] cursor-pointer items-center gap-[12px] border-0 px-[14px] py-[12px] text-left"
            >
              <span
                className={cn(
                  "flex size-[24px] flex-none items-center justify-center rounded-[7px] border-2 border-solid text-white",
                  checks[i] ? "border-brand bg-brand" : "border-off bg-surface",
                )}
              >
                <Check size={14} strokeWidth={3} aria-hidden />
              </span>
              <span className="flex flex-col gap-[2px]">
                <span className="text-[15px] font-bold">{d.name}</span>
                <span className="text-text-sub text-[12px]">{d.mNote}</span>
              </span>
            </button>
          ))}
        </section>

        <Link
          href={routes.bizSupport}
          className="bg-brand-deep mx-[16px] flex items-center justify-between gap-[10px] rounded-[22px] px-[20px] py-[18px] text-white no-underline hover:text-white"
        >
          <span className="flex flex-col gap-[4px]">
            <span className="text-brand-deep-text text-[13px]">함께 받을 수 있는 지원</span>
            <span className="text-[16px] font-extrabold">
              {data.linkedSupport.title} · {data.linkedSupport.amount}
            </span>
          </span>
          <ChevronRight size={20} aria-hidden />
        </Link>
        <span className="text-text-sub px-[16px] pt-[4px] text-center text-[13px]">
          자격만 판정해요 · 선정 가능성은 알려드리지 않아요
        </span>
      </main>
      <MBottomActions>
        <a
          href="#"
          className="rounded-control bg-fill text-text hover:text-text flex min-h-[56px] min-w-0 items-center justify-center text-[15px] font-bold no-underline"
          style={{ flex: "1 1 0%" }}
        >
          공고 원문
        </a>
        <button
          type="button"
          aria-pressed={fav}
          onClick={() => setFav((v) => !v)}
          className={cn(
            "rounded-control min-h-[56px] min-w-0 cursor-pointer border-0 text-[16px] font-extrabold",
            fav ? "bg-brand-soft text-brand-strong" : "bg-brand text-white",
          )}
          style={{ flex: "1.6 1 0%" }}
        >
          {fav ? "마감 알림 받는 중" : "관심 등록 · 마감 알림"}
        </button>
      </MBottomActions>
    </MPage>
  );
}
