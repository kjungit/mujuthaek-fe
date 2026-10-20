import type { Metadata } from "next";
import { Responsive } from "@/components/layout/Responsive";
import { MSignup } from "@/screens/auth/MSignup";
import { WebSignup } from "@/screens/auth/WebSignup";

export const metadata: Metadata = { title: "회원가입 | 무주택자들" };

export default function SignupPage() {
  return <Responsive web={<WebSignup />} mobile={<MSignup />} />;
}
