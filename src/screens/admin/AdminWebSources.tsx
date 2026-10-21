"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { AdminTitle } from "@/components/admin/AdminShell";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { useAdminSources } from "@/features/admin/queries";
import { cn } from "@/lib/cn";
import type { SourceRow, SourceRun, SourceStatus } from "@/mocks/admin";

type ShownStatus = SourceStatus | "paused" | "running";

const ST: Record<ShownStatus, { label: string; tone: BadgeTone }> = {
  ok: { label: "정상", tone: "ok" },
  late: { label: "지연", tone: "check" },
  fail: { label: "연속 0건 · 3회", tone: "danger" },
  paused: { label: "일시 중지", tone: "neutral" },
  running: { label: "수집 중", tone: "ok" },
};

const runColor: Record<SourceRun["tone"], string> = {
  normal: "text-text",
  fail: "text-danger-text",
  late: "text-check-text",
};

const COLS =
  "minmax(0, 2.4fr) minmax(0, 0.9fr) minmax(0, 1fr) minmax(0, 1.3fr) minmax(0, 0.8fr) minmax(0, 1.2fr)";

function SummaryTile({
  dot,
  label,
  value,
  alert,
}: {
  dot: string;
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-card bg-surface flex items-center gap-[14px] px-[24px] py-[20px]",
        alert && "shadow-[inset_0_0_0_2px_var(--color-danger-line)]",
      )}
    >
      <span className={cn("rounded-pill size-[12px] flex-none", dot)} aria-hidden />
      <span className="flex flex-col gap-[2px]">
        <span className="text-text-sub text-[14px]">{label}</span>
        <span className="tracking-title text-[28px] font-extrabold">{value}</span>
      </span>
    </div>
  );
}

export function AdminWebSources() {
  const { data } = useAdminSources();
  const [sel, setSel] = useState("gh");
  const [rerun, setRerun] = useState<Record<string, boolean>>({});
  const [paused, setPaused] = useState<Record<string, boolean>>({});

  const stOf = (r: SourceRow): ShownStatus =>
    rerun[r.id] ? "running" : paused[r.id] ? "paused" : r.st;
  const cur = data.rows.find((r) => r.id === sel) ?? data.rows[0];
  const curSt = ST[stOf(cur)];
  const hasIssue = !!cur.issue && !rerun[cur.id];

  return (
    <>
      <AdminTitle
        title="수집 현황"
        desc={`공고와 정책을 가져오는 곳 ${data.total}개 · ${data.asOf} 기준`}
      />

      <section
        aria-label="상태 요약"
        className="grid gap-[14px]"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}
      >
        <SummaryTile dot="bg-brand" label="정상" value={`${data.summary.ok}곳`} />
        <SummaryTile
          dot="bg-warn-dot"
          label="지연 · 주기보다 늦음"
          value={`${data.summary.late}곳`}
        />
        <SummaryTile
          dot="bg-danger-text"
          label="실패 · 연속 0건"
          value={`${data.summary.fail}곳`}
          alert
        />
      </section>

      <div className="flex flex-wrap items-start gap-[20px]">
        <section
          aria-label="수집처 목록"
          className="rounded-card bg-surface min-w-0 overflow-hidden"
          style={{ flex: "999 1 600px" }}
        >
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div
                className="border-line text-text-sub grid gap-[12px] border-b border-solid px-[22px] py-[14px] text-[13px] font-bold"
                style={{ gridTemplateColumns: COLS }}
              >
                <span>수집처</span>
                <span>방식</span>
                <span>주기</span>
                <span>최근 수집</span>
                <span className="text-right">이번 건수</span>
                <span>상태</span>
              </div>
              {data.rows.map((r) => {
                const on = r.id === cur.id;
                const st = ST[stOf(r)];
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setSel(r.id)}
                    className={cn(
                      "border-line-soft text-text grid min-h-[52px] w-full cursor-pointer items-center gap-[12px] border-0 border-b border-solid px-[22px] py-[13px] text-left",
                      on ? "bg-row-selected" : "bg-surface",
                    )}
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <span className="flex flex-col gap-[2px]">
                      <span className="text-[15px] font-bold">{r.name}</span>
                      <span className="text-text-sub text-[12px]">{r.area}</span>
                    </span>
                    <span className="text-text-sub text-[14px]">{r.method}</span>
                    <span className="text-text-sub text-[14px]">{r.cycle}</span>
                    <span className="text-[14px]">{r.last}</span>
                    <span className="text-right text-[15px] font-bold">{r.count}</span>
                    <span>
                      <Badge tone={st.tone} size="md" className="inline-flex">
                        {st.label}
                      </Badge>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section
          aria-label="수집처 상세"
          aria-live="polite"
          className="rounded-card bg-surface box-content flex min-w-0 flex-col gap-[16px] p-[24px]"
          style={{ flex: "1 1 320px" }}
        >
          <div className="flex flex-col gap-[8px]">
            <Badge tone={curSt.tone} size="md" className="self-start">
              {curSt.label}
            </Badge>
            <h2 className="tracking-title m-0 text-[22px] font-extrabold">{cur.name}</h2>
            <span className="text-text-sub text-[14px]">
              {cur.method} · {cur.cycle} · {cur.area}
            </span>
          </div>
          {hasIssue && (
            <div className="rounded-tile bg-danger-bg text-danger-text px-[16px] py-[14px] text-[14px] leading-[1.6] font-semibold">
              {cur.issue}
            </div>
          )}
          <div className="flex flex-col">
            <span className="mb-[6px] text-[15px] font-extrabold">최근 기록</span>
            {cur.runs.map((x) => (
              <div
                key={x.at}
                className="border-line-soft flex justify-between gap-[10px] border-t border-solid py-[9px] text-[14px]"
              >
                <span className="text-text-sub">{x.at}</span>
                <span className={cn("font-bold", runColor[x.tone])}>{x.text}</span>
              </div>
            ))}
          </div>
          <dl
            className="m-0 grid gap-x-[14px] gap-y-[8px] text-[14px]"
            style={{ gridTemplateColumns: "auto minmax(0, 1fr)" }}
          >
            <dt className="text-text-sub">robots.txt</dt>
            <dd className="m-0">{cur.robots}</dd>
            <dt className="text-text-sub">읽는 방식</dt>
            <dd className="m-0">{cur.parser}</dd>
            <dt className="text-text-sub">누적</dt>
            <dd className="m-0">{cur.total}</dd>
          </dl>
          <div className="flex flex-wrap gap-[8px]">
            <button
              type="button"
              onClick={() => setRerun({ ...rerun, [cur.id]: true })}
              className="rounded-control bg-brand inline-flex min-h-[48px] cursor-pointer items-center gap-[6px] border-0 px-[18px] text-[15px] font-extrabold text-white"
            >
              <RefreshCw size={18} aria-hidden />
              {rerun[cur.id] ? "수집 요청함" : "지금 다시 수집"}
            </button>
            <button
              type="button"
              onClick={() => setPaused({ ...paused, [cur.id]: !paused[cur.id] })}
              className="rounded-control bg-fill text-text min-h-[48px] cursor-pointer border-0 px-[18px] text-[15px] font-bold"
            >
              {paused[cur.id] ? "수집 다시 켜기" : "일시 중지"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
