"use client";

// 「이 공고 이야기」: 공고마다 하나인 채팅방 (공고 상세 본문 아래). 읽기는 누구나, 쓰기는 로그인한 회원만
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerDownRight, Heart, MessageCircle, Send, X } from "lucide-react";
import { outlineChip } from "@/components/me/MePanels";
import {
  chatErrorMessage,
  chatReasons,
  chatTime,
  hiddenText,
  MAX_LENGTH,
  type ChatMessage,
  type ChatReportReason,
} from "@/features/chat/api";
import { useNoticeChat } from "@/features/chat/useNoticeChat";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

type Props = { noticeId: string; variant: "web" | "mobile" };

/** 아래에서 이만큼 안이면 「맨 아래에 있다」로 보고 새 메시지를 따라 내려가요 */
const BOTTOM_SLACK = 60;

export function NoticeChat({ noticeId, variant }: Props) {
  const web = variant === "web";
  const chat = useNoticeChat(noticeId);
  const now = useNow();
  const readOnly = !!chat.room?.readOnly;
  const canWrite = chat.loggedIn && !readOnly;
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  // 방이 없는 공고(404 등)면 채팅을 보여 주지 않아요
  if (chat.roomError) return null;

  return (
    <section
      aria-labelledby={`chat-h-${variant}`}
      className={
        web
          ? "rounded-card-lg bg-surface flex flex-col gap-[14px] px-[30px] py-[24px]"
          : "rounded-card bg-surface mx-[16px] flex flex-col gap-[12px] px-[20px] py-[18px]"
      }
    >
      <h2
        id={`chat-h-${variant}`}
        className={cn(
          "m-0 flex items-center gap-[8px] font-extrabold",
          web ? "tracking-title text-[21px]" : "text-[17px]",
        )}
      >
        <MessageCircle size={web ? 22 : 19} className="text-brand" aria-hidden />이 공고 이야기
      </h2>
      {chat.room && (
        <p className="bg-bg rounded-tile text-text-sub m-0 px-[14px] py-[10px] text-[13px] leading-[1.6]">
          {chat.room.guide}
          {readOnly && (
            <>
              <br />
              <strong className="text-text">접수 마감 30일이 지나 읽기만 할 수 있어요.</strong>
            </>
          )}
        </p>
      )}

      <MessageList
        chat={chat}
        now={now}
        maxHeight={web ? 420 : 360}
        canWrite={canWrite}
        onReply={(m) => setReplyTo(m)}
      />

      {readOnly ? null : !chat.loggedIn ? (
        chat.sessionPending ? null : (
          <Link
            href={routes.login}
            className="rounded-control border-line text-brand-strong flex min-h-[48px] items-center justify-center border border-solid text-[15px] font-bold no-underline"
          >
            로그인하고 이야기 남기기
          </Link>
        )
      ) : (
        <Composer
          key={noticeId}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          onSend={async (content) => {
            await chat.send(content, replyTo?.id);
            setReplyTo(null);
          }}
        />
      )}
    </section>
  );
}

/** 상대 시간을 1분마다 다시 그려요. 처음 그릴 때(서버)는 시간 없이 */
function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const t = setInterval(tick, 60 * 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

type Chat = ReturnType<typeof useNoticeChat>;

function MessageList({
  chat,
  now,
  maxHeight,
  canWrite,
  onReply,
}: {
  chat: Chat;
  now: number | null;
  maxHeight: number;
  canWrite: boolean;
  onReply: (m: ChatMessage) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const prev = useRef<{ first?: string; last?: string; height: number }>({ height: 0 });
  const { messages } = chat;

  // 새 메시지는 맨 아래에 있을 때(또는 내가 보냈을 때)만 따라 내려가고, 이전 이야기를 불러오면 보던 자리를 지켜요
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const first = messages[0]?.id;
    const last = messages.at(-1)?.id;
    const p = prev.current;
    if (p.last && last === p.last && first !== p.first) {
      el.scrollTop += el.scrollHeight - p.height;
    } else if (last !== p.last) {
      const lastMine = messages.length > 0 && chat.isMine(messages[messages.length - 1]);
      if (!p.last || atBottom.current || lastMine) el.scrollTop = el.scrollHeight;
    }
    prev.current = { first, last, height: el.scrollHeight };
  }, [messages, chat]);

  return (
    <div
      ref={box}
      role="log"
      aria-label="공고 이야기 메시지"
      aria-busy={chat.loading}
      tabIndex={0}
      onScroll={(e) => {
        const el = e.currentTarget;
        atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK;
      }}
      className="flex flex-col gap-[10px] overflow-y-auto overscroll-contain pr-[2px]"
      style={{ maxHeight, minHeight: 140 }}
    >
      {chat.hasOlder && (
        <button
          type="button"
          disabled={chat.loadingOlder}
          onClick={chat.loadOlder}
          className="text-text-sub min-h-[40px] flex-none cursor-pointer self-center border-0 bg-transparent text-[14px] font-bold disabled:opacity-60"
        >
          {chat.loadingOlder ? "불러오는 중…" : "이전 이야기 더 보기"}
        </button>
      )}
      {chat.loading ? (
        <p className="text-text-sub m-auto text-[14px]">이야기를 불러오는 중이에요</p>
      ) : chat.error ? (
        <p role="alert" className="text-text-sub m-auto text-[14px]">
          이야기를 불러오지 못했어요. 잠시 뒤 다시 열어 주세요
        </p>
      ) : messages.length === 0 ? (
        <p className="text-text-sub m-auto text-center text-[14px] leading-[1.6]">
          아직 이야기가 없어요.
          <br />이 공고를 준비하며 궁금한 점을 먼저 남겨 보세요
        </p>
      ) : (
        messages.map((m) => (
          <MessageItem
            key={m.id}
            message={m}
            mine={chat.isMine(m)}
            now={now}
            canWrite={canWrite}
            loggedIn={chat.loggedIn}
            onReply={() => onReply(m)}
            onLike={() => chat.toggleLike(m)}
            onDelete={() => chat.remove(m.id)}
            onReport={(reason, detail) => chat.report(m.id, reason, detail)}
          />
        ))
      )}
    </div>
  );
}

