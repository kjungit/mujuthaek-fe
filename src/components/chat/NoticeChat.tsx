"use client";

// 「이 공고 이야기」: 공고마다 하나인 채팅방. 공고 상세에는 안내 카드만 두고, 누르면 채팅 창이 열려요
// (PC는 오른쪽 패널, 모바일은 아래에서 올라오는 시트. 공고 원문 PDF 보기와 같은 방식). 읽기는 누구나, 쓰기는 로그인한 회원만
// 채팅 창: 내 메시지는 오른쪽, 다른 사람은 왼쪽 말풍선. 같은 사람이 이어 보낸 건 이름·시각을 한 번만
import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  CornerDownRight,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  X,
} from "lucide-react";
import { outlineChip } from "@/components/me/MePanels";
import {
  chatClock,
  chatDay,
  chatDayKey,
  chatErrorMessage,
  chatReasons,
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
/** 같은 사람이 이 안에 이어 보낸 메시지는 한 묶음 (이름·시각을 한 번만) */
const GROUP_GAP_MS = 3 * 60 * 1000;
/** 글자 수는 한도에 가까워지면 보여 줘요 */
const COUNT_FROM = MAX_LENGTH - 50;

/** 모바일 아래 고정 줄의 「이야기」 단추가 보내는 신호: 그 공고의 채팅 창을 열어요 (detail = 공고 ID) */
const OPEN_EVENT = "noticechat:open";
/** PC 오른쪽 단추 묶음의 「이야기」 단추가 보내는 신호: 열려 있으면 닫고, 닫혀 있으면 열어요 (detail = 공고 ID) */
const TOGGLE_EVENT = "noticechat:toggle";
/** 채팅 창이 열리고 닫힐 때 알려요 (detail = { noticeId, open }). PC 단추가 「이야기 닫기」로 바뀌는 데 써요 */
const STATE_EVENT = "noticechat:state";

const iconBtn =
  "text-text inline-flex size-[44px] flex-none cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent";

export function NoticeChat({ noticeId, variant }: Props) {
  const web = variant === "web";
  // 뒤로 가기로 닫기는 모바일 시트만 (PC 패널은 PDF 원문 패널과 함께 열 수 있어서 방문 기록을 쓰지 않아요)
  const { open, show, hide } = usePanel(noticeId, !web);
  // 실시간 연결은 채팅 창을 열었을 때만 (닫혀 있으면 방 정보와 첫 쪽만 받아 미리보기에 써요)
  const chat = useNoticeChat(noticeId, { live: open });
  const readOnly = !!chat.room?.readOnly;
  const opener = useRef<HTMLButtonElement>(null);
  // 쓰던 글과 답장 대상은 창을 닫았다 열어도 남아요
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  // 닫히면(X · Esc · 뒤로 가기 · 다시 누르기) 포커스를 연 단추로 돌려줘요 (아래 고정 줄에서 열었으면 그 단추로, 화면은 움직이지 않게)
  const returnTo = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !open) {
      const active = document.activeElement;
      if (!active || active === document.body || !document.contains(active)) {
        const target = returnTo.current?.isConnected ? returnTo.current : opener.current;
        target?.focus({ preventScroll: true });
      }
      returnTo.current = null;
    }
    wasOpen.current = open;
  }, [open]);

  // 다른 「이야기」 단추(모바일 아래 고정 줄 · PC 오른쪽 단추 묶음)로도 열고 닫아요.
  // 웹·모바일 화면이 둘 다 그려져 있어서, 보이는 쪽 채팅만 움직여요
  useEffect(() => {
    const mineAndVisible = (e: Event) =>
      (e as CustomEvent<string>).detail === noticeId &&
      !!opener.current &&
      opener.current.offsetParent !== null;
    const openFrom = () => {
      returnTo.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      show();
    };
    const onOpen = (e: Event) => {
      if (mineAndVisible(e)) openFrom();
    };
    const onToggle = (e: Event) => {
      if (!mineAndVisible(e)) return;
      if (open) hide();
      else openFrom();
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener(TOGGLE_EVENT, onToggle);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener(TOGGLE_EVENT, onToggle);
    };
  }, [noticeId, show, hide, open]);

  // 열림 상태를 알려요 (PC 「이야기」 단추 글자)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent(STATE_EVENT, { detail: { noticeId, open } }));
  }, [noticeId, open]);

  // 열린 채로 화면 크기가 PC ↔ 모바일 경계(1024px)를 넘으면 닫아요 (보이지 않는 쪽 창이 남지 않게)
  useEffect(() => {
    if (!open) return;
    const wide = window.matchMedia("(min-width: 1024px)");
    const onChange = () => wide.matches !== web && hide();
    wide.addEventListener("change", onChange);
    return () => wide.removeEventListener("change", onChange);
  }, [open, web, hide]);

  // 방이 없는 공고(404 등)면 채팅을 보여 주지 않아요. 열린 뒤 다시 받다 실패한 건 그대로 둬요
  if (chat.roomError && !chat.room) return null;

  const visible = chat.messages.filter((m) => m.status === "VISIBLE");
  const latest = visible.at(-1);
  const openLabel =
    chat.loading || chat.error || !chat.room
      ? "이야기 열기"
      : visible.length === 0
        ? readOnly || chat.hasOlder
          ? "이야기 보기"
          : "첫 이야기 남기기"
        : `이야기 ${visible.length}개${chat.hasOlder ? "+" : ""} 보기`;

  return (
    <section
      aria-labelledby={`chat-h-${variant}`}
      className={
        web
          ? "rounded-card-lg bg-surface flex flex-col gap-[12px] px-[30px] py-[24px]"
          : "rounded-card bg-surface mx-[16px] flex flex-col gap-[10px] px-[20px] py-[18px]"
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
      <p className="text-text-sub m-0 text-[14px] leading-[1.6]">
        다른 사람들은 이 공고를 어떻게 준비하고 있을까요? 궁금한 점을 묻고 준비 팁을 나눠 보세요.
        {readOnly && " 접수 마감 30일이 지나 지금은 읽기만 할 수 있어요."}
      </p>
      {chat.error ? (
        <p className="bg-bg rounded-tile text-text-sub m-0 px-[14px] py-[10px] text-[14px]">
          이야기를 불러오지 못했어요. 열어서 다시 받아 볼 수 있어요
        </p>
      ) : (
        latest && (
          <p className="bg-bg rounded-tile m-0 flex min-w-0 items-baseline gap-[8px] px-[14px] py-[10px] text-[14px]">
            <span className="text-text-sub flex-none text-[12px] font-bold">
              {latest.authorNickname ?? "이름 없음"}
            </span>
            <span className="line-clamp-1 min-w-0">{latest.content}</span>
          </p>
        )
      )}
      <button
        ref={opener}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={open ? hide : show}
        className="rounded-control bg-brand-soft text-brand-strong inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-[6px] self-stretch border-0 text-[15px] font-extrabold"
      >
        <MessageCircle size={18} aria-hidden />
        {open && web ? "이야기 닫기" : openLabel}
      </button>

      {open &&
        createPortal(
          <ChatWindow
            chat={chat}
            noticeId={noticeId}
            web={web}
            onClose={hide}
            draft={draft}
            onDraft={setDraft}
            replyTo={replyTo}
            onReplyTo={setReplyTo}
          />,
          document.body,
        )}
    </section>
  );
}

