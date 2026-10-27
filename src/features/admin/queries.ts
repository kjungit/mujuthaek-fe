import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { mockQuery } from "@/features/mock-query";
import {
  adminCounts,
  adminCriteria,
  adminOverview,
  adminReports,
  adminSources,
  reviewQueue,
  type AdminCounts,
} from "@/mocks/admin";
import {
  EMPTY_REVIEW,
  liveCounts,
  liveCriteria,
  liveOverview,
  liveReports,
  liveReviewQueue,
  liveSources,
  liveBotTraffic,
  liveActivity,
  liveRealtime,
  liveAdminChanges,
  liveUsers,
  liveUserNames,
  liveTraffic,
  noticeTitles,
  groupChatReports,
  liveChatReports,
} from "./api";
import { USE_MOCKS } from "@/lib/api/config";
import { botTrafficMock, noticeTitlesMock, realtimeMock, trafficMock } from "@/mocks/admin-traffic";
import { chatReportTitlesMock, chatReportsMock, type ChatReviewStatus } from "@/mocks/admin-chat";
import { adminChangesMock, adminUsersMock, type AdminUserFilter } from "@/mocks/admin-users";
import { activityMock } from "@/mocks/admin-activity";

export const adminKeys = {
  counts: ["admin", "counts"] as const,
  overview: ["admin", "overview"] as const,
  review: ["admin", "review"] as const,
  sources: ["admin", "sources"] as const,
  criteria: ["admin", "criteria"] as const,
  reports: ["admin", "reports"] as const,
};

/**
 * 실제 API(NEXT_PUBLIC_USE_MOCKS=false)면 관리자 화면 값을 백엔드에서 받아요(./api). 받기 전에는 빈 값(불러오는 중)을 보여 줘요.
 * USE_MOCKS는 빌드 때 정해지는 상수라 아래 훅에서 갈라 불러도 훅 순서가 바뀌지 않아요.
 */
const LIVE = !USE_MOCKS;
const live = (key: readonly string[]) => ["admin", "live", ...key.slice(1)] as const;
const ZERO: AdminCounts = { reviewPending: 0, sourceIssues: 0, newReports: 0, chatReports: 0 };

/** 사이드바 메뉴 옆 숫자 */
export function useAdminCounts() {
  if (LIVE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery({ queryKey: live(adminKeys.counts), queryFn: liveCounts, staleTime: 0 });
    return { ...q, data: q.data ?? ZERO };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery(mockQuery(adminKeys.counts, adminCounts));
}

/** 화면에서 처리한 결과를 사이드바 숫자에 반영해요 (실제 연결이면 다시 받아요) */
export function useSetAdminCounts() {
  const queryClient = useQueryClient();
  return useCallback(
    (patch: Partial<AdminCounts>) => {
      if (LIVE) {
        void queryClient.invalidateQueries({ queryKey: ["admin", "live"] });
        return;
      }
      queryClient.setQueryData<AdminCounts>(adminKeys.counts, (prev) => ({
        ...(prev ?? adminCounts),
        ...patch,
      }));
    },
    [queryClient],
  );
}

export function useAdminOverview() {
  if (LIVE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery({
      queryKey: live(adminKeys.overview),
      queryFn: () => liveOverview(adminOverview),
      staleTime: 0,
    });
    const wait = q.isError ? "불러오지 못했어요" : "불러오는 중";
    const empty = {
      ...adminOverview,
      asOf: wait,
      review: { count: 0, oldest: "-" },
      collected: { count: 0, note: wait },
      issues: { count: 0, note: wait },
      reports: { count: 0, note: wait },
      todos: [],
      quality: { asIs: "-", edited: "-", rejected: "-", medianTime: "-", fixedByReport: "-" },
      today: { approved: 0, editedApproved: 0, rejected: 0, replied: 0 },
    };
    return { ...q, data: q.data ?? empty };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery(mockQuery(adminKeys.overview, adminOverview));
}

export function useReviewQueue() {
  if (LIVE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery({
      queryKey: live(adminKeys.review),
      queryFn: liveReviewQueue,
      staleTime: 0,
    });
    return {
      ...q,
      data: q.data ?? { total: 0, items: [{ ...EMPTY_REVIEW, title: "불러오는 중…" }] },
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery(mockQuery(adminKeys.review, reviewQueue));
}

export function useAdminSources() {
  if (LIVE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery({
      queryKey: live(adminKeys.sources),
      queryFn: liveSources,
      staleTime: 0,
      refetchInterval: 15000,
    });
    return {
      ...q,
      data: q.data ?? {
        ...adminSources,
        asOf: "불러오는 중",
        summary: { ok: 0, late: 0, fail: 0 },
        rows: adminSources.rows.slice(0, 0),
        enabled: {} as Record<string, boolean>,
      },
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const q = useQuery(mockQuery(adminKeys.sources, adminSources));
  return { ...q, data: { ...q.data, enabled: {} as Record<string, boolean> } };
}

export function useAdminCriteria() {
  if (LIVE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery({
      queryKey: live(adminKeys.criteria),
      queryFn: () => liveCriteria(adminCriteria),
      staleTime: 0,
    });
    return {
      ...q,
      data: q.data ?? {
        ...adminCriteria,
        incomeBase: [],
        rules: [],
        history: [],
        regions: [],
        rulesCount: 0,
      },
    };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery(mockQuery(adminKeys.criteria, adminCriteria));
}

export function useAdminReports() {
  if (LIVE) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const q = useQuery({ queryKey: live(adminKeys.reports), queryFn: liveReports, staleTime: 0 });
    return { ...q, data: q.data ?? { doneBefore: 0, newBefore: 0, items: [] } };
  }
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useQuery(mockQuery(adminKeys.reports, adminReports));
}

/** 트래픽(GA·서버 숫자). 기간이 바뀌면 다시 받아요. GA 숫자는 백엔드가 한 시간쯤 다시 써요 */
export function useAdminTraffic(days: number) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "traffic", days],
    queryFn: () => (LIVE ? liveTraffic(days) : Promise.resolve(trafficMock)),
    staleTime: 60_000,
  });
}

/** 봇·보안(서버 요청 기록) */
export function useAdminBotTraffic(days: number) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "traffic-bots", days],
    queryFn: () => (LIVE ? liveBotTraffic(days) : Promise.resolve(botTrafficMock)),
    staleTime: 60_000,
  });
}

