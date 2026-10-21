import { useQuery } from "@tanstack/react-query";
import { mockQuery } from "@/features/mock-query";
import { meData } from "@/mocks/me";

export const meKeys = {
  profile: ["me", "profile"] as const,
};

export function useMe() {
  return useQuery(mockQuery(meKeys.profile, meData));
}
