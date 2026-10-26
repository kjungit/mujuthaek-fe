"use client";

import { Fragment, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAdminMe, type AdminMe } from "@/components/admin/AdminGuard";
import { AdminTitle, AdminTitleRow } from "@/components/admin/AdminShell";
import {
  changeUserRole,
  freezeAdmins,
  setUserPermissions,
  suspendUser,
  transferSuperAdmin,
  unfreezeAdmins,
  unsuspendUser,
} from "@/features/admin/api";
import {
  PERMISSION_GROUPS,
  PERMISSION_INFO,
  PERMISSION_PRESETS,
  type AdminPermission,
} from "@/features/admin/permissions";
import { useAdminChanges, useAdminUsers } from "@/features/admin/queries";
import { ApiError, type Problem } from "@/lib/api/client";
import { USE_MOCKS } from "@/lib/api/config";
import { cn } from "@/lib/cn";
import type { AdminChange, AdminUser, AdminUserFilter } from "@/mocks/admin-users";

const FILTERS: { key: AdminUserFilter; label: string }[] = [
  { key: "", label: "전체" },
  { key: "ADMIN", label: "관리자" },
  { key: "USER", label: "일반 회원" },
  { key: "SUSPENDED", label: "정지 중" },
];

const PROVIDER: Record<string, string> = { KAKAO: "카카오", NAVER: "네이버", GOOGLE: "구글" };
const PAGE_SIZE = 30;

const PERIODS: { label: string; days: number | null }[] = [
  { label: "1일", days: 1 },
  { label: "7일", days: 7 },
  { label: "30일", days: 30 },
  { label: "해제할 때까지", days: null },
];

const CHANGE_LABEL: Record<AdminChange["kind"], string> = {
  APPOINT: "관리자 지정",
  DISMISS: "관리자 해제",
  GRANT: "권한 주기",
  REVOKE: "권한 빼기",
  SUSPEND: "이용 정지",
  UNSUSPEND: "정지 해제",
  TRANSFER: "최상위 넘기기",
  FREEZE: "관리자 긴급 정지",
  UNFREEZE: "긴급 정지 풀기",
};

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

const ROLE_LABEL: Record<AdminUser["role"], string> = {
  USER: "일반 회원",
  ADMIN: "관리자",
  SUPER_ADMIN: "최상위 관리자",
};

/** 백엔드 오류 문구 (Problem Details의 detail) */
function message(e: unknown) {
  if (e instanceof ApiError) return (e.body as Problem | null)?.detail ?? e.message;
  return e instanceof Error ? e.message : String(e);
}

const has = (me: AdminMe | undefined, p: AdminPermission) => !!me?.permissions.includes(p);
const isSuper = (me: AdminMe | undefined) => me?.role === "SUPER_ADMIN";
const labels = (ps: AdminPermission[]) => ps.map((p) => PERMISSION_INFO[p].label).join(", ");

/**
 * 그 관리자의 권한을 모두 멈추는 일(해제·정지)을 내가 할 수 있는지. 안 되면 이유. 서버와 같은 규칙이에요:
 * 「권한 부여」를 가진 관리자는 최상위만, 그 사람의 권한을 내가 모두 가져야 해요.
 */
function wholeBlock(me: AdminMe | undefined, u: AdminUser, what: string) {
  if (isSuper(me) || u.role !== "ADMIN") return null;
  if (u.permissions.includes("PERMISSION_GRANT"))
    return `「권한 부여」를 가진 관리자는 최상위 관리자만 ${what}할 수 있어요`;
  const missing = u.permissions.filter((p) => !me?.permissions.includes(p));
  return missing.length ? `내가 가지지 않은 권한(${labels(missing)})을 가진 관리자예요` : null;
}

