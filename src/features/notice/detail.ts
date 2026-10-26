// GET /api/v1/notices/{id} 응답 (백엔드 NoticeDetailResponse) → 공고 상세 화면 값
import { dueText } from "@/features/notice/format";
import {
  noticeTypeLabel,
  providerName,
  tagLabel,
  targetGroupLabel,
} from "@/features/notice/labels";
import type { NoticeFact, StandardNotice } from "@/mocks/notice";
import type {
  EligibilityCategory,
  NoticeDoc,
  NoticeDocumentGroup,
  NoticeScheduleItem,
} from "@/mocks/notice-doc";

type Evidence = { quote: string; page: number | null };
type TimeRange = { start: string; end: string };

type ApiSchedule = {
  id: string;
  label: string;
  kinds: string[];
  startsAt: string | null;
  endsAt: string | null;
  description: string | null;
  applicationUrl: string | null;
  channels: string[];
  places: { name: string | null; address: string | null; detail: string | null }[];
  dailyHours: TimeRange[];
  excludedDays: string[];
  timeNote: string | null;
  current: boolean;
  evidence: Evidence[];
};

export type ApiNoticeDetail = {
  header: {
    id: string;
    title: string;
    provider: string | null;
    noticeType: string | null;
    supplyTypeText: string | null;
    status: "UPCOMING" | "APPLYING" | "CLOSED" | "ALWAYS" | "UNKNOWN";
    applyStart: string | null;
    applyEnd: string | null;
    dday: number | null;
    regionName: string | null;
    detailUrl: string | null;
  };
  summary: {
    summaryText: string | null;
    targetGroups: string[];
    supplyTotal: number | null;
    exclusiveM2Min: number | null;
    exclusiveM2Max: number | null;
    applicationChannels: string[];
  };
  schedules: ApiSchedule[];
  sites: {
    id: string;
    name: string | null;
    address: string | null;
    lat: number | null;
    lng: number | null;
    tags: string[];
  }[];
  unitTypes: {
    houseType: string;
    exclusiveM2: number | null;
    depositWon: number | null;
    rentWon: number | null;
    supplyCount: number | null;
    evidence: Evidence[];
  }[];
  conditions: {
    id: string;
    category: string | null;
    description: string | null;
    originalText: string | null;
    inReview: boolean;
    evidence: Evidence[];
  }[];
  requiredDocuments: {
    id: string;
    name: string;
    group: string | null;
    appliesTo: string | null;
    submissionTime: string | null;
    description: string | null;
    evidence: Evidence[];
  }[];
  files: { name: string; url: string }[];
  areaSummaries: { siteId: string; kind: "LIVING" | "COMMERCIAL"; score: number }[];
  hasUnits: boolean;
};

const categoryOf: Record<string, EligibilityCategory> = {
  AGE: "AGE",
  HOME_OWNERSHIP: "HOME_OWNERSHIP",
  HOMELESS: "HOME_OWNERSHIP",
  INCOME: "INCOME",
  ASSET: "ASSETS",
  ASSETS: "ASSETS",
  CAR: "CAR_ASSETS",
  CAR_ASSETS: "CAR_ASSETS",
  CAR_VALUE: "CAR_ASSETS",
  RESIDENCE: "RESIDENCE",
  HOUSEHOLD: "HOUSEHOLD",
  NATIONALITY: "NATIONALITY",
};

const channelOf: Record<string, NonNullable<NoticeDoc["apply"]["channel"]>> = {
  ONLINE: "ONLINE",
  ONSITE: "ONSITE",
  EMAIL: "EMAIL",
  MAIL: "MAIL",
  FAX: "FAX",
};

const channelText: Record<string, string> = {
  ONLINE: "온라인",
  ONSITE: "방문",
  EMAIL: "이메일",
  MAIL: "우편",
  FAX: "팩스",
};

