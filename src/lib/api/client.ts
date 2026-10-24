import { endpoints } from "./endpoints";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

/** 백엔드 오류 응답 (Problem Details + 화면이 문구를 고를 code) */
export type Problem = {
  type?: string;
  title?: string;
  status?: number;
  code?: string;
  detail?: string;
  instance?: string;
  errors?: { field: string; reason: string }[];
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API 요청 실패 (${status})`);
    this.name = "ApiError";
  }

  /** 백엔드 오류 코드 (예: VALIDATION_FAILED, NOT_FOUND). 형식이 다르면 undefined */
  get code() {
    return (this.body as Problem | null)?.code;
  }
}

// access token은 메모리에만 둬요. refresh token은 백엔드가 HttpOnly 쿠키로 관리해요
let accessToken: string | null = null;
let refreshing: Promise<string | null> | null = null;

export const authToken = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
};

/** 쿠키의 refresh token으로 access token을 다시 받아요. 동시에 여러 번 불려도 한 번만 요청해요 */
export function refreshAccessToken(): Promise<string | null> {
  refreshing ??= fetch(`${API_BASE_URL}${endpoints.authRefresh}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    credentials: "include",
  })
    .then(async (res) => {
      const data = res.ok ? ((await res.json()) as { accessToken: string }) : null;
      accessToken = data?.accessToken ?? null;
      return accessToken;
    })
    .catch(() => {
      accessToken = null;
      return null;
    })
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

function send(path: string, { body, headers, ...init }: RequestOptions) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials: "include",
  });
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}) {
  let res = await send(path, options);

  // 토큰이 없거나 만료됐으면 한 번만 다시 받아서 재시도해요 (재발급·로그아웃 요청은 제외)
  if (res.status === 401 && !path.startsWith("/api/auth/") && (await refreshAccessToken())) {
    res = await send(path, options);
  }

  const data = res.status === 204 || res.status === 304 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data as T;
}

export const api = {
  get: <T>(path: string, init?: RequestOptions) => apiFetch<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "POST", body }),
  put: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "PUT", body }),
  patch: <T>(path: string, body?: unknown, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "PATCH", body }),
  delete: <T>(path: string, init?: RequestOptions) =>
    apiFetch<T>(path, { ...init, method: "DELETE" }),
};
