// 관리자 「회원」 화면 타입과 예시 데이터. 실제 값은 GET /api/admin/users (백엔드 user 모듈)
export type AdminUserRole = "USER" | "ADMIN";

export type AdminUser = {
  id: string;
  nickname: string | null;
  role: AdminUserRole;
  /** 이어진 소셜 로그인 (KAKAO·NAVER·GOOGLE) */
  providers: string[];
  joinedAt: string;
  lastLoginAt: string | null;
};

export type AdminUsersPage = { items: AdminUser[]; total: number };

export type RoleChange = {
  changedAt: string;
  userId: string;
  nickname: string | null;
  fromRole: AdminUserRole;
  toRole: AdminUserRole;
  changedBy: string | null;
  changedByNickname: string | null;
};

export const adminUsersMock: AdminUser[] = [
  {
    id: "01a17000-0000-7000-8000-00000000ad01",
    nickname: "김○○",
    role: "ADMIN",
    providers: ["KAKAO"],
    joinedAt: "2026-10-01T00:00:00Z",
    lastLoginAt: "2026-10-27T01:00:00Z",
  },
  {
    id: "01a17000-0000-7000-8000-000000000b01",
    nickname: "이청년",
    role: "USER",
    providers: ["GOOGLE"],
    joinedAt: "2026-10-20T00:00:00Z",
    lastLoginAt: "2026-10-26T12:00:00Z",
  },
  {
    id: "01a17000-0000-7000-8000-000000000b02",
    nickname: "박신혼",
    role: "USER",
    providers: ["NAVER", "KAKAO"],
    joinedAt: "2026-10-22T00:00:00Z",
    lastLoginAt: null,
  },
];

export const roleChangesMock: RoleChange[] = [
  {
    changedAt: "2026-10-25T05:00:00Z",
    userId: "01a17000-0000-7000-8000-000000000b09",
    nickname: "최운영",
    fromRole: "ADMIN",
    toRole: "USER",
    changedBy: "01a17000-0000-7000-8000-00000000ad01",
    changedByNickname: "김○○",
  },
];
