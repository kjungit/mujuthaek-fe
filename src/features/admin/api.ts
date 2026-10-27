/**
 * 관리자 화면을 백엔드 관리자 API(mujuthaek-be services/api, /api/admin/**)에 연결하는 어댑터.
 * 백엔드 응답을 화면이 쓰는 타입(@/mocks/admin)으로 바꿔요. NEXT_PUBLIC_USE_MOCKS=false일 때만 써요.
 * 관리자 API는 ADMIN 로그인이 필요해요(토큰은 공통 API 클라이언트가 붙여요).
 */
import { api } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import type { BotTrafficData, TrafficData } from "@/mocks/admin-traffic";
import type {
  AdminCriteria,
  AdminCounts,
  AdminOverview,
  AdminTodo,
  ReportItem,
  ReportStatus,
  ReviewItem,
  ReviewReason,
  SourcePartKind,
  SourceRow,
  SourceRun,
  SourceStatus,
} from "@/mocks/admin";

// ---------- 공통 ----------
const KST = "Asia/Seoul";

function when(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    timeZone: KST,
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ago(iso?: string | null) {
  if (!iso) return "-";
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `${min}분 전`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
}

function span(iso?: string | null) {
  if (!iso) return "-";
  const h = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  return h < 24 ? `${h}시간` : `${Math.round(h / 24)}일`;
}

// ---------- 검수 (공고 + 혜택 정책) ----------
type NoticeReviewList = {
  total: number;
  items: { id: string; reason: string; title: string; applyEndsOn: string | null }[];
};
type NoticeReviewDetail = {
  id: string;
  reason: string;
  title: string;
  field: string;
  provider: string | null;
  sourceCode: string;
  rawVersion: number;
  receivedAt: string;
  detailUrl: string | null;
  issues: { code: string; target: string | null }[];
  fields: {
    path: string;
    section: string;
    label: string;
    status: string;
    value: unknown;
    display: string | null;
    editable: boolean;
    reasons: string[];
    codes?: string[];
    sourceIds: string[];
  }[];
  sources: { id: string; page: number | null; quote: string }[];
  impact: string | null;
  log: { at: string; who: string; text: string }[];
};
type BenefitReviewList = {
  items: {
    id: string;
    title: string;
    reasons: string[];
    reported: boolean;
    sourceCode: string | null;
  }[];
};
type BenefitCondition = {
  type: string;
  value: unknown;
  group: number;
  known: boolean;
  origin: string;
  rawText: string;
  evidence: string;
  confidence: number;
};
const BENEFIT_SOURCE: Record<string, string> = {
  youth: "온통청년",
  gov24: "정부24",
  bokjiro_central: "복지로(중앙부처)",
  bokjiro_local: "복지로(지자체)",
};
type BenefitReviewDetail = {
  id: string;
  /** 목록에서 붙여요(상세 응답에는 없음) */
  sourceCode?: string | null;
  rawVersion: number;
  status: string;
  reasons: string[];
  queuedAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  note: string | null;
  result: {
    summary: string | null;
    howToApply: string | null;
    contact: string | null;
    relevant: boolean;
    relevanceReason: string;
    source: { title: string; agency: string | null; detailUrl: string | null };
    supports: { kind: string; amountMax: number | null; ratePct: number | null; rawText: string }[];
    conditions: BenefitCondition[];
    quality: { confidence: number };
  };
  source: { title: string | null; text: string | null; detailUrl: string | null };
};

/** 화면의 칸 이름 → 백엔드 칸별 수정 경로. 승인할 때 고친 칸을 edits로 바꿔요. */
export type FieldMeta = { path: string; json: boolean; editable: boolean };
export type ReviewMeta = {
  kind: "notice" | "benefit";
  id: string;
  fields: Record<string, FieldMeta>;
  detailUrl: string | null;
};
export const reviewMeta = new Map<string, ReviewMeta>();

const REASON: Record<string, ReviewReason> = { MUST: "must", CHECK: "low", FORMAT: "format" };
const TYPE_KO: Record<string, string> = {
  AGE: "나이",
  RESIDENCE: "거주",
  INCOME_AMOUNT: "소득",
  INCOME_MEDIAN_PCT: "중위소득",
  ASSET_AMOUNT: "자산",
  HOMELESS: "무주택",
  LEASE: "임대 조건",
  MARITAL: "혼인",
  EDUCATION: "학력",
  EMPLOYMENT: "취업",
  OCCUPATION: "직업",
  WORKPLACE: "직장",
  PREGNANCY: "임신·출산",
  OTHER: "기타",
  EXCLUSIVE: "중복 불가",
  PRIORITY: "우선순위",
};

// 혜택 지원 종류 코드 → 화면 말 (policy.extracted supports[].kind)
const SUPPORT_KO: Record<string, string> = {
  RENT: "월세·임대료",
  DEPOSIT_LOAN: "전월세 보증금 대출",
  PURCHASE_LOAN: "주택 구입 대출",
  HOUSING_SUPPLY: "집 제공",
  MOVE_IN_GRANT: "전입·정착 지원금",
  CASH: "현금 지원",
  OTHER: "기타 지원",
};

// 수집 회차 상태 → 화면 말
const RUN_KO: Record<string, string> = {
  SUCCESS: "성공",
  FAILED: "실패",
  RUNNING: "수집 중",
  PARTIAL: "일부 실패",
};

// 검수 이유 코드 → 사람이 읽는 말 (백엔드 이슈 코드, 혜택 reviewReasons)
const ISSUE_KO: Record<string, string> = {
  PDF_MISSING: "첨부 공고문(PDF)이 없어 게시글만 읽었어요",
  PDF_TEXT_UNREADABLE: "PDF 글자를 읽지 못했어요(스캔 이미지 등)",
  SOURCE_IN_IMAGE_SUSPECTED: "내용이 이미지 안에 있는 것 같아요",
  AI_OUTPUT_ITEM_DROPPED: "AI 결과 일부가 형식이 맞지 않아 빠졌어요",
  AI_OUTPUT_INVALID: "AI 결과 형식이 잘못됐어요",
  VALUE_NOT_IN_QUOTE: "값이 근거 문장에서 확인되지 않아요",
  COVERAGE_PARTIAL_REPORTED: "AI가 일부만 읽었다고 알렸어요",
  CRITERION_NOT_STRUCTURED: "조건을 값으로 바꾸지 못해 글로만 남았어요",
  RELATION_UNRESOLVED: "정정·후속 공고의 원래 공고를 찾지 못했어요",
  LOW_CONFIDENCE:
    "확실하지 않은 값이 있어요(기준이 원문에 없거나, 같은 문장에 다른 금액이 있는 등)",
  RULE_AI_CONFLICT: "출처 항목 값과 원문 글에서 읽은 값이 달라요",
  EVIDENCE_NOT_FOUND: "AI가 든 근거 문장이 원문에 없어요",
  TEXT_TRUNCATED: "원문이 길어 일부만 읽었어요",
  NO_DOCUMENT: "첨부 문서 없이 정책 항목만으로 읽었어요(참고)",
  REPORTED: "다시 열린 검수예요(회원 제보나 원문 대조, 아래 기록의 메모 참고)",
  CONTRACT_EXCEPTIONS_NOT_REVIEWED: "예외 조건을 AI가 다 살폈는지 확인되지 않았어요",
  CONTRACT_INCOMPLETE_EXTRACTION: "추출이 끝까지 되지 않았어요",
  CONTRACT_UNRESOLVED_MISSING_FIELD: "빠진 칸이 아직 채워지지 않았어요",
  COUNT_KIND_SUSPECTED: "호수를 표의 다른 열에서 읽은 것 같아요",
  COUNT_MERGED_AMBIGUOUS: "합쳐진 호수를 나누기 어려워요",
  COVERAGE_FAILED: "읽어야 할 부분을 읽지 못했어요",
  COVERAGE_PARTIAL: "일부만 읽었어요",
  ELIGIBILITY_OMISSION_SUSPECTED: "원문에 있는 자격 조건이 빠진 것 같아요",
  EVIDENCE_AMBIGUOUS: "근거 문장이 여러 곳에 있어 어느 것인지 애매해요",
  EVIDENCE_QUOTE_NOT_FOUND: "근거 문장을 원문에서 찾지 못했어요",
  EVIDENCE_SCATTERED: "근거 낱말이 원문에 흩어져 있어요",
  EXCEPTION_SUSPECTED: "예외 조건이 있는 것 같아요",
  ITEM_DROPPED_NO_EVIDENCE: "근거를 찾지 못한 항목을 뺐어요",
  ITEM_QUARANTINED: "형식 오류로 항목을 뺐어요",
  MISSING_FIELD_HAS_VALUE: "AI가 없다고 한 칸에 값이 있어요",
  ORIGINAL_TEXT_NOT_FOUND: "원문 그대로여야 하는 문장이 원문에 없어요",
  PRICE_PLAN_MIXED: "보증금·임대료 전환안 금액이 섞였을 수 있어요",
  PRICE_VALUES_UNUSED: "원문 금액 일부가 쓰이지 않았어요",
  TIER_CONDITION_MISSING: "가구원 수·자녀 수별 기준이 구분되지 않았어요",
  VALUE_POSITION_SUSPECTED: "표의 다른 칸 값을 읽은 것 같아요",
  AI_OUTPUT_VALUE_CHANGED: "AI가 준 값을 프로그램이 바꾸거나 비웠어요(원문 확인 필요)",
  // 2026-10-26 원문 대조 뒤 더한 코드들(번역이 없으면 영어 코드가 그대로 보였음)
  AI_TEXT_FOREIGN_SCRIPT: "AI가 쓴 문장에 원문에 없는 외국 문자(일본어·한자)가 섞였어요",
  AI_OUTPUT_FIELD_CLEARED: "형식이 맞지 않는 칸을 비웠어요",
  AI_OUTPUT_ITEM_COERCED: "AI가 준 항목의 칸을 형식에 맞게 바꿨어요",
  AI_OUTPUT_ID_RENAMED: "겹친 항목 번호를 바꿨어요(참고)",
  DETAIL_UNVERIFIED_CLEARED: "근거에서 확인하지 못한 세부 칸(시각·장소·부수 등)을 비웠어요",
  INCOMPLETE_EXTRACTION: "추출이 끝까지 되지 않았어요",
  UNRESOLVED_MISSING_FIELD: "빠진 칸이 아직 채워지지 않았어요",
  EXCEPTIONS_NOT_REVIEWED: "예외 조건을 AI가 다 살폈는지 확인되지 않았어요",
  API_MISMATCH: "공공 API 값과 원문에서 읽은 값이 달라요",
  OPERATOR_MISMATCH: "이상·이하 같은 비교 방향이 원문과 달라 보여요",
  EVIDENCE_QUOTE_TOO_SHORT: "근거 문장이 너무 짧아 어디인지 확실하지 않아요",
  EVIDENCE_FROM_IMAGE: "근거가 그림 속 글자(AI가 옮겨 씀)예요",
  IMAGE_TRANSCRIBED_VALUES: "그림 속 글자를 옮긴 값이에요(참고)",
  ITEM_WITHOUT_EVIDENCE: "근거 문장이 없는 항목이에요",
  CLAIM_UNSUPPORTED: "설명 문장이 근거 문장과 맞지 않아요",
  COUNT_TOTAL_SUSPECTED: "합계를 유형별 호수로 읽은 것 같아요",
  SUPPLY_PRICE_MISSING: "주택형에 금액이 없어요",
  SUPPLY_PRICE_UNATTACHED: "금액이 어느 주택형인지 붙지 않았어요",
  PRICE_SCOPE_UNCERTAIN: "금액이 어느 대상·주택형 것인지 확실하지 않아요",
  PRICE_UNIT_MISMATCH: "금액 단위가 원문과 달라 보여요",
  PRICE_ROWS_UNUSED: "원문 금액 표 일부가 쓰이지 않았어요",
  RENT_EXCEEDS_DEPOSIT: "월 임대료가 보증금보다 커요(뒤바뀜 의심)",
  CONVERSION_DIRECTION_UNCERTAIN: "보증금 전환 방향(올림·내림)이 확실하지 않아요",
  CONVERSION_DIRECTION_CORRECTED: "보증금 전환 방향을 숫자에 맞게 고쳤어요(참고)",
  DOCUMENT_OMISSION_SUSPECTED: "원문 서류 표에 있는 서류가 빠진 것 같아요",
  DOCUMENT_GROUP_CONFLICT: "서류가 공통·해당자 중 어디인지 엇갈려요",
  LIST_OMISSION_SUSPECTED: "원문 목록 일부가 빠진 것 같아요",
  SECTION_OMISSION_SUSPECTED: "원문에 있는 내용 묶음이 통째로 빠진 것 같아요",
  SCORING_OMISSION_SUSPECTED: "배점표 일부가 빠진 것 같아요",
  SCHEDULE_ORDER_SUSPECTED: "일정 순서가 이상해요",
  SCOPE_LOCATION_CONFLICT: "적용 단지가 서로 엇갈려요",
  SUPPLY_TYPE_AMBIGUOUS: "공급 유형이 확실하지 않아요",
  RELATION_INCONSISTENT: "정정·후속 공고 관계가 맞지 않아요",
  RENEWAL_CRITERION_IN_ELIGIBILITY: "재계약 기준이 신청 자격에 섞였어요",
  NOT_A_NOTICE_SUSPECTED: "모집 공고가 아닌 안내 글 같아요",
  UNITS_DISAGREE: "주택 목록과 공고문 값이 달라요",
  VALUE_OUT_OF_RANGE: "값이 있을 수 없는 범위예요",
  MISSING_FIELD_NEEDS_REVIEW: "빈칸 이유를 확인해야 해요",
  PDF_PAGES_UNREADABLE: "PDF 일부 쪽을 읽지 못했어요",
  PDF_TOO_LONG: "PDF가 너무 길어 일부만 읽었어요",
  SOURCE_TEXT_EMPTY: "원문 글자가 비어 있어요",
  ATTACHMENT_TYPE_UNSUPPORTED: "공고문이 읽을 수 없는 형식(HWP 등)이에요",
  ATTACHMENT_UNAVAILABLE: "첨부 파일을 받지 못했어요",
  NOTICE_DOC_NOT_PDF: "공고문이 PDF가 아니에요(HWP 등)",
};
const TARGET_KO: Record<string, string> = {
  documents: "첨부 문서",
  supplyGroups: "공급 주택",
  eligibility: "자격 조건",
  schedules: "일정",
  locations: "위치",
  requiredDocuments: "제출 서류",
  announcedOn: "공고일",
  units: "주택 목록",
};
function issueText(code: string, target: string | null) {
  const base = code.replace(/:$/, "");
  // 계약 검사 코드는 「CONTRACT_」를 떼고도 찾아요. 모르는 코드는 영어 코드 대신 일반 문구로(내부 용어가 보이지 않게)
  const text =
    ISSUE_KO[base] ??
    ISSUE_KO[base.replace(/^(CONTRACT_|COVERAGE_)/, "")] ??
    (base.startsWith("CONTRACT_") || base.startsWith("SCHEMA")
      ? "형식·완료 조건 검사에서 걸렸어요"
      : "자동 검사에서 확인이 필요하다고 표시했어요");
  if (!target) return text;
  if (!target.startsWith("/")) return `${text} · ${target}`;
  const key = target
    .split("/")
    .filter(Boolean)
    .reverse()
    .find((k) => TARGET_KO[k]);
  return key ? `${text} · ${TARGET_KO[key]}` : text;
}

/**
 * 검수 칸 이름에서 내부 용어를 사람이 읽는 말로 바꿔요: 같은 말 반복(「자격 조건 · 자격 조건」), 묶음 ID(sg-t3-5-r4),
 * JSON 위치(prices.30, rule.expression.children.1.value)가 그대로 보였어요
 */
function fieldLabel(section: string, label: string) {
  const parts = [section, ...label.split(" · ")].map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    let t = p;
    if (/^sg-[\w-]+$/.test(t)) t = "주택형 묶음";
    else if (/^prices(\.\d+)?$/.test(t))
      t = t.includes(".") ? `금액 ${Number(t.split(".")[1]) + 1}번째` : "금액";
    else if (/^counts(\.\d+)?$/.test(t)) t = "호수";
    else if (/^exceptions\./.test(t)) t = "예외 조건의 값";
    else if (/(^|\.)(rule|expression|effectExpression|children|value)(\.|$)/.test(t))
      t = "조건의 값";
    if (out[out.length - 1] !== t) out.push(t);
  }
  return out.join(" · ");
}

