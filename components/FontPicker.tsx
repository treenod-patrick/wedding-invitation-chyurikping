"use client";
import { useState, useEffect } from "react";
import { fonts, type FontId } from "@/lib/data";

type Props = {
  value: FontId;
  onChange: (id: FontId) => void;
};

export default function FontPicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("font") : null;
    if (saved && fonts.some((f) => f.id === saved)) onChange(saved as FontId);
  }, [onChange]);

  const select = (id: FontId) => {
    onChange(id);
    if (typeof window !== "undefined") localStorage.setItem("font", id);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="글씨체 변경"
        className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-ink)] text-[color:var(--color-ivory)] shadow-lg active:scale-95 transition"
      >
        <span className="text-lg font-semibold">가</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-[color:var(--color-ivory)] p-5 pb-8 max-h-[70vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold">글씨체 선택</h3>
              <button onClick={() => setOpen(false)} aria-label="닫기" className="text-xl text-[color:var(--color-warm-gray)]">×</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {fonts.map((f) => (
                <button
                  key={f.id}
                  onClick={() => select(f.id)}
                  className={`${f.cls} rounded-lg border px-3 py-4 text-left transition ${
                    value === f.id
                      ? "border-[color:var(--color-gold)] bg-white"
                      : "border-[color:var(--color-warm-gray)]/20 hover:border-[color:var(--color-gold)]/50"
                  }`}
                >
                  <div className="text-xs text-[color:var(--color-warm-gray)]">{f.cat}</div>
                  <div className="text-lg">{f.label}</div>
                  <div className="text-sm text-[color:var(--color-ink)]/70">우리 결혼합니다</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
