"use client";

// 사업공간 실제 API: POST /api/v1/spaces/search (맞춤 목록) · POST /api/v1/spaces/{id}/evaluate (공간 하나의 판정)
// 사업 지원: POST /api/v1/supports/search · POST /api/v1/supports/{id}/evaluate (창업지원 사업, 상세 API 없이 판정 응답으로)
// 공간 상세: 공고면 공고 상세(GET /notices/{id}) + 판정, 모집 정책(K-Startup·기업마당)은 판정 응답(기간·지역·자격 조건)만으로
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ListingVerdict } from "@/components/ui/Badge";
import {
  toBusinessApplicant,
  useBizProfileInput,
  type BizProfileInput,
  type BusinessApplicant,
} from "@/features/business/profile";
import { useConditions } from "@/features/conditions/store";
import { formatPeriod } from "@/features/notice/format";
import { providerName, tagLabel } from "@/features/notice/labels";
import { useNotice } from "@/features/notice/queries";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { snapshotRegions } from "@/lib/regions";
import {
  type BusinessSummary,
  type SpaceDetail,
  type SpaceItem,
  type SpaceType,
  type SupportItem,
  type SupportList,
  type SupportType,
} from "@/mocks/business";
import { routes } from "@/lib/routes";

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

type ApiSubField = "FUND" | "LOAN" | "TAX";

/** POST /api/v1/supports/search 한 줄 (백엔드 SupportSearchResponse.Item) */
type ApiSupportItem = {
  id: string;
  source: PolicySource | null;
  /** 이름으로 정한 지원 종류 */
  subField: ApiSubField;
  title: string;
  regionCodes: string[] | null;
  status: ApiSpaceItem["status"];
  applyStart: string | null;
  applyEnd: string | null;
  dday: number | null;
  overall: Overall;
  reason: string | null;
  groups: string[];
  missingInputs: { field: string; label: string }[];
  detailUrl: string | null;
};

type ApiSupportSearch = {
  counts: { eligible: number; needsInput: number; ineligible: number };
  subFieldCounts: Record<ApiSubField, number>;
  items: ApiSupportItem[];
  nextCursor: string | null;
  hasNext: boolean;
};

/** POST /api/v1/supports/{id}/evaluate (백엔드 SupportEvaluationResponse). 판정 응답 모양은 사업공간과 같아요 */
type ApiSupportEvaluation = Omit<ApiSpaceEvaluation, "policy"> & { subField: ApiSubField };

/** 판정 입력 (판정 엔진 모양): 사는 곳 + 사업 정보. 나이는 엔진이 생년월일을 받아서 아직 보내지 않아요 (구간만 보내는 원칙) */
type SpaceApplicant = { residenceRegionCode?: string; business?: BusinessApplicant };

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

function applicantOf(
  residence: string | undefined,
  profile: BizProfileInput | null,
  revenue: string,
): SpaceApplicant {
  return {
    residenceRegionCode: residence || undefined,
    business: profile ? toBusinessApplicant(profile, revenue) : undefined,
  };
}

function useSpaceApplicant(): { ready: boolean; applicant: SpaceApplicant } {
  const stored = useConditions();
  const biz = useBizProfileInput();
  return useMemo(
    () =>
      stored.status === "ready" && biz.status === "ready"
        ? {
            ready: true,
            applicant: applicantOf(stored.device?.regionCode, biz.profile, biz.revenue),
          }
        : { ready: false, applicant: {} },
    [stored, biz],
  );
}

/** 사업 정보 입력 화면의 "지금 조건으로": 고치는 중인 값으로 공간 · 지원 개수를 바로 세요 */
export function useApiBusinessPreview(draft: BizProfileInput, revenue: string) {
  const stored = useConditions();
  const applicant = useMemo(
    () =>
      applicantOf(
        stored.status === "ready" ? stored.device?.regionCode : undefined,
        draft,
        revenue,
      ),
    [stored, draft, revenue],
  );
  const body = { applicant, size: 1 };
  const spaces = useQuery({
    queryKey: ["spaces", "preview", applicant] as const,
    queryFn: () => api.post<ApiSpaceSearch>(endpoints.spacesSearch, body),
    enabled: stored.status === "ready",
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
  const supports = useQuery({
    queryKey: ["supports", "preview", applicant] as const,
    queryFn: () => api.post<ApiSupportSearch>(endpoints.supportsSearch, body),
    enabled: stored.status === "ready",
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  });
  return {
    spaces: spaces.data?.counts.eligible ?? 0,
    support: supports.data?.counts.eligible ?? 0,
    check: (spaces.data?.counts.needsInput ?? 0) + (supports.data?.counts.needsInput ?? 0),
  };
}

/**
 * 사업공간 홈: 공간 맞춤 목록으로 공간 카드와 개수를, 사업 지원 맞춤 목록으로 지원 개수를 채워요.
 * 불러오는 동안은 빈 목록이에요
 */
export function useApiBusinessSummary() {
  const { ready, applicant } = useSpaceApplicant();
  const supports = useApiSupportSearch();
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
      support: supports.data
        ? {
            count: supports.data.counts.eligible,
            needCheck: supports.data.counts.needsInput,
          }
        : { count: 0, needCheck: 0 },
      list: items.map(toSpaceItem),
    };
  }, [q.data, supports.data]);
  return { data, loading: q.isPending, error: q.isError };
}

function useApiSupportSearch() {
  const { ready, applicant } = useSpaceApplicant();
  return useQuery({
    queryKey: ["supports", "search", applicant] as const,
    queryFn: () =>
      api.post<ApiSupportSearch>(endpoints.supportsSearch, { applicant, size: PAGE_SIZE }),
    enabled: ready,
    staleTime: 60 * 1000,
  });
}