function noticeItem(d: NoticeReviewDetail): ReviewItem {
  const held = new Set(d.fields.filter((f) => f.status === "HELD").flatMap((f) => f.sourceIds));
  const byPage = new Map<string, { t: string; kind: SourcePartKind }[]>();
  for (const s of d.sources) {
    const head = s.page ? `${s.page}쪽` : "원문";
    byPage.set(head, [
      ...(byPage.get(head) ?? []),
      { t: s.quote + " ", kind: held.has(s.id) ? "low" : "ok" },
    ]);
  }
  const fields: Record<string, FieldMeta> = {};
  // 칸 이름이 길어 잘리면 서로 같아질 수 있어요. 이름은 화면 key이자 수정값을 찾는 열쇠라 겹치면 번호를 붙여요
  const seen = new Map<string, number>();
  const rows = d.fields.map((f) => {
    const base = fieldLabel(f.section, f.label);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const label = n > 1 ? `${base} (${n})` : base;
    fields[label] = { path: f.path, json: typeof f.value !== "string", editable: f.editable };
    // 백엔드는 신뢰도 숫자 대신 「확인 필요 + 이유」예요. 화면이 숫자를 쓰니 보류(HELD)는 낮게, 확인(CHECK)은 중간으로 바꿔 보여 줘요
    return {
      label,
      value: f.display ?? (typeof f.value === "string" ? f.value : JSON.stringify(f.value)),
      conf: f.status === "HELD" ? 0.3 : 0.6,
      status: (f.status === "HELD" ? "HELD" : "CHECK") as "HELD" | "CHECK",
      why: [...new Set((f.codes ?? []).map((c) => issueText(c, null)))].join(" / ") || undefined,
    };
  });
  reviewMeta.set(`n:${d.id}`, { kind: "notice", id: d.id, fields, detailUrl: d.detailUrl ?? null });
  // 검수에 온 이유를 원문 칸 맨 위에 보여 줘요. 확인할 칸·근거가 없는 건(PDF 없음 등)도 무엇을 볼지 알 수 있게
  const why = [...new Set(d.issues.map((i) => issueText(i.code, i.target)))];
  const reasonPara = {
    head: "검수 이유",
    parts: [
      { t: why.length ? why.join(" / ") : "이유 코드가 없어요", kind: "low" as SourcePartKind },
    ],
  };
  const emptyPara = byPage.size
    ? []
    : [
        {
          head: "원문 근거",
          parts: [
            {
              t: "뽑힌 근거 문장이 없어요. 「원문 사이트」에서 공고를 직접 확인해 주세요.",
              kind: "plain" as SourcePartKind,
            },
          ],
        },
      ];
  return {
    id: `n:${d.id}`,
    reason: REASON[d.reason] ?? "low",
    kind: `${d.field === "HOUSING" ? "주거 공고" : "사업공간 공고"}${d.provider ? " · " + d.provider : ""}`,
    title: d.title,
    source: (d.provider ?? d.sourceCode).toUpperCase(),
    version: `v${d.rawVersion}`,
    received: when(d.receivedAt),
    age: ago(d.receivedAt),
    paras: [
      reasonPara,
      ...emptyPara,
      ...[...byPage.entries()].map(([head, parts]) => ({ head, parts })),
    ],
    fields: rows,
    impact: d.impact ?? "검수한 값이 서비스에 반영돼요",
    log: d.log.map((l) => ({ at: when(l.at), who: l.who, text: l.text })),
  };
}

