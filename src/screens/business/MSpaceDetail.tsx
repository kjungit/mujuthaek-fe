"use client";

import Link from "next/link";
import { Building, Check, ChevronRight } from "lucide-react";
import { useState } from "react";
import { MBackHeader, MBottomActions } from "@/components/layout/MBackHeader";
import { MPage } from "@/components/layout/Responsive";
import { Badge, VerdictBadge } from "@/components/ui/Badge";
import { useSpaceDetail, useSupportDetail } from "@/features/business/queries";
import { track } from "@/lib/analytics";
import { useDocChecks } from "@/features/business/state";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { SpaceDetail } from "@/mocks/business";
import { AboutSection, AnswerButtons } from "./parts";

const card = "bg-surface mx-[16px] flex flex-col rounded-card px-[20px] py-[16px]";
const h3 = "m-0 text-[17px] font-extrabold";
const row = (last: boolean) =>
  cn("flex justify-between text-[15px]", last ? "" : "border-line-soft border-b border-solid");

/** 돌아갈 목록과 머리 제목: 공간 상세 · 사업 지원 상세 */
type Back = { href: string; title: string; noun: string };

export function MSpaceDetail({ id }: { id: string }) {
  return (
    <MBizDetail
      {...useSpaceDetail(id)}
      back={{ href: routes.business, title: "공간 공고 상세", noun: "공간" }}
    />
  );
}

export function MSupportDetail({ id }: { id: string }) {
  return (
    <MBizDetail
      {...useSupportDetail(id)}
      back={{ href: routes.bizSupport, title: "사업 지원 상세", noun: "사업 지원" }}
    />
  );
}

type OnAnswer = (questionId: string, value: "YES" | "NO") => void;

function MBizDetail({
  data,
  loading,
  error,
  back,
  answer,
}: {
  data: SpaceDetail | undefined;
  loading: boolean;
  error: boolean;
  back: Back;
  answer?: OnAnswer;
}) {
  if (!data) {
    return (
      <MPage>
        <MBackHeader title={back.title} backHref={back.href} />
        {(loading || error) && (
          <p
            role={error ? "alert" : undefined}
            className="text-text-sub m-0 px-[20px] py-[64px] text-center text-[15px]"
          >
            {error
              ? `${back.noun}을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요`
              : `${back.noun}을 불러오는 중이에요`}
          </p>
        )}
      </MPage>
    );
  }
  return <MSpaceDetailView data={data} back={back} onAnswer={answer} />;
}

