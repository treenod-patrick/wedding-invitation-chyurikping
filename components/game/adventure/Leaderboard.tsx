"use client";
import { useEffect, useState } from "react";

const KEY = "wedding-adventure-leaderboard-v1";
const MAX_ENTRIES = 10;

export type LeaderboardEntry = {
  nickname: string;
  score: number;
  cleared: boolean;
  ts: number;
};

export function loadLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveScore(entry: LeaderboardEntry): LeaderboardEntry[] {
  const all = [...loadLeaderboard(), entry]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ENTRIES);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  return all;
}

type Props = {
  highlight?: LeaderboardEntry;
  onRetry?: () => void;
  onClose?: () => void;
};

export default function Leaderboard({ highlight, onRetry, onClose }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    setEntries(loadLeaderboard());
  }, []);

  return (
    <div className="rounded-md border-[3px] border-[#0d1530] bg-[#1a2240] p-3 font-mono text-white">
      <div className="text-center text-[11px] uppercase tracking-[0.3em] text-amber-300">
        Hall of Fame
      </div>
      <ol className="mt-2 space-y-1 text-[13px]">
        {entries.length === 0 && (
          <li className="text-center text-white/50">아직 기록이 없습니다.</li>
        )}
        {entries.map((e, i) => {
          const isMe =
            highlight && e.nickname === highlight.nickname && e.ts === highlight.ts;
          return (
            <li
              key={`${e.nickname}-${e.ts}`}
              className={`flex items-center justify-between rounded px-2 py-1 ${
                isMe ? "bg-amber-300 text-[#1a2240]" : i === 0 ? "bg-[#2a3470]" : ""
              }`}
            >
              <span className="w-6">{i + 1}.</span>
              <span className="flex-1 truncate">{e.nickname}</span>
              <span>{e.score}pt</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            onTouchEnd={(e) => {
              e.preventDefault();
              onRetry();
            }}
            className="flex-1 rounded-md border-[3px] border-amber-300 bg-amber-400 py-1.5 text-[12px] font-bold text-[#1a2240]"
            style={{ touchAction: "manipulation" }}
          >
            다시 도전
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            onTouchEnd={(e) => {
              e.preventDefault();
              onClose();
            }}
            className="rounded-md border-[3px] border-white bg-[#0d1530] px-3 py-1.5 text-[12px] text-white"
            style={{ touchAction: "manipulation" }}
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}