function benefitItem(d: BenefitReviewDetail): ReviewItem {
  const r = d.result;
  const evidence = new Map(r.conditions.map((c) => [c.evidence.replace(/\s+/g, ""), c.known]));
  // 「항목: 값」 줄은 새 문단, 그 밖의 줄은 앞 문단에 이어 붙여요(문단 머리말이 화면의 key라 겹치지 않게)
  const paras: { head: string; parts: { t: string; kind: SourcePartKind }[] }[] = [];
  const heads = new Map<string, number>();
  for (const line of (d.source.text ?? "")
    .split("\n")
    .filter((l) => l.trim())
    .slice(0, 80)) {
    const m = /^([^:]{1,30}):\s*(.*)$/.exec(line.trim());
    const body = m ? m[2] : line.trim();
    const key = line.replace(/\s+/g, "");
    const hit = [...evidence.entries()].find(([e]) => e && key.includes(e));
    const part = {
      t: body + " ",
      kind: (hit ? (hit[1] ? "ok" : "low") : "plain") as SourcePartKind,
    };
    if (m || !paras.length) {
      const base = m ? m[1].trim() : "원문";
      const n = (heads.get(base) ?? 0) + 1;
      heads.set(base, n);
      paras.push({ head: n > 1 ? `${base} (${n})` : base, parts: [part] });
    } else {
      paras[paras.length - 1].parts.push(part);
    }
  }
  const fields: Record<string, FieldMeta> = {
    요약: { path: "/summary", json: false, editable: true },
    "신청 방법": { path: "/howToApply", json: false, editable: true },
    문의처: { path: "/contact", json: false, editable: true },
  };
  const rows = [
    { label: "요약", value: r.summary ?? "", conf: r.quality.confidence },
    { label: "신청 방법", value: r.howToApply ?? "", conf: r.quality.confidence },
    { label: "문의처", value: r.contact ?? "", conf: r.quality.confidence },
    ...r.supports.map((s, i) => {
      const label = `지원 ${i + 1} · ${SUPPORT_KO[s.kind] ?? "기타 지원"}`;
      fields[label] = { path: `/supports/${i}/amountMax`, json: true, editable: true };
      return {
        label,
        value: s.amountMax == null ? "" : String(s.amountMax),
        conf: s.amountMax == null ? 0 : r.quality.confidence,
        status: s.amountMax == null ? ("EMPTY" as const) : undefined,
      };
    }),
    ...r.conditions.map((c, i) => {
      const label = `${TYPE_KO[c.type] ?? c.type} (묶음 ${c.group}) · ${i + 1}`;
      fields[label] = {
        path: `/conditions/${i}/value`,
        json: true,
        editable: !["OTHER", "EXCLUSIVE", "PRIORITY"].includes(c.type),
      };
      return {
        label,
        value: c.known ? JSON.stringify(c.value) : c.rawText,
        conf: c.known ? c.confidence : 0,
        status: c.known ? undefined : ("EMPTY" as const),
        why: c.known ? undefined : "판정에 쓰는 값이 없어 글로만 보여요",
      };
    }),
  ];
  reviewMeta.set(`b:${d.id}`, { kind: "benefit", id: d.id, fields, detailUrl: r.source.detailUrl });
  return {
    id: `b:${d.id}`,
    reason: d.reasons.includes("REPORTED") ? "must" : "low",
    kind: `혜택 정책 · ${BENEFIT_SOURCE[d.sourceCode ?? ""] ?? d.sourceCode ?? "정책"}`,
    title: r.source.title,
    source: r.source.agency ?? BENEFIT_SOURCE[d.sourceCode ?? ""] ?? "-",
    version: `v${d.rawVersion}`,
    received: when(d.queuedAt),
    age: ago(d.queuedAt),
    paras: [
      {
        head: "검수 이유",
        parts: [
          {
            t: d.reasons.map((r) => issueText(r, null)).join(" / ") || "이유 코드가 없어요",
            kind: "low" as SourcePartKind,
          },
        ],
      },
      ...paras,
    ],
    fields: rows,
    impact: r.relevant
      ? "확인 필요 표시가 풀린 정제 결과가 다시 나가요 (알림 없음)"
      : "주거 혜택이 아니라고 판정된 정책이에요",
    log: [
      {
        at: when(d.queuedAt),
        who: "시스템",
        text: `검수 대기열에 추가 (${d.reasons.map((r) => issueText(r, null)).join(" / ")})`,
      },
    ],
  };
}

