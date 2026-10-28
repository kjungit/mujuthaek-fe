"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
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

export function MSearch() {
  const { query, setQuery, keyword, recent, remember, terms, results, loading, error } =
    useSearch();
  const [tab, setTab] = useState<SearchTab>("전체");
  const tabs: SearchTab[] = ["전체", ...searchTypes];

  return (
    <div className="bg-surface text-text flex min-h-screen w-full flex-col">
      <header className="border-line-soft bg-surface sticky top-0 z-[2] flex items-center gap-[4px] border-b border-solid py-[8px] pr-[12px] pl-[6px]">
        <Link
          href={routes.home}
          aria-label="뒤로"
          className="text-text hover:text-text inline-flex size-[44px] flex-none items-center justify-center rounded-sm"
        >
          <ChevronLeft size={24} aria-hidden />
        </Link>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            remember();
          }}
          className="relative flex flex-1"
        >
          <label className="flex flex-1">
            <span className="sr-only">검색어</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="공고, 혜택 이름이나 기관"
              className="bg-fill text-text min-h-[44px] min-w-0 flex-1 rounded-sm border-0 px-[14px] text-[16px] font-semibold"
            />
          </label>
        </form>
      </header>

      <main className="flex flex-1 flex-col gap-[8px] pt-[12px] pb-[24px]">
        {recent.length > 0 && (
          <div className="flex gap-[6px] overflow-x-auto px-[16px] pb-[4px]">
            <span className="text-text-sub inline-flex min-h-[32px] flex-none items-center text-[13px]">
              최근
            </span>
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setQuery(r)}
                className="rounded-pill bg-fill text-text-sub inline-flex min-h-[32px] flex-none cursor-pointer items-center border-0 px-[12px] text-[13px] font-semibold"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div role="group" aria-label="결과 종류" className="flex gap-[6px] px-[16px]">
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
                  "rounded-pill min-h-[38px] cursor-pointer border-0 px-[14px] text-[14px] font-bold",
                  on ? "bg-text text-white" : "bg-fill text-text-sub",
                )}
              >
                {t} {count}
              </button>
            );
          })}
        </div>

        {!keyword && (
          <p className="text-text-sub m-0 px-[20px] py-[32px] text-center text-[14px]">
            공고나 혜택의 이름, 기관으로 찾아요 (예: 행복주택, 월세 지원)
          </p>
        )}
        {keyword && error && (
          <p role="alert" className="text-text-sub m-0 px-[20px] py-[32px] text-center text-[14px]">
            검색하지 못했어요. 잠시 뒤 다시 해 주세요
          </p>
        )}
        {keyword && !error && !loading && results.length === 0 && (
          <p className="text-text-sub m-0 px-[20px] py-[32px] text-center text-[14px]">
            「{keyword}」에 맞는 공고·혜택이 없어요
          </p>
        )}
        {results.length > 0 &&
          groupResults(results, tab)
            .filter((sec) => sec.count > 0)
            .map((sec) => (
              <section key={sec.type} className="flex flex-col pt-[8px]">
                <h2 className="text-text-sub m-0 px-[20px] py-[8px] text-[14px] font-extrabold">
                  {sec.type} {sec.count}
                </h2>
                {sec.rows.map((r) => (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={resultHref(r)}
                    onClick={() => remember()}
                    className="border-line-soft text-text hover:text-text flex items-center gap-[12px] border-b border-solid px-[20px] py-[14px] no-underline"
                  >
                    <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
                      <span className="text-[16px] leading-[1.45] font-semibold">
                        {splitTitle(r.titleShort ?? r.title, terms).map((p, i) => (
                          <span
                            key={i}
                            className={cn(
                              "rounded-[3px]",
                              p.hl ? "bg-brand-soft text-brand-strong font-extrabold" : "text-text",
                            )}
                          >
                            {p.t}
                          </span>
                        ))}
                      </span>
                      <span className="text-text-sub text-[13px]">{r.metaShort}</span>
                    </span>
                    <ResultBadge badge={r.badge} size="sm" className="rounded-tag" />
                  </Link>
                ))}
              </section>
            ))}

        <div className="bg-bg mx-[16px] mt-[16px] flex flex-col gap-[6px] rounded-[20px] p-[16px]">
          <span className="text-[15px] font-extrabold">찾는 게 없나요?</span>
          <Link
            href={routes.me}
            className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
          >
            빠진 공고·정책 알려주기
          </Link>
        </div>
      </main>
    </div>
  );
}
