import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Segment } from "@/components/ui/Segment";
import { cn } from "@/lib/cn";
import { routes, type Mode } from "@/lib/routes";
import { modeSegment } from "./nav";

const iconLink =
  "inline-flex size-[44px] items-center justify-center rounded-sm text-text-sub hover:text-text-sub";

/** 모바일 상단 바 56px: 로고 · 주거/사업공간 · 검색 · 알림 */
export function MTopBar({ mode = "home", unread = 0 }: { mode?: Mode; unread?: number }) {
  return (
    <header className="border-line-soft bg-surface sticky top-0 z-[2] flex h-[56px] items-center justify-between border-b border-solid pr-[6px] pl-[14px]">
      <div className="flex items-center gap-[10px]">
        <Link href={routes.main} aria-label="무주택자들 소개" className="inline-flex">
          <Logo size={28} />
        </Link>
        <Segment items={modeSegment(mode)} compact />
      </div>
      <div className="flex">
        <Link href={routes.search} aria-label="검색" className={iconLink}>
          <Search size={22} aria-hidden />
        </Link>
        <Link
          href={routes.alerts}
          aria-label={unread > 0 ? `알림, 새 알림 ${unread}개` : "알림"}
          className={cn(iconLink, "relative")}
        >
          <Bell size={22} aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="rounded-pill bg-brand absolute top-[10px] right-[11px] size-[8px] border-2 border-solid border-white"
            />
          )}
        </Link>
      </div>
    </header>
  );
}
