import type { Metadata } from "next";
import { Responsive } from "@/components/layout/Responsive";
import { MFindPw } from "@/screens/auth/MFindPw";
import { WebFindPw } from "@/screens/auth/WebFindPw";

export const metadata: Metadata = { title: "비밀번호 찾기 | 무주택자들" };

export default function FindPwPage() {
  return <Responsive web={<WebFindPw />} mobile={<MFindPw />} />;
}
