"use client";

// 사업공간 실제 API: POST /api/v1/spaces/search (맞춤 목록) · POST /api/v1/spaces/{id}/evaluate (공간 하나의 판정)
// 공간 상세: 공고면 공고 상세(GET /notices/{id}) + 판정, 모집 정책(K-Startup·기업마당)은 판정 응답(기간·지역·자격 조건)만으로
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ListingVerdict } from "@/components/ui/Badge";
import { useConditions } from "@/features/conditions/store";
import { formatPeriod } from "@/features/notice/format";
import { providerName, tagLabel } from "@/features/notice/labels";
import { useNotice } from "@/features/notice/queries";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { snapshotRegions } from "@/lib/regions";
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
  /** 사업공간 모집 정책(K-Startup·기업마당)이면 true: 공고 상세 대신 판정 응답으로 상세를 보여줘요 */
  policy: boolean;
  source: PolicySource | null;
  spaceType: ApiSpaceType;
  title: string;
  provider: string | null;
  regionName: string | null;
  /** 법정동코드 10자리. 전국은 빈 목록, 모르면 null */
  regionCodes: string[] | null;
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

type PolicySource = "KSTARTUP" | "BIZINFO";
type Verdict3 = "MET" | "NOT_MET" | "UNKNOWN";
type ApiCriterion = {
  id: string;
  kind: string;
  result: Verdict3;
  summary: string | null;
  /** 근거 원문 문장 */
  quote: string | null;
};

/** POST /api/v1/spaces/{id}/evaluate (백엔드 SpaceEvaluationResponse) */
type ApiSpaceEvaluation = {
  id: string;
  policy: boolean;
  source: PolicySource | null;
  title: string;
  detailUrl: string | null;
  applyStart: string | null;
  applyEnd: string | null;
  dday: number | null;
  status: ApiSpaceItem["status"];
  regionCodes: string[] | null;
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

const sourceLabel: Record<PolicySource, string> = { KSTARTUP: "K-Startup", BIZINFO: "기업마당" };

/** 지역 법정동코드(10자리) → "서울 종로구" · 시도 전체면 "서울". 여러 곳이면 "서울 종로구 외 1곳" */
function regionLabelOf(codes: string[] | null) {
  if (!codes?.length) return codes ? "전국" : null;
  const code = codes[0].slice(2, 5) === "000" ? codes[0].slice(0, 2) : codes[0].slice(0, 5);
  const label = snapshotRegions.label(code);
  return codes.length > 1 ? `${label} 외 ${codes.length - 1}곳` : label;
}

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
  ASK: "확인할 것",
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

/** 응답 한 줄 → 공간 카드. 모집 정책은 출처(K-Startup · 기업마당)와 지역을 보여줘요 */
export function toSpaceItem(it: ApiSpaceItem): SpaceItem {
  return {
    id: it.id,
    type: typeOf[it.spaceType],
    verdict: it.overall === "ELIGIBLE" ? "ok" : "check",
    org: it.policy
      ? [it.source ? sourceLabel[it.source] : "입주기업 모집", regionLabelOf(it.regionCodes)]
          .filter(Boolean)
          .join(" · ")
      : [providerName(it.provider), it.regionName].filter(Boolean).join(" · "),
    title: it.title,
    info:
      it.reason === "CONDITIONS_NOT_READY"
        ? `${statusLabel[it.status]} · 자격 조건 정리 중`
        : [statusLabel[it.status], formatPeriod(it.applyStart, it.applyEnd)]
            .filter(Boolean)
            .join(" · "),
    tags: it.tags.map((t) => tagLabel[t]).filter(Boolean),
    money: it.policy ? "입주 조건은 원문에서 확인" : "",
    due: dueOf(it),
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

/** 판정 조건 → 내 자격 줄. 근거 문장이 있으면 같이 */
function rulesOf(j: ApiSpaceEvaluation["judgment"]): SpaceDetail["rules"] {
  const criteria = j ? [...j.common, ...j.groups.flatMap((g) => g.criteria)] : [];
  return criteria
    .filter((c) => c.kind !== "RULE" && (c.summary || c.quote))
    .map((c) => ({
      label: criterionLabel[c.kind] ?? "조건",
      rule: c.summary ?? c.quote ?? "",
      mRule: c.summary ?? c.quote ?? "",
      quote: c.summary && c.quote ? c.quote : undefined,
      met: c.result === "MET",
    }));
}

/** 모집 정책 상세: 공고 상세가 없어서 판정 응답(기간 · 지역 · 자격 조건)과 원문으로 */
function policyDetail(e: ApiSpaceEvaluation): SpaceDetail {
  const period = formatPeriod(e.applyStart, e.applyEnd);
  const region = regionLabelOf(e.regionCodes);
  const source = e.source ? sourceLabel[e.source] : "원문";
  return {
    id: e.id,
    verdict: e.judgment ? verdictOf[e.judgment.result] : "check",
    due: dueOf(e),
    tag: statusLabel[e.status],
    title: e.title,
    kind: "입주기업 모집",
    host: e.source ? sourceLabel[e.source] : "",
    area: region ?? "",
    facts: [
      { label: "접수 기간", value: period ?? "원문 확인", mValue: period ?? "원문 확인" },
      { label: "지역", value: region ?? "원문 확인", mValue: region ?? "원문 확인" },
      { label: "출처", value: source, mValue: source },
    ],
    conditions: [],
    docs: [],
    currentStep: 0,
    schedule: [],
    rules: rulesOf(e.judgment),
    sourceUrl: e.detailUrl ?? undefined,
    notReady: !e.judgment,
    summaryNote: "입주 공간 · 기간 · 비용 · 준비 서류는 원문에서 확인해 주세요",
  };
}

/** 공간 상세: 판정을 먼저 받고, 공고면 공고 상세를 더 받아요 (모집 정책은 공고 상세가 없어요) */
export function useApiSpaceDetail(id: string) {
  const { ready, applicant } = useSpaceApplicant();
  const evaluation = useQuery({
    queryKey: ["spaces", "evaluate", id, applicant] as const,
    queryFn: () => api.post<ApiSpaceEvaluation>(endpoints.spaceEvaluate(id), { applicant }),
    enabled: ready,
    staleTime: 60 * 1000,
    retry: false,
  });
  const notice = useNotice(id, evaluation.data?.policy === false);
  const n = notice.data?.kind === "standard" ? notice.data : undefined;
  const data: SpaceDetail | undefined = useMemo(() => {
    const e = evaluation.data;
    if (e?.policy) return policyDetail(e);
    if (!n) return undefined;
    const j = e?.judgment ?? null;
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
      rules: rulesOf(j),
      sourceUrl: n.doc.source.detailUrl || undefined,
      notReady: Boolean(e) && !j,
    };
  }, [n, evaluation.data]);
  const loading =
    !evaluation.isError && (evaluation.isPending || (!evaluation.data?.policy && notice.loading));
  return { data, loading, error: evaluation.isError || notice.error };
}
