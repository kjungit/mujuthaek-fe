import type { Metadata } from "next";
import { AdminWebTraffic } from "@/screens/admin/AdminWebTraffic";

export const metadata: Metadata = { title: "트래픽 | 무주택자들 관리자" };

export default function AdminWebTrafficPage() {
  return <AdminWebTraffic />;
}
