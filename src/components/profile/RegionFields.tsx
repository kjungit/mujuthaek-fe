"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_SEARCH_REGIONS, type ProfileForm } from "@/features/profile/useProfileForm";
import { useRegions } from "@/features/regions/queries";
import { cn } from "@/lib/cn";

/**
 * 시·도 → 시·군·구 두 칸. 값은 지역 코드 하나예요.
 * 시·도만 고르면 2자리, 시·군·구까지 고르면 5자리, 아무것도 안 고르면 ""
 */
function PlaceSelects({
  code,
  onChange,
  selectClassName,
  sigunguEmpty,
}: {
  code: string;
  onChange: (code: string) => void;
  selectClassName: string;
  sigunguEmpty: string;
}) {
  const regions = useRegions();
  const sidoCode = code.slice(0, 2);
  const sido = sidoCode ? regions.sido(sidoCode) : undefined;

  return (
    <div className="grid grid-cols-2 gap-[8px]">
      <select
        aria-label="시·도"
        value={sidoCode}
        onChange={(e) => onChange(e.target.value)}
        className={selectClassName}
      >
        {!sidoCode && <option value="">시·도 선택</option>}
        {regions.sidos.map((r) => (
          <option key={r.code} value={r.code}>
            {r.name}
          </option>
        ))}
      </select>
      <select
        aria-label="시·군·구"
        value={code.length === 5 ? code : ""}
        onChange={(e) => onChange(e.target.value || sidoCode)}
        disabled={!sido}
        className={cn(selectClassName, "disabled:bg-fill disabled:text-text-sub")}
      >
        <option value="">{sigunguEmpty}</option>
        {(sido?.sigungus ?? []).map((g) => (
          <option key={g.code} value={g.code}>
            {g.name}
          </option>
        ))}
      </select>
    </div>
  );
}

/** 지금 사는 곳: 거주 요건·순위 판정에만 써요 */
export function ResidenceField({
  form,
  selectClassName,
}: {
  form: ProfileForm;
  selectClassName: string;
}) {
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[15px] font-bold">지금 사는 곳</span>
      <PlaceSelects
        code={form.regionCode}
        onChange={form.setRegionCode}
        selectClassName={selectClassName}
        sigunguEmpty="시·군·구 선택"
      />
      <span className="text-text-sub text-[13px]">공고의 거주 요건과 순위를 확인할 때 써요</span>
    </div>
  );
}

/** 찾아볼 지역: 내 집에서 볼 공고를 골라요 (최대 3곳) */
export function SearchRegionsField({
  form,
  selectClassName,
}: {
  form: ProfileForm;
  selectClassName: string;
}) {
  const regions = useRegions();
  const [draft, setDraft] = useState("");
  const full = form.searchRegionCodes.length >= MAX_SEARCH_REGIONS;
  const add = () => {
    form.addSearchRegion(draft);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[15px] font-bold">
        어떤 지역 공고를 찾아볼까요?{" "}
        <span className="text-text-sub font-medium">· 최대 {MAX_SEARCH_REGIONS}곳</span>
      </span>
      {form.searchRegionCodes.length > 0 && (
        <ul aria-label="찾아볼 지역" className="m-0 flex list-none flex-wrap gap-[6px] p-0">
          {form.searchRegionCodes.map((code) => {
            const label = regions.label(code);
            return (
              <li key={code}>
                <span className="rounded-pill bg-brand-soft text-brand-strong inline-flex min-h-[36px] items-center gap-[2px] pl-[12px] text-[14px] font-bold">
                  {code.length === 2 ? `${label} 전체` : label}
                  <button
                    type="button"
                    aria-label={`${label} 빼기`}
                    onClick={() => form.removeSearchRegion(code)}
                    className="text-brand-strong inline-flex size-[36px] cursor-pointer items-center justify-center rounded-full border-0 bg-transparent"
                  >
                    <X size={16} aria-hidden />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {!full && (
        <div className="flex flex-col gap-[8px]">
          <PlaceSelects
            code={draft}
            onChange={setDraft}
            selectClassName={selectClassName}
            sigunguEmpty="전체"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft}
            className="bg-fill text-text disabled:text-text-tertiary inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-[4px] self-start rounded-sm border-0 px-[16px] text-[14px] font-bold disabled:cursor-default"
          >
            <Plus size={16} aria-hidden />
            지역 추가
          </button>
        </div>
      )}
      <span className="text-text-sub text-[13px]">
        내 집에서 이 지역 공고를 먼저 보여드려요. 비워 두면 지금 사는 곳 공고를 보여드려요
      </span>
    </div>
  );
}
