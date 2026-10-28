"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Heart, Lock, User } from "lucide-react";
import { ContactEmailCard } from "@/components/auth/ContactEmailParts";
import { WebHeader } from "@/components/layout/WebHeader";
import { WebPage } from "@/components/layout/Responsive";
import { Toggle } from "@/components/ui/Toggle";
import { usePush } from "@/features/alerts/usePush";
import { daysLeft } from "@/features/conditions/format";
import { DEVICE_TTL_MS, clearConditions, setSaveOnDevice } from "@/features/conditions/store";
import { useConditionSummary } from "@/features/conditions/useConditionSummary";
import { useMe } from "@/features/me/queries";
import { cn } from "@/lib/cn";
import { useLogout, useSession } from "@/features/auth/session";
import { routes } from "@/lib/routes";
import type { MeChannelKey, MeNotifKey } from "@/mocks/me";

type Tab = "cond" | "fav" | "notif" | "privacy" | "report";

const titles: Record<Tab, string> = {
  cond: "내 조건",
  fav: "관심 공고",
  notif: "알림 설정",
  privacy: "개인정보 설정",
  report: "제보하기",
};

const notifRows: { key: MeNotifKey; label: string; desc: string }[] = [
  { key: "newPost", label: "새 공고", desc: "내 조건에 맞는 공고가 나오면" },
  { key: "d3", label: "마감 3일 전", desc: "관심 공고 마감 3일 전" },
  { key: "d1", label: "마감 1일 전", desc: "관심 공고 마감 하루 전" },
  { key: "start", label: "신청 시작", desc: "받을 수 있는 혜택 신청이 열리면" },
  { key: "change", label: "혜택 · 기준 변경", desc: "금액이나 기준이 바뀌어 판정이 달라지면" },
  { key: "notice", label: "공지", desc: "새 기능과 서비스 소식" },
];

const channelRows: { key: MeChannelKey; label: string }[] = [
  { key: "push", label: "브라우저 · 앱 알림" },
  { key: "email", label: "이메일" },
  { key: "kakao", label: "카카오 알림톡" },
];

const supportLinks = [
  { label: "공지사항", href: routes.announcements },
  { label: "자주 묻는 질문", href: routes.faq },
  { label: "이용약관", href: routes.terms },
  { label: "개인정보처리방침", href: routes.privacy, strong: true },
];

/** 2px 테두리 선택 칩 */
const outlineChip = (on: boolean) =>
  cn(
    "rounded-pill min-h-[44px] cursor-pointer border-2 border-solid text-[15px] font-bold",
    on ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-text",
  );

const grayButton =
  "bg-fill text-text min-h-[48px] cursor-pointer rounded-sm border-0 px-[16px] text-[15px] font-bold";

const selectCls =
  "border-line bg-surface text-text min-h-[44px] rounded-sm border border-solid px-[12px] text-[15px]";

