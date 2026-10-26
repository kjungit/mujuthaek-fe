"use client";

import Link from "next/link";
import { Bell, Building, Check, ChevronLeft, ChevronRight, ExternalLink, Flag } from "lucide-react";
import { useState } from "react";
import { WebHeader } from "@/components/layout/WebHeader";
import { WebMain, WebPage } from "@/components/layout/Responsive";
import { Badge, VerdictBadge } from "@/components/ui/Badge";
import { useSpaceDetail, useSupportDetail } from "@/features/business/queries";
import { useDocChecks } from "@/features/business/state";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { SpaceDetail } from "@/mocks/business";

const card = "rounded-card-lg bg-surface flex flex-col";
const h2 = "tracking-title m-0 text-[22px] font-extrabold";

function RuleList({ rules }: { rules: SpaceDetail["rules"] }) {
  return (
    <div className="flex flex-col">
      {rules.map((r, i) => {
        const last = i === rules.length - 1;
        return (
          <div
            key={`${i}-${r.label}`}
            className={cn(
              "flex items-center gap-[12px]",
              last ? "flex-wrap pt-[12px]" : "border-line-soft border-b border-solid py-[12px]",
            )}
          >
            {r.met ? (
              <span className="rounded-pill bg-brand flex size-[28px] flex-none items-center justify-center text-white">
                <Check size={16} strokeWidth={3} aria-hidden />
              </span>
            ) : (
              <span
                aria-hidden
                className="rounded-pill bg-check-bg text-check-text flex size-[28px] flex-none items-center justify-center text-[16px] font-extrabold"
              >
                ?
              </span>
            )}
            <span className="flex flex-1 flex-col gap-[2px]">
              <span className="text-[15px] font-bold">{r.label}</span>
              <span className="text-text-sub text-[13px]">{r.rule}</span>
              {r.quote && (
                <span className="text-text-tertiary text-[12px] leading-[1.5]">
                  원문 · {r.quote}
                </span>
              )}
            </span>
            {r.met ? (
              <span className="text-ok-text text-[14px] font-bold">충족</span>
            ) : (
              <Link
                href={routes.bizOnboarding}
                className="bg-check-bg text-check-text hover:text-check-text inline-flex min-h-[40px] items-center rounded-[10px] px-[12px] text-[14px] font-bold no-underline"
              >
                확인 필요 · 입력
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

/** 돌아갈 목록: 공간 상세는 사업공간 홈, 사업 지원 상세는 사업 지원 목록 */
type Back = { href: string; label: string; noun: string };

export function WebSpaceDetail({ id }: { id: string }) {
  return (
    <WebBizDetail
      {...useSpaceDetail(id)}
      back={{ href: routes.business, label: "공간 목록", noun: "공간" }}
    />
  );
}

export function WebSupportDetail({ id }: { id: string }) {
  return (
    <WebBizDetail
      {...useSupportDetail(id)}
      back={{ href: routes.bizSupport, label: "사업 지원 목록", noun: "사업 지원" }}
    />
  );
}

function WebBizDetail({
  data,
  loading,
  error,
  back,
}: {
  data: SpaceDetail | undefined;
  loading: boolean;
  error: boolean;
  back: Back;
}) {
  if (!data) {
    return (
      <WebPage>
        <WebHeader mode="business" current={back.href} unread={3} />
        <WebMain className="pt-[24px]">
          {(loading || error) && (
            <div
              role={error ? "alert" : undefined}
              className="rounded-card-lg bg-surface text-text-sub px-[24px] py-[64px] text-center text-[15px]"
            >
              {error
                ? `${back.noun}을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요`
                : `${back.noun}을 불러오는 중이에요`}
            </div>
          )}
        </WebMain>
      </WebPage>
    );
  }
  return <WebSpaceDetailView data={data} back={back} />;
}

function WebSpaceDetailView({ data, back }: { data: SpaceDetail; back: Back }) {
  const { checks, toggle, done } = useDocChecks(data.docs.map((d) => d.ready));
  const [fav, setFav] = useState(false);
  // 모집 정책은 공간 정보 대신 자격 조건이 많아서 넓은 칸에 보여줘요
  const wideRules = data.rules.length > 0 && Boolean(data.summaryNote);
  const met = data.rules.filter((r) => r.met).length;
  const unmet = data.rules.length - met;

  return (
    <WebPage>
      <WebHeader mode="business" current={back.href} unread={3} />
      <WebMain className="gap-[16px] pt-[24px]">
        <Link
          href={back.href}
          className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center gap-[4px] self-start text-[15px] font-semibold no-underline"
        >
          <ChevronLeft size={18} aria-hidden />
          {back.label}
        </Link>

        <div className="flex flex-wrap items-start gap-[24px]">
          <div className="flex min-w-0 flex-col gap-[16px]" style={{ flex: "999 1 560px" }}>
            <section aria-label="공고 요약" className={cn(card, "overflow-hidden")}>
              <div className="bg-brand-soft text-brand flex h-[240px] items-center justify-center">
                <Building size={64} strokeWidth={1.2} aria-hidden />
              </div>
              <div className="flex flex-col gap-[20px] px-[32px] pt-[28px] pb-[32px]">
                <div className="flex flex-col gap-[10px]">
                  <div className="flex flex-wrap gap-[6px]">
                    <VerdictBadge verdict={data.verdict} />
                    {data.due && (
                      <Badge tone="neutral" className="bg-text text-white">
                        {data.due}
                      </Badge>
                    )}
                    {data.tag && (
                      <Badge tone="neutral" className="font-semibold">
                        {data.tag}
                      </Badge>
                    )}
                  </div>
                  <h1 className="tracking-h1 m-0 text-[32px] font-extrabold">{data.title}</h1>
                  <span className="text-text-sub text-[16px]">
                    {[data.kind, data.host, data.area].filter(Boolean).join(" · ")}
                  </span>
                </div>
                <dl
                  className="m-0 grid gap-[10px]"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
                >
                  {data.facts.map((f) => (
                    <div key={f.label} className="bg-bg rounded-tile p-[16px]">
                      <dt className="text-text-sub text-[13px] font-semibold">{f.label}</dt>
                      <dd className="m-0 mt-[6px] text-[17px] font-extrabold">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                {data.summaryNote && (
                  <span className="text-text-sub text-[14px]">{data.summaryNote}</span>
                )}
              </div>
            </section>

            {wideRules && (
              <section
                aria-labelledby="rules-h"
                className={cn(card, "gap-[4px] px-[32px] py-[28px]")}
              >
                <h2 id="rules-h" className={cn(h2, "mb-[4px]")}>
                  신청 자격
                </h2>
                <span className="text-text-sub mb-[4px] text-[14px]">
                  공고 원문에서 뽑은 조건이에요 · 확인 필요는 사업 정보를 넣거나 원문으로 확인해
                  주세요
                </span>
                <RuleList rules={data.rules} />
              </section>
            )}

            {data.conditions.length > 0 && (
              <section
                aria-labelledby="cond-h"
                className={cn(card, "gap-[4px] px-[32px] py-[28px]")}
              >
                <h2 id="cond-h" className={cn(h2, "mb-[8px]")}>
                  입주 조건
                </h2>
                {data.conditions.map((c, i) => {
                  const last = i === data.conditions.length - 1;
                  return (
                    <div
                      key={c.label}
                      className={cn(
                        "flex flex-wrap justify-between gap-x-[16px] gap-y-[6px] text-[16px]",
                        last ? "pt-[14px]" : "border-line-soft border-b border-solid py-[14px]",
                      )}
                    >
                      <span className="text-text-sub">{c.label}</span>
                      <span className="font-bold">
                        {c.value}
                        {c.note && (
                          <>
                            {" "}
                            <span className="text-text-sub font-medium">{c.note}</span>
                          </>
                        )}
                      </span>
                    </div>
                  );
                })}
              </section>
            )}

            {data.docs.length > 0 && (
              <section
                aria-labelledby="docs-h"
                className={cn(card, "gap-[14px] px-[32px] py-[28px]")}
              >
                <div className="flex items-baseline justify-between gap-[12px]">
                  <h2 id="docs-h" className={h2}>
                    준비 서류
                  </h2>
                  <span className="text-brand-strong text-[14px] font-bold">
                    {done} / {data.docs.length} 준비
                  </span>
                </div>
                <div className="flex flex-col gap-[8px]">
                  {data.docs.map((d, i) => (
                    <button
                      key={d.name}
                      type="button"
                      role="checkbox"
                      aria-checked={checks[i]}
                      onClick={() => toggle(i)}
                      className="rounded-tile bg-bg text-text flex min-h-[60px] cursor-pointer items-center gap-[14px] border-0 px-[16px] py-[14px] text-left"
                    >
                      <span
                        className={cn(
                          "rounded-badge flex size-[26px] flex-none items-center justify-center border-2 border-solid text-white",
                          checks[i] ? "border-brand bg-brand" : "border-off bg-surface",
                        )}
                      >
                        <Check size={16} strokeWidth={3} aria-hidden />
                      </span>
                      <span className="flex flex-col gap-[2px]">
                        <span className="text-[16px] font-bold">{d.name}</span>
                        <span className="text-text-sub text-[13px]">{d.note}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {data.schedule.length > 0 && (
              <section
                aria-labelledby="sch-h"
                className={cn(card, "gap-[18px] px-[32px] py-[28px]")}
              >
                <h2 id="sch-h" className={h2}>
                  진행 일정
                </h2>
                <ol
                  className="m-0 grid list-none gap-[10px] p-0"
                  style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}
                >
                  {data.schedule.map((s) => {
                    const now = s.step === data.currentStep;
                    return (
                      <li
                        key={s.step}
                        aria-current={now ? "step" : undefined}
                        className={cn(
                          "rounded-tile flex flex-col gap-[4px] p-[16px]",
                          now ? "bg-brand text-white" : "bg-bg",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[13px] font-semibold",
                            now ? "text-brand-deep-text-3" : "text-text-sub",
                          )}
                        >
                          {now ? `지금 · ${s.step}단계` : `${s.step}단계`}
                        </span>
                        <span className="text-[17px] font-extrabold">{s.title}</span>
                        <span className={cn("text-[14px]", !now && "text-text-sub")}>{s.when}</span>
                      </li>
                    );
                  })}
                </ol>
              </section>
            )}

            {data.linkedSupport && (
              <section
                aria-labelledby="link-h"
                className="rounded-card-lg bg-brand-deep flex flex-col gap-[12px] px-[32px] py-[26px] text-white"
              >
                <h2 id="link-h" className="m-0 text-[18px] font-extrabold tracking-[-0.02em]">
                  이 공간과 함께 받을 수 있는 지원
                </h2>
                <Link
                  href={routes.bizSupport}
                  className="box-content flex min-h-[44px] items-center justify-between gap-[12px] rounded-[18px] bg-white/8 px-[18px] py-[16px] text-white no-underline hover:text-white"
                >
                  <span className="flex flex-col gap-[4px]">
                    <span className="text-[16px] font-extrabold">{data.linkedSupport.title}</span>
                    <span className="text-brand-deep-text text-[14px]">
                      {data.linkedSupport.desc}
                    </span>
                  </span>
                  <ChevronRight size={20} aria-hidden />
                </Link>
              </section>
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-[16px]" style={{ flex: "1 1 340px" }}>
            <section aria-labelledby="me-h" className={cn(card, "gap-[14px] p-[26px]")}>
              <div className="flex items-center justify-between">
                <h2 id="me-h" className="tracking-title m-0 text-[20px] font-extrabold">
                  내 자격
                </h2>
                <a
                  href="#"
                  className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
                >
                  근거 보기
                </a>
              </div>
              <div className="rounded-tile bg-ok-bg text-ok-text px-[16px] py-[14px] text-[15px] font-bold">
                {data.notReady
                  ? "자격 조건을 정리하고 있어요 · 원문을 확인해 주세요"
                  : `${data.rules.length}개 조건 중 ${met}개 충족 · ${unmet}개 확인 필요`}
              </div>
              {!wideRules && <RuleList rules={data.rules} />}
            </section>

            <section aria-label="신청" className={cn(card, "gap-[10px] p-[22px]")}>
              <button
                type="button"
                aria-pressed={fav}
                onClick={() => setFav((v) => !v)}
                className={cn(
                  "rounded-control flex min-h-[56px] cursor-pointer items-center justify-center gap-[8px] border-0 text-[17px] font-extrabold",
                  fav ? "bg-brand-soft text-brand-strong" : "bg-brand text-white",
                )}
              >
                <Bell size={20} aria-hidden />
                {fav ? "마감 알림 받는 중" : "관심 등록 · 마감 알림"}
              </button>
              <a
                href={data.sourceUrl ?? "#"}
                target={data.sourceUrl ? "_blank" : undefined}
                rel={data.sourceUrl ? "noreferrer" : undefined}
                className="rounded-control bg-fill text-text hover:text-text flex min-h-[52px] items-center justify-center gap-[6px] text-[16px] font-bold no-underline"
              >
                공고 원문 보기
                <ExternalLink size={18} aria-hidden />
              </a>
              <span className="text-text-sub pt-[4px] text-center text-[13px]">
                자격만 판정해요 · 선정 가능성은 알려드리지 않아요
              </span>
            </section>

            <a
              href="#"
              className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] items-center gap-[6px] self-center text-[14px] font-semibold no-underline"
            >
              <Flag size={16} aria-hidden />
              정보가 틀렸어요 · 제보하기
            </a>
          </aside>
        </div>
      </WebMain>
    </WebPage>
  );
}
