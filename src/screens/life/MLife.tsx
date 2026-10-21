"use client";

import Link from "next/link";
import { MTabBar } from "@/components/layout/MTabBar";
import { MTopBar } from "@/components/layout/MTopBar";
import { MPage } from "@/components/layout/Responsive";
import { useLifeScores, weightLabels } from "@/features/life/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";

export function MLife() {
  const life = useLifeScores();
  const sel = life.selected;

  return (
    <MPage>
      <MTopBar mode="home" unread={3} />
      <main className="flex flex-1 flex-col gap-[12px] px-[16px] pt-[20px] pb-[28px]">
        <div className="flex flex-col gap-[4px] px-[4px]">
          <h1 className="tracking-h1 m-0 text-[26px] font-extrabold">생활권</h1>
          <span className="text-text-sub text-[14px]">
            직장 {life.workplace} 기준 · 내가 중요하게 여기는 것으로 점수를 매겨요
          </span>
        </div>

        <div
          role="img"
          aria-label="동네 점수 지도"
          className="rounded-card bg-placeholder-bg relative h-[240px] overflow-hidden"
        >
          <span
            aria-hidden
            className="bg-map-water absolute top-[170px] left-[-30px] h-[30px] w-[460px] rotate-[-6deg]"
          />
          <span
            aria-hidden
            className="bg-map-park-2 absolute top-[18px] left-[16px] h-[64px] w-[90px] rounded-[18px]"
          />
          {life.scored.map((a) => {
            const on = a.id === sel.id;
            return (
              <span
                key={a.id}
                style={{ left: `${a.mobile.x}%`, top: `${a.mobile.y}%` }}
                className={cn(
                  "rounded-pill absolute -translate-x-1/2 -translate-y-1/2 px-[12px] py-[7px] text-[13px] font-extrabold whitespace-nowrap shadow-[0_4px_12px_rgba(25,31,40,0.15)]",
                  on ? "bg-brand text-white" : "bg-surface text-text",
                )}
              >
                {a.name} {a.score}
              </span>
            );
          })}
          <span className="bg-text absolute right-[12px] bottom-[12px] rounded-[10px] px-[9px] py-[5px] text-[12px] font-bold text-white">
            직장 · {life.workplace}
          </span>
        </div>

        <section aria-label="동네 순위" className="rounded-card bg-surface flex flex-col p-[8px]">
          {life.ranked.map((a, i) => {
            const on = a.id === sel.id;
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={on}
                onClick={() => life.select(a.id)}
                className={cn(
                  "rounded-tile text-text flex min-h-[60px] cursor-pointer items-center gap-[12px] border-0 px-[14px] py-[12px] text-left",
                  on ? "bg-row-selected" : "bg-transparent",
                )}
              >
                <span className="text-brand-strong w-[26px] flex-none text-[15px] font-extrabold">
                  {i + 1}
                </span>
                <span className="flex flex-1 flex-col gap-[5px]">
                  <span className="flex justify-between">
                    <span className="text-[16px] font-extrabold">{a.name}</span>
                    <span className="text-[16px] font-extrabold">{a.score}점</span>
                  </span>
                  <span className="bg-fill h-[6px] overflow-hidden rounded-[3px]">
                    <span
                      className="bg-brand block h-full rounded-[3px]"
                      style={{ width: `${a.score}%` }}
                    />
                  </span>
                  <span className="text-text-sub text-[12px]">직장까지 {a.commute}</span>
                </span>
              </button>
            );
          })}
        </section>

        <section
          aria-labelledby="inf-h"
          className="rounded-card bg-surface flex flex-col px-[20px] pt-[16px] pb-[8px]"
        >
          <h2 id="inf-h" className="m-0 mb-[6px] text-[17px] font-extrabold">
            {sel.name} 주변
          </h2>
          {sel.infra.map((it) => (
            <div
              key={it.k}
              className="border-line-soft flex justify-between gap-[10px] border-b border-solid py-[10px] text-[15px]"
            >
              <span className="font-bold">{it.k}</span>
              <span className="text-text-sub">{it.vShort ?? it.v}</span>
            </div>
          ))}
          {/* 세권 기준 설명 화면은 아직 없어요 */}
          <button
            type="button"
            className="text-brand inline-flex min-h-[44px] cursor-pointer items-center self-start border-0 bg-transparent p-0 text-[14px] font-bold"
          >
            세권 기준 보기
          </button>
        </section>

        <section
          aria-labelledby="w-h"
          className="rounded-card bg-surface flex flex-col gap-[12px] px-[20px] py-[16px]"
        >
          <div className="flex items-center justify-between">
            <h2 id="w-h" className="m-0 text-[17px] font-extrabold">
              나에게 중요한 것
            </h2>
            <button
              type="button"
              onClick={life.resetWeights}
              className="text-text-sub min-h-[44px] cursor-pointer border-0 bg-transparent px-[6px] py-[1px] text-[14px] font-semibold"
            >
              처음으로
            </button>
          </div>
          {weightLabels.map((w) => (
            <label
              key={w.key}
              className="grid grid-cols-[76px_minmax(0,1fr)_24px] items-center gap-[10px] text-[14px] font-bold"
            >
              {w.label}
              <input
                type="range"
                min={0}
                max={10}
                value={life.weights[w.key]}
                onChange={(e) => life.setWeight(w.key, Number(e.target.value))}
                aria-label={`${w.label} 중요도`}
                className="accent-brand my-[2px] min-h-[32px]"
              />
              <span className="text-brand-strong text-right">{life.weights[w.key]}</span>
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
      </main>
      <MTabBar mode="home" current={routes.life} />
    </MPage>
  );
}