export function WebMe() {
  const logout = useLogout();
  const router = useRouter();
  const { data } = useMe();
  const { data: session } = useSession();
  const push = usePush();
  const [tab, setTab] = useState<Tab>("cond");
  const conditions = useConditionSummary();
  const saveOnDevice = conditions.status === "ready" ? conditions.saveOnDevice : true;
  const deviceStatus =
    conditions.status !== "ready" || !conditions.hasConditions
      ? "없음"
      : conditions.savedAt
        ? `이 기기 · ${daysLeft(conditions.savedAt, DEVICE_TTL_MS)}일 뒤 삭제`
        : "이번 탭에서만";
  const [favIds, setFavIds] = useState(() => data.favorites.map((f) => f.id));
  const [notif, setNotif] = useState(data.notif);
  const [channels, setChannels] = useState(data.channels);
  const [reportKind, setReportKind] = useState(data.report.kinds[0]);
  const [reported, setReported] = useState(false);

  const favs = data.favorites.filter((f) => favIds.includes(f.id));

  const toggleChannel = async (key: MeChannelKey) => {
    const next = !channels[key];
    setChannels((c) => ({ ...c, [key]: next }));
    if (key !== "push") return;
    // 브라우저 알림은 이 브라우저의 푸시 구독도 함께 켜고 꺼요
    if (next) {
      const ok = await push.turnOn();
      if (!ok) setChannels((c) => ({ ...c, push: false }));
    } else {
      await push.turnOff();
    }
  };

  const menu: { key: Tab; label: string; count: string }[] = [
    { key: "cond", label: "내 조건", count: "" },
    { key: "fav", label: "관심 공고", count: `${favs.length}개` },
    { key: "notif", label: "알림 설정", count: "" },
    { key: "privacy", label: "개인정보 설정", count: "" },
    { key: "report", label: "제보하기", count: "" },
  ];

  return (
    <WebPage>
      <WebHeader mode="home" active="me" unread={3} />
      <main className="mx-auto box-border flex w-full max-w-[1200px] flex-1 flex-wrap items-start gap-[24px] px-[32px] pt-[40px] pb-[72px]">
        <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-[16px]">
          <section
            aria-label="계정"
            className="rounded-card bg-surface flex flex-col gap-[14px] p-[22px]"
          >
            <div className="flex items-center gap-[12px]">
              <span className="rounded-pill bg-brand-soft text-brand flex size-[52px] flex-none items-center justify-center">
                <User size={26} strokeWidth={1.8} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col gap-[2px]">
                <span className="text-[18px] font-extrabold">{data.account.name}</span>
                <span className="text-text-sub truncate text-[14px]">
                  {session?.email ?? "연락용 이메일 없음"}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="rounded-badge bg-fill text-text-sub px-[10px] py-[5px] text-[13px] font-semibold">
                {data.account.provider}로 로그인
              </span>
              <button
                type="button"
                onClick={() => void logout().then(() => router.push(routes.main))}
                className="text-text-sub hover:text-text-sub inline-flex min-h-[44px] cursor-pointer items-center border-0 bg-transparent p-0 text-[14px] font-semibold"
              >
                로그아웃
              </button>
            </div>
          </section>

          <nav
            aria-label="내 정보 메뉴"
            className="rounded-card bg-surface flex flex-col gap-[2px] p-[8px]"
          >
            {menu.map((m) => {
              const on = m.key === tab;
              return (
                <button
                  key={m.key}
                  type="button"
                  aria-current={on ? "page" : undefined}
                  onClick={() => setTab(m.key)}
                  className={cn(
                    "rounded-control flex min-h-[52px] cursor-pointer items-center justify-between gap-[8px] border-0 px-[14px] text-left",
                    on ? "bg-brand-soft text-brand-strong" : "text-text bg-transparent",
                  )}
                >
                  <span className={cn("text-[16px]", on ? "font-extrabold" : "font-semibold")}>
                    {m.label}
                  </span>
                  <span className="text-text-sub text-[14px]">{m.count}</span>
                </button>
              );
            })}
          </nav>

          <nav
            aria-label="고객센터"
            className="rounded-card bg-surface flex flex-col gap-[2px] p-[8px]"
          >
            {supportLinks.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={cn(
                  "rounded-control text-text hover:text-text flex min-h-[48px] items-center justify-between px-[14px] text-[15px] no-underline",
                  l.strong ? "font-bold" : "font-medium",
                )}
              >
                {l.label}
                <ChevronRight size={16} className="text-text-tertiary" aria-hidden />
              </Link>
            ))}
          </nav>
        </div>

        <section
          aria-label={titles[tab]}
          className="rounded-card-lg bg-surface flex min-w-0 flex-[999_1_600px] flex-col gap-[22px] p-[30px]"
        >
          <div className="flex items-center justify-between gap-[12px]">
            <h1 className="tracking-h1 m-0 text-[26px] font-extrabold">{titles[tab]}</h1>
            {tab === "cond" && (
              <Link
                href={routes.profile}
                className="bg-fill text-text hover:text-text inline-flex min-h-[44px] items-center gap-[4px] rounded-sm px-[14px] text-[15px] font-bold no-underline"
              >
                조건 수정
              </Link>
            )}
          </div>

          {tab === "cond" && (
            <div className="flex flex-col gap-[16px]">
              {conditions.status === "ready" && !conditions.hasConditions ? (
                <span className="rounded-tile bg-bg text-text-sub px-[16px] py-[18px] text-[15px]">
                  아직 입력한 조건이 없어요. 조건을 입력하면 이 기기에 저장해 둘게요.
                </span>
              ) : (
                <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[10px]">
                  {conditions.status === "ready" &&
                    conditions.rows.map((c) => (
                      <div key={c.k} className="rounded-tile bg-bg px-[16px] py-[14px]">
                        <dt className="text-text-sub text-[13px]">{c.k}</dt>
                        <dd
                          className={cn(
                            "m-0 mt-[4px] text-[16px] font-bold",
                            c.muted ? "text-text-sub" : "text-text",
                          )}
                        >
                          {c.v}
                        </dd>
                      </div>
                    ))}
                </dl>
              )}
              <span className="text-text-sub inline-flex items-center gap-[6px] text-[14px]">
                <Lock size={16} aria-hidden />
                소득·자산은 저장하지 않아요. 판정할 때만 입력해요
              </span>
            </div>
          )}

          {tab === "fav" && (
            <div className="flex flex-col">
              {favs.map((f) => (
                <div
                  key={f.id}
                  className="border-line-soft flex items-center gap-[14px] border-b border-solid py-[16px]"
                >
                  <Link
                    href={routes.notice(f.id)}
                    className="text-text hover:text-text flex min-w-0 flex-1 flex-col gap-[3px] no-underline"
                  >
                    <span className="text-[17px] font-bold">{f.title}</span>
                    <span className="text-text-sub text-[14px]">{f.meta}</span>
                  </Link>
                  <span
                    className={cn(
                      "rounded-badge flex-none px-[10px] py-[5px] text-[13px] font-extrabold",
                      f.urgent ? "bg-text text-white" : "bg-fill text-text-sub",
                    )}
                  >
                    {f.dday}
                  </span>
                  <button
                    type="button"
                    aria-label={`${f.title} 관심 해제`}
                    onClick={() => setFavIds((ids) => ids.filter((x) => x !== f.id))}
                    className="bg-fill text-brand flex size-[44px] flex-none cursor-pointer items-center justify-center rounded-sm border-0"
                  >
                    <Heart size={20} fill="currentColor" aria-hidden />
                  </button>
                </div>
              ))}
              {favs.length === 0 && (
                <div className="flex flex-col items-center gap-[12px] py-[40px] text-center">
                  <span className="text-[17px] font-bold">관심 공고가 없어요</span>
                  <Link
                    href={routes.homes}
                    className="bg-brand inline-flex min-h-[48px] items-center rounded-sm px-[18px] text-[15px] font-bold text-white no-underline hover:text-white"
                  >
                    공고 보러 가기
                  </Link>
                </div>
              )}
            </div>
          )}

          {tab === "notif" && (
            <div className="flex flex-col gap-[22px]">
              <div className="flex flex-col">
                {notifRows.map((n) => (
                  <div
                    key={n.key}
                    className="border-line-soft flex items-center justify-between gap-[16px] border-b border-solid py-[14px]"
                  >
                    <span className="flex flex-col gap-[2px]">
                      <span className="text-[16px] font-bold">{n.label}</span>
                      <span className="text-text-sub text-[14px]">{n.desc}</span>
                    </span>
                    <Toggle
                      checked={notif[n.key]}
                      onChange={(v) => setNotif((s) => ({ ...s, [n.key]: v }))}
                      label={n.label}
                    />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-[10px]">
                <span className="text-[16px] font-extrabold">받는 방법</span>
                <div role="group" aria-label="받는 방법" className="flex flex-wrap gap-[8px]">
                  {channelRows.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      aria-pressed={channels[c.key]}
                      onClick={() => void toggleChannel(c.key)}
                      className={cn(outlineChip(channels[c.key]), "px-[18px]")}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-[10px]">
                <span className="mr-[6px] text-[16px] font-extrabold">방해 금지</span>
                <select aria-label="시작 시각" className={selectCls}>
                  {data.quiet.startOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <span className="text-text-sub">부터</span>
                <select aria-label="끝 시각" className={selectCls}>
                  {data.quiet.endOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <span className="text-text-sub">까지</span>
              </div>
            </div>
          )}

          {tab === "privacy" && (
            <div className="flex flex-col gap-[16px]">
              <div className="bg-brand-soft flex items-center justify-between gap-[16px] rounded-[20px] px-[22px] py-[20px]">
                <span className="flex flex-col gap-[4px]">
                  <span className="text-brand-strong text-[17px] font-extrabold">
                    이 기기에 조건 저장
                  </span>
                  <span className="text-brand-strong text-[14px] leading-[1.6]">
                    {saveOnDevice
                      ? "나이·지역·가족·주택 조건을 30일 동안 이 기기에만 저장해요"
                      : "이 기기에 저장하지 않아요. 탭을 닫으면 입력한 조건이 지워져요"}
                  </span>
                </span>
                <Toggle
                  checked={saveOnDevice}
                  onChange={setSaveOnDevice}
                  label="이 기기에 조건 저장"
                />
              </div>
              <ContactEmailCard className="border-line-soft border-b border-solid pb-[16px]" />
              <div className="flex flex-col">
                <span className="mb-[4px] text-[16px] font-extrabold">저장된 정보</span>
                <div className="border-line-soft flex justify-between gap-[12px] border-b border-solid py-[12px] text-[15px]">
                  <span>나이 · 지역 · 가족 · 주택 조건</span>
                  <span className="font-bold">{deviceStatus}</span>
                </div>
                <div className="border-line-soft flex justify-between gap-[12px] border-b border-solid py-[12px] text-[15px]">
                  <span>소득 · 자산 · 순위 세부 조건</span>
                  <span className="text-brand-strong font-bold">저장 안 함</span>
                </div>
                <div className="border-line-soft flex justify-between gap-[12px] border-b border-solid py-[12px] text-[15px]">
                  <span>관심 공고 · 알림 설정</span>
                  <span className="font-bold">계정에 저장</span>
                </div>
                <div className="flex justify-between gap-[12px] py-[12px] text-[15px]">
                  <span>연락용 이메일 (선택)</span>
                  <span className="font-bold">{session?.email ? "계정에 저장" : "없음"}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-[8px]">
                <button type="button" className={grayButton}>
                  내 데이터 내려받기
                </button>
                <button
                  type="button"
                  onClick={clearConditions}
                  disabled={!conditions.hasConditions}
                  className={cn(grayButton, "disabled:text-text-sub disabled:cursor-default")}
                >
                  저장한 조건 모두 지우기
                </button>
              </div>
              <button
                type="button"
                className="text-danger-link inline-flex min-h-[44px] cursor-pointer items-center self-start border-0 bg-transparent p-0 text-[14px] font-bold"
              >
                회원 탈퇴
              </button>
            </div>
          )}

          {tab === "report" && (
            <div className="flex flex-col gap-[18px]">
              {!reported ? (
                <div className="flex flex-col gap-[18px]">
                  <span className="text-text-sub text-[15px] leading-[1.6]">
                    빠진 정책이나 틀린 판정을 알려주시면 확인해서 반영해요. 보통 영업일 기준 3일
                    안에 답을 드려요.
                  </span>
                  <label className="flex flex-col gap-[8px] text-[15px] font-bold">
                    어떤 것에 대한 제보인가요?
                    <select className="rounded-control border-line bg-surface text-text min-h-[52px] border border-solid px-[14px] text-[16px] font-medium">
                      {data.report.targets.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </label>
                  <div className="flex flex-col gap-[8px]">
                    <span className="text-[15px] font-bold">무엇이 틀렸나요?</span>
                    <div role="group" aria-label="틀린 항목" className="flex flex-wrap gap-[8px]">
                      {data.report.kinds.map((k) => (
                        <button
                          key={k}
                          type="button"
                          aria-pressed={k === reportKind}
                          onClick={() => setReportKind(k)}
                          className={cn(outlineChip(k === reportKind), "px-[16px]")}
                        >
                          {k}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="flex flex-col gap-[8px] text-[15px] font-bold">
                    자세히 알려주세요
                    <textarea
                      rows={4}
                      placeholder="예: 소득 기준이 공고문 4쪽에는 100%인데 70%로 나와요"
                      className="rounded-control border-line bg-surface text-text resize-y border border-solid px-[16px] py-[14px] text-[16px] font-medium"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setReported(true)}
                    className="rounded-control bg-brand min-h-[52px] cursor-pointer self-start border-0 px-[24px] text-[16px] font-extrabold text-white"
                  >
                    제보 보내기
                  </button>
                </div>
              ) : (
                <div
                  role="status"
                  className="bg-brand-soft flex flex-col items-start gap-[10px] rounded-[20px] p-[28px]"
                >
                  <span className="text-brand-strong text-[19px] font-extrabold">
                    제보 고마워요
                  </span>
                  <span className="text-brand-strong text-[15px] leading-[1.6]">
                    확인한 뒤 알림으로 결과를 알려드릴게요.
                  </span>
                  <button
                    type="button"
                    onClick={() => setReported(false)}
                    className="text-brand-strong min-h-[44px] cursor-pointer rounded-sm border-0 bg-white px-[16px] text-[15px] font-bold"
                  >
                    다른 제보하기
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </WebPage>
  );
}
