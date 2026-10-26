"use client";

import Link from "next/link";
import { Store } from "lucide-react";
import { MTabBar } from "@/components/layout/MTabBar";
import { MTopBar } from "@/components/layout/MTopBar";
import { MPage } from "@/components/layout/Responsive";
import { VerdictBadge } from "@/components/ui/Badge";
import { useBizProfileChips, useBusinessSummary } from "@/features/business/queries";
import { useTypeFilter } from "@/features/business/state";
import { cn } from "@/lib/cn";
import { routes } from "@/lib/routes";
import { TypeFilters, spaceFilters, spaceLink, spaceThumb } from "./parts";

export function MBusiness() {
  const { data, loading } = useBusinessSummary();
  const profileChips = useBizProfileChips();
  const { filter, setFilter, count, visible } = useTypeFilter(data.list);

  return (
    <MPage>
      <MTopBar mode="business" unread={3} />
      <main className="flex flex-1 flex-col gap-[12px] px-[16px] pt-[20px] pb-[28px]">
        <div className="flex flex-col gap-[4px] px-[4px]">
          <h1 className="tracking-h1 m-0 text-[26px] font-extrabold">사업공간</h1>
          <span className="text-text-sub text-[15px]">
            입주 지원할 수 있는 곳{" "}
            <strong className="text-brand-strong">{data.spaces.count}곳</strong>
          </span>
        </div>

        <div className="flex gap-[6px] overflow-x-auto px-[4px] pb-[2px]">
          {profileChips.map((c) => (
            <span
              key={c}
              className="rounded-pill bg-surface flex-none px-[12px] py-[6px] text-[13px] font-semibold"
            >
              {c}
            </span>
          ))}
          <Link
            href={routes.bizOnboarding}
            className="rounded-pill bg-brand-soft text-brand-strong hover:text-brand-strong flex-none px-[12px] py-[6px] text-[13px] font-bold no-underline"
          >
            {profileChips.length ? "수정" : "사업 정보 입력하기"}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-[10px]">
          <a
            href="#spaces"
            className="bg-brand-deep flex flex-col gap-[6px] rounded-[22px] p-[18px] text-white no-underline hover:text-white"
          >
            <span className="text-brand-deep-text text-[13px] font-semibold">입주 지원 가능</span>
            <span className="tracking-h1 text-[28px] font-extrabold">{data.spaces.count}곳</span>
            <span className="text-brand-deep-text text-[12px]">
              마감 임박 {data.spaces.closingSoon}곳
            </span>
          </a>
          <Link
            href={routes.bizSupport}
            className="bg-surface text-text hover:text-text flex flex-col gap-[6px] rounded-[22px] p-[18px] no-underline"
          >
            <span className="text-text-sub text-[13px] font-semibold">사업 지원</span>
            <span className="tracking-h1 text-[28px] font-extrabold">{data.support.count}개</span>
            <span className="text-text-sub text-[12px]">
              {data.support.maxAmount
                ? `최대 ${data.support.maxAmount}`
                : `확인 필요 ${data.support.needCheck}개`}
            </span>
          </Link>
        </div>

        <TypeFilters
          label="공간 종류"
          options={spaceFilters(true)}
          value={filter}
          onChange={setFilter}
          count={count}
          mobile
          id="spaces"
          className="overflow-x-auto px-[4px] pt-[4px] pb-[2px]"
        />

        {visible.length === 0 && (
          <p className="text-text-sub m-0 px-[20px] py-[40px] text-center text-[15px]">
            {loading ? "공간을 불러오는 중이에요" : "지금 지원할 수 있는 공간이 없어요"}
          </p>
        )}
        {visible.map((it) => (
          <Link
            key={it.id}
            {...spaceLink(it)}
            className="bg-surface text-text hover:text-text flex gap-[14px] rounded-[22px] p-[16px] no-underline"
          >
            <span
              className={cn(
                "flex size-[76px] flex-none items-center justify-center rounded-[16px]",
                spaceThumb(it.type),
              )}
            >
              <Store size={30} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-[5px]">
              <span className="flex items-center justify-between gap-[6px]">
                {it.verdict && <VerdictBadge verdict={it.verdict} size="xs" />}
                <span className="flex-1" />
                <span className="text-[13px] font-extrabold">{it.due}</span>
              </span>
              <span className="text-[16px] font-extrabold tracking-[-0.02em]">{it.title}</span>
              <span className="text-text-tertiary text-[12px]">{it.org}</span>
              <span className="text-[14px] font-semibold">{it.info}</span>
              <span className="text-text-sub text-[13px]">{it.money}</span>
            </span>
          </Link>
        ))}
      </main>
      <MTabBar mode="business" current={routes.business} />
    </MPage>
  );
}
