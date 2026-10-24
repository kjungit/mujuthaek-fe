"use client";

import { useSyncExternalStore } from "react";

const OLDEST_YEAR = 1930;
// 프리렌더에선 시계를 읽지 않아요 (Cache Components). 브라우저에서 올해로 바꿔요
const FALLBACK_YEAR = 2026;
const noop = () => () => {};

/** 저장 값 "1997.03.15" (고르는 중이면 "1997.03.") ↔ 년·월·일. 예전 "19970315" · "1997-03-15"도 읽어요 */
export function splitBirth(birth: string) {
  const digits = birth.replace(/\D/g, "");
  if (digits.length === 8 && !birth.includes(".")) {
    return { y: digits.slice(0, 4), m: digits.slice(4, 6), d: digits.slice(6, 8) };
  }
  const [y = "", m = "", d = ""] = birth.split(".");
  return { y, m, d };
}

const joinBirth = (y: string, m: string, d: string) => (y || m || d ? `${y}.${m}.${d}` : "");

const pad = (n: number) => String(n).padStart(2, "0");

/** 생년월일: 년 · 월 · 일을 골라요 */
export function BirthField({
  value,
  onChange,
  selectClassName,
}: {
  value: string;
  onChange: (birth: string) => void;
  selectClassName: string;
}) {
  const thisYear = useSyncExternalStore(
    noop,
    () => new Date().getFullYear(),
    () => FALLBACK_YEAR,
  );
  const { y, m, d } = splitBirth(value);
  const years = Array.from({ length: thisYear - OLDEST_YEAR + 1 }, (_, i) => String(thisYear - i));
  // 월을 고르기 전엔 31일까지, 고르면 그 달의 마지막 날까지 (윤년 포함)
  const lastDay = m ? new Date(Number(y) || 2000, Number(m), 0).getDate() : 31;

  const pick = (next: { y?: string; m?: string; d?: string }) => {
    const ny = next.y ?? y;
    const nm = next.m ?? m;
    let nd = next.d ?? d;
    if (nd && nm && Number(nd) > new Date(Number(ny) || 2000, Number(nm), 0).getDate()) nd = "";
    onChange(joinBirth(ny, nm, nd));
  };

  return (
    <fieldset className="m-0 flex flex-col gap-[8px] border-0 p-0">
      <legend className="mb-[8px] p-0 text-[15px] font-bold">생년월일</legend>
      <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-[8px]">
        <select
          aria-label="태어난 해"
          value={y}
          onChange={(e) => pick({ y: e.target.value })}
          className={selectClassName}
        >
          <option value="">년</option>
          {years.map((v) => (
            <option key={v} value={v}>
              {v}년
            </option>
          ))}
        </select>
        <select
          aria-label="태어난 달"
          value={m}
          onChange={(e) => pick({ m: e.target.value })}
          className={selectClassName}
        >
          <option value="">월</option>
          {Array.from({ length: 12 }, (_, i) => pad(i + 1)).map((v) => (
            <option key={v} value={v}>
              {Number(v)}월
            </option>
          ))}
        </select>
        <select
          aria-label="태어난 날"
          value={d}
          onChange={(e) => pick({ d: e.target.value })}
          className={selectClassName}
        >
          <option value="">일</option>
          {Array.from({ length: lastDay }, (_, i) => pad(i + 1)).map((v) => (
            <option key={v} value={v}>
              {Number(v)}일
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