/** 채팅 창이 열려 있는지 (STATE_EVENT로 들어요). 단추 글자와 말풍선에 써요 */
function useChatOpen(noticeId: string) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onState = (e: Event) => {
      const d = (e as CustomEvent<{ noticeId: string; open: boolean }>).detail;
      if (d.noticeId === noticeId) setOpen(d.open);
    };
    window.addEventListener(STATE_EVENT, onState);
    return () => window.removeEventListener(STATE_EVENT, onState);
  }, [noticeId]);
  return open;
}

/** 말풍선은 공고마다 이 기기에서 한 번만 띄워요 */
const nudgeKey = (noticeId: string) => `mujuthaek:chat-nudge:${noticeId}`;
/** 상세를 열고 이만큼 뒤에 떠요 (화면을 먼저 읽게) */
const NUDGE_DELAY_MS = 2500;
/** 떠 있는 시간 */
const NUDGE_SHOW_MS = 6000;

/**
 * 「이야기」 단추 위에 잠깐 띄우는 말풍선 (다른 사람과 이 공고 이야기를 해 보라는 안내).
 * 웹·모바일 단추가 둘 다 그려져 있어서, 그때 보이는 단추에서만 띄우고 그때 「봤다」고 적어요
 */
function useChatNudge(
  noticeId: string,
  anchor: RefObject<HTMLElement | null>,
  ready: boolean,
  open: boolean,
) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ready || open) return;
    try {
      if (localStorage.getItem(nudgeKey(noticeId)) !== null) return;
    } catch {
      return; // 저장소를 못 쓰면 띄우지 않아요 (계속 뜨지 않게)
    }
    const t = setTimeout(() => {
      if (!anchor.current || anchor.current.offsetParent === null) return;
      try {
        localStorage.setItem(nudgeKey(noticeId), "1");
      } catch {
        // 못 적어도 이번 한 번은 띄워요
      }
      setVisible(true);
    }, NUDGE_DELAY_MS);
    return () => clearTimeout(t);
  }, [noticeId, anchor, ready, open]);
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), NUDGE_SHOW_MS);
    return () => clearTimeout(t);
  }, [visible]);
  return { shown: visible && !open, dismiss: () => setVisible(false) };
}

