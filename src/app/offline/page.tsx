export const metadata = { title: "오프라인 | 무주택자들" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-xl font-bold">인터넷에 연결되어 있지 않아요</h1>
      <p className="text-sm text-neutral-500">연결되면 다시 시도해 주세요.</p>
    </main>
  );
}