const actionBtn =
  "text-text-sub inline-flex min-h-[32px] cursor-pointer items-center gap-[4px] border-0 bg-transparent px-[2px] text-[13px] font-bold disabled:opacity-60";

function MessageItem({
  message: m,
  mine,
  now,
  canWrite,
  loggedIn,
  onReply,
  onLike,
  onDelete,
  onReport,
}: {
  message: ChatMessage;
  mine: boolean;
  now: number | null;
  canWrite: boolean;
  loggedIn: boolean;
  onReply: () => void;
  onLike: () => Promise<void>;
  onDelete: () => Promise<void>;
  onReport: (reason: ChatReportReason, detail?: string) => Promise<void>;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<"none" | "delete" | "report">("none");
  const [reason, setReason] = useState<ChatReportReason>("AD");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const visible = m.status === "VISIBLE";

  const run = async (work: () => Promise<void>, done?: string) => {
    setBusy(true);
    setNote(null);
    try {
      await work();
      setPanel("none");
      if (done) setNote(done);
    } catch (error) {
      setNote(chatErrorMessage(error));
      if (error instanceof ApiError && error.code === "CHAT_ALREADY_REPORTED") setPanel("none");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className={cn(
        "flex flex-none flex-col gap-[4px] rounded-[18px] px-[14px] py-[10px]",
        mine ? "bg-brand-soft" : "bg-bg",
      )}
    >
      <div className="flex items-baseline gap-[6px]">
        <span className="text-text text-[14px] font-extrabold">
          {visible ? (m.authorNickname ?? "이름 없음") : " "}
        </span>
        {mine && visible && <span className="text-brand-strong text-[12px] font-bold">내 글</span>}
        {now !== null && (
          <time dateTime={m.createdAt} className="text-text-tertiary ml-auto text-[12px]">
            {chatTime(m.createdAt, now)}
          </time>
        )}
      </div>

      {m.parent && (
        <p className="text-text-sub border-line m-0 flex items-start gap-[4px] border-0 border-l-2 border-solid pl-[8px] text-[12px] leading-[1.5]">
          <CornerDownRight size={13} className="mt-[2px] flex-none" aria-hidden />
          <span className="line-clamp-1">
            {m.parent.status === "VISIBLE"
              ? `${m.parent.authorNickname ?? "이름 없음"}: ${m.parent.content ?? ""}`
              : hiddenText[m.parent.status]}
          </span>
        </p>
      )}

      {visible ? (
        <p className="text-text m-0 text-[15px] leading-[1.6] break-words whitespace-pre-wrap">
          {m.content}
        </p>
      ) : (
        <p className="text-text-tertiary m-0 text-[14px]">{hiddenText[m.status]}</p>
      )}

      {visible && (
        <div className="-ml-[2px] flex flex-wrap items-center gap-[10px]">
          <button
            type="button"
            aria-pressed={m.likedByMe}
            aria-label={`좋아요 ${m.likeCount}개`}
            disabled={busy || (loggedIn && !canWrite)}
            onClick={() => (loggedIn ? void run(onLike) : router.push(routes.login))}
            className={cn(actionBtn, m.likedByMe && "text-brand-strong")}
          >
            <Heart size={14} fill={m.likedByMe ? "currentColor" : "none"} aria-hidden />
            {m.likeCount > 0 ? m.likeCount : "좋아요"}
          </button>
          {canWrite && !m.parent && (
            <button type="button" onClick={onReply} className={actionBtn}>
              답장
            </button>
          )}
          {mine ? (
            <button
              type="button"
              onClick={() => setPanel(panel === "delete" ? "none" : "delete")}
              className={actionBtn}
            >
              삭제
            </button>
          ) : (
            loggedIn && (
              <button
                type="button"
                aria-expanded={panel === "report"}
                onClick={() => setPanel(panel === "report" ? "none" : "report")}
                className={actionBtn}
              >
                신고
              </button>
            )
          )}
        </div>
      )}

      {panel === "delete" && (
        <div className="flex items-center gap-[10px] pt-[2px] text-[14px]">
          <span>이 메시지를 지울까요?</span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(onDelete)}
            className="text-danger-text min-h-[36px] cursor-pointer border-0 bg-transparent font-extrabold"
          >
            지우기
          </button>
          <button
            type="button"
            onClick={() => setPanel("none")}
            className="text-text-sub min-h-[36px] cursor-pointer border-0 bg-transparent font-bold"
          >
            취소
          </button>
        </div>
      )}

      {panel === "report" && (
        <div className="flex flex-col gap-[8px] pt-[4px]">
          <div role="group" aria-label="신고 사유" className="flex flex-wrap gap-[6px]">
            {chatReasons.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={r.key === reason}
                onClick={() => setReason(r.key)}
                className={cn(outlineChip(r.key === reason), "min-h-[36px] px-[12px] text-[13px]")}
              >
                {r.label}
              </button>
            ))}
          </div>
          <input
            value={detail}
            maxLength={200}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="자세한 내용 (선택)"
            aria-label="신고 자세한 내용"
            className="rounded-control border-line bg-surface text-text min-h-[40px] border border-solid px-[12px] text-[14px]"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(() => onReport(reason, detail.trim()), "신고했어요. 운영자가 확인할게요")
            }
            className="bg-brand min-h-[40px] cursor-pointer self-start rounded-sm border-0 px-[16px] text-[14px] font-extrabold text-white disabled:opacity-60"
          >
            신고하기
          </button>
        </div>
      )}

      {note && (
        <span role="status" className="text-text-sub text-[13px]">
          {note}
        </span>
      )}
    </article>
  );
}

