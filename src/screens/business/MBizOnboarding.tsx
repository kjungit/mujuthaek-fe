"use client";

import Link from "next/link";
import { MBackHeader } from "@/components/layout/MBackHeader";
import { useBizOnboardingForm } from "@/features/business/state";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { stageOptions } from "./onboarding";

const control =
  "rounded-control border-line text-text min-h-[54px] border border-solid text-[16px]";
const pickTone = (on: boolean) =>
  on ? "border-brand bg-brand-soft text-brand-strong" : "border-line bg-surface text-text";

// 모바일은 선택지를 줄여 보여줘요
const M_INDUSTRY_COUNT = 3;
const M_PROVINCE_COUNT = 2;
const M_DISTRICT_COUNT = 1;

function NumField({
  label,
  placeholder,
  disabled,
}: {
  label: string;
  placeholder: string;
  disabled: boolean;
}) {
  return (
    <label className="flex flex-col gap-[8px] text-[15px] font-bold">
      {label}
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        disabled={disabled}
        className={cn(control, "bg-surface box-content min-w-0 px-[14px] font-normal")}
      />
    </label>
  );
}

export function MBizOnboarding() {
  const { data, stage, setStage, pre, needs, toggleNeed, preview } = useBizOnboardingForm();

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
            <span className="text-[15px] font-bold">
              만 {data.common.age}세 · {data.common.residence}
            </span>
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
          <select className={cn(control, "bg-surface px-[12px] font-medium")}>
            {data.industries.slice(0, M_INDUSTRY_COUNT).map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </label>

        <div className={cn("flex flex-col gap-[8px]", pre && "opacity-45")}>
          <div className="grid grid-cols-2 gap-[8px]">
            <NumField label="업력" placeholder="개월" disabled={pre} />
            <NumField label="직원 수" placeholder="명" disabled={pre} />
          </div>
          <NumField label="연 매출" placeholder="만 원" disabled={pre} />
        </div>
        <span className="text-text-sub -mt-[12px] text-[13px]">
          {pre
            ? "예비 창업이면 업력 · 직원 수 · 매출은 입력하지 않아요"
            : "업력은 사업자등록일부터 세요"}
        </span>

        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-bold">{pre ? "희망 지역" : "사업장 소재지"}</span>
          <div className="grid grid-cols-2 gap-[8px]">
            <select aria-label="시·도" className={cn(control, "bg-surface px-[12px]")}>
              {data.provinces.slice(0, M_PROVINCE_COUNT).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <select aria-label="시·군·구" className={cn(control, "bg-surface px-[12px]")}>
              <option>시·군·구</option>
              {data.districts.slice(0, M_DISTRICT_COUNT).map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-[8px]">
          <span className="text-[15px] font-bold">필요한 공간</span>
          <div role="group" aria-label="필요한 공간" className="flex flex-wrap gap-[8px]">
            {data.needs.map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={needs.includes(n)}
                onClick={() => toggleNeed(n)}
                className={cn(
                  "rounded-pill min-h-[44px] cursor-pointer border-2 border-solid px-[16px] text-[15px] font-bold",
                  pickTone(needs.includes(n)),
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </main>
      <div className="border-line bg-surface sticky bottom-0 flex flex-col gap-[4px] border-t border-solid px-[16px] pt-[10px] pb-[28px]">
        <span className="text-text-sub text-center text-[13px]" aria-live="polite">
          지금 조건으로 공간 {preview.spaces}곳 · 사업 지원 {preview.support}개
        </span>
        <Link
          href={routes.business}
          className="rounded-control bg-brand flex min-h-[56px] items-center justify-center text-[17px] font-extrabold text-white no-underline hover:text-white"
        >
          결과 보기
        </Link>
      </div>
    </div>
  );
}