/** 채팅 신고(메시지별로 묶음). 상태가 바뀌면 다시 받아요 */
export function useAdminChatReports(status: ChatReviewStatus) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "chat-reports", status],
    queryFn: () =>
      LIVE
        ? liveChatReports(status)
        : Promise.resolve(
            groupChatReports(
              chatReportsMock.filter((r) => r.reviewStatus === status),
              chatReportTitlesMock,
            ),
          ),
    staleTime: 0,
  });
}

/** 지금 접속자. 화면을 열어 둔 동안 30초마다 다시 받아요(백엔드도 30초 다시 써요) */
export function useAdminRealtime() {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "traffic-realtime"],
    queryFn: () => (LIVE ? liveRealtime() : Promise.resolve(realtimeMock)),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });
}

/** 공고 ID → 제목 (많이 본 공고·채팅 신고 등). 못 찾은 공고는 빠져요 */
export function useNoticeTitles(ids: string[]) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "notice-titles", ...ids],
    queryFn: () => (LIVE ? noticeTitles(ids) : Promise.resolve(noticeTitlesMock)),
    enabled: ids.length > 0,
    staleTime: 10 * 60_000,
  });
}

/** 회원 찾기 (한 쪽 30명) */
export function useAdminUsers(query: string, filter: AdminUserFilter, page: number) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "users", query, filter, page],
    queryFn: () => {
      if (LIVE) return liveUsers(query, filter, page);
      const items = adminUsersMock.filter(
        (u) =>
          (!filter ||
            (filter === "ADMIN" && u.role !== "USER") ||
            (filter === "USER" && u.role === "USER") ||
            (filter === "SUSPENDED" && u.suspension)) &&
          (!query.trim() || (u.nickname ?? "").includes(query.trim()) || u.id === query.trim()),
      );
      return Promise.resolve({ items, total: items.length });
    },
    staleTime: 0,
  });
}

/** 회원 ID → 이름 (처리 기록의 관리자 이름) */
export function useAdminUserNames(ids: string[]) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "user-names", ...ids],
    queryFn: () =>
      LIVE ? liveUserNames(ids) : Promise.resolve(adminUsersMock.filter((u) => ids.includes(u.id))),
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
  });
}

/** 관리자 변경 기록 (지정·해제·권한·정지·넘기기·긴급 정지) */
export function useAdminChanges(days: number, enabled = true) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "admin-changes", days],
    queryFn: () => (LIVE ? liveAdminChanges(days) : Promise.resolve(adminChangesMock)),
    enabled,
    staleTime: 0,
  });
}

/** 처리 기록 (검수·제보·기준값·권한) */
export function useAdminActivity(days: number) {
  return useQuery({
    queryKey: ["admin", LIVE ? "live" : "mock", "activity", days],
    queryFn: () => (LIVE ? liveActivity(days) : Promise.resolve(activityMock)),
    staleTime: 0,
  });
}
