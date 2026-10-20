"use client";

import { useOffline } from "next/offline";

export function OfflineBanner() {
  const isOffline = useOffline();
  if (!isOffline) return null;

  return (
    <div role="status" className="bg-neutral-900 px-4 py-2 text-center text-sm text-white">
      오프라인 상태예요. 연결되면 자동으로 다시 불러올게요.
    </div>
  );
}
