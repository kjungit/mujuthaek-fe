import type { Metadata } from "next";
import { AdminWebSources } from "@/screens/admin/AdminWebSources";

export const metadata: Metadata = { title: "수집 현황 | 무주택자들 관리자" };

export default function AdminWebSourcesPage() {
  return <AdminWebSources />;
}