const groupOf: Record<string, NoticeDocumentGroup> = {
  COMMON: "COMMON",
  CONDITIONAL: "CONDITIONAL",
  DIRECT: "DIRECT",
  PROXY_SPOUSE: "PROXY_SPOUSE",
  PROXY_OTHER: "PROXY_OTHER",
};

const dayText: Record<string, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
  HOLIDAY: "공휴일",
};

/** "2026-10-01T10:00" · "2026-10-01" → "2026-10-01" */
const dayOf = (v: string | null) => (v ? v.slice(0, 10) : null);

/** 근거 원문 중 가장 앞 쪽 */
const firstPage = (items: { evidence: Evidence[] }[]) => {
  const pages = items.flatMap((i) => i.evidence.map((e) => e.page)).filter((p) => p !== null);
  return pages.length ? Math.min(...pages) : undefined;
};

const hoursText = (s: ApiSchedule) => {
  const hours = s.dailyHours.map((h) => `${h.start}~${h.end}`).join(", ");
  const off = s.excludedDays.map((d) => dayText[d] ?? d).join("·");
  return [hours, off && `${off} 제외`].filter(Boolean).join(" · ") || undefined;
};

function scheduleItem(s: ApiSchedule, today: string): NoticeScheduleItem {
  const end = dayOf(s.endsAt) ?? dayOf(s.startsAt);
  return {
    id: s.id,
    label: s.label,
    start: dayOf(s.startsAt),
    end: dayOf(s.endsAt),
    time: hoursText(s),
    note: s.timeNote ?? s.description ?? undefined,
    state: s.current ? "now" : end && end < today ? "done" : "todo",
  };
}

const statusOf: Record<ApiNoticeDetail["header"]["status"], NoticeDoc["status"]> = {
  UPCOMING: "UPCOMING",
  APPLYING: "OPEN",
  ALWAYS: "OPEN",
  CLOSED: "CLOSED",
  UNKNOWN: "UPCOMING",
};

function dueLabelOf(h: ApiNoticeDetail["header"]) {
  if (h.status === "ALWAYS") return "상시 모집";
  if (h.status === "UPCOMING") return "접수 예정";
  if (h.status === "CLOSED") return "마감";
  if (h.dday === null) return "마감일 확인";
  return h.dday <= 0 ? "오늘 마감" : undefined;
}

function factsOf(d: ApiNoticeDetail): NoticeFact[] {
  const { summary: s } = d;
  const groups = s.targetGroups.map((g) => targetGroupLabel[g]).filter(Boolean);
  const min = s.exclusiveM2Min;
  const max = s.exclusiveM2Max;
  const area =
    min === null && max === null
      ? null
      : min === max || max === null
        ? `${min}㎡`
        : min === null
          ? `${max}㎡`
          : `${min} ~ ${max}㎡`;
  const channels = s.applicationChannels.map((c) => channelText[c]).filter(Boolean);
  return [
    groups.length ? { label: "모집 대상", value: groups.join(" · ") } : null,
    s.supplyTotal !== null ? { label: "공급 호수", value: `${s.supplyTotal}호` } : null,
    area ? { label: "전용면적", value: area } : null,
    channels.length ? { label: "신청 방법", value: channels.join(" · ") } : null,
  ].filter((f): f is NoticeFact => f !== null);
}

