import type { Metadata } from "next";
import { AdminWebCriteria } from "@/screens/admin/AdminWebCriteria";

export const metadata: Metadata = { title: "기준값 | 무주택자들 관리자" };

export default function AdminWebCriteriaPage() {
  return <AdminWebCriteria />;
}
