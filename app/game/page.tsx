"use client";
import dynamic from "next/dynamic";
import Link from "next/link";

const WeddingRunner = dynamic(() => import("@/components/game/WeddingRunner"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--color-cream)] text-[color:var(--color-rose-deep)]">
      게임을 준비하고 있어요…
    </div>
  ),
});

export default function GamePage() {
  return (
    <main className="game-bg min-h-screen">
      <header className="flex items-center justify-between px-5 py-4">
        <Link
          href="/"
          className="rounded-full border border-[color:var(--color-line)] bg-white/80 px-4 py-1.5 text-[13px] tracking-widest text-[color:var(--color-rose-deep)]"
        >
          ← 청첩장
        </Link>
        <p className="font-[family-name:var(--font-accent)] text-lg text-[color:var(--color-charcoal)]">
          Wedding Runner
        </p>
        <span className="w-[72px]" />
      </header>
      <WeddingRunner />
    </main>
  );
}
