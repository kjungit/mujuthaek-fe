import Link from "next/link";
import { Building, Store, Users, type LucideIcon } from "lucide-react";
import { Badge, verdictLabel } from "@/components/ui/Badge";
import { FilterChip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { SpaceItem, SpaceRule, SpaceType, SupportStatus } from "@/mocks/business";

/** 공간 카드 링크: 상세 화면이 없는 공간(모집 정책)은 원문을 새 탭으로 */
export const spaceLink = (it: SpaceItem) =>
  it.externalUrl
    ? { href: it.externalUrl, target: "_blank", rel: "noreferrer" }
    : { href: routes.space(it.id) };

export const spaceIcon: Record<SpaceType, LucideIcon> = {
  startup: Building,
  shop: Store,
  room: Users,
};

/** 창업 공간은 연한 초록, 나머지는 이미지 자리 회색 */
export const spaceThumb = (type: SpaceType) =>
  type === "startup" ? "bg-brand-soft text-brand" : "bg-placeholder-bg text-placeholder-icon";

export const spaceFilters = (mobile: boolean) =>
  [
    { key: "all", label: "전체" },
    { key: "startup", label: "창업 공간" },
    { key: "shop", label: "공공 상가" },
    { key: "room", label: mobile ? "회의실" : "회의실 대관" },
  ] as const;

export const supportFilters = (mobile: boolean) =>
  [
    { key: "all", label: "전체" },
    { key: "fund", label: mobile ? "지원금" : "창업 지원금" },
    { key: "loan", label: "정책자금" },
    { key: "tax", label: "세금 감면" },
  ] as const;

/** 판정 배지 두 가지 + 판정이 아닌 상태(회색) */
export function SupportBadge({
  status,
  className,
  size,
}: {
  status: SupportStatus;
  className?: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  return status === "afterStart" ? (
    <Badge tone="neutral" size={size} className={className}>
      창업 후 신청
    </Badge>
  ) : (
    <Badge tone={status} size={size} className={className}>
      {verdictLabel[status]}
    </Badge>
  );
}

type FilterOption<K extends string> = { readonly key: K; readonly label: string };

/** 종류 필터 칩 묶음 (회색 페이지 위) */
export function TypeFilters<K extends string>({
  label,
  options,
  value,
  onChange,
  count,
  mobile,
  className,
  id,
}: {
  label: string;
  options: readonly FilterOption<K>[];
  value: K;
  onChange: (key: K) => void;
  count: (key: K) => number;
  mobile?: boolean;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} role="group" aria-label={label} className={cn("flex gap-[6px]", className)}>
      {/* 0건인 종류는 숨겨요 (전체와 지금 고른 것은 늘 보여요) */}
      {options
        .filter((o) => o.key === "all" || o.key === value || count(o.key) > 0)
        .map((o) => (
          <FilterChip
            key={o.key}
            selected={value === o.key}
            onClick={() => onChange(o.key)}
            className={cn("font-bold", mobile && "flex-none px-[14px]")}
          >
            {mobile ? (
              `${o.label} ${count(o.key)}`
            ) : (
              <span>
                {o.label} <span className="font-semibold opacity-80">{count(o.key)}</span>
              </span>
            )}
          </FilterChip>
        ))}
    </div>
  );
}

/** 목록 지역: 사업 정보의 지역 기준 / 전국. 사업 정보에 지역이 없으면 안 보여요 */
export function RegionScopeChips({
  scope,
  className,
}: {
  scope: { label: string | null; nationwide: boolean; setNationwide: (v: boolean) => void };
  className?: string;
}) {
  if (!scope.label) return null;
  return (
    <div role="group" aria-label="지역" className={cn("flex flex-wrap gap-[6px]", className)}>
      <FilterChip selected={!scope.nationwide} onClick={() => scope.setNationwide(false)}>
        {scope.label} 기준
      </FilterChip>
      <FilterChip selected={scope.nationwide} onClick={() => scope.setNationwide(true)}>
        전국
      </FilterChip>
    </div>
  );
}

/** 질문형 조건 답하기: 예 · 아니요 (다시 누르면 답을 지워요) */
export function AnswerButtons({
  questionId,
  answer,
  onAnswer,
}: {
  questionId: string;
  answer?: "YES" | "NO";
  onAnswer: (questionId: string, value: "YES" | "NO") => void;
}) {
  return (
    <span role="group" aria-label="답하기" className="flex flex-none gap-[6px]">
      {(["YES", "NO"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={answer === v}
          onClick={() => onAnswer(questionId, v)}
          className={cn(
            "min-h-[40px] cursor-pointer rounded-[10px] border-0 px-[14px] text-[14px] font-bold",
            answer === v ? "bg-text text-white" : "bg-fill text-text-sub",
          )}
        >
          {v === "YES" ? "예" : "아니요"}
        </button>
      ))}
    </span>
  );
}

/** 공고 안내: 출처가 준 요약 · 기관 · 문의처 · 접수 방법 · 링크 (모집 정책 · 사업 지원) */
export function AboutSection({
  about,
  web,
}: {
  about: { summary?: string; rows: { label: string; value: string; href?: string }[] };
  web?: boolean;
}) {
  return (
    <section
      aria-labelledby="about-h"
      className={cn(
        "bg-surface flex flex-col",
        web
          ? "rounded-card-lg gap-[14px] px-[32px] py-[28px]"
          : "rounded-card mx-[16px] gap-[10px] px-[20px] py-[16px]",
      )}
    >
      <h2
        id="about-h"
        className={cn("m-0 font-extrabold", web ? "tracking-title text-[22px]" : "text-[17px]")}
      >
        공고 안내
      </h2>
      {about.summary && (
        <p className="m-0 text-[15px] leading-[1.7] whitespace-pre-line">{about.summary}</p>
      )}
      {about.rows.length > 0 && (
        <dl className="m-0 flex flex-col">
          {about.rows.map((r, i) => (
            <div
              key={r.label}
              className={cn(
                "flex flex-wrap justify-between gap-x-[16px] gap-y-[4px] py-[10px] text-[15px]",
                i < about.rows.length - 1 && "border-line-soft border-b border-solid",
              )}
            >
              <dt className="text-text-sub">{r.label}</dt>
              <dd className="m-0 font-bold whitespace-pre-line">
                {r.href ? (
                  <a href={r.href} target="_blank" rel="noreferrer">
                    {r.value}
                  </a>
                ) : (
                  r.value
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
      <span className="text-text-tertiary text-[12px]">
        출처 사이트가 준 정보를 그대로 옮겼어요 · 정확한 내용은 공고 원문을 확인해 주세요
      </span>
    </section>
  );
}

/** 자격 조건 한 줄의 결과 (웹·모바일 공통): 질문이면 예 · 아니요, 아니면 충족 · 해당 안 돼요 · 확인 필요(사업 정보 입력으로).
 * 오른쪽 칸: 질문이면 예 · 아니요, 아니면 결과 (확인 필요면 사업 정보 입력으로) */
export function RuleAction({
  r,
  onAnswer,
}: {
  r: SpaceRule;
  onAnswer?: (questionId: string, value: "YES" | "NO") => void;
}) {
  if (r.questionId && onAnswer)
    return <AnswerButtons questionId={r.questionId} answer={r.answer} onAnswer={onAnswer} />;
  if (r.met) return <span className="text-ok-text flex-none text-[14px] font-bold">충족</span>;
  if (r.notMet)
    return <span className="text-text-sub flex-none text-[14px] font-bold">해당 안 돼요</span>;
  if (r.options)
    return <span className="text-check-text flex-none text-[14px] font-bold">확인 필요</span>;
  return (
    <Link
      href={routes.bizOnboarding}
      className="bg-check-bg text-check-text hover:text-check-text inline-flex min-h-[40px] flex-none items-center rounded-[10px] px-[12px] text-[14px] font-bold no-underline"
    >
      확인 필요 · 입력
    </Link>
  );
}