function docOf(d: ApiNoticeDetail, today: string): NoticeDoc {
  const { header: h } = d;
  const application = d.schedules.find((s) => s.kinds.includes("APPLICATION"));
  const place = application?.places[0];
  const documents = new Map<NoticeDocumentGroup, NoticeDoc["apply"]["documents"][number]>();
  for (const r of d.requiredDocuments) {
    const group = groupOf[r.group ?? ""] ?? "COMMON";
    const g = documents.get(group) ?? { group, items: [] };
    g.items.push({
      id: r.id,
      name: r.name,
      when: [r.appliesTo, r.submissionTime].filter(Boolean).join(" · ") || undefined,
      desc: r.description ?? "",
    });
    documents.set(group, g);
  }
  const start = h.applyStart ?? h.applyEnd;
  const end = h.applyEnd ?? h.applyStart;
  const sites = d.sites.filter((s) => s.name || s.address);

  return {
    status: statusOf[h.status],
    applyPeriod: start && end ? { start, end, note: application && hoursText(application) } : null,
    summary: d.summary.summaryText ?? "",
    source: {
      fileName: d.files[0]?.name ?? "",
      // 원문 PDF는 아직 우리 저장소에 없어서 기관 사이트로 보내요
      pdfUrl: null,
      pageCount: null,
      detailUrl: h.detailUrl ?? d.files[0]?.url ?? "",
    },
    pages: {
      eligibility: firstPage(d.conditions),
      housing: firstPage(d.unitTypes),
      schedule: firstPage(d.schedules),
      apply: firstPage(d.requiredDocuments),
    },
    eligibility: d.conditions.map((c) => ({
      id: c.id,
      category: categoryOf[c.category ?? ""] ?? "OTHER",
      text: c.description ?? c.originalText ?? "",
      detail: c.inReview ? "원문과 다시 확인하는 중이에요" : undefined,
    })),
    housing: d.unitTypes.length
      ? [
          {
            id: "unit-types",
            complexName: sites.map((s) => s.name ?? s.address).join(" · ") || h.title,
            address: sites[0]?.address ?? h.regionName ?? "",
            types: d.unitTypes.map((u) => ({
              code: u.houseType,
              areaSqm: u.exclusiveM2,
              offered: u.supplyCount,
              depositWon: u.depositWon,
              monthlyRentWon: u.rentWon,
            })),
          },
        ]
      : [],
    // 날짜순 (날짜 없는 일정은 뒤로)
    schedule: d.schedules
      .map((s) => scheduleItem(s, today))
      .sort((a, b) => (a.start ?? "9999").localeCompare(b.start ?? "9999")),
    apply: {
      // 일정 설명은 일정 칸에 있어서 여기엔 다시 쓰지 않아요
      method: "",
      channel: channelOf[application?.channels[0] ?? ""] ?? null,
      url: application?.applicationUrl ?? undefined,
      place:
        place && (place.name || place.address)
          ? { name: place.name ?? "", address: place.address ?? "" }
          : undefined,
      hours: application && hoursText(application),
      documents: [...documents.values()],
    },
    // 아래 목차는 추출 결과에 아직 없어요
    selection: [],
    cautions: [],
    living: [],
    contacts: [],
  };
}

/** "2026-10-26" (한국 날짜) */
const todayYmd = (now: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(now);

/** 상세 응답 → 화면 값. 판정(배지 · 내 자격 · 준비할 돈)은 판정 응답에서 따로 채워요 */
export function toNotice(d: ApiNoticeDetail, now = new Date()): StandardNotice {
  const { header: h } = d;
  const living = d.areaSummaries.filter((a) => a.kind === "LIVING").map((a) => a.score);
  const tags = [...new Set(d.sites.flatMap((s) => s.tags))].map((t) => tagLabel[t]).filter(Boolean);
  const agency = providerName(h.provider);
  const notice: StandardNotice = {
    kind: "standard",
    id: h.id,
    verdict: "check",
    dday: Math.max(0, h.dday ?? 0),
    tags,
    title: h.title,
    meta: [
      agency,
      h.supplyTypeText ?? (h.noticeType ? noticeTypeLabel[h.noticeType] : null),
      h.regionName,
    ]
      .filter(Boolean)
      .join(" · "),
    agency: agency ?? "기관",
    facts: factsOf(d),
    eligibility: [],
    doc: docOf(d, todayYmd(now)),
    life: living.length ? { score: Math.round(Math.max(...living)), items: [] } : undefined,
    sites: d.sites.map((s) => ({
      id: s.id,
      name: s.name ?? s.address ?? "단지",
      lat: s.lat,
      lng: s.lng,
    })),
    hasUnits: d.hasUnits,
  };
  notice.dueLabel = dueLabelOf(h) ?? dueText(notice);
  return notice;
}
