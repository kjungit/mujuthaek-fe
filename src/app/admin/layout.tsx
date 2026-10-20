import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "관리자 | 무주택자들" };

/** 관리자는 PC 전용 화면이라 모바일 화면을 따로 두지 않아요 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