const subFieldOf: Record<ApiSubField, SupportType> = { FUND: "fund", LOAN: "loan", TAX: "tax" };

/** 판정 이유 한 줄: 지원 가능이면 충족한 대상, 확인 필요면 넣을 입력 */
function supportReason(it: ApiSupportItem) {
  if (it.reason === "CONDITIONS_NOT_READY") return "자격 조건 정리 중";
  if (it.overall === "ELIGIBLE")
    return it.groups.length ? `${it.groups.join(" · ")} 충족` : "조건 충족";
  const inputs = it.missingInputs.map((m) => m.label).slice(0, 2);
  return inputs.length
    ? `${inputs.join(" · ")}를 넣으면 판정돼요`
    : "원문에서 조건을 확인해 주세요";
}

/** 응답 한 줄 → 사업 지원 줄. 지원 금액은 판정 틀에 없어서 원문에서 */
export function toSupportItem(it: ApiSupportItem): SupportItem {
  const org = [it.source ? sourceLabel[it.source] : null, regionLabelOf(it.regionCodes)]
    .filter(Boolean)
    .join(" · ");
  const period = formatPeriod(it.applyStart, it.applyEnd);
  const reason = supportReason(it);
  return {
    id: it.id,
    type: subFieldOf[it.subField],
    status: it.overall === "ELIGIBLE" ? "ok" : "check",
    title: it.title,
    org,
    mOrg: org,
    body: "지원 내용은 원문에서 확인",
    note: period ? `${statusLabel[it.status]} · ${period}` : statusLabel[it.status],
    mBody: period ?? statusLabel[it.status],
    reason,
    mReason: reason,
    summary: [org, period].filter(Boolean).join(" · "),
    due: dueOf(it),
    href: `${routes.bizSupport}/${encodeURIComponent(it.id)}`,
  };
}

/** 사업 지원 목록 (불러오는 동안은 빈 목록) */
export function useApiSupportList() {
  const q = useApiSupportSearch();
  const data: SupportList = useMemo(() => {
    const items = q.data?.items ?? [];
    return {
      count: q.data?.counts.eligible ?? 0,
      baseDate: new Intl.DateTimeFormat("ko-KR", {
        month: "long",
        day: "numeric",
        timeZone: "Asia/Seoul",
      }).format(new Date()),
      items: items.map(toSupportItem),
      missingSiteCount: items.filter((i) =>
        i.missingInputs.some((m) => m.field.includes("siteRegionCode")),
      ).length,
    };
  }, [q.data]);
  return { data, loading: q.isPending, error: q.isError };
}

/** 사업 지원 상세: 상세 API가 없어서 판정 응답(기간 · 지역 · 자격 조건)과 원문으로 */
export function useApiSupportDetail(id: string) {
  const { ready, applicant } = useSpaceApplicant();
  const q = useQuery({
    queryKey: ["supports", "evaluate", id, applicant] as const,
    queryFn: () => api.post<ApiSupportEvaluation>(endpoints.supportEvaluate(id), { applicant }),
    enabled: ready,
    staleTime: 60 * 1000,
    retry: false,
  });
  const data = useMemo(
    () =>
      q.data &&
      policyDetail(q.data, {
        kind: supportKindLabel[q.data.subField],
        note: "지원 금액 · 신청 방법 · 제출 서류는 원문에서 확인해 주세요",
      }),
    [q.data],
  );
  return { data, loading: !q.isError && q.isPending, error: q.isError };
}

const supportKindLabel: Record<ApiSubField, string> = {
  FUND: "창업 지원금",
  LOAN: "정책자금",
  TAX: "세금 감면",
};

/** 판정 설명 안의 법정동코드(10자리)를 지역 이름으로 ("4400000000 지역 안" → "충남 지역 안") */
const withRegionNames = (text: string) =>
  text.replace(/\b\d{10}\b/g, (code) => regionLabelOf([code]) ?? code);

/** 판정 조건 → 내 자격 줄. 근거 문장이 있으면 같이 */
function rulesOf(j: ApiSpaceEvaluation["judgment"]): SpaceDetail["rules"] {
  const criteria = j ? [...j.common, ...j.groups.flatMap((g) => g.criteria)] : [];
  return criteria
    .filter((c) => c.kind !== "RULE" && (c.summary || c.quote))
    .map((c) => ({
      label: criterionLabel[c.kind] ?? "조건",
      rule: withRegionNames(c.summary ?? c.quote ?? ""),
      mRule: withRegionNames(c.summary ?? c.quote ?? ""),
      quote: c.summary && c.quote ? c.quote : undefined,
      met: c.result === "MET",
    }));
}

/** 모집 정책·사업 지원 상세: 공고 상세가 없어서 판정 응답(기간 · 지역 · 자격 조건)과 원문으로 */
function policyDetail(
  e: Omit<ApiSpaceEvaluation, "policy">,
  text = {
    kind: "입주기업 모집",
    note: "입주 공간 · 기간 · 비용 · 준비 서류는 원문에서 확인해 주세요",
  },
): SpaceDetail {
  const period = formatPeriod(e.applyStart, e.applyEnd);
  const region = regionLabelOf(e.regionCodes);
  const source = e.source ? sourceLabel[e.source] : "원문";
  return {
    id: e.id,
    verdict: e.judgment ? verdictOf[e.judgment.result] : "check",
    due: dueOf(e),
    tag: statusLabel[e.status],
    title: e.title,
    kind: text.kind,
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
    summaryNote: text.note,
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
