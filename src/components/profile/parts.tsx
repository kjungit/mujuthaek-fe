"use client";

import { SelectChip } from "@/components/ui/Chip";
import type { ProfileForm } from "@/features/profile/useProfileForm";
import { cn } from "@/lib/cn";

export const pLabel = "flex flex-col gap-[8px] text-[15px] font-bold";
export const pInput =
  "rounded-control border border-solid border-line bg-surface text-text min-h-[56px] min-w-0 px-[16px] text-[17px] font-medium";
export const pSelect =
  "rounded-control border border-solid border-line bg-surface text-text min-h-[56px] min-w-0 px-[14px] text-[17px]";

/** 단위가 오른쪽 안에 있는 입력칸 */
export function UnitInput({
  unit,
  placeholder,
  className,
  describedBy,
}: {
  unit: string;
  placeholder: string;
  className?: string;
  describedBy?: string;
}) {
  return (
    <span className="relative flex">
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        aria-describedby={describedBy}
        className={cn(pInput, "flex-1", unit.length > 1 ? "pr-[60px]" : "pr-[44px]", className)}
      />
      <span className="text-text-sub pointer-events-none absolute top-1/2 right-[16px] -translate-y-1/2 text-[16px] font-semibold">
        {unit}
      </span>
    </span>
  );
}

/** 자녀 수 − / + */
export function KidsStepper({ form, className }: { form: ProfileForm; className?: string }) {
  const btn = "bg-fill text-text size-[44px] cursor-pointer rounded-[10px] border-0 text-[20px]";
  return (
    <div
      className={cn(
        "rounded-control border-line flex min-h-[56px] items-center justify-between border border-solid px-[6px]",
        className,
      )}
    >
      <button type="button" aria-label="자녀 수 줄이기" onClick={form.kidsDown} className={btn}>
        −
      </button>
      <span aria-live="polite" className="text-[18px] font-extrabold">
        {form.kids}명
      </span>
      <button type="button" aria-label="자녀 수 늘리기" onClick={form.kidsUp} className={btn}>
        +
      </button>
    </div>
  );
}

/** 2px 테두리 선택 칩 묶음 */
export function ChipGroup<K extends string>({
  label,
  options,
  value,
  onPick,
  className,
  chipClassName,
}: {
  label: string;
  options: { key: K; label: string }[];
  value: K;
  onPick: (k: K) => void;
  className?: string;
  chipClassName?: string;
}) {
  return (
    <div role="group" aria-label={label} className={cn("grid gap-[8px]", className)}>
      {options.map((o) => (
        <SelectChip
          key={o.key}
          selected={value === o.key}
          onClick={() => onPick(o.key)}
          className={chipClassName}
        >
          {o.label}
        </SelectChip>
      ))}
    </div>
  );
}

/** 살 곳을 고를 때 중요한 것 (알약 칩, 여러 개) */
export function PriorityChips({
  form,
  chipClassName,
}: {
  form: ProfileForm;
  chipClassName?: string;
}) {
  return (
    <div role="group" aria-label="우선순위" className="flex flex-wrap gap-[8px]">
      {form.data.options.priorities.map((p) => (
        <SelectChip
          key={p}
          selected={form.prios.includes(p)}
          onClick={() => form.togglePrio(p)}
          className={cn("rounded-pill min-h-[44px] px-[18px] text-[15px]", chipClassName)}
        >
          {p}
        </SelectChip>
      ))}
    </div>
  );
}
