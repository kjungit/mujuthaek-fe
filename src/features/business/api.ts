"use client";

// 사업공간 실제 API: POST /api/v1/spaces/search (맞춤 목록) · POST /api/v1/spaces/{id}/evaluate (공간 하나의 판정)
// 공간 상세 내용은 공고 상세(GET /notices/{id})를 그대로 써요
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ListingVerdict } from "@/components/ui/Badge";
import { useConditions } from "@/features/conditions/store";
import { formatPeriod } from "@/features/notice/format";
import { providerName, tagLabel } from "@/features/notice/labels";
import { useNotice } from "@/features/notice/queries";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import {
  businessSummary,
  type BusinessSummary,
  type SpaceDetail,
  type SpaceItem,
  type SpaceType,
} from "@/mocks/business";

type Overall = "ELIGIBLE" | "NEEDS_INPUT" | "INELIGIBLE";
type ApiSpaceType = "STARTUP_SPACE" | "SHOP_RENTAL" | "MEETING_ROOM";

/** POST /api/v1/spaces/search 한 줄 (백엔드 SpaceSearchResponse.Item) */
type ApiSpaceItem = {
  id: string;
  /** 사업공간 모집 정책(K-Startup·기업마당)이면 true: 상세 화면 없이 원문으로 */
  policy: boolean;
  spaceType: ApiSpaceType;
  title: string;
  provider: string | null;
  regionName: string | null;
  status: "UPCOMING" | "APPLYING" | "ALWAYS";
  applyStart: string | null;
  applyEnd: string | null;
  dday: number | null;
  overall: Overall;
  /** CONDITIONS_NOT_READY: 판정 틀이 아직 없어요 */
  reason: string | null;
  detailUrl: string | null;
  tags: string[];
};

type ApiSpaceSearch = {
  counts: { eligible: number; needsInput: number; ineligible: number };
  typeCounts: Record<ApiSpaceType, number>;
  items: ApiSpaceItem[];
  nextCursor: string | null;
  hasNext: boolean;
};

type Verdict3 = "MET" | "NOT_MET" | "UNKNOWN";
type ApiCriterion = { id: string; kind: string; result: Verdict3; summary: string | null };

/** POST /api/v1/spaces/{id}/evaluate (백엔드 SpaceEvaluationResponse) */
type ApiSpaceEvaluation = {
  id: string;
  policy: boolean;
  title: string;
  detailUrl: string | null;
  /** 판정 틀이 아직 없으면 null */
  judgment: {
    result: Overall;
    common: ApiCriterion[];
    groups: { id: string; name: string; result: Overall; criteria: ApiCriterion[] }[];
  } | null;
};

/** 판정 입력 (판정 엔진 모양). 사업 입력은 아직 저장하지 않아서 사는 곳만 보내요 */
type SpaceApplicant = { residenceRegionCode?: string };

const typeOf: Record<ApiSpaceType, SpaceType> = {
  STARTUP_SPACE: "startup",
  SHOP_RENTAL: "shop",
  MEETING_ROOM: "room",
};

const verdictOf: Record<Overall, ListingVerdict> = {
  ELIGIBLE: "ok",
  NEEDS_INPUT: "check",
  INELIGIBLE: "no",
};

const statusLabel: Record<ApiSpaceItem["status"], string> = {
  UPCOMING: "접수 예정",
  APPLYING: "접수 중",
  ALWAYS: "상시 모집",
};

/** 판정 조건 종류 → 화면 이름 */
const criterionLabel: Record<string, string> = {
  AGE: "대표자 나이",
  APPLICANT_TYPE: "신청 자격 (개인 · 법인)",
  BUSINESS_CAREER: "업력",
  BUSINESS_REGISTRATION: "사업자 등록",
  EXCLUDED_STATUS: "신청 제한",
  INDUSTRY: "업종",
  NATIONALITY: "국적",
  REGION: "지역",
  STATUS: "대상",
};

/** 이 날 안에 마감하면 "마감 임박" */
const CLOSING_SOON_DAYS = 7;
/** 사업공간은 많지 않아서 한 번에 받아요 */
const PAGE_SIZE = 100;

function dueOf(it: Pick<ApiSpaceItem, "dday" | "status">) {
  if (it.dday === 0) return "오늘 마감";
  if (it.dday !== null) return `D-${it.dday}`;
  return it.status === "ALWAYS" ? "상시" : "마감일 확인";
}

