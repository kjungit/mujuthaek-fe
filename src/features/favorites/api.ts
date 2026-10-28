"use client";

// 관심 공고·정책 (PUT·DELETE /api/users/me/favorites/{targetType}/{targetId}, GET 목록).
// 관심으로 저장한 것은 마감 3일·하루 전 알림을 받아요. 로그인해야 저장돼요
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useSession } from "@/features/auth/session";
import { api } from "@/lib/api/client";
import { USE_MOCKS } from "@/lib/api/config";
import { endpoints } from "@/lib/api/endpoints";
import { routes } from "@/lib/routes";

/** 공고(주거·사업공간 공고) · 혜택 · 창업 지원 사업 · 입주 모집 */
export type FavoriteType = "NOTICE" | "BENEFIT" | "STARTUP_SUPPORT" | "SPACE_RECRUITMENT";

/** GET 목록 한 줄 (백엔드 FavoriteResponse) */
export type Favorite = { targetType: FavoriteType; targetId: string; createdAt: string };

export const favoritesKey = ["favorites"] as const;

const same = (f: Favorite, type: FavoriteType, id: string) =>
  f.targetType === type && f.targetId === id;

/** 내 관심 목록 (최근 저장한 것부터). 로그인하지 않았으면 빈 목록 */
export function useFavorites() {
  const { data: session } = useSession();
  return useQuery({
    queryKey: favoritesKey,
    queryFn: async () =>
      (await api.get<{ items: Favorite[] }>(`${endpoints.favorites}?size=100`)).items,
    enabled: !USE_MOCKS && !!session,
    staleTime: 60 * 1000,
    placeholderData: [] as Favorite[],
  });
}

/** 관심 켜고 끄기 (목록에 바로 반영하고 실패하면 되돌려요). 로그인하지 않았으면 로그인 화면으로 보내요 */
export function useFavoriteActions() {
  const { data: session } = useSession();
  const router = useRouter();
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: ({ type, id, next }: { type: FavoriteType; id: string; next: boolean }) =>
      next ? api.put(endpoints.favorite(type, id)) : api.delete(endpoints.favorite(type, id)),
    onMutate: async ({ type, id, next }) => {
      await client.cancelQueries({ queryKey: favoritesKey });
      const before = client.getQueryData<Favorite[]>(favoritesKey) ?? [];
      client.setQueryData<Favorite[]>(favoritesKey, (list = []) =>
        next
          ? [{ targetType: type, targetId: id, createdAt: new Date().toISOString() }, ...list]
          : list.filter((f) => !same(f, type, id)),
      );
      return { before };
    },
    onError: (_error, _vars, context) => client.setQueryData(favoritesKey, context?.before),
    onSettled: () => client.invalidateQueries({ queryKey: favoritesKey }),
  });
  const { mutate } = mutation;
  const set = useCallback(
    (type: FavoriteType, id: string, next: boolean) => {
      if (USE_MOCKS) return;
      if (session === null) {
        router.push(routes.login);
        return;
      }
      mutate({ type, id, next });
    },
    [session, router, mutate],
  );
  return { set, pending: mutation.isPending };
}

/** 하나의 관심 상태와 켜고 끄기 */
export function useFavorite(type: FavoriteType | undefined, id: string | undefined) {
  const { data: items = [] } = useFavorites();
  const { set, pending } = useFavoriteActions();
  const on = !!type && !!id && items.some((f) => same(f, type, id));
  const toggle = () => {
    if (type && id) set(type, id, !on);
  };
  return { on, toggle, pending };
}
