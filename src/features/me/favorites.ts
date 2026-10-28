"use client";

// 내 정보 「관심 공고」: 관심 목록(서버)마다 제목·기관·마감을 받아 한 줄로 보여줘요
import { useQueries } from "@tanstack/react-query";
import { useFavorites, type Favorite } from "@/features/favorites/api";
import type { ApiNoticeDetail } from "@/features/notice/detail";
import { formatPeriod } from "@/features/notice/format";
import { providerName } from "@/features/notice/labels";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { routes } from "@/lib/routes";
import type { MeFavorite } from "@/mocks/me";

/** 사업 지원·입주 모집 판정 응답에서 쓰는 칸 (상세 API가 없어 판정 API로 제목·기간을 받아요) */
type ProgramSummary = {
  title: string;
  applyEnd: string | null;
  dday: number | null;
  status: string;
};

type Row = { title: string; meta: string; dday: number | null; status: string };

const ddayLabel = (dday: number | null, status: string) => {
  if (status === "ALWAYS") return "상시";
  if (status === "CLOSED" || (dday !== null && dday < 0)) return "마감";
  if (dday === null) return "일정 확인";
  return dday === 0 ? "오늘 마감" : `D-${dday}`;
};

async function rowOf(f: Favorite): Promise<Row> {
  if (f.targetType === "NOTICE") {
    const { header: h } = await api.get<ApiNoticeDetail>(endpoints.noticeDetail(f.targetId));
    const until = h.applyEnd ? `접수 ${formatPeriod(null, h.applyEnd)}까지` : null;
    return {
      title: h.title,
      meta: [providerName(h.provider), h.supplyTypeText, until].filter(Boolean).join(" · "),
      dday: h.dday,
      status: h.status,
    };
  }
  const evaluate =
    f.targetType === "STARTUP_SUPPORT" ? endpoints.supportEvaluate : endpoints.spaceEvaluate;
  const p = await api.post<ProgramSummary>(evaluate(f.targetId), { applicant: {}, answers: {} });
  const kind = f.targetType === "STARTUP_SUPPORT" ? "사업 지원" : "입주 모집";
  const until = p.applyEnd ? `접수 ${formatPeriod(null, p.applyEnd)}까지` : null;
  return {
    title: p.title,
    meta: [kind, until].filter(Boolean).join(" · "),
    dday: p.dday,
    status: p.status,
  };
}

const hrefOf = (f: Favorite) =>
  f.targetType === "NOTICE"
    ? routes.notice(f.targetId)
    : f.targetType === "STARTUP_SUPPORT"
      ? `${routes.bizSupport}/${f.targetId}`
      : routes.space(f.targetId);

/** 관심 공고·사업 (혜택은 아직 화면이 없어 빼요). 받는 중이면 loading */
export function useMyFavorites() {
  const { data: favorites = [], isFetching } = useFavorites();
  const shown = favorites.filter((f) => f.targetType !== "BENEFIT");
  const rows = useQueries({
    queries: shown.map((f) => ({
      queryKey: ["favorites", "row", f.targetType, f.targetId] as const,
      queryFn: () => rowOf(f),
      staleTime: 5 * 60 * 1000,
      retry: false,
    })),
  });
  const items: (MeFavorite & { type: Favorite["targetType"]; href: string })[] = shown.flatMap(
    (f, i) => {
      const row = rows[i]?.data;
      if (!row) return [];
      return [
        {
          id: f.targetId,
          type: f.targetType,
          href: hrefOf(f),
          title: row.title,
          meta: row.meta,
          dday: ddayLabel(row.dday, row.status),
          urgent: row.dday !== null && row.dday >= 0 && row.dday <= 3,
        },
      ];
    },
  );
  return { items, total: shown.length, loading: isFetching || rows.some((r) => r.isPending) };
}
