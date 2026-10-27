"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminMe } from "@/components/admin/AdminGuard";
import { AdminTitle, AdminTitleRow } from "@/components/admin/AdminShell";
import { changeUserRole } from "@/features/admin/api";
import { useAdminUsers, useRoleChanges } from "@/features/admin/queries";
import { ApiError, type Problem } from "@/lib/api/client";
import { USE_MOCKS } from "@/lib/api/config";
import { cn } from "@/lib/cn";
import type { AdminUser, AdminUserRole } from "@/mocks/admin-users";

const ROLES: { key: AdminUserRole | ""; label: string }[] = [
  { key: "", label: "전체" },
  { key: "ADMIN", label: "관리자" },
  { key: "USER", label: "일반 회원" },
];

const PROVIDER: Record<string, string> = { KAKAO: "카카오", NAVER: "네이버", GOOGLE: "구글" };
const PAGE_SIZE = 30;

const day = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("ko-KR", {
        year: "2-digit",
        month: "numeric",
        day: "numeric",
      })
    : "-";

const when = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const roleLabel = (r: AdminUserRole) => (r === "ADMIN" ? "관리자" : "일반 회원");

/** 백엔드 오류 문구 (Problem Details의 detail) */
function message(e: unknown) {
  if (e instanceof ApiError) return (e.body as Problem | null)?.detail ?? e.message;
  return e instanceof Error ? e.message : String(e);
}