export async function liveReviewQueue(): Promise<{ total: number; items: ReviewItem[] }> {
  const [notices, benefits] = await Promise.all([
    api.get<NoticeReviewList>("/api/admin/reviews"),
    api.get<BenefitReviewList>("/api/admin/benefit-reviews"),
  ]);
  // 상세 하나가 실패(이미 처리됨 등)해도 대기열 전체가 멈추지 않게 성공한 것만 써요
  const ok = <T>(rs: PromiseSettledResult<T>[]) =>
    rs.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const [nd, bd] = await Promise.all([
    Promise.allSettled(
      notices.items.map((i) => api.get<NoticeReviewDetail>(`/api/admin/reviews/${i.id}`)),
    ).then(ok),
    Promise.allSettled(
      benefits.items.map((i) =>
        api
          .get<BenefitReviewDetail>(`/api/admin/benefit-reviews/${i.id}`)
          .then((d) => ({ ...d, sourceCode: i.sourceCode })),
      ),
    ).then(ok),
  ]);
  const items = [...bd.map(benefitItem), ...nd.map(noticeItem)];
  // 전체 건수는 목록 길이가 아니라 백엔드 total(공고) + 혜택 목록 길이
  const total = (notices.total ?? notices.items.length) + benefits.items.length;
  return { total, items: items.length ? items : [EMPTY_REVIEW] };
}

