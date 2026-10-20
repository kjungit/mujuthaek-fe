import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { PushToggle } from "@/components/pwa/PushToggle";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold">무주택자들</h1>
        <p className="mt-1 text-sm text-neutral-500">
          공공 주거·창업지원 공고를 모아 지원 가능 여부를 알려드려요.
        </p>
      </header>
      <PushToggle />
      <InstallPrompt />
    </main>
  );
}