/** 말풍선: 누르면 채팅이 열리고, X로 닫아요. 최근 이야기가 있으면 한 줄 보여 줘요 */
function ChatNudge({
  latest,
  onOpen,
  onDismiss,
  align,
}: {
  latest: ChatMessage | undefined;
  onOpen: () => void;
  onDismiss: () => void;
  /** start: 단추 왼쪽 끝에 맞춰요 (모바일 아래 고정 줄) · center: 단추 가운데 (PC) */
  align: "start" | "center";
}) {
  return (
    <div
      role="status"
      className={cn(
        "absolute bottom-full z-[5] mb-[12px] max-w-[calc(100vw-32px)]",
        align === "start" ? "left-0 w-[270px]" : "left-1/2 w-[330px] -translate-x-1/2",
      )}
    >
      <div className="bg-text shadow-float relative rounded-[14px] py-[12px] pr-[34px] pl-[14px]">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full cursor-pointer border-0 bg-transparent p-0 text-left text-white"
        >
          <span className="block text-[14px] leading-[1.5] font-bold">
            이 공고, 다른 사람들은 어떻게 준비할까요?
          </span>
          <span className="line-clamp-1 text-[13px] leading-[1.5] text-white/80">
            {latest?.content ? `「${latest.content}」` : "궁금한 점을 묻고 준비 팁을 나눠 보세요"}
          </span>
        </button>
        <button
          type="button"
          aria-label="안내 닫기"
          onClick={onDismiss}
          className="absolute top-[6px] right-[6px] inline-flex size-[28px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-white/80"
        >
          <X size={16} aria-hidden />
        </button>
        <span
          aria-hidden
          className={cn(
            "bg-text absolute top-full -mt-[6px] size-[12px] rotate-45",
            align === "start" ? "left-[22px]" : "left-1/2 -translate-x-1/2",
          )}
        />
      </div>
    </div>
  );
}

/**
 * 모바일 아래 고정 줄(관심 하트 옆)의 「이야기」 단추. 공고 상세를 끝까지 내리지 않아도 채팅을 열 수 있어요.
 * 목록은 안내 카드와 같은 캐시를 읽어서 요청이 더 가지 않고, 이야기 수를 작은 숫자로 보여 줘요.
 * 처음 보는 공고면 잠깐 말풍선으로 이야기해 보라고 알려요
 */
export function MNoticeChatButton({ noticeId }: { noticeId: string }) {
  const chat = useNoticeChat(noticeId, { live: false });
  const open = useChatOpen(noticeId);
  const anchor = useRef<HTMLButtonElement>(null);
  const nudge = useChatNudge(noticeId, anchor, !!chat.room && !chat.loading, open);
  if (chat.roomError && !chat.room) return null;
  const visible = chat.messages.filter((m) => m.status === "VISIBLE");
  const count = visible.length;
  const countLabel = count > 0 ? `${count}${chat.hasOlder ? "+" : ""}` : null;
  const openChat = () => {
    nudge.dismiss();
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: noticeId }));
  };
  return (
    <span className="relative flex flex-none">
      {nudge.shown && (
        <ChatNudge
          latest={visible.at(-1)}
          onOpen={openChat}
          onDismiss={nudge.dismiss}
          align="start"
        />
      )}
      <button
        ref={anchor}
        type="button"
        aria-haspopup="dialog"
        aria-label={countLabel ? `이 공고 이야기 ${countLabel}개 보기` : "이 공고 이야기 열기"}
        onClick={openChat}
        className="rounded-control bg-fill text-text-sub relative flex min-h-[56px] w-[56px] flex-none cursor-pointer items-center justify-center border-0"
      >
        <MessageCircle size={24} aria-hidden />
        {countLabel && (
          <span
            aria-hidden
            className="bg-brand absolute top-[6px] right-[6px] min-w-[18px] rounded-full px-[4px] text-center text-[11px] leading-[18px] font-bold text-white"
          >
            {countLabel}
          </span>
        )}
      </button>
    </span>
  );
}

/**
 * PC 오른쪽 단추 묶음(관심 등록 · 원문 보기 아래)의 「이야기」 단추. 스크롤해도 늘 보이는 자리라 공고를 읽다가 바로 열 수 있어요.
 * 열려 있으면 「이야기 닫기」로 바뀌고 누르면 닫혀요. 모양은 옆 단추에 맞춰 className으로 받아요.
 * 처음 보는 공고면 잠깐 말풍선으로 이야기해 보라고 알려요
 */
