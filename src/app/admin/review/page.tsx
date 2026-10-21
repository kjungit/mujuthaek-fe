import type { Metadata } from "next";
import { AdminWebReview } from "@/screens/admin/AdminWebReview";

export const metadata: Metadata = { title: "검수 | 무주택자들 관리자" };

export default function AdminWebReviewPage() {
  return <AdminWebReview />;
}
