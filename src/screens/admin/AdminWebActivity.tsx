"use client";

import { useState } from "react";
import { AdminTitle, AdminTitleRow } from "@/components/admin/AdminShell";
import { useAdminActivity, useAdminUsersByIds } from "@/features/admin/queries";
import { cn } from "@/lib/cn";
import type { ActivityItem, ActivityKind } from "@/mocks/admin-activity";

type Group = "all" | "review" | "report" | "criteria" | "role";

const GROUPS: { key: Group; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "review", label: "검수" },
  { key: "report", label: "제보" },
  { key: "criteria", label: "기준값" },
  { key: "role", label: "권한" },
];

const GROUP_OF: Record<ActivityKind, Group> = {
  NOTICE_REVIEW: "review",
  BENEFIT_REVIEW: "review",
  NOTICE_REPORT: "report",
  BENEFIT_REPORT: "report",
  PROGRAM_REPORT: "report",
  AREA_REPORT: "report",
  CRITERIA: "criteria",
  ROLE: "role",
};

const KIND_LABEL: Record<ActivityKind, string> = {
  NOTICE_REVIEW: "공고 검수",
  BENEFIT_REVIEW: "혜택 검수",
  NOTICE_REPORT: "공고 제보",
  BENEFIT_REPORT: "혜택 제보",
  PROGRAM_REPORT: "창업 사업 제보",
  AREA_REPORT: "생활권 제보",
  CRITERIA: "기준값",
  ROLE: "권한",
};

const ACTION: Record<string, { label: string; cls: string }> = {
  APPROVED: { label: "승인", cls: "bg-ok-bg text-ok-text" },
  EDITED_APPROVED: { label: "고쳐서 승인", cls: "bg-ok-bg text-ok-text" },
  REJECTED: { label: "반려", cls: "bg-fill text-text" },
  REOPENED: { label: "다시 열기", cls: "bg-check-bg text-check-text" },
  FIXED: { label: "고침", cls: "bg-ok-bg text-ok-text" },
  KEPT: { label: "그대로 둠", cls: "bg-fill text-text" },
  REPLACED: { label: "값 바꿈", cls: "bg-check-bg text-check-text" },
  TO_ADMIN: { label: "관리자 지정", cls: "bg-brand-soft text-brand-strong" },
  TO_USER: { label: "관리자 해제", cls: "bg-fill text-text" },
};

const PERIODS = [7, 30, 90];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const when = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function AdminWebActivity() {
  const [days, setDays] = useState(30);
  const [group, setGroup] = useState<Group>("all");
  const [who, setWho] = useState("");
  const { data, isPending, isError } = useAdminActivity(days);
  const items = data?.items ?? [];
  // 처리한 관리자는 회원 ID로 남아 있어서 이름을 찾아요
  const ids = [...new Set(items.map((i) => i.by).filter((b): b is string => !!b && UUID.test(b)))];
  const { data: users } = useAdminUsersByIds(ids);
  const nameOf = (by: string | null) => {
    if (!by) return "알 수 없음";
    const u = users?.find((x) => x.id === by);
    return u ? (u.nickname ?? "이름 없는 관리자") : UUID.test(by) ? `${by.slice(0, 8)}…` : by;
  };
  const people = [...new Set(items.map((i) => nameOf(i.by)))].sort();
  const list = items.filter(
    (i) => (group === "all" || GROUP_OF[i.kind] === group) && (!who || nameOf(i.by) === who),
  );

  return (
    <>
      <AdminTitleRow>
        <AdminTitle
          title="처리 기록"
          desc="관리자가 처리한 검수·제보·기준값·권한 변경을 최근 순으로 보여 줘요 · 채팅 신고 처리는 누가 했는지 남지 않아요"
        />
        <div role="group" aria-label="기간" className="flex flex-wrap gap-[6px]">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={days === p}
              onClick={() => setDays(p)}
              className={cn(
                "rounded-pill min-h-[40px] cursor-pointer border-0 px-[16px] text-[14px] font-bold",
                days === p ? "bg-text text-white" : "bg-surface text-text-sub",
              )}
            >
              {p}일
            </button>
          ))}
        </div>
      </AdminTitleRow>

      <section className="rounded-card bg-surface flex flex-col gap-[14px] px-[24px] py-[22px]">
        <div className="flex flex-wrap items-center gap-[10px]">
          <div role="group" aria-label="종류" className="flex flex-wrap gap-[6px]">
            {GROUPS.map((g) => {
              const n =
                g.key === "all"
                  ? items.length
                  : items.filter((i) => GROUP_OF[i.kind] === g.key).length;
              return (
                <button
                  key={g.key}
                  type="button"
                  aria-pressed={group === g.key}
                  onClick={() => setGroup(g.key)}
                  className={cn(
                    "rounded-pill min-h-[38px] cursor-pointer border-0 px-[14px] text-[14px] font-bold",
                    group === g.key ? "bg-text text-white" : "bg-fill text-text-sub",
                  )}
                >
                  {g.label} {n}
                </button>
              );
            })}
          </div>
          <select
            aria-label="처리한 관리자"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            className="rounded-control border-line ml-auto min-h-[40px] border border-solid px-[10px] text-[14px]"
          >
            <option value="">모든 관리자</option>
            {people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {data?.reviewsError && (
          <div
            role="status"
            className="rounded-control bg-check-bg text-check-text px-[16px] py-[12px] text-[14px] font-bold"
          >
            {data.reviewsError} · 받은 기록만 보여요
          </div>
        )}
        {isPending && <span className="text-text-sub text-[15px]">불러오는 중이에요</span>}
        {isError && (
          <span className="text-text-sub text-[15px]">처리 기록을 불러오지 못했어요</span>
        )}
        {data && list.length === 0 && (
          <span className="text-text-sub py-[24px] text-center text-[15px]">
            이 조건의 기록이 없어요
          </span>
        )}

        <ol className="m-0 flex list-none flex-col p-0">
          {list.map((i: ActivityItem, n) => {
            const a = ACTION[i.action] ?? { label: i.action, cls: "bg-fill text-text" };
            return (
              <li
                key={`${i.kind}-${i.at}-${n}`}
                className="border-b-line-soft flex flex-wrap items-center gap-x-[12px] gap-y-[6px] border-b border-solid py-[12px] text-[14px]"
              >
                <span className="text-text-sub w-[110px] flex-none text-[13px]">{when(i.at)}</span>
                <span className="text-text-sub w-[96px] flex-none text-[13px] font-bold">
                  {KIND_LABEL[i.kind]}
                </span>
                <span
                  className={cn(
                    "rounded-tag flex-none px-[8px] py-[2px] text-[12px] font-extrabold",
                    a.cls,
                  )}
                >
                  {a.label}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold" title={i.title ?? ""}>
                  {i.title ?? "-"}
                  {i.detail && <span className="text-text-sub font-medium"> · {i.detail}</span>}
                </span>
                <span className="text-text-sub flex-none text-[13px]">{nameOf(i.by)}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
