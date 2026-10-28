import { useQuery } from "@tanstack/react-query";
import { providerLabel, useSession } from "@/features/auth/session";
import { mockQuery } from "@/features/mock-query";
import { meData } from "@/mocks/me";

export const meKeys = {
  profile: ["me", "profile"] as const,
};

export function useMe() {
  return useQuery(mockQuery(meKeys.profile, meData));
}

/** 계정 칸: 로그인한 회원(GET /api/users/me)의 닉네임 · 간편 로그인 · 가입일. 백엔드는 이메일을 주지 않아요 */
export function useAccount() {
  const { data: session } = useSession();
  if (!session) return null;
  const joined = new Date(session.joinedAt).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return {
    name: session.nickname,
    joined: `${joined} 가입`,
    provider: session.providers.map((p) => providerLabel[p] ?? p).join(" · ") || "간편 로그인",
  };
}
