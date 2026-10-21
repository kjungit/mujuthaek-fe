import { Building, Store, Users, type LucideIcon } from "lucide-react";
import { Badge, verdictLabel } from "@/components/ui/Badge";
import { FilterChip } from "@/components/ui/Chip";
import { cn } from "@/lib/cn";
import type { SpaceType, SupportStatus } from "@/mocks/business";

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
