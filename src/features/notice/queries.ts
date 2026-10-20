import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import { notices, type Notice } from "@/mocks/notice";

export const noticeKeys = {
  detail: (id: string) => ["notice", "detail", id] as const,
};

/** 목업 단계: 없는 id는 첫 공고를 보여줘요 */
export function findNotice(id: string): Notice {
  return notices.find((n) => n.id === id) ?? notices[0];
}

export function useNotice(id: string) {
  return useQuery(mockQuery(noticeKeys.detail(id), findNotice(id)));
}
