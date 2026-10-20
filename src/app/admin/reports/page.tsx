import type { Metadata } from "next";
import { AdminWebReports } from "@/screens/admin/AdminWebReports";

export const metadata: Metadata = { title: "제보 | 무주택자들 관리자" };

export default function AdminWebReportsPage() {
  return <AdminWebReports />;
}
