"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { MBackHeader, MBottomActions } from "@/components/layout/MBackHeader";
import { MPage } from "@/components/layout/Responsive";
import { NoticeSections, NoticeToc } from "@/components/notice/NoticeSections";
import { NoticeTags } from "@/components/notice/NoticeTags";
import { PdfViewer } from "@/components/notice/PdfViewer";
import { MRankCard } from "@/components/notice/RankCard";
import { VerdictBadge } from "@/components/ui/Badge";
import { formatPeriod, statusLabel, pdfSections } from "@/features/notice/format";
import { noticeParams, useJudgmentViewed } from "@/features/notice/analytics";
import { useNotice } from "@/features/notice/queries";
import { usePdfViewer } from "@/features/notice/usePdfViewer";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const MOBILE_BENEFIT_COUNT = 2;

const card = "rounded-card bg-surface mx-[16px] flex flex-col";

export function MDetail({ id }: { id: string }) {
  const { data: n } = useNotice(id);
  const [fav, setFav] = useState(false);
  const pdf = usePdfViewer();
  useJudgmentViewed(id, n);
  if (n.kind !== "standard") return null;
  const benefits = n.benefits.slice(0, MOBILE_BENEFIT_COUNT);
  const { doc } = n;
  const pdfUrl = doc.source.pdfUrl;
  /** 원문 PDF가 있으면 시트로 열고, 없으면 기관 사이트로 */
  const openOriginal = (page = 1, label?: string) => {
    track("notice_source_open", { ...noticeParams(n), via: pdfUrl ? "pdf" : "site" });
    if (pdfUrl) pdf.show(page, label);
    else window.open(doc.source.detailUrl, "_blank", "noreferrer");
  };

  return (
    <MPage>
      <MBackHeader title="공고 상세" backHref={routes.homes} />
      <main className="flex flex-1 flex-col gap-[12px] pb-[24px]">
        <section className="bg-surface flex flex-col gap-[12px] px-[20px] pt-[20px] pb-[22px]">
          <NoticeTags
            verdict={n.verdict}
            rank={n.ranking?.myRank}
            dday={n.dday}
            tags={n.tags.slice(0, 1)}
            size="md"
          />
          <h2 className="tracking-h1 m-0 text-[24px] font-extrabold">{n.title}</h2>
          <span className="text-text-sub text-[14px] leading-[1.5]">{n.meta}</span>
          <p className="m-0 text-[15px] leading-[1.6]">{doc.summary}</p>
          <dl className="m-0 grid grid-cols-2 gap-[8px]">
            {n.facts.map((f) => (
              <div key={f.label} className="bg-bg rounded-control px-[14px] py-[12px]">
                <dt className="text-text-sub text-[12px]">{f.label}</dt>
                <dd className="mx-0 mt-[3px] mb-0 text-[15px] font-extrabold">{f.value}</dd>
              </div>
            ))}
          </dl>
          {doc.applyPeriod && (
            <div className="bg-brand-soft rounded-control flex flex-col gap-[2px] px-[14px] py-[12px]">
              <span className="text-brand-strong text-[12px] font-bold">
                신청 기간 · {statusLabel[doc.status]}
              </span>
              <span className="text-[15px] font-extrabold">
                {formatPeriod(doc.applyPeriod.start, doc.applyPeriod.end)}
              </span>
              {doc.applyPeriod.note && (
                <span className="text-text-sub text-[13px]">{doc.applyPeriod.note}</span>
              )}
            </div>
          )}
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
              onClick={() => openOriginal(doc.pages.eligibility ?? 1, "신청 자격")}
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

        {n.ranking && <MRankCard ranking={n.ranking} />}

        <NoticeToc doc={doc} variant="mobile" />
        <NoticeSections
          doc={doc}
          variant="mobile"
          onOpenPage={pdfUrl ? (page, label) => pdf.show(page, label) : undefined}
        />

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
          onClick={() => {
            if (!fav) track("notice_bookmark", noticeParams(n));
            setFav(!fav);
          }}
          className={cn(
            "rounded-control bg-fill flex min-h-[56px] w-[56px] flex-none cursor-pointer items-center justify-center border-0",
            fav ? "text-brand" : "text-text-sub",
          )}
        >
          <Heart size={24} fill={fav ? "currentColor" : "none"} aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => openOriginal()}
          className="rounded-control bg-brand flex min-h-[56px] flex-1 cursor-pointer items-center justify-center border-0 text-[17px] font-extrabold text-white"
        >
          {n.agency} 공고 원문 보기
        </button>
      </MBottomActions>
      {pdfUrl && (
        <PdfViewer
          open={pdf.open}
          onClose={pdf.close}
          src={pdfUrl}
          fileName={doc.source.fileName}
          detailUrl={doc.source.detailUrl}
          target={pdf.target}
          sections={pdfSections(doc)}
          onJump={pdf.show}
          variant="mobile"
        />
      )}
    </MPage>
  );
}
