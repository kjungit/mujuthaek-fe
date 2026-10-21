"use client";

import Link from "next/link";
import { BriefcaseBusiness, Search } from "lucide-react";
import { WebHeader } from "@/components/layout/WebHeader";
import { WebMain, WebPage } from "@/components/layout/Responsive";
import { useLifeScores, weightLabels } from "@/features/life/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

const card = "rounded-card bg-surface flex flex-col";
const h2 = "tracking-title m-0 text-[18px] font-extrabold";

export function WebLife() {
  const life = useLifeScores();
  const sel = life.selected;

  return (
    <WebPage>
      <WebHeader mode="home" current={routes.life} unread={3} />
      <WebMain>
        <div className="flex flex-wrap items-end justify-between gap-[16px]">
          <div className="flex flex-col gap-[6px]">
            <h1 className="tracking-h1 m-0 text-[32px] font-extrabold">생활권</h1>
            <span className="text-text-sub text-[16px]">
              직장 <strong className="text-text">{life.workplace}</strong> 기준 · 내가 중요하게
              여기는 것으로 점수를 매겨요
            </span>
          </div>
          <label className="relative flex flex-[0_1_380px]">
            <span className="sr-only">동네 · 역 검색</span>
            <Search
              size={20}
              className="text-text-tertiary absolute top-1/2 left-[16px] -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              placeholder="동네, 역, 단지 이름으로 찾기"
              className="rounded-control bg-surface text-text min-h-[52px] flex-1 border-0 pr-[16px] pl-[46px] text-[16px]"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-start gap-[20px]">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-[16px]">
            <div
              aria-label="생활권 지도"
              className="rounded-card-lg bg-map-road relative h-[520px] overflow-hidden"
            >
              <span
                aria-hidden
                className="bg-map-water-2 absolute top-[74%] right-[-10%] left-[-10%] h-[13%] rotate-[-8deg]"
              />
              <span
                aria-hidden
                className="bg-map-park absolute top-[10%] left-[6%] h-[28%] w-[22%] rounded-[45%_55%_50%_50%]"
              />
              <span aria-hidden className="absolute top-[44%] right-0 left-0 h-[10px] bg-white" />
              <span
                aria-hidden
                className="absolute top-0 bottom-0 left-[46%] w-[10px] rotate-[10deg] bg-white"
              />
              <span
                aria-hidden
                className="absolute top-[66%] right-0 left-0 h-[7px] rotate-[-6deg] bg-white"
              />
              <span
                aria-hidden
                className="text-brand-strong absolute top-[22%] left-[12%] text-[12px]"
              >
                하늘공원
              </span>
              <span aria-hidden className="text-text-sub absolute top-[80%] left-[40%] text-[12px]">
                한강
              </span>

              <span
                aria-label={`직장 ${life.workplace}`}
                className="bg-text absolute top-[90%] left-[72%] inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-[6px] rounded-[10px] px-[10px] py-[6px] text-[13px] font-bold text-white"
              >
                <BriefcaseBusiness size={16} aria-hidden />
                직장 · {life.workplace}
              </span>

              {life.scored.map((a) => {
                const on = a.id === sel.id;
                return (
                  <button
                    key={a.id}
                    type="button"
                    aria-pressed={on}
                    aria-label={`${a.name} ${a.score}점`}
                    onClick={() => life.select(a.id)}
                    style={{ left: `${a.web.x}%`, top: `${a.web.y}%` }}
                    className={cn(
                      "rounded-pill absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center border-0",
                      on
                        ? "bg-brand size-[108px] text-white shadow-[0_10px_24px_rgba(8,127,91,0.35)]"
                        : "bg-surface text-text size-[88px] shadow-[0_4px_12px_rgba(25,31,40,0.12)]",
                    )}
                  >
                    <span className="text-[13px] font-bold">{a.name}</span>
                    <span className="tracking-title text-[22px] font-extrabold">{a.score}</span>
                  </button>
                );
              })}
            </div>

            <section aria-label="동네 비교" className={cn(card, "gap-[6px] px-[24px] py-[20px]")}>
              <h2 className={cn(h2, "mb-[6px]")}>내 기준 동네 순위</h2>
              {life.ranked.map((a, i) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={a.id === sel.id}
                  onClick={() => life.select(a.id)}
                  className={cn(
                    "rounded-control text-text flex cursor-pointer items-center gap-[14px] border-0 px-[12px] py-[10px] text-left",
                    a.id === sel.id ? "bg-row-selected" : "bg-transparent",
                  )}
                >
                  <span className="text-brand-strong w-[28px] flex-none text-[16px] font-extrabold">
                    {i + 1}
                  </span>
                  <span className="w-[70px] flex-none text-[16px] font-bold">{a.name}</span>
                  <span className="bg-fill h-[10px] flex-1 overflow-hidden rounded-[5px]">
                    <span
                      className="bg-brand block h-full rounded-[5px]"
                      style={{ width: `${a.score}%` }}
                    />
                  </span>
                  <span className="w-[52px] flex-none text-right text-[16px] font-extrabold">
                    {a.score}점
                  </span>
                  <span className="text-text-sub w-[74px] flex-none text-right text-[14px]">
                    직장 {a.commute}
                  </span>
                </button>
              ))}
            </section>
          </div>

          <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-[16px]">
            <section
              aria-label="선택한 동네"
              aria-live="polite"
              className={cn(card, "gap-[6px] p-[24px]")}
            >
              <span className="text-text-sub text-[15px] font-bold">{sel.name} · 내 기준</span>
              <span className="flex items-baseline gap-[6px]">
                <span className="text-brand text-[48px] font-extrabold tracking-[-0.05em]">
                  {sel.score}
                </span>
                <span className="text-[18px] font-bold">점</span>
              </span>
              <span className="text-text-sub text-[15px]">직장까지 대중교통 {sel.commute}</span>
            </section>

            <section aria-label="주변 생활 인프라" className={cn(card, "px-[24px] py-[20px]")}>
              <div className="mb-[4px] flex items-center justify-between">
                <h2 className={h2}>주변 생활 인프라</h2>
                {/* 기준 설명 화면(DeskLife)은 아직 없어요 */}
                <button
                  type="button"
                  className="text-brand-strong inline-flex min-h-[44px] cursor-pointer items-center border-0 bg-transparent p-0 text-[14px] font-bold"
                >
                  기준 보기
                </button>
              </div>
              {sel.infra.map((it) => (
                <div
                  key={it.k}
                  className="border-line-soft flex justify-between gap-[10px] border-b border-solid py-[9px] text-[15px]"
                >
                  <span className="font-bold">{it.k}</span>
                  <span className="text-text-sub">{it.v}</span>
                </div>
              ))}
            </section>

            <section
              aria-label="나에게 중요한 것"
              className={cn(card, "gap-[12px] px-[24px] py-[20px]")}
            >
              <div className="flex items-center justify-between">
                <h2 className={h2}>나에게 중요한 것</h2>
                <button
                  type="button"
                  onClick={life.resetWeights}
                  className="text-text-sub min-h-[44px] cursor-pointer border-0 bg-transparent px-[6px] py-[1px] text-[14px] font-bold"
                >
                  처음으로
                </button>
              </div>
              {weightLabels.map((w) => (
                <label
                  key={w.key}
                  className="grid grid-cols-[76px_minmax(0,1fr)_24px] items-center gap-[10px] text-[15px] font-bold"
                >
                  {w.label}
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={life.weights[w.key]}
                    onChange={(e) => life.setWeight(w.key, Number(e.target.value))}
                    aria-label={`${w.label} 중요도`}
                    className="accent-brand my-[2px] w-full"
                  />
                  <span className="text-brand-strong text-right font-extrabold">
                    {life.weights[w.key]}
                  </span>
                </label>
              ))}
            </section>

            <div className="grid grid-cols-2 gap-[8px]">
              <Link
                href={routes.homes}
                className="rounded-control bg-brand flex min-h-[52px] items-center justify-center text-[15px] font-extrabold text-white no-underline hover:text-white"
              >
                {sel.name} 공고
              </Link>
              <Link
                href={routes.benefits}
                className="rounded-control bg-surface text-text hover:text-text flex min-h-[52px] items-center justify-center text-[15px] font-bold no-underline"
              >
                이 지역 혜택
              </Link>
            </div>
          </aside>
        </div>
      </WebMain>
    </WebPage>
  );
}
