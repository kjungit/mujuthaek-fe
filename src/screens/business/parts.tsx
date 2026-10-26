import { Building, Store, Users, type LucideIcon } from "lucide-react";
import { Badge, verdictLabel } from "@/components/ui/Badge";
import { FilterChip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import type { SpaceItem, SpaceType, SupportStatus } from "@/mocks/business";

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
      {options.map((o) => (
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
