import type { Metadata } from "next";
import { Responsive } from "@/components/layout/Responsive";
import { MMe } from "@/screens/me/MMe";
import { WebMe } from "@/screens/me/WebMe";

export const metadata: Metadata = { title: "내 정보 | 무주택자들" };

export default function MePage() {
  return <Responsive web={<WebMe />} mobile={<MMe />} />;
}