export const EMPTY_REVIEW: ReviewItem = {
  id: "empty",
  reason: "low",
  kind: "-",
  title: "검수할 항목이 없어요",
  source: "-",
  version: "-",
  received: "-",
  age: "",
  paras: [],
  fields: [],
  impact: "-",
  log: [],
};

/** 승인·반려. edits는 화면 칸 이름 → 새 글자. */
export async function decideReview(
  itemId: string,
  approve: boolean,
  edits: Record<string, string>,
  rejectReason: string | null,
) {
  const meta = reviewMeta.get(itemId);
  if (!meta) throw new Error("검수 항목 정보가 없어요. 새로고침해 주세요");
  const body: Record<string, unknown> = {};
  if (approve) {
    const list = Object.entries(edits).flatMap(([label, text]) => {
      const f = meta.fields[label];
      // 예전에는 고칠 수 없는 칸의 수정을 조용히 버리고 「수정 후 승인」이라고 했어요. 보내기 전에 알려요
      if (!f || !f.editable)
        throw new Error(`「${label}」 칸은 여기서 고칠 수 없어요. 원문과 다르면 반려해 주세요`);
      let value: unknown = text;
      if (f.json) {
        try {
          value = text.trim() === "" ? null : JSON.parse(text);
        } catch {
          if (meta.kind === "benefit" && f.path.startsWith("/conditions/"))
            throw new Error(`「${label}」 값은 {"max":6000,…} 같은 JSON 형식이어야 해요`);
          value = text;
        }
      }
      const one = [{ path: f.path, value }];
      if (meta.kind === "benefit" && f.path.startsWith("/conditions/"))
        one.push({ path: f.path.replace(/\/value$/, "/known"), value: value != null });
      return one;
    });
    if (list.length) body.edits = list;
  } else if (rejectReason) {
    body.reason = REJECT[rejectReason] ?? null;
  }
  const base = meta.kind === "notice" ? "/api/admin/reviews/" : "/api/admin/benefit-reviews/";
  return api.post<{ pendingCount: number }>(
    `${base}${meta.id}/${approve ? "approve" : "reject"}`,
    body,
  );
}

const REJECT: Record<string, string> = {
  "중복 공고": "DUPLICATE",
  "원문과 다름 · 다시 추출": "SOURCE_MISMATCH",
  "서비스 대상 아님": "OUT_OF_SCOPE",
  "마감된 공고": "CLOSED",
};

// ---------- 제보 ----------
type ReportList = {
  counts: { newCount: number; doing: number; done: number };
  items: {
    id: string;
    status: string;
    screen: string | null;
    targetType: string;
    noticeId: string | null;
    benefitPolicyId: string | null;
    noticeTitle: string;
    field: string;
    currentValue: string | null;
    reportedValue: string | null;
    summary: string | null;
    createdAt: string;
    groupCount: number;
  }[];
};
type ReportDetail = {
  note: string | null;
  notes: { text: string; createdAt: string }[];
  reply: string | null;
  reviewId: string | null;
};

const STATUS: Record<string, ReportStatus> = { NEW: "new", DOING: "doing", DONE: "done" };

export async function liveReports(): Promise<{
  doneBefore: number;
  newBefore: number;
  items: ReportItem[];
}> {
  const list = await api.get<ReportList>("/api/admin/reports");
  const details = await Promise.all(
    list.items.map((i) => api.get<ReportDetail>(`/api/admin/reports/${i.id}`)),
  );
  const items: (ReportItem & { at: string })[] = list.items.map((r, i) => ({
    at: r.createdAt,
    id: r.id,
    st: STATUS[r.status] ?? "new",
    where: `${r.screen ?? "-"} · ${r.targetType === "BENEFIT" ? "혜택 정책" : r.targetType === "PROGRAM" ? "창업지원" : "공고"}`,
    target: r.noticeTitle,
    field: r.field,
    current: r.currentValue ?? "-",
    reported: r.reportedValue ?? "-",
    source: details[i].note ?? r.summary ?? "-", // 화면에서는 「제보 설명」으로 보여요(기관 원문이 아님)
    summary: r.summary ?? r.field,
    age: ago(r.createdAt),
    groupCount: r.groupCount,
    link: r.noticeId
      ? routes.notice(r.noticeId)
      : r.benefitPolicyId
        ? routes.benefit(r.benefitPolicyId)
        : routes.adminReports,
    notes: (details[i].notes ?? []).map((n) => ({
      text: n.text,
      meta: `사용자 · ${when(n.createdAt)}`,
    })),
    reply: details[i].reply ?? "",
  }));
  items.push(...(await liveAreaReports()));
  items.sort((a, b) => b.at.localeCompare(a.at)); // 공고·생활권 제보를 들어온 차례(최근 먼저)로
  return { doneBefore: 0, newBefore: 0, items };
}

// 생활권 제보(역까지 거리 등 공고 주변 정보). 공고 제보와 같은 목록에 섞어 보여 줘요. id 앞에 「area:」를 붙여 처리 API를 가려요
type AreaReportList = {
  counts: { newCount: number; doing: number; done: number };
  items: {
    id: string;
    status: string;
    screen: string | null;
    noticeId: string;
    noticeLocationId: string | null;
    field: string;
    currentValue: string | null;
    reportedValue: string | null;
    summary: string | null;
    createdAt: string;
    groupCount: number;
  }[];
};
type AreaReportDetail = {
  note: string | null;
  notes: { text: string; createdAt: string }[];
  reply: string | null;
};
const AREA_REPORT = "area:";
export const isAreaReport = (id: string) => id.startsWith(AREA_REPORT);

