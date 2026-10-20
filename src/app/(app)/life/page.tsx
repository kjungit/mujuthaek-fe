import type { Metadata } from "next";
import { Responsive } from "@/components/layout/Responsive";
import { MLife } from "@/screens/life/MLife";
import { WebLife } from "@/screens/life/WebLife";

export const metadata: Metadata = { title: "생활권 | 무주택자들" };

export default function LifePage() {
  return <Responsive web={<WebLife />} mobile={<MLife />} />;
}
