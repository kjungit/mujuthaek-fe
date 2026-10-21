"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { MBottomActions } from "@/components/layout/MBackHeader";
import {
  ChipGroup,
  KidsStepper,
  PriorityChips,
  RankCriteriaFields,
  StatusChips,
  UnitInput,
  DeviceSaveCard,
  SelectOptions,
  pInput,
  pLabel,
  pSelect,
} from "@/components/profile/parts";
import { headOptions, marryOptions, useProfileForm } from "@/features/profile/useProfileForm";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const titles = ["기본 정보를 알려주세요", "가족 · 소득 · 자산", "주택 · 생활권"];

const mInput = cn(pInput, "min-h-[54px]");
const mSelect = cn(pSelect, "min-h-[54px] px-[12px] text-[16px]");

// 모바일은 선택지 일부만 보여줘요
const pickIdx = (xs: string[], idx: number[]) => idx.map((i) => xs[i]).filter(Boolean);

export function MProfile() {
  const form = useProfileForm();
  const { options } = form.data;

  return (
    <div className="bg-surface text-text flex min-h-screen w-full flex-col">
      <header className="bg-surface flex flex-col px-[8px]">
        <div className="flex h-[56px] items-center justify-between">
          <Link
            href={routes.main}
            aria-label="나가기"
            className="text-text hover:text-text inline-flex size-[44px] items-center justify-center rounded-sm"
          >
            <X size={24} aria-hidden />
          </Link>
          <span className="text-brand-strong pr-[12px] text-[15px] font-bold">{form.step} / 3</span>
        </div>
        <span className="bg-line mx-[12px] block h-[4px] overflow-hidden rounded-[2px]">
          <span
            className="bg-brand block h-full"
            style={{ width: `${Math.round((form.step / 3) * 100)}%` }}
          />
        </span>
      </header>

      <main className="flex flex-1 flex-col gap-[22px] px-[20px] py-[24px]">
        <div className="flex flex-col gap-[6px]">
          <h1 className="tracking-h1 m-0 text-[26px] font-extrabold">{titles[form.step - 1]}</h1>
          <span className="text-text-sub text-[15px] leading-[1.6]">
            모르는 칸은 비워도 돼요 · &apos;확인 필요&apos;로 보여드려요
          </span>
        </div>

        {form.step === 1 && (
          <div className="flex flex-col gap-[20px]">
            <label className={pLabel}>
              생년월일
              <input
                type="text"
                inputMode="numeric"
                placeholder="예: 1997.03.15"
                className={mInput}
                {...form.field("birth")}
              />
            </label>
            <div className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-bold">지금 사는 곳</span>
              <div className="grid grid-cols-2 gap-[8px]">
                <select aria-label="시·도" className={mSelect} {...form.field("sido")}>
                  <SelectOptions
                    items={options.sido.slice(0, 2)}
                    value={form.field("sido").value}
                  />
                </select>
                <select aria-label="시·군·구" className={mSelect} {...form.field("sigungu")}>
                  <SelectOptions
                    items={options.sigungu.slice(0, 2)}
                    value={form.field("sigungu").value}
                  />
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-bold">세대주인가요?</span>
              <ChipGroup
                label="세대주 여부"
                options={headOptions}
                value={form.head}
                onPick={form.setHead}
                className="grid-cols-2"
              />
              <span className="text-text-sub text-[13px]">주민등록등본에서 확인할 수 있어요</span>
            </div>
            <StatusChips form={form} />
          </div>
        )}

        {form.step === 2 && (
          <div className="flex flex-col gap-[20px]">
            <div className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-bold">결혼 여부</span>
              <ChipGroup
                label="결혼 여부"
                options={marryOptions}
                value={form.marry}
                onPick={form.setMarry}
                className="grid-cols-3"
                chipClassName="min-h-[52px] text-[15px]"
              />
            </div>
            <div className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-bold">자녀 수</span>
              <KidsStepper form={form} className="min-h-[54px]" />
            </div>
            <label className={pLabel}>
              연소득 (세전)
              <UnitInput
                unit="만 원"
                placeholder="3,200"
                className="min-h-[54px]"
                {...form.sessionField("income")}
              />
            </label>
            <label className={pLabel}>
              자산 합계
              <UnitInput
                unit="만 원"
                placeholder="4,500"
                className="min-h-[54px]"
                {...form.sessionField("asset")}
              />
              <span className="text-text-sub flex min-h-[32px] items-center gap-[8px] text-[14px] font-medium">
                <input
                  type="checkbox"
                  checked={form.assetUnknown}
                  onChange={(e) => form.setAssetUnknown(e.target.checked)}
                  className="m-[3px_3px_3px_4px] size-[18px]"
                />{" "}
                잘 모르겠어요
              </span>
            </label>
            <RankCriteriaFields form={form} compact />
          </div>
        )}

        {form.step === 3 && (
          <div className="flex flex-col gap-[20px]">
            <label className={pLabel}>
              무주택 기간
              <select className={cn(mSelect, "font-medium")} {...form.field("homelessPeriod")}>
                <SelectOptions
                  items={pickIdx(options.homelessPeriod, [0, 1, 3])}
                  value={form.field("homelessPeriod").value}
                />
              </select>
            </label>
            <label className={pLabel}>
              청약통장 가입 기간
              <select className={cn(mSelect, "font-medium")} {...form.field("bankbookPeriod")}>
                <SelectOptions
                  items={options.bankbookPeriod.slice(0, 3)}
                  value={form.field("bankbookPeriod").value}
                />
              </select>
            </label>
            <label className={pLabel}>
              지금 쓸 수 있는 돈
              <UnitInput
                unit="만 원"
                placeholder="1,500"
                className="min-h-[54px]"
                {...form.sessionField("available")}
              />
            </label>
            <label className={pLabel}>
              직장 · 학교 위치
              <input
                type="search"
                placeholder="회사 주소나 역 이름"
                className={mInput}
                {...form.field("workplace")}
              />
            </label>
            <div className="flex flex-col gap-[8px]">
              <span className="text-[15px] font-bold">살 곳을 고를 때 중요한 것</span>
              <PriorityChips form={form} chipClassName="px-[16px]" />
            </div>
            <DeviceSaveCard form={form} compact />
          </div>
        )}

        <div className="bg-bg flex items-center justify-between gap-[10px] rounded-[18px] px-[16px] py-[14px]">
          <span className="text-text-sub text-[14px]">지금 조건으로</span>
          <span className="text-[15px] font-extrabold">
            공고 {form.preview.homes}곳 · 혜택 {form.preview.benefits}개
          </span>
        </div>
      </main>

      <MBottomActions>
        {form.step > 1 && (
          <button
            type="button"
            onClick={form.prev}
            className="rounded-control bg-fill text-text min-h-[56px] flex-none cursor-pointer border-0 px-[20px] text-[16px] font-bold"
          >
            이전
          </button>
        )}
        {form.isLast ? (
          <button
            type="button"
            onClick={form.submit}
            className="rounded-control bg-brand min-h-[56px] flex-1 cursor-pointer border-0 text-[17px] font-extrabold text-white"
          >
            확인하기
          </button>
        ) : (
          <button
            type="button"
            onClick={form.next}
            className="rounded-control bg-brand min-h-[56px] flex-1 cursor-pointer border-0 text-[17px] font-extrabold text-white"
          >
            다음
          </button>
        )}
      </MBottomActions>
    </div>
  );
}