async function liveAreaReports(): Promise<(ReportItem & { at: string })[]> {
  const list = await api.get<AreaReportList>("/api/admin/area-reports");
  const [details, notices] = await Promise.all([
    Promise.all(
      list.items.map((i) => api.get<AreaReportDetail>(`/api/admin/area-reports/${i.id}`)),
    ),
    // 생활권 제보는 공고 제목을 주지 않아 공고 상세에서 제목·단지 이름을 찾아요
    Promise.all(
      [...new Set(list.items.map((i) => i.noticeId))].map((id) =>
        api
          .get<{
            header: { title: string };
            sites: { id: string; name: string | null }[];
          }>(`/api/v1/notices/${id}`)
          .then((d) => [id, d] as const)
          .catch(() => [id, null] as const),
      ),
    ).then((rows) => new Map(rows)),
  ]);
  return list.items.map((r, i) => {
    const notice = notices.get(r.noticeId);
    const site = notice?.sites.find((s) => s.id === r.noticeLocationId)?.name;
    return {
      at: r.createdAt,
      id: AREA_REPORT + r.id,
      st: STATUS[r.status] ?? "new",
      where: `${r.screen ?? "-"} · 생활권`,
      target: [notice?.header.title ?? "공고", site].filter(Boolean).join(" · "),
      field: r.field,
      current: r.currentValue ?? "-",
      reported: r.reportedValue ?? "-",
      source: details[i].note ?? r.summary ?? "-",
      summary: r.summary ?? r.field,
      age: ago(r.createdAt),
      groupCount: r.groupCount,
      link: routes.notice(r.noticeId),
      notes: (details[i].notes ?? []).map((n) => ({
        text: n.text,
        meta: `사용자 · ${when(n.createdAt)}`,
      })),
      reply: details[i].reply ?? "",
    };
  });
}

/** 처리 끝: 고침(FIXED)·그대로(KEPT)와 답장. 처리 시작 전이면 먼저 시작해요. */
export async function resolveReport(id: string, fixed: boolean, reply: string) {
  const path = isAreaReport(id)
    ? `/api/admin/area-reports/${id.slice(AREA_REPORT.length)}/resolve`
    : `/api/admin/reports/${id}/resolve`;
  return api.post(path, {
    result: fixed ? "FIXED" : "KEPT",
    reply: reply.trim() || null,
  });
}

/** 다시 검수로 보내기(고치기): 공고·혜택 정책의 검수를 다시 열어요. */
export async function reopenFromReport(id: string) {
  if (isAreaReport(id)) throw new Error("생활권 제보는 AI 추출 값이 아니라 검수로 보낼 수 없어요");
  return api.post<{ reviewId: string; reopened: boolean }>(`/api/admin/reports/${id}/review`);
}

// ---------- 사이드바 숫자·개요 ----------
export async function liveCounts(): Promise<AdminCounts> {
  const [n, b, r, c] = await Promise.all([
    api.get<{ reviewPending: number }>("/api/admin/reviews/counts"),
    api.get<BenefitReviewList>("/api/admin/benefit-reviews"),
    api.get<{ newCount: number }>("/api/admin/reports/counts"),
    collectedSummary(),
  ]);
  const area = await api
    .get<{ newCount: number }>("/api/admin/area-reports/counts")
    .catch(() => ({ newCount: 0 }));
  return {
    reviewPending: n.reviewPending + b.items.length,
    sourceIssues: c.fail + c.late,
    newReports: r.newCount + area.newCount,
  };
}

