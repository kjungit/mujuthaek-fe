"use client";

// 「정보가 틀렸어요 · 제보하기」: 누르면 아래에 제보 칸이 열리고 제보 API로 보내요. 관리자 화면 「제보·신고」로 바로 들어가요.
// 공고(POST /api/v1/notices/{id}/reports) · 창업 지원 사업·입주 모집(/api/v1/programs/{id}/reports)
import Link from "next/link";
import { MessageSquareWarning } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/features/auth/session";
import { api, ApiError, type Problem } from "@/lib/api/client";
import { USE_MOCKS } from "@/lib/api/config";
import { endpoints } from "@/lib/api/endpoints";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export type ReportTarget = { kind: "notice" | "program"; id: string };

const FIELDS = [
  "신청 기간",
  "자격 조건",
  "보증금·임대료·금액",
  "주택·공간 정보",
  "제출 서류",
  "문의처·링크",
  "기타",
];

const input =
  "rounded-sm border-line bg-surface text-text min-h-[44px] border border-solid px-[12px] text-[15px]";

export function ReportButton({
  target,
  screen,
  className,
}: {
  target: ReportTarget | undefined;
  /** 제보를 보낸 화면 (관리자가 어디서 왔는지 봐요) */
  screen: string;
  className?: string;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [field, setField] = useState(FIELDS[0]);
  const [current, setCurrent] = useState("");
  const [reported, setReported] = useState("");
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const send = async () => {
    if (!target) return;
    if (!reported.trim() && !note.trim()) {
      setState("error");
      setError("맞는 값이나 설명 중 하나는 적어 주세요");
      return;
    }
    setState("sending");
    try {
      if (!USE_MOCKS) {
        const path =
          target.kind === "notice"
            ? endpoints.noticeReports(target.id)
            : endpoints.programReports(target.id);
        await api.post(path, {
          field,
          currentValue: current.trim() || null,
          reportedValue: reported.trim() || null,
          note: note.trim() || null,
          screen,
        });
      }
      setState("done");
    } catch (e) {
      setState("error");
      setError(
        (e instanceof ApiError && (e.body as Problem | null)?.detail) || "잠시 뒤 다시 보내 주세요",
      );
    }
  };

  if (state === "done") {
    return (
      <span role="status" className={cn("text-ok-text py-[10px] text-[14px] font-bold", className)}>
        제보를 보냈어요 · 확인하고 답하면 알림으로 알려드려요
      </span>
    );
  }
  return (
    <div className={cn("flex w-full flex-col items-center gap-[8px]", className)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="text-text-sub inline-flex min-h-[44px] cursor-pointer items-center gap-[4px] border-0 bg-transparent p-0 text-[14px] font-bold"
      >
        <MessageSquareWarning size={15} aria-hidden />
        정보가 틀렸어요 · 제보하기
      </button>
      {open && session === null && (
        <div className="rounded-tile bg-fill flex w-full flex-col items-center gap-[8px] p-[16px] text-center text-[14px]">
          제보는 로그인하면 보낼 수 있어요. 답을 알림으로 알려드려요
          <Link
            href={routes.login}
            className="bg-brand inline-flex min-h-[44px] items-center rounded-sm px-[16px] font-bold text-white no-underline hover:text-white"
          >
            로그인하기
          </Link>
        </div>
      )}
      {open && session !== null && (
        <div className="rounded-tile bg-fill flex w-full flex-col gap-[10px] p-[16px] text-left">
          <label className="flex flex-col gap-[4px] text-[14px] font-bold">
            어떤 정보인가요
            <select value={field} onChange={(e) => setField(e.target.value)} className={input}>
              {FIELDS.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-[4px] text-[14px] font-bold">
            화면에 보인 값 · 선택
            <input
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              maxLength={200}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-[4px] text-[14px] font-bold">
            맞는 값
            <input
              value={reported}
              onChange={(e) => setReported(e.target.value)}
              maxLength={200}
              className={input}
            />
          </label>
          <label className="flex flex-col gap-[4px] text-[14px] font-bold">
            설명 (원문 몇 쪽에 있는지 등)
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
              rows={3}
              className={cn(input, "py-[10px]")}
            />
          </label>
          {state === "error" && (
            <span role="alert" className="text-danger-text text-[14px] font-bold">
              보내지 못했어요 · {error}
            </span>
          )}
          <button
            type="button"
            onClick={send}
            disabled={state === "sending" || !target}
            className="rounded-control bg-brand min-h-[48px] cursor-pointer border-0 text-[15px] font-extrabold text-white disabled:opacity-60"
          >
            {state === "sending" ? "보내는 중이에요" : "제보 보내기"}
          </button>
        </div>
      )}
    </div>
  );
}