export function AdminWebUsers() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<AdminUserFilter>("");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const { data, isPending, isError } = useAdminUsers(query, filter, page);
  const { data: me } = useAdminMe();
  const seesChanges =
    has(me, "ACTIVITY") ||
    has(me, "ADMIN_APPOINT") ||
    has(me, "PERMISSION_GRANT") ||
    has(me, "USERS_SUSPEND");
  const changes = useAdminChanges(30, seesChanges);
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  /** 확인을 받고 실행한 뒤 목록·기록·내 권한을 다시 받아요 */
  const run = async (ask: string | null, done: string, action: () => Promise<unknown>) => {
    if (ask && !window.confirm(ask)) return;
    setBusy(true);
    setNotice(null);
    try {
      if (!USE_MOCKS) await action();
      setNotice({ ok: true, text: done });
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch (e) {
      setNotice({ ok: false, text: `처리하지 못했어요 · ${message(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / PAGE_SIZE) - 1);

  return (
    <>
      <AdminTitleRow>
        <AdminTitle
          title="회원"
          desc="회원을 찾고, 관리자 지정·권한·이용 정지를 관리해요 · 소득·자산 같은 판정 조건과 소셜 계정 원본 정보는 보이지 않아요"
        />
      </AdminTitleRow>

      {isSuper(me) && <SuperTools me={me!} busy={busy} run={run} />}

      {notice && (
        <div
          role={notice.ok ? "status" : "alert"}
          className={cn(
            "rounded-control px-[16px] py-[12px] text-[14px] font-bold",
            notice.ok ? "bg-ok-bg text-ok-text" : "bg-danger-bg text-danger-text",
          )}
        >
          {notice.text}
        </div>
      )}

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
            className="rounded-control border-line min-h-[44px] min-w-[240px] flex-1 border border-solid px-[14px] text-[15px]"
          />
          <button
            type="submit"
            className="rounded-control bg-text min-h-[44px] cursor-pointer border-0 px-[18px] text-[15px] font-bold text-white"
          >
            찾기
          </button>
          <div role="group" aria-label="거르기" className="flex flex-wrap gap-[6px]">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                type="button"
                aria-pressed={filter === f.key}
                onClick={() => {
                  setFilter(f.key);
                  setPage(0);
                }}
                className={cn(
                  "rounded-pill min-h-[40px] cursor-pointer border-0 px-[14px] text-[14px] font-bold",
                  filter === f.key ? "bg-text text-white" : "bg-fill text-text-sub",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </form>

        {isPending && <span className="text-text-sub text-[15px]">불러오는 중이에요</span>}
        {isError && <span className="text-text-sub text-[15px]">회원을 불러오지 못했어요</span>}
        {data && (
          <>
            <span className="text-text-sub text-[14px]">{total.toLocaleString("ko-KR")}명</span>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="text-text-sub text-left">
                    {["닉네임", "단계", "권한", "로그인 방식", "가입", "마지막 로그인", ""].map(
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
                  {data.items.map((u) => (
                    <Fragment key={u.id}>
                      <tr className="border-b-line-soft border-b border-solid">
                        <td className="py-[12px] pr-[12px] font-bold">
                          {u.nickname ?? "-"}
                          {me?.id === u.id && (
                            <span className="text-text-sub ml-[6px] text-[12px] font-medium">
                              나
                            </span>
                          )}
                        </td>
                        <td className="py-[12px] pr-[12px]">
                          <span className="flex flex-wrap gap-[4px]">
                            <span
                              className={cn(
                                "rounded-tag px-[8px] py-[2px] text-[12px] font-extrabold",
                                u.role === "USER"
                                  ? "bg-fill text-text-sub"
                                  : u.role === "SUPER_ADMIN"
                                    ? "bg-check-bg text-check-text"
                                    : "bg-brand-soft text-brand-strong",
                              )}
                            >
                              {ROLE_LABEL[u.role]}
                            </span>
                            {u.suspension && (
                              <span className="rounded-tag bg-danger-bg text-danger-text px-[8px] py-[2px] text-[12px] font-extrabold">
                                정지 중
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="text-text-sub py-[12px] pr-[12px] text-[13px]">
                          {u.role === "SUPER_ADMIN"
                            ? "전부"
                            : u.role === "ADMIN"
                              ? u.permissions.length
                                ? labels(u.permissions)
                                : "없음"
                              : "-"}
                        </td>
                        <td className="text-text-sub py-[12px] pr-[12px]">
                          {u.providers.map((p) => PROVIDER[p] ?? p).join(" · ") || "-"}
                        </td>
                        <td className="text-text-sub py-[12px] pr-[12px]">{day(u.joinedAt)}</td>
                        <td className="text-text-sub py-[12px] pr-[12px]">{day(u.lastLoginAt)}</td>
                        <td className="py-[12px] text-right">
                          <button
                            type="button"
                            aria-expanded={open === u.id}
                            onClick={() => setOpen(open === u.id ? null : u.id)}
                            className="rounded-control bg-fill text-text min-h-[38px] cursor-pointer border-0 px-[12px] text-[13px] font-bold"
                          >
                            {open === u.id ? "닫기" : "관리"}
                          </button>
                        </td>
                      </tr>
                      {open === u.id && (
                        <tr>
                          <td colSpan={7} className="bg-bg px-[16px] py-[16px]">
                            <UserPanel
                              key={JSON.stringify(u)}
                              u={u}
                              me={me}
                              busy={busy}
                              run={run}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
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

      {seesChanges && (
        <section className="rounded-card bg-surface flex flex-col gap-[12px] px-[24px] py-[22px]">
          <div className="flex flex-col gap-[2px]">
            <h2 className="m-0 text-[17px] font-extrabold">관리자 변경 기록</h2>
            <span className="text-text-sub text-[13px]">
              최근 30일 · 관리자 지정·해제, 권한 주고 빼기, 이용 정지, 최상위 넘기기, 긴급 정지
            </span>
          </div>
          {(changes.data ?? []).length === 0 && (
            <span className="text-text-sub text-[14px]">아직 없어요</span>
          )}
          {(changes.data ?? []).map((c) => (
            <div
              key={c.id}
              className="rounded-control bg-bg flex flex-wrap items-baseline justify-between gap-[8px] px-[14px] py-[10px] text-[14px]"
            >
              <span>
                <b>
                  {c.kind === "FREEZE" || c.kind === "UNFREEZE"
                    ? "모든 관리자"
                    : (c.nickname ?? "탈퇴한 회원")}
                </b>{" "}
                · {CHANGE_LABEL[c.kind]}
                {c.permission && ` 「${PERMISSION_INFO[c.permission].label}」`}
                {c.note && <span className="text-text-sub"> · {c.note}</span>}
              </span>
              <span className="text-text-sub text-[13px]">
                {c.changedByNickname ?? "알 수 없음"} · {when(c.changedAt)}
              </span>
            </div>
          ))}
        </section>
      )}
    </>
  );
}

type Run = (ask: string | null, done: string, action: () => Promise<unknown>) => Promise<void>;

/** 최상위 관리자만: 관리자 긴급 정지 */
function SuperTools({ me, busy, run }: { me: AdminMe; busy: boolean; run: Run }) {
  const [reason, setReason] = useState("");
  return (
    <section className="rounded-card bg-surface flex flex-col gap-[10px] px-[24px] py-[18px]">
      <div className="flex flex-col gap-[2px]">
        <h2 className="m-0 text-[17px] font-extrabold">최상위 관리자</h2>
        <span className="text-text-sub text-[13px]">
          관리자 긴급 정지는 최상위를 뺀 모든 관리자의 관리자 화면을 바로 멈춰요 (계정 유출이 의심될
          때). 최상위 넘기기는 회원의 「관리」에서 해요.
        </span>
      </div>
      {me.freeze ? (
        <div className="flex flex-wrap items-center gap-[10px]">
          <span className="rounded-tag bg-danger-bg text-danger-text px-[10px] py-[4px] text-[13px] font-extrabold">
            긴급 정지 중 · {when(me.freeze.at)}
            {me.freeze.reason && ` · ${me.freeze.reason}`}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run("관리자 긴급 정지를 풀까요?", "긴급 정지를 풀었어요", unfreezeAdmins)
            }
            className="rounded-control bg-text min-h-[40px] cursor-pointer border-0 px-[14px] text-[14px] font-bold text-white disabled:opacity-50"
          >
            긴급 정지 풀기
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-[10px]">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            placeholder="이유 (선택)"
            aria-label="긴급 정지 이유"
            className="rounded-control border-line min-h-[40px] min-w-[220px] flex-1 border border-solid px-[12px] text-[14px]"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              run(
                "최상위를 뺀 모든 관리자의 관리자 화면을 지금 멈출까요?",
                "모든 관리자를 긴급 정지했어요",
                () => freezeAdmins(reason),
              )
            }
            className="rounded-control bg-danger-text min-h-[40px] cursor-pointer border-0 px-[14px] text-[14px] font-bold text-white disabled:opacity-50"
          >
            관리자 긴급 정지
          </button>
        </div>
      )}
    </section>
  );
}

/** 회원 한 명 관리: 관리자 지정·해제, 권한, 이용 정지, 최상위 넘기기 */
function UserPanel({
  u,
  me,
  busy,
  run,
}: {
  u: AdminUser;
  me: AdminMe | undefined;
  busy: boolean;
  run: Run;
}) {
  const name = u.nickname ?? "이름 없는 회원";
  const self = me?.id === u.id;
  const [picked, setPicked] = useState<AdminPermission[]>(u.permissions);
  const [reason, setReason] = useState("");
  const [period, setPeriod] = useState<number | null>(7);

  if (self) {
    return (
      <p className="text-text-sub m-0 text-[14px]">
        내 계정은 여기서 바꿀 수 없어요. 다른 관리자에게 부탁해 주세요.
      </p>
    );
  }
  if (u.role === "SUPER_ADMIN") {
    return (
      <p className="text-text-sub m-0 text-[14px]">
        최상위 관리자는 바꿀 수 없어요. 최상위 관리자가 직접 넘길 수만 있어요.
      </p>
    );
  }

  // 권한 칸: 「권한 부여」가 있어야 하고, 내가 가진 권한만, 「권한 부여」 자체와 그 보유자는 최상위만
  const grantLock = !has(me, "PERMISSION_GRANT")
    ? "「권한 부여」 권한이 없어요"
    : !isSuper(me) && u.permissions.includes("PERMISSION_GRANT")
      ? "「권한 부여」를 가진 관리자의 권한은 최상위 관리자만 바꿀 수 있어요"
      : null;
  const lockOf = (p: AdminPermission) =>
    grantLock ??
    (p === "PERMISSION_GRANT" && !isSuper(me)
      ? "최상위 관리자만 주고 뺄 수 있어요"
      : !me?.permissions.includes(p)
        ? "내가 가지지 않은 권한이에요"
        : null);
  const changed =
    picked.length !== u.permissions.length || picked.some((p) => !u.permissions.includes(p));
  const toggle = (p: AdminPermission) =>
    setPicked(picked.includes(p) ? picked.filter((x) => x !== p) : [...picked, p]);
  const preset = (items: AdminPermission[]) =>
    setPicked([...picked.filter((p) => lockOf(p)), ...items.filter((p) => !lockOf(p))]);

  const dismissBlock = wholeBlock(me, u, "해제");
  const suspendBlock = !has(me, "USERS_SUSPEND")
    ? "「이용 정지」 권한이 없어요"
    : wholeBlock(me, u, "정지");
  const appointBlock = !has(me, "ADMIN_APPOINT") ? "「관리자 지정」 권한이 없어요" : null;

  return (
    <div className="flex flex-col gap-[18px]">
      <div className="text-text-sub flex flex-wrap gap-x-[12px] text-[13px]">
        <span>
          회원 ID <span className="font-mono">{u.id}</span>
        </span>
      </div>

      {/* 단계 */}
      <div className="flex flex-col gap-[8px]">
        <h3 className="m-0 text-[15px] font-extrabold">단계 · {ROLE_LABEL[u.role]}</h3>
        <div className="flex flex-wrap items-center gap-[8px]">
          {u.role === "USER" ? (
            <ActionButton
              label="관리자로 지정"
              tone="brand"
              block={
                appointBlock ?? (u.suspension ? "이용 정지 중인 회원은 지정할 수 없어요" : null)
              }
              busy={busy}
              onClick={() =>
                run(
                  `${name}님을 관리자로 지정할까요? 지정만 하면 권한은 없고, 권한은 따로 줘야 해요.`,
                  `${name}님을 관리자로 지정했어요`,
                  () => changeUserRole(u.id, "ADMIN"),
                )
              }
            />
          ) : (
            <ActionButton
              label="관리자 해제"
              tone="plain"
              block={appointBlock ?? dismissBlock}
              busy={busy}
              onClick={() =>
                run(
                  `${name}님의 관리자를 해제할까요? 받은 권한이 모두 빠지고 로그인이 바로 끊겨요.`,
                  `${name}님을 일반 회원으로 바꿨어요`,
                  () => changeUserRole(u.id, "USER"),
                )
              }
            />
          )}
          {isSuper(me) && u.role === "ADMIN" && (
            <ActionButton
              label="최상위 넘기기"
              tone="plain"
              block={u.suspension ? "이용 정지 중인 관리자에게는 넘길 수 없어요" : null}
              busy={busy}
              onClick={() =>
                window.confirm(
                  `${name}님에게 최상위 관리자를 넘길까요? 나는 모든 권한을 가진 일반 관리자가 되고, 되돌리려면 ${name}님이 다시 넘겨야 해요.`,
                ) &&
                run(
                  "정말 넘길까요? 이 작업은 바로 적용돼요.",
                  `${name}님에게 최상위 관리자를 넘겼어요. 화면을 새로 고치면 바뀐 권한이 보여요`,
                  () => transferSuperAdmin(u.id),
                )
              }
            />
          )}
        </div>
      </div>

      {/* 권한 */}
      {u.role === "ADMIN" && (
        <div className="flex flex-col gap-[10px]">
          <div className="flex flex-wrap items-baseline justify-between gap-[8px]">
            <h3 className="m-0 text-[15px] font-extrabold">권한</h3>
            {grantLock && <span className="text-text-sub text-[13px]">{grantLock}</span>}
          </div>
          {!grantLock && (
            <div className="flex flex-wrap gap-[6px]">
              {PERMISSION_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => preset(p.items)}
                  className="rounded-pill bg-fill text-text-sub min-h-[34px] cursor-pointer border-0 px-[12px] text-[13px] font-bold"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-[10px]">
            {PERMISSION_GROUPS.map((g) => (
              <fieldset
                key={g.label}
                className="rounded-control border-line-soft m-0 flex flex-col gap-[6px] border border-solid px-[12px] py-[10px]"
              >
                <legend className="text-text-sub px-[4px] text-[12px] font-bold">{g.label}</legend>
                {g.items.map((p) => {
                  const lock = lockOf(p);
                  return (
                    <label
                      key={p}
                      title={lock ?? PERMISSION_INFO[p].desc}
                      className={cn(
                        "flex items-start gap-[8px] text-[14px]",
                        lock ? "opacity-50" : "cursor-pointer",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={picked.includes(p)}
                        disabled={!!lock || busy}
                        onChange={() => toggle(p)}
                        className="mt-[3px]"
                      />
                      <span className="flex flex-col">
                        <span className="font-bold">{PERMISSION_INFO[p].label}</span>
                        <span className="text-text-sub text-[12px]">
                          {lock ?? PERMISSION_INFO[p].desc}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            ))}
          </div>
          {!grantLock && (
            <div className="flex items-center gap-[8px]">
              <ActionButton
                label="권한 저장"
                tone="brand"
                block={changed ? null : "바뀐 권한이 없어요"}
                busy={busy}
                onClick={() =>
                  run(null, `${name}님의 권한을 저장했어요`, () => setUserPermissions(u.id, picked))
                }
              />
              {changed && (
                <button
                  type="button"
                  onClick={() => setPicked(u.permissions)}
                  className="text-text-sub cursor-pointer border-0 bg-transparent text-[13px] font-bold underline"
                >
                  되돌리기
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 이용 정지 */}
      <div className="flex flex-col gap-[8px]">
        <h3 className="m-0 text-[15px] font-extrabold">이용 정지</h3>
        {u.suspension ? (
          <div className="flex flex-wrap items-center gap-[10px] text-[14px]">
            <span className="rounded-tag bg-danger-bg text-danger-text px-[10px] py-[4px] text-[13px] font-extrabold">
              {u.suspension.until ? `${when(u.suspension.until)}까지` : "해제할 때까지"} ·{" "}
              {u.suspension.reason}
            </span>
            <ActionButton
              label="정지 해제"
              tone="plain"
              block={suspendBlock}
              busy={busy}
              onClick={() =>
                run(`${name}님의 이용 정지를 풀까요?`, `${name}님의 이용 정지를 풀었어요`, () =>
                  unsuspendUser(u.id),
                )
              }
            />
          </div>
        ) : suspendBlock ? (
          <span className="text-text-sub text-[13px]">{suspendBlock}</span>
        ) : (
          <div className="flex flex-wrap items-center gap-[8px]">
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              placeholder="정지 이유 (회원에게는 보이지 않아요)"
              aria-label="정지 이유"
              className="rounded-control border-line min-h-[40px] min-w-[220px] flex-1 border border-solid px-[12px] text-[14px]"
            />
            <select
              aria-label="정지 기간"
              value={period ?? ""}
              onChange={(e) => setPeriod(e.target.value ? Number(e.target.value) : null)}
              className="rounded-control border-line min-h-[40px] border border-solid px-[10px] text-[14px]"
            >
              {PERIODS.map((p) => (
                <option key={p.label} value={p.days ?? ""}>
                  {p.label}
                </option>
              ))}
            </select>
            <ActionButton
              label="이용 정지"
              tone="danger"
              block={reason.trim() ? null : "정지 이유를 적어 주세요"}
              busy={busy}
              onClick={() =>
                run(
                  `${name}님을 ${period ? `${period}일` : "해제할 때까지"} 이용 정지할까요? 로그인이 바로 끊기고 다시 로그인할 수 없어요.`,
                  `${name}님을 이용 정지했어요`,
                  () =>
                    suspendUser(
                      u.id,
                      reason.trim(),
                      period ? new Date(Date.now() + period * 86_400_000).toISOString() : null,
                    ),
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  tone,
  block,
  busy,
  onClick,
}: {
  label: string;
  tone: "brand" | "plain" | "danger";
  /** 누를 수 없는 이유 (있으면 버튼을 막고 옆에 보여 줘요) */
  block: string | null;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <span className="flex flex-wrap items-center gap-[8px]">
      <button
        type="button"
        disabled={!!block || busy}
        onClick={onClick}
        className={cn(
          "rounded-control min-h-[38px] cursor-pointer border-0 px-[14px] text-[13px] font-bold disabled:cursor-default disabled:opacity-40",
          tone === "brand" && "bg-brand text-white",
          tone === "plain" && "bg-fill text-text",
          tone === "danger" && "bg-danger-text text-white",
        )}
      >
        {label}
      </button>
      {block && <span className="text-text-sub text-[12px]">{block}</span>}
    </span>
  );
}
