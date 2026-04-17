"use client";
import { useEffect, useState } from "react";

export type DialogLine = {
  speaker?: string;
  text: string;
};

type Props = {
  lines: DialogLine[];
  onComplete: () => void;
  onSkip?: () => void;
  charsPerSecond?: number;
};

export default function DialogBox({ lines, onComplete, onSkip, charsPerSecond = 36 }: Props) {
  const [idx, setIdx] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [done, setDone] = useState(false);

  const line = lines[idx];

  useEffect(() => {
    setCharCount(0);
    setDone(false);
    if (!line) return;
    const interval = 1000 / charsPerSecond;
    let cancelled = false;
    let n = 0;
    const tick = () => {
      if (cancelled) return;
      n += 1;
      setCharCount(n);
      if (n >= line.text.length) {
        setDone(true);
        return;
      }
      setTimeout(tick, interval);
    };
    const t = setTimeout(tick, interval);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [idx, line, charsPerSecond]);

  if (!line) return null;

  const advance = () => {
    if (!done) {
      setCharCount(line.text.length);
      setDone(true);
      return;
    }
    if (idx + 1 >= lines.length) {
      onComplete();
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <div
      onClick={advance}
      onTouchEnd={(e) => {
        e.preventDefault();
        advance();
      }}
      className="absolute inset-x-0 bottom-0 cursor-pointer select-none"
      style={{ touchAction: "manipulation" }}
    >
      {onSkip && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSkip();
          }}
          onTouchEnd={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onSkip();
          }}
          className="absolute right-2 top-[-32px] rounded-md border border-white/40 bg-black/60 px-2 py-0.5 text-[10px] tracking-widest text-white"
          style={{ touchAction: "manipulation" }}
        >
          ▶▶ SKIP
        </button>
      )}
      <div
        className="mx-2 mb-2 rounded-md border-[3px] border-white bg-[#1a2240] px-3 py-2.5 font-mono text-white shadow-[inset_0_0_0_2px_#0d1530]"
        style={{ minHeight: 78 }}
      >
        {line.speaker && (
          <div className="mb-1 text-[10px] uppercase tracking-[0.2em] text-amber-300">
            {line.speaker}
          </div>
        )}
        <div className="text-[13px] leading-snug">
          {line.text.slice(0, charCount)}
          {done && <span className="ml-1 inline-block animate-pulse">▼</span>}
        </div>
      </div>
    </div>
  );
}
