"use client";

import { ChevronRight, ExternalLink, Users } from "lucide-react";
import { useState } from "react";
import { AdminTitle, AdminTitleRow } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/Badge";
import { useReviewQueue, useSetAdminCounts } from "@/features/admin/queries";
import { cn } from "@/lib/cn";
import type { ReviewReason, SourcePartKind } from "@/mocks/admin";

const REASON: Record<ReviewReason, { label: string; tone: "ok" | "check" | "danger" }> = {
  must: { label: "필수 검수", tone: "ok" },
  low: { label: "신뢰도 낮음", tone: "check" },
  format: { label: "형식 오류", tone: "danger" },
};

const FILTERS: { key: "all" | ReviewReason; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "must", label: "필수 검수" },
  { key: "low", label: "신뢰도 낮음" },
  { key: "format", label: "형식 오류" },
];

const partStyle: Record<SourcePartKind, string> = {
  ok: "bg-ok-bg text-ok-text font-bold",
  low: "bg-check-bg text-check-text font-bold",
  plain: "text-text-body-long font-normal",
};

const REJECT_REASONS = ["중복 공고", "원문과 다름 · 다시 추출", "서비스 대상 아님", "마감된 공고"];

type Done = "ok" | "no";

export function AdminWebReview() {
  const { data } = useReviewQueue();
  const setCounts = useSetAdminCounts();
  const items = data.items;

  const [filter, setFilter] = useState<"all" | ReviewReason>("all");
  const [sel, setSel] = useState(items[0].id);
  const [done, setDone] = useState<Record<string, Done>>({});
  const [edits, setEdits] = useState<Record<string, Record<string, string>>>({});

  const shown = items.filter((i) => filter === "all" || i.reason === filter);
  const selId = shown.some((i) => i.id === sel) ? sel : (shown[0]?.id ?? items[0].id);
  const cur = items.find((i) => i.id === selId) ?? items[0];
  const curEdits = edits[cur.id] ?? {};
  const edited = Object.keys(curEdits).length > 0;
  const curDone = done[cur.id];
  const pending = data.total - Object.keys(done).length;

  const statusText = (id: string) =>
    done[id] === "ok" ? "승인함" : done[id] === "no" ? "반려함" : "대기 중";

  const finish = (kind: Done) => {
    const next = { ...done, [cur.id]: kind };
    setDone(next);
    setCounts({ reviewPending: data.total - Object.keys(next).length });
  };

  const goNext = () => {
    const idx = items.findIndex((i) => i.id === cur.id);
    setSel(items[(idx + 1) % items.length].id);
    setFilter("all");
  };

  const reason = REASON[cur.reason];

  return (
    <>
      <AdminTitleRow>
        <AdminTitle
          title="검수"
          desc="AI가 원문에서 뽑은 조건을 확인하고 서비스에 내보내요 · 승인 전에는 사용자에게 보이지 않아요"
        />
      </AdminTitleRow>

      <div className="flex flex-wrap items-start gap-[20px]">
        <section
          aria-label="검수 대기열"
          className="rounded-card bg-surface flex min-w-0 flex-col overflow-hidden"
          style={{ flex: "1 1 290px" }}
        >
          <div className="flex flex-col gap-[12px] px-[18px] pt-[18px] pb-[12px]">
            <div className="flex items-center justify-between">
              <span className="text-[16px] font-extrabold">대기열 {pending}건</span>
              <span className="text-text-sub text-[13px]">오래된 순</span>
            </div>
            <div role="group" aria-label="검수 사유" className="flex flex-wrap gap-[6px]">
              {FILTERS.map((f) => {
                const on = f.key === filter;
                return (
                  <button
                    key={f.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setFilter(f.key)}
                    className={cn(
                      "rounded-pill min-h-[36px] cursor-pointer border-0 px-[12px] text-[13px] font-bold",
                      on ? "bg-text text-white" : "bg-fill text-text-sub",
                    )}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
          {shown.map((q) => {
            const on = q.id === selId;
            const r = REASON[q.reason];
            return (
              <button
                key={q.id}
                type="button"
                aria-pressed={on}
                onClick={() => setSel(q.id)}
                className={cn(
                  "border-t-line-soft text-text flex cursor-pointer flex-col gap-[6px] border-0 border-t border-l-4 border-solid py-[14px] pr-[18px] pl-[14px] text-left",
                  on ? "bg-row-selected border-l-brand" : "bg-surface border-l-transparent",
                )}
              >
                <span className="flex w-full items-center justify-between gap-[8px]">
                  <Badge tone={r.tone} size="xs">
                    {r.label}
                  </Badge>
                  <span className="text-text-sub text-[12px]">{q.age}</span>
                </span>
                <span className="text-[15px] font-bold">{q.title}</span>
                <span className="text-text-sub text-[13px]">
                  {q.source} · {statusText(q.id)}
                </span>
              </button>
            );
          })}
        </section>

        <div className="flex min-w-0 flex-col gap-[16px]" style={{ flex: "999 1 600px" }}>
          <section
            aria-label="검수 대상"
            className="rounded-card bg-surface flex flex-wrap items-center justify-between gap-[12px] px-[26px] py-[22px]"
          >
            <div className="flex flex-col gap-[6px]">
              <div className="flex flex-wrap gap-[6px]">
                <Badge tone={reason.tone} size="md">
                  {reason.label}
                </Badge>
                <Badge tone="neutral" size="md" className="font-semibold">
                  {cur.kind}
                </Badge>
              </div>
              <h2 className="tracking-title m-0 text-[22px] font-extrabold">{cur.title}</h2>
              <span className="text-text-sub text-[14px]">
                출처 {cur.source} · {cur.version} · 들어온 시각 {cur.received}
              </span>
            </div>
            <a
              href="#"
              className="bg-fill text-text hover:text-text inline-flex min-h-[44px] items-center gap-[6px] rounded-sm px-[14px] text-[14px] font-bold no-underline"
            >
              원문 사이트
              <ExternalLink size={16} aria-hidden />
            </a>
          </section>

          <div className="flex flex-wrap items-stretch gap-[16px]">
            <section
              aria-labelledby="src-h"
              className="rounded-card bg-surface box-content flex min-w-0 flex-col gap-[12px] px-[24px] py-[22px]"
              style={{ flex: "1 1 320px" }}
            >
              <div className="flex items-center justify-between">
                <h3 id="src-h" className="m-0 text-[17px] font-extrabold">
                  원문
                </h3>
                <span className="text-text-sub inline-flex gap-[10px] text-[12px]">
                  <span className="inline-flex items-center gap-[4px]">
                    <span className="bg-ok-bg size-[10px] rounded-[3px]" aria-hidden />
                    추출
                  </span>
                  <span className="inline-flex items-center gap-[4px]">
                    <span className="bg-check-bg size-[10px] rounded-[3px]" aria-hidden />
                    확인 필요
                  </span>
                </span>
              </div>
              {cur.paras.map((p) => (
                <p key={p.head} className="text-text-body-long m-0 text-[15px] leading-[1.85]">
                  <strong className="text-text">{p.head}</strong>{" "}
                  {p.parts.map((s, i) => (
                    <span key={i} className={cn("rounded-[4px]", partStyle[s.kind])}>
                      {s.t}
                    </span>
                  ))}
                </p>
              ))}
            </section>

            <section
              aria-labelledby="ex-h"
              className="rounded-card bg-surface box-content flex min-w-0 flex-col gap-[12px] px-[24px] py-[22px]"
              style={{ flex: "1 1 320px" }}
            >
              <div className="flex items-center justify-between">
                <h3 id="ex-h" className="m-0 text-[17px] font-extrabold">
                  AI 추출 결과
                </h3>
                <span className="text-text-sub text-[13px]">신뢰도</span>
              </div>
              {cur.fields.map((f) => {
                const low = f.conf < 0.7;
                const value = curEdits[f.label] ?? f.value;
                return (
                  <label
                    key={f.label}
                    className="grid items-center gap-[10px] text-[14px] font-bold"
                    style={{ gridTemplateColumns: "92px minmax(0, 1fr) 54px" }}
                  >
                    {f.label}
                    <input
                      type="text"
                      value={value}
                      onChange={(e) =>
                        setEdits({
                          ...edits,
                          [cur.id]: { ...curEdits, [f.label]: e.target.value },
                        })
                      }
                      className={cn(
                        "text-text box-border min-h-[44px] min-w-0 rounded-sm border-solid px-[12px] text-[15px] font-medium",
                        low
                          ? "border-lowconf-line bg-lowconf-bg border-2"
                          : "border-line bg-surface border",
                      )}
                    />
                    <span
                      className={cn(
                        "text-right text-[13px] font-extrabold",
                        low ? "text-check-text" : "text-text-sub",
                      )}
                    >
                      {f.conf === 0 ? "없음" : f.conf.toFixed(2)}
                    </span>
                  </label>
                );
              })}
              <span className="text-text-sub border-line-soft border-t border-solid pt-[10px] text-[13px]">
                신뢰도 0.7 미만은 노란색으로 표시해요 · 고친 칸은 &apos;수정 후 승인&apos;으로
                저장돼요
              </span>
            </section>
          </div>

          <section
            aria-label="승인 영향"
            className="bg-brand-soft flex flex-wrap items-center gap-x-[16px] gap-y-[10px] rounded-[20px] px-[20px] py-[16px]"
          >
            <Users size={20} className="text-brand-strong" aria-hidden />
            <span className="text-brand-strong text-[15px]" style={{ flex: "1 1 300px" }}>
              <strong>승인하면</strong> {cur.impact}
            </span>
          </section>

          <section
            aria-label="처리"
            className="rounded-card bg-surface flex flex-col gap-[14px] px-[24px] py-[20px]"
          >
            {curDone && (
              <div
                role="status"
                className={cn(
                  "rounded-control px-[16px] py-[12px] text-[15px] font-bold",
                  curDone === "ok" ? "bg-ok-bg text-ok-text" : "bg-fill text-text-sub",
                )}
              >
                {curDone === "ok"
                  ? edited
                    ? "수정 후 승인했어요 · 사용자 화면에 반영됐어요"
                    : "승인했어요 · 사용자 화면에 반영됐어요"
                  : "반려했어요 · 다시 수집되면 대기열에 돌아와요"}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-[8px]">
              <button
                type="button"
                onClick={() => finish("ok")}
                className="rounded-control bg-brand min-h-[52px] cursor-pointer border-0 px-[22px] text-[16px] font-extrabold text-white"
              >
                {edited ? "수정 후 승인" : "승인"}
              </button>
              <button
                type="button"
                onClick={() => finish("no")}
                className="rounded-control bg-fill text-text min-h-[52px] cursor-pointer border-0 px-[20px] text-[15px] font-bold"
              >
                반려
              </button>
              <select
                aria-label="반려 사유"
                className="rounded-control border-line bg-surface text-text min-h-[52px] border border-solid px-[14px] text-[15px]"
              >
                <option>반려 사유 선택</option>
                {REJECT_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <span className="flex-1" />
              <button
                type="button"
                onClick={goNext}
                className="rounded-control text-text-sub inline-flex min-h-[52px] cursor-pointer items-center gap-[4px] border-0 bg-transparent px-[12px] text-[15px] font-bold"
              >
                다음 건
                <ChevronRight size={18} aria-hidden />
              </button>
            </div>
          </section>

          <section
            aria-labelledby="log-h"
            className="rounded-card bg-surface flex flex-col gap-[6px] px-[24px] py-[20px]"
          >
            <h3 id="log-h" className="m-0 mb-[6px] text-[17px] font-extrabold">
              처리 기록
            </h3>
            {cur.log.map((l) => (
              <div
                key={l.at + l.text}
                className="border-line-soft grid gap-[12px] border-t border-solid py-[10px] text-[14px]"
                style={{ gridTemplateColumns: "120px 80px minmax(0, 1fr)" }}
              >
                <span className="text-text-sub">{l.at}</span>
                <span className="font-bold">{l.who}</span>
                <span>{l.text}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