function MSpaceDetailView({
  data,
  back,
  onAnswer,
}: {
  data: SpaceDetail;
  back: Back;
  onAnswer?: OnAnswer;
}) {
  const { checks, toggle, done } = useDocChecks(data.docs.map((d) => d.ready));
  const [fav, setFav] = useState(false);
  const met = data.rules.filter((r) => r.met).length;
  const no = data.rules.filter((r) => r.notMet).length;
  const unmet = data.rules.length - met - no;

  return (
    <MPage>
      <MBackHeader title={back.title} backHref={back.href} />
      <main className="flex flex-1 flex-col gap-[12px] pb-[24px]">
        <section className="bg-surface flex flex-col">
          <div className="bg-brand-soft text-brand flex h-[180px] items-center justify-center">
            <Building size={56} strokeWidth={1.2} aria-hidden />
          </div>
          <div className="flex flex-col gap-[10px] p-[20px]">
            <div className="flex flex-wrap gap-[6px]">
              <VerdictBadge verdict={data.verdict} size="md" />
              {data.due && (
                <Badge tone="neutral" size="md" className="bg-text text-white">
                  {data.due}
                </Badge>
              )}
              {data.tag && (
                <Badge tone="neutral" size="md" className="font-semibold">
                  {data.tag}
                </Badge>
              )}
            </div>
            <h2 className="tracking-h1 m-0 text-[23px] leading-[1.35] font-extrabold">
              {data.title}
            </h2>
            <span className="text-text-sub text-[14px]">
              {[data.host || data.kind, data.area].filter(Boolean).join(" · ")}
            </span>
            <dl className="m-0 grid grid-cols-2 gap-[8px]">
              {data.facts.map((f) => (
                <div key={f.label} className="rounded-control bg-bg px-[14px] py-[12px]">
                  <dt className="text-text-sub text-[12px]">{f.label}</dt>
                  <dd className="m-0 mt-[3px] text-[15px] font-extrabold">{f.mValue}</dd>
                </div>
              ))}
            </dl>
            {data.summaryNote && (
              <span className="text-text-sub text-[13px]">{data.summaryNote}</span>
            )}
          </div>
        </section>

        {data.about && <AboutSection about={data.about} />}

        <section aria-labelledby="me-h" className={cn(card, "gap-[6px]")}>
          <h3 id="me-h" className={h3}>
            내 자격
          </h3>
          <span className="bg-ok-bg text-ok-text my-[4px] rounded-sm px-[12px] py-[10px] text-[14px] font-bold">
            {data.notReady
              ? "자격 조건을 정리하고 있어요 · 원문을 확인해 주세요"
              : `${data.rules.length}개 중 ${met}개 충족 · ${unmet}개 확인 필요${no ? ` · ${no}개 해당 안 됨` : ""}`}
          </span>
          {data.rules.map((r, i) =>
            r.options ? (
              <div
                key={`${i}-${r.label}`}
                className={cn(
                  row(i === data.rules.length - 1),
                  "flex-col items-stretch gap-[8px] py-[10px]",
                )}
              >
                <span className="flex items-center justify-between gap-[8px]">
                  <span className="font-bold">{r.label}</span>
                  <span
                    className={cn(
                      "flex-none text-[13px] font-bold",
                      r.met ? "text-ok-text" : r.notMet ? "text-text-sub" : "text-check-text",
                    )}
                  >
                    {r.met ? "충족" : r.notMet ? "해당 안 돼요" : "확인 필요"}
                  </span>
                </span>
                {r.options.map((o, k) => (
                  <div
                    key={k}
                    className="bg-bg rounded-control flex flex-col gap-[8px] px-[12px] py-[10px]"
                  >
                    <span className="text-text-sub text-[12px] font-bold">
                      {k + 1}번째 길 {o.met ? "· 충족" : o.notMet ? "· 해당 안 됨" : ""}
                    </span>
                    {o.rules.map((x, m) => (
                      <div key={m} className="flex flex-col gap-[6px]">
                        <span className="text-[14px] leading-[1.5]">{x.mRule || o.label}</span>
                        {x.questionId && onAnswer && (
                          <AnswerButtons
                            questionId={x.questionId}
                            answer={x.answer}
                            onAnswer={onAnswer}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : r.questionId && onAnswer ? (
              <div
                key={`${i}-${r.label}`}
                className={cn(
                  row(i === data.rules.length - 1),
                  "flex-col items-stretch gap-[8px] py-[10px]",
                )}
              >
                <span className="text-[14px] leading-[1.5]">{r.mRule}</span>
                <AnswerButtons questionId={r.questionId} answer={r.answer} onAnswer={onAnswer} />
              </div>
            ) : r.met ? (
              <div
                key={`${i}-${r.label}`}
                className={cn(row(i === data.rules.length - 1), "py-[10px]")}
              >
                <span>
                  {r.label} · {r.mRule}
                </span>
                <span className="text-ok-text font-bold">충족</span>
              </div>
            ) : (
              <div
                key={`${i}-${r.label}`}
                className={cn(row(i === data.rules.length - 1), "items-center py-[6px]")}
              >
                <span className="flex min-w-0 flex-col gap-[2px]">
                  <span>{r.label}</span>
                  {r.mRule && <span className="text-text-sub text-[13px]">{r.mRule}</span>}
                </span>
                {r.notMet ? (
                  <span className="text-text-sub flex-none font-bold">해당 안 돼요</span>
                ) : (
                  <Link
                    href={routes.bizOnboarding}
                    className="bg-check-bg text-check-text hover:text-check-text inline-flex min-h-[40px] flex-none items-center rounded-[10px] px-[12px] text-[14px] font-bold no-underline"
                  >
                    확인 필요 · 입력
                  </Link>
                )}
              </div>
            ),
          )}
        </section>

        {data.conditions.length > 0 && (
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
        )}

        {data.docs.length > 0 && (
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
        )}

        {data.linkedSupport && (
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
        )}
        <span className="text-text-sub px-[16px] pt-[4px] text-center text-[13px]">
          자격만 판정해요 · 선정 가능성은 알려드리지 않아요
        </span>
      </main>
      <MBottomActions>
        <a
          href={data.sourceUrl ?? "#"}
          target={data.sourceUrl ? "_blank" : undefined}
          rel={data.sourceUrl ? "noreferrer" : undefined}
          onClick={() => track("notice_source_open", { notice_kind: "space", via: "site" })}
          className="rounded-control bg-fill text-text hover:text-text flex min-h-[56px] min-w-0 items-center justify-center text-[15px] font-bold no-underline"
          style={{ flex: "1 1 0%" }}
        >
          공고 원문
        </a>
        <button
          type="button"
          aria-pressed={fav}
          onClick={() => {
            if (!fav) track("notice_bookmark", { notice_kind: "space" });
            setFav((v) => !v);
          }}
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