export function WebNoticeChatButton({
  noticeId,
  className,
}: {
  noticeId: string;
  className?: string;
}) {
  const chat = useNoticeChat(noticeId, { live: false });
  const open = useChatOpen(noticeId);
  const anchor = useRef<HTMLButtonElement>(null);
  const nudge = useChatNudge(noticeId, anchor, !!chat.room && !chat.loading, open);
  if (chat.roomError && !chat.room) return null;
  const visible = chat.messages.filter((m) => m.status === "VISIBLE");
  const count = visible.length;
  const label = open
    ? "이야기 닫기"
    : count > 0
      ? `이 공고 이야기 ${count}${chat.hasOlder ? "+" : ""}개`
      : "이 공고 이야기";
  const toggle = () => {
    nudge.dismiss();
    window.dispatchEvent(new CustomEvent(TOGGLE_EVENT, { detail: noticeId }));
  };
  return (
    <div className="relative flex flex-col">
      {nudge.shown && (
        <ChatNudge
          latest={visible.at(-1)}
          onOpen={toggle}
          onDismiss={nudge.dismiss}
          align="center"
        />
      )}
      <button
        ref={anchor}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          "flex cursor-pointer items-center justify-center gap-[6px] border-0 text-[16px] font-bold",
          className,
        )}
      >
        <MessageCircle size={18} aria-hidden />
        {label}
      </button>
    </div>
  );
}

/**
 * 채팅 창 열고 닫기. withHistory(모바일 시트)면 열 때 같은 주소에 방문 기록을 하나 쌓아 뒤로 가기로 닫혀요.
 * 쌓은 기록에는 표시({ noticeChat })를 남겨서, 다른 창이 쌓은 기록이나 뒤로 가기와 헷갈리지 않아요
 */
