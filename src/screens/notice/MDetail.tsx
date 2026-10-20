"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { MBackHeader, MBottomActions } from "@/components/layout/MBackHeader";
import { MPage } from "@/components/layout/Responsive";
import { NoticeTags } from "@/components/notice/NoticeTags";
import { MRankCard } from "@/components/notice/RankCard";
import { VerdictBadge } from "@/components/ui/Badge";
import { useNotice } from "@/features/notice/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const MOBILE_BENEFIT_COUNT = 2;

const card = "rounded-card bg-surface mx-[16px] flex flex-col";

export function MDetail({ id }: { id: string }) {
  const { data: n } = useNotice(id);
  const [fav, setFav] = useState(false);
  if (n.kind !== "standard") return null;
  const benefits = n.benefits.slice(0, MOBILE_BENEFIT_COUNT);

  return (
    <MPage>
      <MBackHeader title="공고 상세" backHref={routes.homes} />
      <main className="flex flex-1 flex-col gap-[12px] pb-[24px]">
        <section className="bg-surface flex flex-col gap-[12px] px-[20px] pt-[20px] pb-[22px]">
          <NoticeTags
            verdict={n.verdict}
            rank={n.ranking.myRank}
            dday={n.dday}
            tags={n.tags.slice(0, 1)}
            size="md"
          />
          <h2 className="tracking-h1 m-0 text-[24px] font-extrabold">{n.title}</h2>
          <span className="text-text-sub text-[14px] leading-[1.5]">{n.meta}</span>
          <dl className="m-0 grid grid-cols-2 gap-[8px]">
            {n.facts.map((f) => (
              <div key={f.label} className="bg-bg rounded-control px-[14px] py-[12px]">
                <dt className="text-text-sub text-[12px]">{f.label}</dt>
                <dd className="mx-0 mt-[3px] mb-0 text-[15px] font-extrabold">{f.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section
          aria-labelledby="money-h"
          className="rounded-card bg-brand-deep mx-[16px] flex flex-col gap-[10px] p-[20px] text-white"
        >
          <h3 id="money-h" className="text-brand-deep-text m-0 text-[15px] font-bold">
            내가 준비할 돈 · {n.money.type}
          </h3>
          <span className="flex justify-between text-[15px]">
            <span>임대보증금</span>
            <span>{n.money.deposit}</span>
          </span>
          <span className="flex justify-between text-[15px]">
            <span>{n.money.loanShortName}</span>
            <span>− {n.money.loan}</span>
          </span>
          <span className="flex items-baseline justify-between border-t border-solid border-white/14 pt-[10px]">
            <span className="text-[15px] font-bold">준비할 돈</span>
            <span className="tracking-title text-[28px] font-extrabold">{n.money.prep}</span>
          </span>
          <span className="text-brand-deep-text text-[13px]">{n.money.note}</span>
        </section>

        <section aria-labelledby="el-h" className={cn(card, "px-[20px] pt-[16px] pb-[6px]")}>
          <div className="flex items-center justify-between">
            <h3 id="el-h" className="m-0 text-[17px] font-extrabold">
              내 자격
            </h3>
            <button
              type="button"
              className="text-brand inline-flex min-h-[44px] cursor-pointer items-center border-0 bg-transparent p-0 text-[14px] font-bold"
            >
              근거 원문
            </button>
          </div>
          {n.eligibility.map((e, i) => (
            <div
              key={e.label}
              className={cn(
                "flex items-center justify-between text-[15px]",
                e.status === "met" ? "py-[11px]" : "py-[8px]",
                i < n.eligibility.length - 1 && "border-line-soft border-b border-solid",
              )}
            >
              <span>{e.shortLabel}</span>
              {e.status === "met" ? (
                <span className="text-brand-strong font-bold">충족</span>
              ) : (
                <Link
                  href={routes.profile}
                  className="bg-check-bg text-check-text hover:text-check-text inline-flex min-h-[40px] items-center rounded-[10px] px-[12px] text-[14px] font-bold no-underline"
                >
                  입력하고 확인
                </Link>
              )}
            </div>
          ))}
        </section>

        <MRankCard ranking={n.ranking} />

        <section aria-labelledby="type-h" className={cn(card, "gap-[10px] px-[20px] py-[16px]")}>
          <h3 id="type-h" className="m-0 text-[17px] font-extrabold">
            주택형별 임대 조건{" "}
            <span className="text-text-sub text-[13px] font-medium">· {n.rentBasis}</span>
          </h3>
          {n.rentTable.map((r) => (
            <div
              key={r.type}
              className={cn(
                "rounded-tile flex items-center justify-between p-[14px]",
                r.mine ? "bg-brand-soft" : "bg-bg",
              )}
            >
              <span className="flex flex-col gap-[2px]">
                <span className="text-[16px] font-extrabold">
                  {r.type} · {r.area}
                </span>
                <span className={cn("text-[13px]", r.mine ? "text-brand-strong" : "text-text-sub")}>
                  {r.supply}
                  {r.mine && " · 신청 가능"}
                </span>
              </span>
              <span className="text-right text-[14px] font-bold">
                {r.deposit}
                <br />월 {r.rent}
              </span>
            </div>
          ))}
        </section>

        <section aria-labelledby="sch-h" className={cn(card, "gap-[4px] px-[20px] py-[16px]")}>
          <h3 id="sch-h" className="mx-0 mt-0 mb-[8px] text-[17px] font-extrabold">
            일정
          </h3>
          <ol className="m-0 flex list-none flex-col p-0">
            {n.schedule.map((s) => (
              <li
                key={s.label}
                className={cn(
                  "flex gap-[12px] py-[8px] text-[15px]",
                  s.state === "done" && "text-text-sub",
                  s.state === "now" && "font-extrabold",
                )}
              >
                <span
                  className={cn(
                    "rounded-pill mt-[6px] size-[10px] flex-none",
                    s.state === "done" && "bg-off",
                    s.state === "now" && "bg-brand shadow-[0_0_0_4px_var(--color-brand-soft)]",
                    s.state === "todo" && "bg-check-off",
                  )}
                />
                <span className="flex-1">
                  {s.label}
                  {s.state === "now" && " · 지금"}
                </span>
                <span>{s.date}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="life-h" className={cn(card, "gap-[10px] px-[20px] py-[16px]")}>
          <div className="flex items-center justify-between">
            <h3 id="life-h" className="m-0 text-[17px] font-extrabold">
              생활권 {n.life.score}점
            </h3>
            <Link
              href={routes.life}
              className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
            >
              자세히
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-[8px] text-center">
            {n.life.items.map((it) => (
              <span
                key={it.kind}
                className="bg-bg rounded-control flex flex-col gap-[2px] px-[6px] py-[12px]"
              >
                <span className="text-text-sub text-[12px]">{it.label}</span>
                <span className="text-[16px] font-extrabold">{it.value}</span>
              </span>
            ))}
          </div>
        </section>

        <section aria-labelledby="bn-h" className={cn(card, "px-[20px] pt-[16px] pb-[6px]")}>
          <h3 id="bn-h" className="mx-0 mt-0 mb-[6px] text-[17px] font-extrabold">
            입주하면 받을 수 있는 혜택
          </h3>
          {benefits.map((b, i) => (
            <Link
              key={b.id}
              href={routes.benefit(b.id)}
              className={cn(
                "text-text hover:text-text flex items-center justify-between gap-[10px] py-[12px] no-underline",
                i < benefits.length - 1 && "border-line-soft border-b border-solid",
              )}
            >
              <span className="flex flex-col gap-[2px]">
                <span className="text-[15px] font-bold">{b.title}</span>
                <span className="text-text-sub text-[13px]">{b.desc}</span>
              </span>
              <VerdictBadge verdict={b.verdict} size="xs" className="flex-none" />
            </Link>
          ))}
        </section>

        <span className="text-text-sub px-[16px] pt-[4px] text-center text-[13px]">
          판정은 참고용이에요. 신청 전에 원문을 확인해 주세요
        </span>
        <button
          type="button"
          className="text-text-sub inline-flex min-h-[44px] cursor-pointer items-center self-center border-0 bg-transparent p-0 text-[14px] font-semibold"
        >
          정보가 틀렸어요 · 제보하기
        </button>
      </main>
      <MBottomActions>
        <button
          type="button"
          aria-pressed={fav}
          aria-label={fav ? "관심 해제" : "관심 등록하고 마감 알림 받기"}
          onClick={() => setFav(!fav)}
          className={cn(
            "rounded-control bg-fill flex min-h-[56px] w-[56px] flex-none cursor-pointer items-center justify-center border-0",
            fav ? "text-brand" : "text-text-sub",
          )}
        >
          <Heart size={24} fill={fav ? "currentColor" : "none"} aria-hidden />
        </button>
        <button
          type="button"
          className="rounded-control bg-brand flex min-h-[56px] flex-1 cursor-pointer items-center justify-center border-0 text-[17px] font-extrabold text-white"
        >
          {n.agency} 공고 원문에서 신청
        </button>
      </MBottomActions>
    </MPage>
  );
}
