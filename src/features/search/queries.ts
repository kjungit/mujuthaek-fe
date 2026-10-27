import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import { routes } from "@/lib/routes";
import { searchData, type SearchResult, type SearchType } from "@/mocks/search";

export const searchKeys = {
  results: (q: string) => ["search", "results", q] as const,
};

export function useSearchResults() {
  return useQuery(mockQuery(searchKeys.results(searchData.query), searchData));
}

export const searchTypes: SearchType[] = ["공고", "혜택", "지역"];

export type SearchTab = "전체" | SearchType;

export const resultHref = (r: SearchResult) =>
  r.type === "공고" ? routes.notice(r.id) : r.type === "혜택" ? routes.benefit(r.id) : routes.homes;

/** 제목을 검색어 기준으로 잘라 강조할 부분을 표시해요 */
export function splitTitle(text: string, terms: string[]) {
  if (terms.length === 0) return [{ t: text, hl: false }];
  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(${escaped.join("|")})`, "g");
  return text
    .split(re)
    .filter(Boolean)
    .map((t) => ({ t, hl: terms.includes(t) }));
}

/** 분류 탭에 맞는 섹션들 */
export function groupResults(results: SearchResult[], tab: SearchTab) {
  const types = tab === "전체" ? searchTypes : [tab];
  return types.map((type) => {
    const rows = results.filter((r) => r.type === type);
    return { type, count: rows.length, rows };
  });
}
