"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { MBackHeader, MBottomActions } from "@/components/layout/MBackHeader";
import { MPage } from "@/components/layout/Responsive";
import { EligibilityCard } from "@/components/notice/EligibilityCard";
import { LifeCard } from "@/components/notice/LifeCard";
import { NoticeSections, NoticeToc } from "@/components/notice/NoticeSections";
import { NoticeTags } from "@/components/notice/NoticeTags";
import { PdfViewer } from "@/components/notice/PdfViewer";
import { MRankCard } from "@/components/notice/RankCard";
import { VerdictBadge } from "@/components/ui/Badge";
import { dueText, formatPeriod, statusLabel, pdfSections } from "@/features/notice/format";
import { useNoticeJudgment, withMine, type NoticeJudgment } from "@/features/notice/judgment";
import { bySite, toUnit, useNoticeUnits } from "@/features/notice/units";
import { UnitPrices } from "@/components/notice/UnitPrices";
import type { StandardNotice } from "@/mocks/notice";
import { useNotice } from "@/features/notice/queries";
import { usePdfViewer } from "@/features/notice/usePdfViewer";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const MOBILE_BENEFIT_COUNT = 2;

const card = "rounded-card bg-surface mx-[16px] flex flex-col";

/** 처음에 보여주는 집 수 */
const MOBILE_UNIT_COUNT = 5;

/** 실제 API 주택목록 (모바일은 목록만) */
function MApiUnits({
  notice,
  judgment,
}: {
  notice: StandardNotice;
  judgment: NoticeJudgment | null;
}) {
  const q = useNoticeUnits(notice.id, true);
  const [onlyOk, setOnlyOk] = useState(false);
  const [all, setAll] = useState(false);
  const sites = useMemo(() => notice.sites ?? [], [notice.sites]);
  const units = useMemo(
    () => (q.data?.pages ?? []).flatMap((p) => p.items.map((u) => toUnit(u, sites, judgment))),
    [q.data, sites, judgment],
  );
  if (q.isPending || units.length === 0) return null;
  const okCount = units.filter((u) => u.ok).length;
  const filtered = onlyOk ? units.filter((u) => u.ok) : units;
  const shown = all ? filtered : filtered.slice(0, MOBILE_UNIT_COUNT);
  const chip = (on: boolean) =>
    cn(
      "rounded-pill min-h-[36px] cursor-pointer border-0 px-[12px] text-[13px] font-bold",
      on ? "bg-text text-white" : "bg-fill text-text-sub",
    );

  return (
    <section aria-labelledby="units-h" className={cn(card, "gap-[10px] px-[20px] py-[16px]")}>
      <h3 id="units-h" className="m-0 text-[17px] font-extrabold">
        공급 주택 목록 <span className="text-brand">{units.length}곳</span>
      </h3>
      <div role="group" aria-label="목록 필터" className="flex gap-[6px]">
        <button
          type="button"
          aria-pressed={!onlyOk}
          onClick={() => setOnlyOk(false)}
          className={chip(!onlyOk)}
        >
          전체 {units.length}
        </button>
        <button
          type="button"
          aria-pressed={onlyOk}
          onClick={() => setOnlyOk(true)}
          className={chip(onlyOk)}
        >
          신청 가능만 {okCount}
        </button>
      </div>
      {bySite(shown, filtered).map((g) => (
        <div key={g.key} className="flex flex-col gap-[8px]">
          {g.name && (
            <h4 className="text-text-sub m-0 text-[14px] font-extrabold">
              {g.name} <span className="text-brand">{g.count}호</span>
              {g.lifeScore !== undefined && (
                <span className="text-text-tertiary font-bold"> · 생활권 {g.lifeScore}점</span>
              )}
            </h4>
          )}
          <ul aria-label={g.name} className="m-0 flex list-none flex-col gap-[8px] p-0">
            {g.units.map((u) => (
              <li
                key={u.id}
                className="bg-bg rounded-tile flex flex-col gap-[3px] px-[14px] py-[12px]"
              >
                <span className="flex items-center justify-between gap-[8px]">
                  <span className="text-[15px] font-bold">
                    {g.name ? (u.label ?? u.name) : u.name}
                  </span>
                  <span
                    className={cn(
                      "rounded-badge flex-none px-[8px] py-[3px] text-[12px] font-bold",
                      u.ok ? "bg-ok-bg text-ok-text" : "bg-surface text-text-sub",
                    )}
                  >
                    {u.ok ? "신청 가능" : u.otherTarget}
                  </span>
                </span>
                <span className="text-text-sub text-[13px]">
                  {u.type} · {u.area} · {u.floor}
                </span>
                <UnitPrices unit={u} />
              </li>
            ))}
          </ul>
        </div>
      ))}
      {(filtered.length > shown.length || q.hasNextPage) && (
        <button
          type="button"
          onClick={() => (filtered.length > shown.length ? setAll(true) : void q.fetchNextPage())}
          disabled={q.isFetchingNextPage}
          className="bg-fill text-text min-h-[44px] cursor-pointer rounded-sm border-0 text-[14px] font-bold disabled:opacity-60"
        >
          {q.isFetchingNextPage ? "불러오는 중" : "더 보기"}
        </button>
      )}
    </section>
  );
}