function Composer({
  replyTo,
  onCancelReply,
  onSend,
}: {
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (content: string) => Promise<void>;
}) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** 1분에 5개를 넘겨 막힌 동안 남은 초 */
  const [wait, setWait] = useState(0);
  const input = useRef<HTMLTextAreaElement>(null);
  const content = text.trim();
  const length = [...content].length;

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  useEffect(() => {
    if (replyTo) input.current?.focus();
  }, [replyTo]);

  const submit = async () => {
    if (!content || length > MAX_LENGTH || sending || wait > 0) return;
    setSending(true);
    setError(null);
    try {
      await onSend(content);
      setText("");
    } catch (e) {
      if (e instanceof ApiError && e.code === "CHAT_RATE_LIMITED") setWait(e.retryAfter ?? 60);
      else setError(chatErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // 한글 입력 중(조합 중) Enter는 글자 확정이라 보내지 않아요
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex flex-col gap-[8px]">
      {replyTo && (
        <div className="text-text-sub flex items-center gap-[6px] text-[13px]">
          <CornerDownRight size={14} aria-hidden />
          <span className="line-clamp-1 flex-1">
            <strong className="text-text">{replyTo.authorNickname ?? "이름 없음"}</strong>님에게
            답장
          </span>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="답장 취소"
            className="text-text-sub inline-flex min-h-[32px] cursor-pointer items-center border-0 bg-transparent"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}
      <div className="rounded-control border-line focus-within:border-brand flex items-end gap-[8px] border border-solid px-[12px] py-[8px]">
        <textarea
          ref={input}
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label="이야기 남기기"
          placeholder="궁금한 점이나 준비 팁을 나눠 주세요 (전화번호 등 개인정보는 올리지 마세요)"
          className="text-text placeholder:text-text-tertiary min-h-[44px] flex-1 resize-none border-0 bg-transparent text-[15px] leading-[1.5] outline-none"
        />
        <button
          type="button"
          disabled={!content || length > MAX_LENGTH || sending || wait > 0}
          onClick={() => void submit()}
          aria-label="보내기"
          className="bg-brand inline-flex size-[40px] flex-none cursor-pointer items-center justify-center rounded-full border-0 text-white disabled:opacity-40"
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-[8px] text-[12px]">
        {(wait > 0 || error) && (
          <span role="alert" className="text-danger-text flex-1">
            {wait > 0
              ? `메시지는 1분에 5개까지 보낼 수 있어요. ${wait}초 뒤 다시 보내 주세요`
              : error}
          </span>
        )}
        <span
          className={cn(
            "ml-auto",
            length > MAX_LENGTH ? "text-danger-text font-bold" : "text-text-tertiary",
          )}
        >
          {length}/{MAX_LENGTH}
        </span>
      </div>
    </div>
  );
}
