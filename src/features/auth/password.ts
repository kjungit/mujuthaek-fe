/** 비밀번호 규칙: 8자 이상 · 영문 포함 · 숫자 포함 */
export function passwordRules(pw: string) {
  return [
    { label: "8자 이상", ok: pw.length >= 8 },
    { label: "영문 포함", ok: /[A-Za-z]/.test(pw) },
    { label: "숫자 포함", ok: /\d/.test(pw) },
  ];
}

export const passwordOk = (pw: string) => passwordRules(pw).every((r) => r.ok);