export function MDetail({ id }: { id: string }) {
  const { data, loading, error } = useNotice(id);
  const n = data?.kind === "standard" ? data : undefined;
  const j = useNoticeJudgment(n);
  const [fav, setFav] = useState(false);
  const pdf = usePdfViewer();
  if (!n) {
    return (
      <MPage>
        <MBackHeader title="공고 상세" backHref={routes.homes} />
        {(loading || error) && (
          <p
            role={error ? "alert" : undefined}
            className="text-text-sub m-0 px-[20px] py-[64px] text-center text-[15px]"
          >
            {error
              ? "공고를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요"
              : "공고를 불러오는 중이에요"}
          </p>
        )}
      </MPage>
    );
  }
  const benefits = (n.benefits ?? []).slice(0, MOBILE_BENEFIT_COUNT);
  const doc = withMine(n.doc, j.judgment?.mineTypes ?? []);
  const money = j.judgment?.money;
  const pdfUrl = doc.source.pdfUrl;
  /** 원문 PDF가 있으면 시트로 열고, 없으면 기관 사이트로 */
  const openOriginal = (page = 1, label?: string) =>
    pdfUrl ? pdf.show(page, label) : window.open(doc.source.detailUrl, "_blank", "noreferrer");

  return (
    <MPage>
      <MBackHeader title="공고 상세" backHref={routes.homes} />
      <main className="flex flex-1 flex-col gap-[12px] pb-[24px]">
        <section className="bg-surface flex flex-col gap-[12px] px-[20px] pt-[20px] pb-[22px]">
          <NoticeTags
            verdict={j.judgment?.verdict ?? "check"}
            rank={n.ranking?.myRank}
            due={dueText(n)}
            tags={n.tags.slice(0, 1)}
            size="md"
          />
          <h2 className="tracking-h1 m-0 text-[24px] font-extrabold">{n.title}</h2>
          <span className="text-text-sub text-[14px] leading-[1.5]">{n.meta}</span>
          {doc.summary && <p className="m-0 text-[15px] leading-[1.6]">{doc.summary}</p>}
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

        {money && (
          <section
            aria-labelledby="money-h"
            className="rounded-card bg-brand-deep mx-[16px] flex flex-col gap-[10px] p-[20px] text-white"
          >
            <h3 id="money-h" className="text-brand-deep-text m-0 text-[15px] font-bold">
              내가 준비할 돈 · {money.type}
            </h3>
            <span className="flex justify-between text-[15px]">
              <span>임대보증금</span>
              <span>{money.deposit}</span>
            </span>
            {money.loan && (
              <span className="flex justify-between text-[15px]">
                <span>{money.loanShortName}</span>
                <span>− {money.loan}</span>
              </span>
            )}
            <span className="flex items-baseline justify-between border-t border-solid border-white/14 pt-[10px]">
              <span className="text-[15px] font-bold">준비할 돈</span>
              <span className="tracking-title text-[28px] font-extrabold">{money.prep}</span>
            </span>
            {money.note && <span className="text-brand-deep-text text-[13px]">{money.note}</span>}
          </section>
        )}

        <EligibilityCard
          judgment={j.judgment}
          loading={j.loading}
          error={j.error}
          variant="mobile"
          onOpenOriginal={(page) => openOriginal(page ?? doc.pages.eligibility ?? 1, "신청 자격")}
        />

        {n.hasUnits && <MApiUnits notice={n} judgment={j.judgment} />}

        {n.ranking && <MRankCard ranking={n.ranking} />}

        <NoticeToc doc={doc} variant="mobile" />
        <NoticeSections
          doc={doc}
          variant="mobile"
          onOpenPage={pdfUrl ? (page, label) => pdf.show(page, label) : undefined}
        />

        {n.life && <LifeCard life={n.life} variant="mobile" />}

        {benefits.length > 0 && (
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
        )}

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
