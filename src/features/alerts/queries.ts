"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import { alertsData, type AlertGroup, type AlertItem, type AlertType } from "@/mocks/alerts";

export const alertsKeys = {
  list: ["alerts", "list"] as const,
};

export function useAlertsData() {
  return useQuery(mockQuery(alertsKeys.list, alertsData));
}

export type AlertTab = "전체" | AlertType;
export const alertTabs: AlertTab[] = ["전체", "공고", "혜택", "공지"];
const groups: AlertGroup[] = ["오늘", "어제", "이번 주"];

export type AlertView = AlertItem & { isRead: boolean; urgent: boolean };

/** 분류 탭 · 읽음 상태를 다뤄요 */
export function useAlerts() {
  const { data } = useAlertsData();
  const [tab, setTab] = useState<AlertTab>("전체");
  const [read, setRead] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(data.items.map((a) => [a.id, a.read])),
  );

  const unread = data.items.filter((a) => !read[a.id]).length;

  const grouped = useMemo(() => {
    const shown = tab === "전체" ? data.items : data.items.filter((a) => a.type === tab);
    return groups
      .map((g) => ({
        label: g,
        items: shown
          .filter((a) => a.group === g)
          .map<AlertView>((a) => ({ ...a, isRead: !!read[a.id], urgent: a.icon === "clock" })),
      }))
      .filter((g) => g.items.length > 0);
  }, [data.items, tab, read]);

  return {
    data,
    tab,
    setTab,
    countOf: (t: AlertTab) =>
      t === "전체" ? data.items.length : data.items.filter((a) => a.type === t).length,
    grouped,
    unreadText: unread ? `읽지 않은 알림 ${unread}개` : "모두 읽었어요",
    markRead: (id: string) => setRead((r) => ({ ...r, [id]: true })),
    readAll: () => setRead(Object.fromEntries(data.items.map((a) => [a.id, true]))),
  };
}
