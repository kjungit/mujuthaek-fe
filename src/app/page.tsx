import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

// 메인(소개) 화면이 생기기 전까지 홈으로 보내요
export default function Page() {
  redirect(routes.home);
}
