import type { Metadata } from "next";
import { AdminWebHome } from "@/screens/admin/AdminWebHome";

export const metadata: Metadata = { title: "개요 | 무주택자들 관리자" };

export default function AdminWebHomePage() {
  return <AdminWebHome />;
}
