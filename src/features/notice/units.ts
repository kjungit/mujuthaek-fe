"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { formatWon } from "@/features/notice/format";
import type { NoticeJudgment } from "@/features/notice/judgment";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { NoticeSite, NoticeUnit } from "@/mocks/notice";

/** GET /api/v1/notices/{id}/units 한 줄 (백엔드 NoticeUnitResponse) */
type ApiUnit = {
  id: string;
  siteId: string | null;
  address: string | null;
  unitLabel: string | null;
  floor: string | null;
  houseType: string | null;
  exclusiveM2: number | null;
  depositWon: number | null;
  rentWon: number | null;
};

type ApiUnitPage = { items: ApiUnit[]; nextCursor: string | null; hasNext: boolean };

/** 백엔드가 한 번에 주는 최대 개수 */
const PAGE_SIZE = 100;

/** 주택목록 (호별). 공개 정보라 조금 길게 둬요 */
export function useNoticeUnits(id: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: ["notice", "units", id] as const,
    queryFn: ({ pageParam }) => {
      const q = new URLSearchParams({ size: String(PAGE_SIZE) });
      if (pageParam) q.set("cursor", pageParam);
      return api.get<ApiUnitPage>(`${endpoints.noticeUnits(id)}?${q}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => (last.hasNext ? last.nextCursor : null),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

/** 응답 한 줄 → 화면 집 하나. 신청 가능 · 준비할 돈은 내 판정의 주택형별 값으로 */
export function toUnit(
  u: ApiUnit,
  sites: NoticeSite[],
  judgment: NoticeJudgment | null,
): NoticeUnit {
  const site = sites.find((s) => s.id === u.siteId);
  const type = u.houseType ?? "";
  return {
    id: u.id,
    name: [site?.name, u.unitLabel].filter(Boolean).join(" ") || "공급 주택",
    addr: u.address ?? undefined,
    type: type || "주택형 확인",
    area: u.exclusiveM2 === null ? "면적 확인" : `${u.exclusiveM2}㎡`,
    floor: u.floor ?? "층 확인",
    deposit: u.depositWon === null ? "원문 확인" : formatWon(u.depositWon),
    rent: u.rentWon === null ? "월세 원문 확인" : `월 ${formatWon(u.rentWon)}`,
    station: "",
    ok: Boolean(judgment?.mineTypes.includes(type)),
    otherTarget: judgment ? "다른 대상" : "판정 전",
    prep: judgment?.prepByType[type] ?? "확인 필요",
    siteId: u.siteId ?? undefined,
    // 호마다 좌표가 없어서 그림 지도 위치는 쓰지 않아요 (단지 위치는 카카오맵으로)
    x: 0,
    y: 0,
  };
}
