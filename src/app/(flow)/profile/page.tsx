import type { Metadata } from "next";
import { Responsive } from "@/components/layout/Responsive";
import { MProfile } from "@/screens/profile/MProfile";
import { WebProfile } from "@/screens/profile/WebProfile";

export const metadata: Metadata = { title: "조건 입력 | 무주택자들" };

export default function ProfilePage() {
  return <Responsive web={<WebProfile />} mobile={<MProfile />} />;
}
