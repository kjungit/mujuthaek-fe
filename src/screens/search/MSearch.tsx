"use client";

import { reportHref } from "@/features/me/tabs";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import {
  groupResults,
  resultHref,
  searchTypes,
  splitTitle,
  useSearchResults,
  type SearchTab,
} from "@/features/search/queries";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { ResultBadge } from "./ResultBadge";

export function MSearch() {
  const { data } = useSearchResults();
  const [query, setQuery] = useState(data.query);
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
        <label className="relative flex flex-1">
          <span className="sr-only">검색어</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="공고, 혜택, 동네 검색"
            className="bg-fill text-text min-h-[44px] min-w-0 flex-1 rounded-sm border-0 px-[14px] text-[16px] font-semibold"
          />
        </label>
      </header>

      <main className="flex flex-1 flex-col gap-[8px] pt-[12px] pb-[24px]">
        <div className="flex gap-[6px] overflow-x-auto px-[16px] pb-[4px]">
          <span className="text-text-sub inline-flex min-h-[32px] flex-none items-center text-[13px]">
            최근
          </span>
          {data.recent.map((r) => (
            <span
              key={r}
              className="rounded-pill bg-fill text-text-sub inline-flex min-h-[32px] flex-none items-center px-[12px] text-[13px] font-semibold"
            >
              {r}
            </span>
          ))}
        </div>

        <div role="group" aria-label="결과 종류" className="flex gap-[6px] px-[16px]">
          {tabs.map((t) => {
            const on = t === tab;
            const count =
              t === "전체" ? data.results.length : data.results.filter((r) => r.type === t).length;
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

        {groupResults(data.results, tab).map((sec) => (
          <section key={sec.type} className="flex flex-col pt-[8px]">
            <h2 className="text-text-sub m-0 px-[20px] py-[8px] text-[14px] font-extrabold">
              {sec.type} {sec.count}
            </h2>
            {sec.rows.map((r) => (
              <Link
                key={r.id}
                href={resultHref(r)}
                className="border-line-soft text-text hover:text-text flex items-center gap-[12px] border-b border-solid px-[20px] py-[14px] no-underline"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-[4px]">
                  <span className="text-[16px] leading-[1.45] font-semibold">
                    {splitTitle(r.titleShort ?? r.title, data.terms).map((p, i) => (
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
            href={reportHref({ kind: "MISSING_NOTICE", from: "검색 (모바일)" })}
            className="inline-flex min-h-[44px] items-center text-[14px] font-bold no-underline"
          >
            빠진 공고·정책 알려주기
          </Link>
        </div>
      </main>
    </div>
  );
}