function usePanel(noticeId: string, withHistory: boolean) {
  const [open, setOpen] = useState(false);
  const opened = useRef(false);
  const mine = useCallback(
    () => (window.history.state as { noticeChat?: string } | null)?.noticeChat === noticeId,
    [noticeId],
  );

  useEffect(() => {
    if (!open || !withHistory) return;
    // 내 기록에서 벗어나면(뒤로 가기) 닫혀요
    const onPop = () => {
      if (mine()) return;
      opened.current = false;
      setOpen(false);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [open, withHistory, mine]);

  const show = useCallback(() => {
    if (opened.current) return;
    opened.current = true;
    if (withHistory) window.history.pushState({ noticeChat: noticeId }, "");
    setOpen(true);
  }, [noticeId, withHistory]);

  const hide = useCallback(() => {
    if (!opened.current) return;
    if (withHistory && mine()) {
      // 쌓아 둔 기록을 되돌리면 popstate가 와서 닫혀요
      window.history.back();
      return;
    }
    opened.current = false;
    setOpen(false);
  }, [withHistory, mine]);

  return { open, show, hide };
}

type Chat = ReturnType<typeof useNoticeChat>;

/**
 * 열린 채팅 창. PC는 오른쪽 패널이고 공고 본문을 그만큼 왼쪽으로 좁혀서 가리지 않아요.
 * 모바일은 아래에서 올라오는 시트이고, 열린 동안 뒤 화면은 누르거나 읽히지 않고 스크롤도 멈춰요
 */
function ChatWindow({
  chat,
  noticeId,
  web,
  onClose,
  draft,
  onDraft,
  replyTo,
  onReplyTo,
}: {
  chat: Chat;
  noticeId: string;
  web: boolean;
  onClose: () => void;
  draft: string;
  onDraft: (text: string) => void;
  replyTo: ChatMessage | null;
  onReplyTo: (m: ChatMessage | null) => void;
}) {
  const now = useNow();
  const readOnly = !!chat.room?.readOnly;
  const canWrite = chat.loggedIn && !readOnly;
  const root = useRef<HTMLElement & HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // 열 때 한 번만 닫기 단추로 포커스 (다시 그려질 때 입력칸 포커스를 뺏지 않게)
  useEffect(() => {
    closeBtn.current?.focus();
  }, []);

  // Esc로 닫아요. 한글 조합 중이거나 입력칸이 먼저 처리했으면(답장 취소) 닫지 않고, PC는 패널 안에 포커스가 있을 때만
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || e.isComposing || e.defaultPrevented) return;
      if (web && !root.current?.contains(document.activeElement)) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, web]);

  // PC: 패널 너비만큼 본문을 좁혀요 (PDF 원문 패널처럼). 패널이 오른쪽 칸(내 자격·관심 등록)을 가리지 않게
  useEffect(() => {
    if (!web) return;
    const body = document.body.style;
    const before = body.paddingRight;
    body.paddingRight = "min(440px, 100vw)";
    return () => {
      body.paddingRight = before;
    };
  }, [web]);

  // 모바일: 시트 밖은 inert(누르기·Tab·읽기 막음)로, 뒤 화면 스크롤은 멈춰요
  useEffect(() => {
    if (web) return;
    const sheet = root.current;
    const others = [...document.body.children].filter(
      (el): el is HTMLElement => el instanceof HTMLElement && el !== sheet,
    );
    const inertBefore = others.map((el) => el.inert);
    others.forEach((el) => (el.inert = true));
    const html = document.documentElement.style;
    const overflowBefore = html.overflow;
    html.overflow = "hidden";
    return () => {
      others.forEach((el, i) => (el.inert = inertBefore[i]));
      html.overflow = overflowBefore;
    };
  }, [web]);

  const body = (
    <>
      {chat.room && (
        <p className="bg-bg rounded-tile text-text-sub m-0 mx-[16px] px-[14px] py-[10px] text-[13px] leading-[1.6]">
          {chat.room.guide} 전화번호 등 개인정보는 올리지 마세요.
          {readOnly && (
            <>
              <br />
              <strong className="text-text">접수 마감 30일이 지나 읽기만 할 수 있어요.</strong>
            </>
          )}
        </p>
      )}
      <MessageList chat={chat} now={now} canWrite={canWrite} onReply={(m) => onReplyTo(m)} />
      {readOnly ? null : (
        <div className="border-line-soft bg-surface border-0 border-t border-solid px-[12px] py-[10px]">
          {!chat.loggedIn ? (
            chat.sessionPending ? null : (
              <Link
                href={routes.login}
                // 모바일 시트가 쌓은 기록을 로그인 화면으로 바꿔서, 돌아온 뒤 뒤로 가기가 헛돌지 않게
                replace={!web}
                className="rounded-control border-line text-brand-strong flex min-h-[44px] items-center justify-center border border-solid text-[15px] font-bold no-underline"
              >
                로그인하고 이야기 남기기
              </Link>
            )
          ) : (
            <Composer
              key={noticeId}
              text={draft}
              onText={onDraft}
              replyTo={replyTo}
              onCancelReply={() => onReplyTo(null)}
              onSend={async (content) => {
                await chat.send(content, replyTo?.id);
                onReplyTo(null);
              }}
            />
          )}
        </div>
      )}
    </>
  );

  const header = (
    <div className="flex items-center justify-between gap-[12px] px-[20px] pt-[14px] pb-[10px]">
      <span id="chat-window-h" className="flex items-center gap-[8px] text-[18px] font-extrabold">
        <MessageCircle size={20} className="text-brand" aria-hidden />이 공고 이야기
      </span>
      <button
        ref={closeBtn}
        type="button"
        aria-label="이야기 닫기"
        onClick={onClose}
        className={iconBtn}
      >
        <X size={22} aria-hidden />
      </button>
    </div>
  );

  if (!web) {
    return (
      <div ref={root} className="fixed inset-0 z-[40] flex flex-col justify-end">
        <button
          type="button"
          aria-label="이야기 닫기"
          tabIndex={-1}
          onClick={onClose}
          className="absolute inset-0 cursor-default border-0 bg-[rgba(25,31,40,0.45)]"
        />
        <section
          role="dialog"
          aria-modal="true"
          aria-labelledby="chat-window-h"
          className="bg-surface relative flex h-[92dvh] flex-col gap-[8px] overflow-hidden rounded-t-[20px] pb-[env(safe-area-inset-bottom,0px)]"
        >
          <span aria-hidden className="bg-line mx-auto mt-[8px] h-[4px] w-[40px] rounded-[2px]" />
          {header}
          {body}
        </section>
      </div>
    );
  }

  return (
    <section
      ref={root}
      role="dialog"
      aria-modal="false"
      aria-labelledby="chat-window-h"
      className="bg-surface border-line shadow-float fixed top-0 right-0 bottom-0 z-[30] flex w-[min(440px,100vw)] flex-col gap-[8px] border-l border-solid"
    >
      {header}
      {body}
    </section>
  );
}

/** 날짜 구분선(오늘·어제)을 1분마다 다시 그려요. 처음 그릴 때(서버)는 시각·날짜 없이 (시간대가 달라서) */
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

