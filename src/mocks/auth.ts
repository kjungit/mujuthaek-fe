// 화면용 예시 데이터 (디자인 WebSignup · WebFindPw · WebWelcome 및 모바일). 실제 값은 API에서 받아요.

export type AuthSession = {
  /** 가입한 사람 이름 */
  userName: string;
  /** 인증번호를 보낸 이메일(가린 값) */
  maskedEmail: string;
  /** 인증번호 남은 시간 */
  codeRemaining: string;
  /** 가입 전에 입력한 조건(소득·자산 제외) */
  savedConditions: string[];
};

export const authSession: AuthSession = {
  userName: "준",
  maskedEmail: "j**@example.com",
  codeRemaining: "4:52",
  savedConditions: ["만 29세", "서울 마포구", "미혼", "무주택 4년"],
};
