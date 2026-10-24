"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { MAX_SEARCH_REGIONS, type ProfileForm } from "@/features/profile/useProfileForm";
import { cn } from "@/lib/cn";
import { regionLabel, regions, sidoByName } from "@/lib/regions";

/** 시·도 → 시·군·구 두 칸 */
function PlaceSelects({
  sido,
  sigungu,
  onSido,
  onSigungu,
  selectClassName,
  sigunguEmpty,
}: {
  sido: string;
  sigungu: string;
  onSido: (v: string) => void;
  onSigungu: (v: string) => void;
  selectClassName: string;
  sigunguEmpty: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-[8px]">
      <select
        aria-label="시·도"
        value={sido}
        onChange={(e) => onSido(e.target.value)}
        className={selectClassName}
      >
        {!sido && <option value="">시·도 선택</option>}
        {regions.map((r) => (
          <option key={r.name} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>
      <select
        aria-label="시·군·구"
        value={sigungu}
        onChange={(e) => onSigungu(e.target.value)}
        disabled={!sido}
        className={cn(selectClassName, "disabled:bg-fill disabled:text-text-sub")}
      >
        <option value="">{sigunguEmpty}</option>
        {(sidoByName(sido)?.sigungu ?? []).map((g) => (
          <option key={g} value={g}>
            {g}
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
  const sigungu = form.field("sigungu");
  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[15px] font-bold">지금 사는 곳</span>
      <PlaceSelects
        sido={form.sido}
        sigungu={sigungu.value}
        onSido={form.setSido}
        onSigungu={(v) => sigungu.onChange({ target: { value: v } })}
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
  const [draft, setDraft] = useState({ sido: "", sigungu: "" });
  const full = form.searchRegions.length >= MAX_SEARCH_REGIONS;
  const add = () => {
    form.addSearchRegion(draft);
    setDraft({ sido: "", sigungu: "" });
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <span className="text-[15px] font-bold">
        어떤 지역 공고를 찾아볼까요?{" "}
        <span className="text-text-sub font-medium">· 최대 {MAX_SEARCH_REGIONS}곳</span>
      </span>
      {form.searchRegions.length > 0 && (
        <ul aria-label="찾아볼 지역" className="m-0 flex list-none flex-wrap gap-[6px] p-0">
          {form.searchRegions.map((r) => {
            const label = regionLabel(r.sido, r.sigungu || undefined);
            return (
              <li key={`${r.sido}-${r.sigungu}`}>
                <span className="rounded-pill bg-brand-soft text-brand-strong inline-flex min-h-[36px] items-center gap-[2px] pl-[12px] text-[14px] font-bold">
                  {r.sigungu ? label : `${label} 전체`}
                  <button
                    type="button"
                    aria-label={`${label} 빼기`}
                    onClick={() => form.removeSearchRegion(r)}
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
            sido={draft.sido}
            sigungu={draft.sigungu}
            onSido={(sido) => setDraft({ sido, sigungu: "" })}
            onSigungu={(sigungu) => setDraft((d) => ({ ...d, sigungu }))}
            selectClassName={selectClassName}
            sigunguEmpty="전체"
          />
          <button
            type="button"
            onClick={add}
            disabled={!draft.sido}
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
