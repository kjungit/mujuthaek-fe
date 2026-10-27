"use client";

// 관리자 알림 지표: 눌러서 이동한 알림은 「눌렀어요」로 남겨요
import { markAlertClicked } from "@/features/alerts/api";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { liveAlerts, markAlertRead, markAllAlertsRead } from "@/features/alerts/api";
import { mockQuery } from "@/features/mock-query";
import { USE_MOCKS } from "@/lib/api/config";
import {
  alertsData,
  type AlertGroup,
  type AlertItem,
  type AlertsData,
  type AlertType,
} from "@/mocks/alerts";

export const alertsKeys = {
  list: ["alerts", "list"] as const,
};

/** 받기 전·로그인 전에 보여 줄 빈 값 */
const EMPTY: AlertsData = { items: [], settings: [], quietHours: "밤 10시 ~ 아침 8시" };

export function useAlertsData() {
  const mock = useQuery({ ...mockQuery(alertsKeys.list, alertsData), enabled: USE_MOCKS });
  const live = useQuery({
    queryKey: [...alertsKeys.list, "live"],
    queryFn: liveAlerts,
    enabled: !USE_MOCKS,
    retry: false,
  });
  if (USE_MOCKS) return { data: mock.data, isError: false };
  return { data: live.data ?? EMPTY, isError: live.isError };
}

export type AlertTab = "전체" | AlertType;
export const alertTabs: AlertTab[] = ["전체", "공고", "혜택", "공지"];
const groups: AlertGroup[] = ["오늘", "어제", "이번 주", "이전"];

export type AlertView = AlertItem & { isRead: boolean; urgent: boolean };

/** 분류 탭 · 읽음 상태를 다뤄요 */
export function useAlerts() {
  const { data, isError } = useAlertsData();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<AlertTab>("전체");
  // 누른 알림은 서버 응답을 기다리지 않고 바로 읽음으로 보여요
  const [readNow, setReadNow] = useState<Record<string, boolean>>({});
  const isRead = (a: AlertItem) => a.read || !!readNow[a.id];

  const unread = data.items.filter((a) => !isRead(a)).length;

  const grouped = useMemo(() => {
    const shown = tab === "전체" ? data.items : data.items.filter((a) => a.type === tab);
    return groups
      .map((g) => ({
        label: g,
        items: shown
          .filter((a) => a.group === g)
          .map<AlertView>((a) => ({
            ...a,
            isRead: a.read || !!readNow[a.id],
            urgent: a.icon === "clock",
          })),
      }))
      .filter((g) => g.items.length > 0);
  }, [data.items, tab, readNow]);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: alertsKeys.list });

  const markRead = (id: string) => {
    setReadNow((r) => ({ ...r, [id]: true }));
    if (!USE_MOCKS) void markAlertRead(id).then(refresh, refresh);
  };

  return {
    data,
    tab,
    setTab,
    countOf: (t: AlertTab) =>
      t === "전체" ? data.items.length : data.items.filter((a) => a.type === t).length,
    grouped,
    unreadText: isError
      ? "로그인하면 알림을 볼 수 있어요"
      : data.items.length === 0
        ? "아직 받은 알림이 없어요"
        : unread
          ? `읽지 않은 알림 ${unread}개`
          : "모두 읽었어요",
    markRead,
    /** 알림을 누르면 읽음으로 바꾸고 그 화면으로 가요 (앱 안 경로만) */
    open: (a: AlertItem) => {
      const path = a.linkPath?.startsWith("/") && !a.linkPath.startsWith("//") ? a.linkPath : null;
      if (!path) {
        markRead(a.id);
        return;
      }
      // 눌러서 이동: 읽음과 「눌렀어요」를 함께 남겨요
      setReadNow((r) => ({ ...r, [a.id]: true }));
      if (!USE_MOCKS) void markAlertClicked(a.id).then(refresh, refresh);
      router.push(path);
    },
    readAll: () => {
      setReadNow(Object.fromEntries(data.items.map((a) => [a.id, true])));
      if (!USE_MOCKS) void markAllAlertsRead().then(refresh, refresh);
    },
  };
}
