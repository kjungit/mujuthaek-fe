"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { WebHeader } from "@/components/layout/WebHeader";
import { WebMain, WebPage } from "@/components/layout/Responsive";
import {
  groupResults,
  resultHref,
  searchTypes,
  splitTitle,
  useSearch,
  type SearchTab,
} from "@/features/search/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { ResultBadge } from "./ResultBadge";

export function WebSearch() {
  const { query, setQuery, keyword, recent, remember, terms, results, loading, error } =
    useSearch();
  const [tab, setTab] = useState<SearchTab>("전체");
  const tabs: SearchTab[] = ["전체", ...searchTypes];

  return (
    <WebPage>
      <WebHeader mode="home" active="search" unread={3} />
      <WebMain className="max-w-[920px] gap-[20px]">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            remember();
          }}
          className="flex flex-col gap-[14px]"
        >
          <label className="relative flex">
            <span className="sr-only">공고, 혜택, 동네 검색</span>
            <Search
              size={24}
              strokeWidth={2.2}
              className="text-brand absolute top-1/2 left-[20px] -translate-y-1/2"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="공고, 혜택 이름이나 기관으로 찾아요"
              autoFocus
              className="border-brand bg-surface text-text min-h-[64px] flex-1 rounded-[18px] border-2 border-solid pr-[20px] pl-[56px] text-[20px] font-bold"
            />
          </label>
          {recent.length > 0 && (
            <div className="flex flex-wrap items-center gap-[6px]">
              <span className="text-text-sub mr-[4px] text-[14px]">최근 검색</span>
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQuery(r)}
                  className="rounded-pill bg-surface text-text-sub inline-flex min-h-[36px] cursor-pointer items-center border-0 px-[14px] text-[14px] font-semibold"
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </form>

        <div role="group" aria-label="검색 결과 분류" className="flex flex-wrap gap-[6px]">
          {tabs.map((t) => {
            const on = t === tab;
            const count =
              t === "전체" ? results.length : results.filter((r) => r.type === t).length;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-pill min-h-[42px] cursor-pointer border-0 px-[16px] text-[15px] font-bold",
                  on ? "bg-text text-white" : "bg-surface text-text-sub",
                )}
              >
                {t} {count}
              </button>
            );
          })}
        </div>

        {!keyword && (
          <p className="rounded-card bg-surface text-text-sub m-0 px-[24px] py-[40px] text-center text-[15px]">
            공고나 혜택의 이름, 기관으로 찾아요 (예: 행복주택, 월세 지원)
          </p>
        )}
        {keyword && error && (
          <p
            role="alert"
            className="rounded-card bg-surface text-text-sub m-0 px-[24px] py-[40px] text-center text-[15px]"
          >
            검색하지 못했어요. 잠시 뒤 다시 해 주세요
          </p>
        )}
        {keyword && !error && !loading && results.length === 0 && (
          <p className="rounded-card bg-surface text-text-sub m-0 px-[24px] py-[40px] text-center text-[15px]">
            「{keyword}」에 맞는 공고·혜택이 없어요
          </p>
        )}
        {results.length > 0 &&
          groupResults(results, tab)
            .filter((sec) => sec.count > 0)
            .map((sec) => (
              <section
                key={sec.type}
                aria-label={sec.type}
                className="rounded-card bg-surface flex flex-col pt-[18px] pb-[8px]"
              >
                <h2 className="text-text-sub m-0 px-[24px] pb-[6px] text-[16px] font-extrabold">
                  {sec.type} {sec.count}
                </h2>
                {sec.rows.map((r) => (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={resultHref(r)}
                    onClick={() => remember()}
                    className="text-text hover:text-text flex items-center gap-[16px] px-[24px] py-[14px] no-underline"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                      <span className="text-[17px] font-semibold">
                        {splitTitle(r.title, terms).map((p, i) => (
                          <span
                            key={i}
                            className={cn(
                              "rounded-[4px]",
                              p.hl ? "bg-brand-soft text-brand-strong font-extrabold" : "text-text",
                            )}
                          >
                            {p.t}
                          </span>
                        ))}
                      </span>
                      <span className="text-text-sub text-[14px]">{r.meta}</span>
                    </span>
                    <ResultBadge badge={r.badge} size="lg" />
                    <ChevronRight size={18} className="text-text-tertiary flex-none" aria-hidden />
                  </Link>
                ))}
              </section>
            ))}

        <span className="text-text-sub text-center text-[14px]">
          찾는 게 없나요?{" "}
          <Link href={routes.me} className="font-bold">
            빠진 공고·정책 알려주기
          </Link>
        </span>
      </WebMain>
    </WebPage>
  );
}