export async function liveOverview(base: AdminOverview): Promise<AdminOverview> {
  const [n, b, r, urgent, stats] = await Promise.all([
    api.get<{ reviewPending: number; oldestReceivedAt: string | null }>(
      "/api/admin/reviews/counts",
    ),
    api.get<BenefitReviewList>("/api/admin/benefit-reviews"),
    api.get<{ newCount: number; doing: number; done: number }>("/api/admin/reports/counts"),
    api.get<{ id: string; title: string; applyEndsOn: string | null }[]>(
      "/api/admin/reviews/urgent?days=3",
    ),
    api.get<{
      recent: {
        asIsRate: number | null;
        editedRate: number | null;
        rejectedRate: number | null;
        medianMinutes: number | null;
      };
      today: { approved: number; editedApproved: number; rejected: number };
    }>("/api/admin/reviews/stats?days=7"),
  ]);
  // 백엔드가 이미 0~100 정수로 줘요(예전에 100을 또 곱해 75%가 7500%로 보였음)
  const pct = (v: number | null) => (v == null ? "-" : `${v}%`);
  // 「제보로 고친 값」은 최근 7일에 고침(FIXED)으로 끝낸 제보, 「오늘 제보 답변」은 오늘 끝낸 제보예요(그대로 둠 포함).
  // 예전에는 끝난 제보 전체 수를 둘 다에 써서 「그대로 둠」도 고친 값으로 셌어요
  const handled = await doneReports();
  // 생활권 제보도 제보 수에 더해요
  const ar = await api
    .get<{ newCount: number; doing: number; done: number }>("/api/admin/area-reports/counts")
    .catch(() => ({ newCount: 0, doing: 0, done: 0 }));
  r.newCount += ar.newCount;
  r.doing += ar.doing;
  r.done += ar.done;
  const collected = await collectedSummary();
  const isPast = (d: string | null) => !!d && d < new Date().toLocaleDateString("en-CA");
  const todos: AdminTodo[] = [
    // 마감 전(3일 안)인 건을 먼저, 이미 마감된 대기 건은 뒤에
    ...[...urgent]
      .sort((a, c) => Number(isPast(a.applyEndsOn)) - Number(isPast(c.applyEndsOn)))
      .slice(0, 4)
      .map((u) => ({
        id: u.id,
        kind: "deadline" as const,
        title: u.title,
        // 백엔드는 마감이 이미 지난 대기 건도 함께 줘요(먼저 정리할 일). 지났으면 그렇게 표시해요
        desc: `${u.applyEndsOn && u.applyEndsOn < new Date().toLocaleDateString("en-CA") ? "마감 지남" : "마감"} ${u.applyEndsOn} · 검수 대기`,
      })),
    ...(r.newCount
      ? [
          {
            id: "reports",
            kind: "report" as const,
            title: `새 제보 ${r.newCount}건`,
            desc: "제보 화면에서 확인해요",
          },
        ]
      : []),
  ];
  return {
    ...base,
    asOf: new Date().toLocaleString("ko-KR", {
      timeZone: KST,
      month: "long",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    review: { count: n.reviewPending + b.items.length, oldest: span(n.oldestReceivedAt) },
    reports: {
      count: r.newCount + r.doing,
      note: `새 ${r.newCount} · 처리 중 ${r.doing} · 끝 ${r.done}`,
    },
    collected: {
      count: collected.today,
      note: `최근 회차 새 글 ${collected.recent}건 · 누적 ${collected.total.toLocaleString("ko-KR")}건`,
    },
    issues: {
      count: collected.fail + collected.late,
      note: `실패 ${collected.fail} · 지연·중지 ${collected.late}`,
    },
    todos: todos.length ? todos : base.todos.slice(0, 0),
    quality: {
      ...base.quality,
      asIs: pct(stats.recent.asIsRate),
      edited: pct(stats.recent.editedRate),
      rejected: pct(stats.recent.rejectedRate),
      medianTime: stats.recent.medianMinutes == null ? "-" : `${stats.recent.medianMinutes}분`,
      fixedByReport: `${handled.fixed7}건`,
    },
    today: {
      approved: stats.today.approved,
      editedApproved: stats.today.editedApproved,
      rejected: stats.today.rejected,
      replied: handled.today,
    },
  };
}

/** 끝난 공고·생활권 제보의 처리 시각으로 최근 7일 고친 수·오늘 끝낸 수를 세요. */
async function doneReports(): Promise<{ fixed7: number; today: number }> {
  type Done = { items: { id: string; result: string | null }[] };
  const [n, a] = await Promise.all([
    api.get<Done>("/api/admin/reports?status=DONE").catch(() => ({ items: [] }) as Done),
    api.get<Done>("/api/admin/area-reports?status=DONE").catch(() => ({ items: [] }) as Done),
  ]);
  const at = await Promise.all([
    ...n.items.map((i) =>
      api
        .get<{ handledAt: string | null }>(`/api/admin/reports/${i.id}`)
        .then((d) => ({ result: i.result, at: d.handledAt })),
    ),
    ...a.items.map((i) =>
      api
        .get<{ handledAt: string | null }>(`/api/admin/area-reports/${i.id}`)
        .then((d) => ({ result: i.result, at: d.handledAt })),
    ),
  ]);
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  const today = new Date().toLocaleDateString("en-CA", { timeZone: KST });
  return {
    fixed7: at.filter((x) => x.result === "FIXED" && x.at && Date.parse(x.at) >= weekAgo).length,
    today: at.filter(
      (x) => x.at && new Date(x.at).toLocaleDateString("en-CA", { timeZone: KST }) === today,
    ).length,
  };
}

// ---------- 수집 현황 (수집기 관리자 API를 api 서버가 대신 불러요) ----------
type CollectorRun = {
  startedAt: string;
  finishedAt: string | null;
  status: string;
  newCount: number | null;
  error: string | null;
};
type CollectorSource = {
  code: string;
  name: string;
  enabled: boolean;
  state: string;
  lastRun: CollectorRun | null;
  lastSuccessAt: string | null;
  consecutiveEmpty: number;
  consecutiveFailures: number;
  totalCollected: number;
  recentRuns: CollectorRun[];
};
export type CollectorStatus = {
  asOf: string;
  summary: { ok: number; late: number; fail: number; paused: number };
  sources: CollectorSource[];
};

const POLICY_SOURCES = new Set([
  "youth",
  "bizinfo",
  "kstartup",
  "gov24",
  "bokjiro_central",
  "bokjiro_local",
]);
const AREA: Record<string, string> = {
  lh: "주거 · 전국",
  sh: "주거 · 서울",
  gh: "주거 · 경기",
  ih: "주거 · 인천",
  bmc: "주거 · 부산",
  dcco: "주거 · 대전",
  dudc: "주거 · 대구",
  gbdc: "주거 · 경북",
  gndc: "주거 · 경남",
  umca: "주거 · 울산",
  soco: "주거 · 서울 청년안심주택",
  youth: "청년정책 · 전국",
  bizinfo: "창업 · 전국",
  kstartup: "창업 · 전국",
  gov24: "혜택 · 전국",
  bokjiro_central: "복지 · 중앙부처",
  bokjiro_local: "복지 · 지자체",
};

export async function liveSources() {
  const s = await api.get<CollectorStatus>("/api/admin/sources");
  const rows: SourceRow[] = s.sources.map((src) => {
    const policy = POLICY_SOURCES.has(src.code);
    const st: SourceStatus =
      src.consecutiveFailures > 0 ||
      src.lastRun?.status === "FAILED" ||
      src.lastRun?.status === "BLOCKED"
        ? "fail"
        : src.state === "ok" ||
            // 일시 중지한 곳은 중지 표시를 따로 하고(화면), 여기서는 마지막 수집 결과로 봐요. 다시 켠 직후 「지연」으로 잠깐 보이지 않게
            (src.state === "paused" && src.lastRun?.status === "SUCCESS")
          ? "ok"
          : "late";
    const issue = !src.enabled
      ? "일시 중지한 출처예요"
      : src.consecutiveFailures > 0
        ? `연속 ${src.consecutiveFailures}번 실패했어요${src.lastRun?.error ? " · " + src.lastRun.error.split("\n")[0] : ""}`
        : src.lastRun?.status === "BLOCKED"
          ? "수집이 막혔어요(robots.txt·접근 차단)"
          : !src.lastRun
            ? "아직 한 번도 수집하지 않았어요"
            : src.state !== "ok"
              ? `마지막 성공이 ${ago(src.lastSuccessAt)}이에요`
              : undefined;
    return {
      id: src.code,
      name: src.name,
      area: AREA[src.code] ?? "-",
      method: policy || src.code === "lh" ? "공공 API" : "게시판",
      cycle: policy ? "매일 06:30" : "평일 9~18시 매시간",
      last: src.lastRun ? when(src.lastRun.startedAt) : "-",
      count: src.lastRun?.newCount ?? 0,
      st,
      issue,
      runs: src.recentRuns.slice(0, 6).map((r) => ({
        at: when(r.startedAt),
        text: `${r.newCount ?? 0}건 · ${RUN_KO[r.status] ?? r.status}${r.error ? " · " + r.error.split("\n")[0].slice(0, 60) : ""}`,
        tone: (r.status === "FAILED"
          ? "fail"
          : r.status === "RUNNING"
            ? "late"
            : "normal") as SourceRun["tone"],
      })),
      robots: "-",
      parser: policy ? "API 응답" : "목록·상세 화면",
      total: `${src.totalCollected.toLocaleString("ko-KR")}건`,
    };
  });
  return {
    total: rows.length,
    asOf: when(s.asOf),
    summary: { ok: s.summary.ok, late: s.summary.late + s.summary.paused, fail: s.summary.fail },
    rows,
    enabled: Object.fromEntries(s.sources.map((x) => [x.code, x.enabled])) as Record<
      string,
      boolean
    >,
  };
}

export const sourceAction = (code: string, action: "run" | "pause" | "resume") =>
  api.post(`/api/admin/sources/${code}/${action}`);

// ---------- 기준값 ----------
type CriteriaYears = {
  years: {
    year: number;
    validFrom: string;
    state: string;
    data: { monthlyWon?: Record<string, number> };
    source: string | null;
    updatedAt: string;
  }[];
};
type CriteriaHistory = {
  kind: string;
  changes: {
    year: number;
    validFrom: string;
    source: string | null;
    replacedAt: string;
    replacedBy: string | null;
  }[];
};
type Usage = { housing: number; businessSpace: number; startupSupport: number; total: number };
export async function liveCriteria(base: AdminCriteria): Promise<AdminCriteria> {
  const [median, mHist, mUse, uUse, rUse] = await Promise.all([
    api.get<CriteriaYears>("/api/admin/criteria/MEDIAN_INCOME"),
    api
      .get<CriteriaHistory>("/api/admin/criteria/MEDIAN_INCOME/history")
      .catch(() => ({ kind: "", changes: [] }) as CriteriaHistory),
    api.get<Usage>("/api/admin/criteria/MEDIAN_INCOME/usage"),
    api.get<Usage>("/api/admin/criteria/URBAN_WORKER_INCOME/usage"),
    api.get<Usage>("/api/admin/criteria/RANK_CRITERIA/usage"),
  ]);
  const current = median.years.find((y) => y.state === "IN_EFFECT") ?? median.years[0];
  const monthly = current?.data.monthlyWon ?? {};
  const incomeBase = Object.keys(monthly)
    .sort((a, b) => Number(a) - Number(b))
    .map((k) => monthly[k]);
  const usage = (name: string, u: Usage) =>
    [
      u.housing ? { name: `${name} · 주거 공고`, ratio: `판정 틀 ${u.housing}개` } : null,
      u.businessSpace
        ? { name: `${name} · 사업공간`, ratio: `판정 틀 ${u.businessSpace}개` }
        : null,
      u.startupSupport
        ? { name: `${name} · 창업지원 사업`, ratio: `판정 틀 ${u.startupSupport}개` }
        : null,
    ].filter((x): x is { name: string; ratio: string } => x !== null);
  // 이 탭은 기준 중위소득 화면이라 그 값을 쓰는 판정 틀만 세요. 다른 기준값은 「참고」로 따로 적어요(숫자에 섞지 않게)
  const other = [...usage("도시근로자 월평균소득", uUse), ...usage("순위 요건", rUse)].map((r) => ({
    ...r,
    name: `참고 · ${r.name}`,
  }));
  const rules = [...usage("기준 중위소득", mUse), ...other];
  return {
    ...base,
    incomeBase,
    rulesCount: mUse.total,
    rules,
    history: [
      ...median.years.map((y) => ({
        title: `${y.year}년 값 ${y.state === "IN_EFFECT" ? "적용 중" : y.state === "SCHEDULED" ? "적용 예약" : "지난 값"}`,
        meta: `${y.validFrom}부터 · ${y.source ?? "근거 없음"}`,
      })),
      ...mHist.changes.map((h) => ({
        title: `${h.year}년 값 바뀜`,
        meta: `${when(h.replacedAt)} · ${h.source ?? ""}`,
      })),
    ],
    score: { ...base.score, lastChecked: "판정 코드" },
    // 「지역 구분」은 수도권 과밀억제권역(수도권정비계획법 시행령 별표 1) 법정 목록이에요. 백엔드에 저장소가 없어 화면 목록을 그대로 써요.
    // 규제지역(투기과열·조정대상)은 별도 관리 API(/api/admin/regulated-areas)에 있어요
    regions: base.regions,
  };
}

/** 다음 해 기준 중위소득 적용 예약 (그해 1월 1일 0시부터 판정에 쓰여요) */
export const scheduleMedianIncome = (
  year: number,
  monthlyWon: Record<string, number>,
  source: string,
) =>
  api.put(`/api/admin/criteria/MEDIAN_INCOME/${year}`, {
    validFrom: `${year}-01-01`,
    data: { monthlyWon },
    source,
  });

/** 개요의 수집 칸 */
export async function collectedSummary() {
  const src = await api.get<CollectorStatus>("/api/admin/sources").catch(() => null);
  const todayKst = new Date().toLocaleDateString("ko-KR", { timeZone: KST });
  const sources = src?.sources ?? [];
  return {
    today: sources
      .flatMap((x) => x.recentRuns)
      .filter(
        (x) => new Date(x.startedAt).toLocaleDateString("ko-KR", { timeZone: KST }) === todayKst,
      )
      .reduce((a, x) => a + (x.newCount ?? 0), 0),
    recent: sources.reduce((a, x) => a + (x.lastRun?.newCount ?? 0), 0),
    total: sources.reduce((a, x) => a + x.totalCollected, 0),
    fail: src?.summary.fail ?? 0,
    late: (src?.summary.late ?? 0) + (src?.summary.paused ?? 0),
  };
}

// ---------- 트래픽 (백엔드 traffic 모듈) ----------
export function liveTraffic(days: number) {
  return api.get<TrafficData>(`/api/admin/traffic?days=${days}`);
}

export function liveBotTraffic(days: number) {
  return api.get<BotTrafficData>(`/api/admin/traffic/bots?days=${days}`);
}
