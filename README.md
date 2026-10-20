# 무주택자들 프론트엔드

공공 주거·창업지원 공고를 모아 지원 가능 여부를 알려주는 서비스의 PWA 프론트엔드예요.

## 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · TanStack Query · pnpm

## 처음 실행

준비물: Node 24+, pnpm 11

```bash
pnpm install
cp .env.example .env.local   # 값 채우기
pnpm dev                     # http://localhost:3000
```

백엔드(api)는 기본으로 `http://localhost:8080`을 바라봐요 (`NEXT_PUBLIC_API_BASE_URL`).

## 명령

| 명령                                | 하는 일                                        |
| ----------------------------------- | ---------------------------------------------- |
| `pnpm dev`                          | 개발 서버                                      |
| `pnpm build && pnpm start`          | 프로덕션 빌드·실행 (서비스 워커 확인은 여기서) |
| `pnpm lint`                         | ESLint                                         |
| `pnpm typecheck`                    | 라우트 타입 생성 + `tsc`                       |
| `pnpm format` / `pnpm format:check` | Prettier                                       |

PR마다 GitHub Actions가 format·lint·typecheck·build를 돌려요.

## 구조

```
src/app/manifest.ts             웹 앱 매니페스트
src/app/offline/                오프라인 폴백 페이지
src/app/providers.tsx           QueryClient + 서비스 워커 등록
src/components/pwa/             설치 안내, 푸시 토글, 오프라인 배너
src/lib/api/                    fetch 래퍼, 엔드포인트, 쿼리 키
src/lib/push.ts                 웹 푸시 구독/해지
public/sw.js                    서비스 워커 (오프라인 폴백, 정적 자산 캐시, 푸시)
```

## PWA

- 서비스 워커는 `public/sw.js`를 직접 작성해서 써요 (`next.config.ts`에서 `/sw.js` 캐시 끔).
- 확인: `pnpm build && pnpm start` → Chrome DevTools > Application에서 Manifest·Service Workers 확인, Network를 Offline으로 바꾸고 새로고침하면 `/offline`이 떠요.
- 페이지 이동 중 연결이 끊기면 `experimental.useOffline`이 요청을 보류했다가 다시 시도하고, 상단에 오프라인 배너를 보여줘요.

## 웹 푸시

1. VAPID 키 만들기: `pnpm dlx web-push generate-vapid-keys`
2. 공개 키는 `.env.local`의 `NEXT_PUBLIC_VAPID_PUBLIC_KEY`에, 비공개 키는 백엔드에만 둬요.
3. 구독 정보는 `POST /api/v1/notifications/subscriptions`로 보내요 (백엔드 notification 모듈 확정 전 임시 경로, `src/lib/api/endpoints.ts`).
4. 테스트: DevTools > Application > Service Workers의 Push 버튼으로 알림을 띄워볼 수 있어요.

iOS는 16.4 이상에서 홈 화면에 설치한 경우에만 푸시가 와요.