/** 메시지 목록: 채팅 창의 남은 높이를 채우고 그 안에서 스크롤해요 */
function MessageList({
  chat,
  now,
  canWrite,
  onReply,
}: {
  chat: Chat;
  now: number | null;
  canWrite: boolean;
  onReply: (m: ChatMessage) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const prev = useRef<{ first?: string; last?: string; height: number }>({ height: 0 });
  const { messages } = chat;
  const lastId = messages.at(-1)?.id;
  // 위를 보고 있을 때 새 메시지가 오면 「새 메시지」 단추를 띄워요 (맨 아래에서 본 마지막 메시지와 비교)
  const [bottom, setBottom] = useState(true);
  const [seenLast, setSeenLast] = useState<string | undefined>(undefined);
  const unseen = !bottom && !!lastId && lastId !== seenLast;

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

  // 날짜 구분선·시각은 브라우저에서 나중에 붙어 높이가 늘어요: 맨 아래에 있었으면 계속 맨 아래로
  const ready = now !== null;
  useLayoutEffect(() => {
    const el = box.current;
    if (ready && el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [ready]);

  const loadOlder = () => {
    // 메뉴를 열어 높이가 바뀌었을 수 있어서, 불러오기 직전 높이로 보던 자리를 지켜요
    if (box.current) prev.current.height = box.current.scrollHeight;
    chat.loadOlder();
  };

  const toBottom = () => {
    const el = box.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  return (
    <div className="bg-bg relative flex min-h-0 flex-1 flex-col">
      <div
        ref={box}
        role="log"
        aria-label="공고 이야기 메시지"
        aria-busy={chat.loading}
        tabIndex={0}
        onScroll={(e) => {
          const el = e.currentTarget;
          const near = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK;
          atBottom.current = near;
          setBottom(near);
          if (near) setSeenLast(lastId);
        }}
        className="flex min-h-0 flex-1 flex-col gap-[3px] overflow-y-auto overscroll-contain p-[12px]"
      >
        {chat.hasOlder && (
          <button
            type="button"
            disabled={chat.loadingOlder}
            onClick={loadOlder}
            className="text-text-sub min-h-[40px] flex-none cursor-pointer self-center border-0 bg-transparent text-[13px] font-bold disabled:opacity-60"
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
          messages.map((m, i) => {
            const before = messages[i - 1];
            const after = messages[i + 1];
            // 날짜는 보는 사람 시간대라 브라우저에서만 나눠요
            const newDay =
              now !== null && (!before || chatDayKey(before.createdAt) !== chatDayKey(m.createdAt));
            const nextDay =
              now !== null && !!after && chatDayKey(after.createdAt) !== chatDayKey(m.createdAt);
            return (
              <Fragment key={m.id}>
                {newDay && now !== null && (
                  <p className="text-text-sub bg-surface m-0 my-[8px] flex-none self-center rounded-full px-[12px] py-[3px] text-[12px] font-bold">
                    {chatDay(m.createdAt, now)}
                  </p>
                )}
                {m.status !== "VISIBLE" ? (
                  <p className="text-text-tertiary m-0 my-[6px] flex-none self-center text-[12px]">
                    {hiddenText[m.status]}
                  </p>
                ) : (
                  <MessageItem
                    message={m}
                    mine={chat.isMine(m)}
                    first={newDay || !sameRun(before, m, chat.isMine)}
                    last={nextDay || !sameRun(m, after, chat.isMine)}
                    showTime={now !== null}
                    canWrite={canWrite}
                    loggedIn={chat.loggedIn}
                    onReply={() => onReply(m)}
                    onLike={() => chat.toggleLike(m)}
                    onDelete={() => chat.remove(m.id)}
                    onReport={(reason, detail) => chat.report(m.id, reason, detail)}
                  />
                )}
              </Fragment>
            );
          })
        )}
      </div>
      {unseen && (
        <button
          type="button"
          onClick={toBottom}
          className="bg-text absolute bottom-[12px] left-1/2 inline-flex min-h-[36px] -translate-x-1/2 cursor-pointer items-center gap-[4px] rounded-full border-0 px-[14px] text-[13px] font-bold text-white"
        >
          <ArrowDown size={14} aria-hidden />새 메시지
        </button>
      )}
    </div>
  );
}

/** b가 a에 이어지는 같은 사람의 메시지인지 (같은 묶음이면 이름·시각을 한 번만) */
function sameRun(
  a: ChatMessage | undefined,
  b: ChatMessage | undefined,
  isMine: (m: ChatMessage) => boolean,
) {
  if (!a || !b || a.status !== "VISIBLE" || b.status !== "VISIBLE") return false;
  if (isMine(a) !== isMine(b)) return false;
  if (!isMine(a) && a.authorNickname !== b.authorNickname) return false;
  const gap = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  return Math.abs(gap) <= GROUP_GAP_MS;
}

const menuBtn =
  "bg-surface border-line text-text-sub inline-flex min-h-[32px] cursor-pointer items-center gap-[4px] rounded-full border border-solid px-[10px] text-[13px] font-bold disabled:opacity-60";

function MessageItem({
  message: m,
  mine,
  first,
  last,
  showTime,
  canWrite,
  loggedIn,
  onReply,
  onLike,
  onDelete,
  onReport,
}: {
  message: ChatMessage;
  mine: boolean;
  /** 묶음의 첫 메시지: 이름과 말풍선 꼬리 */
  first: boolean;
  /** 묶음의 마지막 메시지: 시각 */
  last: boolean;
  showTime: boolean;
  canWrite: boolean;
  loggedIn: boolean;
  onReply: () => void;
  onLike: () => Promise<void>;
  onDelete: () => Promise<void>;
  onReport: (reason: ChatReportReason, detail?: string) => Promise<void>;
}) {
  const router = useRouter();
  // 좋아요·답장·삭제·신고는 말풍선이나 ⋯를 누르면 열려요 (PC는 마우스를 올리면 ⋯가 보여요)
  const [menu, setMenu] = useState(false);
  const [panel, setPanel] = useState<"none" | "delete" | "report">("none");
  const [reason, setReason] = useState<ChatReportReason>("AD");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const name = m.authorNickname ?? "이름 없음";

  const run = async (work: () => Promise<void>, done?: string) => {
    setBusy(true);
    setNote(null);
    try {
      await work();
      setPanel("none");
      setMenu(false);
      if (done) setNote(done);
    } catch (error) {
      setNote(chatErrorMessage(error));
      if (error instanceof ApiError && error.code === "CHAT_ALREADY_REPORTED") setPanel("none");
    } finally {
      setBusy(false);
    }
  };

  const like = () => (loggedIn ? void run(onLike) : router.push(routes.login));
  const likeOff = busy || (loggedIn && !canWrite);

  return (
    <article
      className={cn(
        "group flex flex-none flex-col",
        mine ? "items-end" : "items-start",
        first && "mt-[8px]",
      )}
    >
      {!mine && first && (
        <span className="text-text-sub mb-[4px] ml-[4px] text-[12px] font-bold">{name}</span>
      )}
      <div className={cn("flex w-full items-end gap-[6px]", mine && "flex-row-reverse")}>
        <div
          onClick={() => {
            // 글자를 고르는 중이면 메뉴를 열지 않아요
            if (window.getSelection()?.toString()) return;
            setMenu((v) => !v);
          }}
          className={cn(
            "max-w-[78%] min-w-0 cursor-pointer rounded-[18px] px-[13px] py-[8px]",
            mine ? "bg-brand-soft" : "bg-surface",
            first && (mine ? "rounded-tr-[6px]" : "rounded-tl-[6px]"),
          )}
        >
          {/* 화면 읽기: 이름이 위에 보이는 묶음 첫 메시지는 이름을 다시 읽지 않아요 */}
          {(mine || !first) && <span className="sr-only">{mine ? "내 메시지" : name}: </span>}
          {m.parent && (
            <span className="text-text-sub border-line mb-[4px] flex items-start gap-[4px] border-0 border-l-2 border-solid pl-[8px] text-[12px] leading-[1.5]">
              <CornerDownRight size={13} className="mt-[2px] flex-none" aria-hidden />
              <span className="line-clamp-1">
                {m.parent.status === "VISIBLE"
                  ? `${m.parent.authorNickname ?? "이름 없음"}: ${m.parent.content ?? ""}`
                  : hiddenText[m.parent.status]}
              </span>
            </span>
          )}
          <p className="text-text m-0 text-[15px] leading-[1.55] break-words whitespace-pre-wrap">
            {m.content}
          </p>
        </div>

        <div
          className={cn(
            "flex flex-none flex-col gap-[2px] pb-[2px]",
            mine ? "items-end" : "items-start",
          )}
        >
          {m.likeCount > 0 && (
            <button
              type="button"
              aria-pressed={m.likedByMe}
              aria-label={`좋아요 ${m.likeCount}개`}
              disabled={likeOff}
              onClick={like}
              className={cn(
                "inline-flex min-h-[20px] cursor-pointer items-center gap-[2px] border-0 bg-transparent p-0 text-[12px] font-bold disabled:cursor-default",
                m.likedByMe ? "text-brand-strong" : "text-text-tertiary",
              )}
            >
              <Heart size={12} fill={m.likedByMe ? "currentColor" : "none"} aria-hidden />
              {m.likeCount}
            </button>
          )}
          <span className={cn("flex items-center gap-[2px]", mine && "flex-row-reverse")}>
            {last && showTime && (
              <time
                dateTime={m.createdAt}
                className="text-text-tertiary text-[11px] whitespace-nowrap"
              >
                {chatClock(m.createdAt)}
              </time>
            )}
            <button
              type="button"
              aria-label="메시지 메뉴"
              aria-expanded={menu}
              onClick={() => setMenu((v) => !v)}
              className={cn(
                "text-text-tertiary inline-flex size-[24px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 transition-opacity",
                menu
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
              )}
            >
              <MoreHorizontal size={16} aria-hidden />
            </button>
          </span>
        </div>
      </div>

      {menu && (
        <div className={cn("mt-[4px] flex flex-wrap gap-[6px]", mine && "justify-end")}>
          <button
            type="button"
            aria-pressed={m.likedByMe}
            disabled={likeOff}
            onClick={like}
            className={cn(menuBtn, m.likedByMe && "text-brand-strong")}
          >
            <Heart size={14} fill={m.likedByMe ? "currentColor" : "none"} aria-hidden />
            좋아요
          </button>
          {canWrite && !m.parent && (
            <button
              type="button"
              onClick={() => {
                onReply();
                setMenu(false);
              }}
              className={menuBtn}
            >
              <CornerDownRight size={14} aria-hidden />
              답장
            </button>
          )}
          {mine ? (
            <button
              type="button"
              onClick={() => setPanel(panel === "delete" ? "none" : "delete")}
              className={menuBtn}
            >
              삭제
            </button>
          ) : (
            loggedIn && (
              <button
                type="button"
                aria-expanded={panel === "report"}
                onClick={() => setPanel(panel === "report" ? "none" : "report")}
                className={menuBtn}
              >
                신고
              </button>
            )
          )}
        </div>
      )}

      {panel === "delete" && (
        <div className="mt-[6px] flex items-center gap-[10px] text-[14px]">
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
        <div className="bg-surface rounded-tile mt-[6px] flex w-full max-w-[420px] flex-col gap-[8px] p-[12px]">
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
        <span role="status" className="text-text-sub mt-[4px] text-[13px]">
          {note}
        </span>
      )}
    </article>
  );
}

/** 입력칸. 쓰던 글(text)은 바깥(NoticeChat)이 들고 있어서 창을 닫았다 열어도 남아요 */
function Composer({
  text,
  onText,
  replyTo,
  onCancelReply,
  onSend,
}: {
  text: string;
  onText: (text: string) => void;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onSend: (content: string) => Promise<void>;
}) {
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

  // 한 줄에서 시작해 글이 길어지면 5줄까지 늘어나요
  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [text]);

  const submit = async () => {
    if (!content || length > MAX_LENGTH || sending || wait > 0) return;
    setSending(true);
    setError(null);
    try {
      await onSend(content);
      onText("");
    } catch (e) {
      if (e instanceof ApiError && e.code === "CHAT_RATE_LIMITED") setWait(e.retryAfter ?? 60);
      else setError(chatErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Esc는 답장 중이면 답장만 취소해요 (창은 닫지 않아요)
    if (e.key === "Escape" && replyTo && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onCancelReply();
      return;
    }
    // 한글 입력 중(조합 중) Enter는 글자 확정이라 보내지 않아요
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void submit();
    }
  };

  return (
    <div className="flex flex-col gap-[6px]">
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
      <div className="flex items-end gap-[8px]">
        <div className="border-line focus-within:border-brand bg-bg flex min-h-[44px] flex-1 items-center rounded-[22px] border border-solid px-[16px] py-[6px]">
          <textarea
            ref={input}
            rows={1}
            value={text}
            onChange={(e) => onText(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="메시지 보내기"
            placeholder="메시지 보내기"
            className="text-text placeholder:text-text-tertiary max-h-[120px] flex-1 resize-none border-0 bg-transparent p-0 text-[15px] leading-[1.5] outline-none"
          />
        </div>
        <button
          type="button"
          disabled={!content || length > MAX_LENGTH || sending || wait > 0}
          onClick={() => void submit()}
          aria-label="보내기"
          className="bg-brand inline-flex size-[44px] flex-none cursor-pointer items-center justify-center rounded-full border-0 text-white disabled:opacity-40"
        >
          <Send size={18} aria-hidden />
        </button>
      </div>
      {(wait > 0 || error || length > COUNT_FROM) && (
        <div className="flex items-center gap-[8px] px-[4px] text-[12px]">
          {(wait > 0 || error) && (
            <span role="alert" className="text-danger-text flex-1">
              {wait > 0
                ? `메시지는 1분에 5개까지 보낼 수 있어요. ${wait}초 뒤 다시 보내 주세요`
                : error}
            </span>
          )}
          {length > COUNT_FROM && (
            <span
              className={cn(
                "ml-auto",
                length > MAX_LENGTH ? "text-danger-text font-bold" : "text-text-tertiary",
              )}
            >
              {length}/{MAX_LENGTH}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
