"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MBackHeader } from "@/components/layout/MBackHeader";
import { industryGroups, needOptions } from "@/features/business/profile";
import { useBizOnboardingForm } from "@/features/business/state";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { applicantTypes, stageOptions } from "./onboarding";

const control =
  "rounded-control border-line text-text min-h-[54px] border border-solid text-[16px]";
const pickTone = (on: boolean) =>
  on ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-text";

function NumField({
  label,
  placeholder,
  disabled,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  disabled: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-[8px] text-[15px] font-bold">
      {label}
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
        value={disabled ? "" : value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d,]/g, ""))}
        className={cn(control, "bg-surface box-content min-w-0 px-[14px] font-normal")}
      />
    </label>
  );
}

export function MBizOnboarding() {
  const f = useBizOnboardingForm();
  const { draft, stage, setStage, pre, needs, toggleNeed, preview } = f;
  const router = useRouter();
  const done = () => {
    f.save();
    router.push(routes.business);
  };

  return (
    <div className="bg-surface text-text flex min-h-screen w-full flex-col">
      <MBackHeader title="사업 정보 입력" backHref={routes.business} />
      <main className="flex flex-1 flex-col gap-[22px] px-[20px] pt-[20px] pb-[24px]">
        <div className="flex flex-col gap-[6px]">
          <h2 className="tracking-h1 m-0 text-[24px] font-extrabold">사업 정보를 알려주세요</h2>
          <span className="text-text-sub text-[15px] leading-[1.6]">
            창업 공간과 사업 지원을 내 조건으로 판정해요
          </span>
        </div>

        <div className="bg-bg rounded-tile flex items-center justify-between gap-[10px] px-[16px] py-[14px]">
          <span className="flex flex-col gap-[2px]">
            <span className="text-text-sub text-[12px] font-semibold">
              공통 정보 · 주거와 함께 써요
            </span>
            <span className="text-[15px] font-bold">{f.common ?? "나이 · 사는 곳 입력 전"}</span>
          </span>
          <Link
            href={routes.profile}
            className="text-brand-strong hover:text-brand-strong inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
          >
            수정
          </Link>
        </div>

        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-bold">창업 상태</span>
          <div role="group" aria-label="창업 상태" className="grid grid-cols-2 gap-[8px]">
            {stageOptions.mobile.map((o) => (
              <button
                key={o.key}
                type="button"
                aria-pressed={stage === o.key}
                onClick={() => setStage(o.key)}
                className={cn(
                  "rounded-tile flex min-h-[68px] cursor-pointer flex-col gap-[2px] border-2 border-solid px-[14px] py-[12px] text-left",
                  pickTone(stage === o.key),
                )}
              >
                <span className="text-[16px] font-extrabold">{o.label}</span>
                <span className="text-text-sub text-[12px] font-medium">{o.sub}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-[8px] text-[15px] font-bold">
          업종
          <select
            value={draft.industry}
            onChange={(e) => f.set({ industry: e.target.value })}
            className={cn(control, "bg-surface px-[12px] font-medium")}
          >
            <option value="">업종 선택</option>
            {industryGroups.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.items.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>

        {!pre && (
          <div className="flex flex-col gap-[8px]">
            <span className="text-[15px] font-bold">사업자 형태</span>
            <div role="group" aria-label="사업자 형태" className="grid grid-cols-2 gap-[8px]">
              {applicantTypes.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  aria-pressed={draft.applicantType === o.key}
                  onClick={() =>
                    f.set({ applicantType: draft.applicantType === o.key ? "" : o.key })
                  }
                  className={cn(
                    "rounded-tile min-h-[48px] cursor-pointer border-2 border-solid px-[14px] text-[15px] font-extrabold",
                    pickTone(draft.applicantType === o.key),
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={cn("flex flex-col gap-[8px]", pre && "opacity-45")}>
          <div className="grid grid-cols-2 gap-[8px]">
            <NumField
              label="업력"
              placeholder="개월"
              disabled={pre}
              value={draft.months}
              onChange={(v) => f.set({ months: v })}
            />
            <NumField
              label="직원 수"
              placeholder="명"
              disabled={pre}
              value={draft.employees}
              onChange={(v) => f.set({ employees: v })}
            />
          </div>
          <NumField
            label="연 매출"
            placeholder="만 원"
            disabled={pre}
            value={f.revenue}
            onChange={f.setRevenue}
          />
        </div>
        <span className="text-text-sub -mt-[12px] text-[13px]">
          {pre
            ? "예비 창업이면 업력 · 직원 수 · 매출은 입력하지 않아요"
            : "업력은 사업자등록일부터 세요 · 매출은 저장하지 않아요 · 직원 수는 참고용"}
        </span>

        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-bold">{pre ? "희망 지역" : "사업장 소재지"}</span>
          <div className="grid grid-cols-2 gap-[8px]">
            <select
              aria-label="시·도"
              value={f.sidoCode}
              onChange={(e) => f.set({ regionCode: e.target.value })}
              className={cn(control, "bg-surface px-[12px]")}
            >
              <option value="">시·도</option>
              {f.sidos.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.shortName}
                </option>
              ))}
            </select>
            <select
              aria-label="시·군·구"
              value={draft.regionCode.length === 5 ? draft.regionCode : ""}
              onChange={(e) => f.set({ regionCode: e.target.value || f.sidoCode })}
              disabled={!f.sidoCode}
              className={cn(control, "bg-surface px-[12px] disabled:opacity-50")}
            >
              <option value="">{f.sidoCode ? "전체" : "시·군·구"}</option>
              {f.sigungus.map((o) => (
                <option key={o.code} value={o.code}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-bold">필요한 공간</span>
          <div role="group" aria-label="필요한 공간" className="flex flex-wrap gap-[8px]">
            {needOptions.map((n) => (
              <button
                key={n.key}
                type="button"
                aria-pressed={needs.includes(n.key)}
                onClick={() => toggleNeed(n.key)}
                className={cn(
                  "rounded-pill min-h-[44px] cursor-pointer border-2 border-solid px-[16px] text-[15px] font-bold",
                  pickTone(needs.includes(n.key)),
                )}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      </main>
      <div className="border-line bg-surface sticky bottom-0 flex flex-col gap-[4px] border-t border-solid px-[16px] pt-[10px] pb-[28px]">
        <span className="text-text-sub text-center text-[13px]" aria-live="polite">
          지금 조건으로 공간 {preview.spaces}곳 · 사업 지원 {preview.support}개
        </span>
        <button
          type="button"
          onClick={done}
          className="rounded-control bg-brand flex min-h-[56px] cursor-pointer items-center justify-center border-0 text-[17px] font-extrabold text-white"
        >
          저장하고 결과 보기
        </button>
      </div>
    </div>
  );
}