/** 응답 한 줄 → 공간 카드. 모집 정책은 상세 화면이 없어서 원문으로 보내요 */
export function toSpaceItem(it: ApiSpaceItem): SpaceItem {
  return {
    id: it.id,
    type: typeOf[it.spaceType],
    verdict: it.overall === "ELIGIBLE" ? "ok" : "check",
    org: it.policy
      ? ["입주기업 모집", it.regionName].filter(Boolean).join(" · ")
      : [providerName(it.provider), it.regionName].filter(Boolean).join(" · "),
    title: it.title,
    info:
      it.reason === "CONDITIONS_NOT_READY"
        ? `${statusLabel[it.status]} · 자격 조건 정리 중`
        : [statusLabel[it.status], formatPeriod(it.applyStart, it.applyEnd)]
            .filter(Boolean)
            .join(" · "),
    tags: it.tags.map((t) => tagLabel[t]).filter(Boolean),
    money: it.policy ? "원문에서 확인" : "",
    due: dueOf(it),
    externalUrl: it.policy ? (it.detailUrl ?? undefined) : undefined,
  };
}

function useSpaceApplicant(): { ready: boolean; applicant: SpaceApplicant } {
  const stored = useConditions();
  return useMemo(
    () =>
      stored.status === "ready"
        ? {
            ready: true,
            applicant: { residenceRegionCode: stored.device?.regionCode || undefined },
          }
        : { ready: false, applicant: {} },
    [stored],
  );
}

/**
 * 사업공간 홈: 맞춤 목록으로 공간 카드와 개수를 채워요. 사업 지원 칸은 아직 목업이에요 (창업지원 목록 API 전).
 * 불러오는 동안은 빈 목록이에요
 */
export function useApiBusinessSummary() {
  const { ready, applicant } = useSpaceApplicant();
  const q = useQuery({
    queryKey: ["spaces", "search", applicant] as const,
    queryFn: () => api.post<ApiSpaceSearch>(endpoints.spacesSearch, { applicant, size: PAGE_SIZE }),
    enabled: ready,
    staleTime: 60 * 1000,
  });
  const data: BusinessSummary = useMemo(() => {
    const items = q.data?.items ?? [];
    return {
      spaces: {
        count: q.data?.counts.eligible ?? 0,
        closingSoon: items.filter((i) => i.dday !== null && i.dday <= CLOSING_SOON_DAYS).length,
      },
      support: businessSummary.support,
      list: items.map(toSpaceItem),
    };
  }, [q.data]);
  return { data, loading: q.isPending, error: q.isError };
}

/** 공간 상세 (사업공간 공고): 공고 상세 + 이 공간 판정 */
export function useApiSpaceDetail(id: string) {
  const notice = useNotice(id);
  const { ready, applicant } = useSpaceApplicant();
  const evaluation = useQuery({
    queryKey: ["spaces", "evaluate", id, applicant] as const,
    queryFn: () => api.post<ApiSpaceEvaluation>(endpoints.spaceEvaluate(id), { applicant }),
    enabled: ready,
    staleTime: 60 * 1000,
    retry: false,
  });
  const n = notice.data?.kind === "standard" ? notice.data : undefined;
  const data: SpaceDetail | undefined = useMemo(() => {
    if (!n) return undefined;
    const j = evaluation.data?.judgment ?? null;
    const criteria = j ? [...j.common, ...j.groups.flatMap((g) => g.criteria)] : [];
    const schedule = n.doc.schedule.map((s, i) => ({
      step: i + 1,
      title: s.label,
      when: formatPeriod(s.start, s.end) ?? "날짜 미정",
      now: s.state === "now",
    }));
    return {
      id: n.id,
      verdict: j ? verdictOf[j.result] : "check",
      due: n.dueLabel ?? "",
      tag: n.tags[0] ?? "",
      title: n.title,
      kind: n.meta,
      host: "",
      area: "",
      facts: n.facts.map((f) => ({ label: f.label, value: f.value, mValue: f.value })),
      conditions: [],
      docs: n.doc.apply.documents.flatMap((g) =>
        g.items.map((d) => ({
          name: d.name,
          note: [d.when, d.desc].filter(Boolean).join(" · "),
          mNote: d.when ?? d.desc,
          ready: false,
        })),
      ),
      currentStep: schedule.find((s) => s.now)?.step ?? 0,
      schedule,
      rules: criteria
        .filter((c) => c.kind !== "ASK" && c.kind !== "RULE")
        .map((c) => ({
          label: criterionLabel[c.kind] ?? "조건",
          rule: c.summary ?? "",
          mRule: c.summary ?? "",
          met: c.result === "MET",
        })),
      sourceUrl: n.doc.source.detailUrl || undefined,
      notReady: Boolean(evaluation.data) && !j,
    };
  }, [n, evaluation.data]);
  return { data, loading: notice.loading, error: notice.error };
}