export function AdminWebUsers() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<AdminUserRole | "">("");
  const [page, setPage] = useState(0);
  const { data, isPending, isError } = useAdminUsers(query, role, page);
  const changes = useRoleChanges(30);
  const me = useAdminMe();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const change = async (u: AdminUser) => {
    const to: AdminUserRole = u.role === "ADMIN" ? "USER" : "ADMIN";
    const name = u.nickname ?? "이름 없는 회원";
    const ask =
      to === "ADMIN"
        ? `${name}님을 관리자로 지정할까요? 다음 로그인부터 관리자 화면을 쓸 수 있어요.`
        : `${name}님의 관리자 권한을 해제할까요? 그 회원의 로그인이 바로 끊겨요.`;
    if (!window.confirm(ask)) return;
    setBusy(u.id);
    setNotice(null);
    try {
      if (!USE_MOCKS) await changeUserRole(u.id, to);
      setNotice({ ok: true, text: `${name}님을 ${roleLabel(to)}(으)로 바꿨어요` });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      setNotice({ ok: false, text: `바꾸지 못했어요 · ${message(e)}` });
    } finally {
      setBusy(null);
    }
  };

  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <>
      <AdminTitleRow>
        <AdminTitle
          title="회원"
          desc="회원을 찾고 관리자 권한을 주거나 빼요 · 소득·자산 같은 판정 조건과 소셜 계정 원본 정보는 보이지 않아요"
        />
      </AdminTitleRow>

      <section className="rounded-card bg-surface flex flex-col gap-[16px] px-[24px] py-[22px]">
        <form
          className="flex flex-wrap items-center gap-[10px]"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(input);
            setPage(0);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="닉네임 일부 또는 회원 ID"
            aria-label="회원 찾기"
            className="rounded-control border-line min-h-[44px] min-w-[260px] flex-1 border border-solid px-[14px] text-[15px]"
          />
          <button
            type="submit"
            className="rounded-control bg-text min-h-[44px] cursor-pointer border-0 px-[18px] text-[15px] font-bold text-white"
          >
            찾기
          </button>
          <div role="group" aria-label="권한" className="flex flex-wrap gap-[6px]">
            {ROLES.map((r) => (
              <button
                key={r.label}
                type="button"
                aria-pressed={role === r.key}
                onClick={() => {
                  setRole(r.key);
                  setPage(0);
                }}
                className={cn(
                  "rounded-pill min-h-[40px] cursor-pointer border-0 px-[14px] text-[14px] font-bold",
                  role === r.key ? "bg-text text-white" : "bg-fill text-text-sub",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </form>

        {notice && (
          <div
            role={notice.ok ? "status" : "alert"}
            className={cn(
              "rounded-control px-[16px] py-[12px] text-[14px] font-bold",
              notice.ok ? "bg-ok-bg text-ok-text" : "bg-fill text-text",
            )}
          >
            {notice.text}
          </div>
        )}

        {isPending && <span className="text-text-sub text-[15px]">불러오는 중이에요</span>}
        {isError && <span className="text-text-sub text-[15px]">회원을 불러오지 못했어요</span>}
        {data && (
          <>
            <span className="text-text-sub text-[14px]">{total.toLocaleString("ko-KR")}명</span>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="text-text-sub text-left">
                    {["닉네임", "권한", "로그인 방식", "가입", "마지막 로그인", "회원 ID", ""].map(
                      (h) => (
                        <th
                          key={h}
                          className="border-b-line-soft border-b border-solid py-[10px] pr-[12px] font-bold"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-text-sub py-[24px] text-center">
                        찾는 회원이 없어요
                      </td>
                    </tr>
                  )}
                  {data.items.map((u) => {
                    const self = me.data?.id === u.id;
                    return (
                      <tr key={u.id} className="border-b-line-soft border-b border-solid">
                        <td className="py-[12px] pr-[12px] font-bold">{u.nickname ?? "-"}</td>
                        <td className="py-[12px] pr-[12px]">
                          <span
                            className={cn(
                              "rounded-tag px-[8px] py-[2px] text-[12px] font-extrabold",
                              u.role === "ADMIN"
                                ? "bg-brand-soft text-brand-strong"
                                : "bg-fill text-text-sub",
                            )}
                          >
                            {roleLabel(u.role)}
                          </span>
                        </td>
                        <td className="text-text-sub py-[12px] pr-[12px]">
                          {u.providers.map((p) => PROVIDER[p] ?? p).join(" · ") || "-"}
                        </td>
                        <td className="text-text-sub py-[12px] pr-[12px]">{day(u.joinedAt)}</td>
                        <td className="text-text-sub py-[12px] pr-[12px]">{day(u.lastLoginAt)}</td>
                        <td
                          className="text-text-sub py-[12px] pr-[12px] font-mono text-[12px]"
                          title={u.id}
                        >
                          {u.id.slice(0, 8)}…
                        </td>
                        <td className="py-[12px] text-right">
                          {self ? (
                            <span className="text-text-sub text-[13px]">나</span>
                          ) : (
                            <button
                              type="button"
                              disabled={busy === u.id}
                              onClick={() => change(u)}
                              className={cn(
                                "rounded-control min-h-[38px] cursor-pointer border-0 px-[12px] text-[13px] font-bold disabled:opacity-50",
                                u.role === "ADMIN" ? "bg-fill text-text" : "bg-brand text-white",
                              )}
                            >
                              {u.role === "ADMIN" ? "관리자 해제" : "관리자로 지정"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {lastPage > 0 && (
              <div className="flex items-center justify-end gap-[8px] text-[14px]">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="rounded-control bg-fill min-h-[38px] cursor-pointer border-0 px-[12px] font-bold disabled:opacity-40"
                >
                  이전
                </button>
                <span className="text-text-sub">
                  {page + 1} / {lastPage + 1}
                </span>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage(page + 1)}
                  className="rounded-control bg-fill min-h-[38px] cursor-pointer border-0 px-[12px] font-bold disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="rounded-card bg-surface flex flex-col gap-[12px] px-[24px] py-[22px]">
        <div className="flex flex-col gap-[2px]">
          <h2 className="m-0 text-[17px] font-extrabold">권한 변경 기록</h2>
          <span className="text-text-sub text-[13px]">
            최근 30일 · 자기 권한은 바꿀 수 없고, 마지막 관리자는 해제할 수 없어요
          </span>
        </div>
        {(changes.data ?? []).length === 0 && (
          <span className="text-text-sub text-[14px]">아직 없어요</span>
        )}
        {(changes.data ?? []).map((c) => (
          <div
            key={`${c.userId}-${c.changedAt}`}
            className="rounded-control bg-bg flex flex-wrap items-baseline justify-between gap-[8px] px-[14px] py-[10px] text-[14px]"
          >
            <span>
              <b>{c.nickname ?? "탈퇴한 회원"}</b> · {roleLabel(c.fromRole)} → {roleLabel(c.toRole)}
            </span>
            <span className="text-text-sub text-[13px]">
              {c.changedByNickname ?? "알 수 없음"} · {when(c.changedAt)}
            </span>
          </div>
        ))}
      </section>
    </>
  );
}
