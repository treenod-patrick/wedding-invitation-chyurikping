"use client";
import { useEffect, useState } from "react";
import CharacterSelect, { type CharacterId } from "./CharacterSelect";
import Leaderboard, { saveScore, type LeaderboardEntry } from "./Leaderboard";
import OpeningIntro from "./OpeningIntro";
import Phase4Runner from "./Phase4Runner";
import TownScroll from "./TownScroll";
import { getBgm, loadMuted, saveMuted, type BgmTrack } from "./bgm";

type Phase = "title" | "intro" | "select" | "town" | "runner" | "ending";

const PHASE_TRACK: Record<Phase, BgmTrack> = {
  title: "title",
  intro: "intro",
  select: "intro",
  town: "town",
  runner: "runner",
  ending: "ending",
};

export default function WeddingAdventure() {
  const [phase, setPhase] = useState<Phase>("title");
  const [character, setCharacter] = useState<CharacterId>("groom");
  const [nickname, setNickname] = useState("하객");
  const [lastEntry, setLastEntry] = useState<LeaderboardEntry | null>(null);
  const [muted, setMuted] = useState(false);
  const [audioStarted, setAudioStarted] = useState(false);

  useEffect(() => {
    setMuted(loadMuted());
  }, []);

  useEffect(() => {
    const bgm = getBgm();
    bgm.setMuted(muted);
    saveMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (!audioStarted) return;
    const bgm = getBgm();
    bgm.play(PHASE_TRACK[phase]);
    return () => {
      /* keep playing across phase swaps; stop on unmount via title->mount logic */
    };
  }, [phase, audioStarted]);

  useEffect(() => {
    return () => {
      getBgm().stop();
    };
  }, []);

  const begin = () => {
    setAudioStarted(true);
    setPhase("intro");
  };
  const skipAll = () => {
    setAudioStarted(true);
    setPhase("runner");
  };

  return (
    <div className="relative space-y-3">
      <button
        onClick={() => setMuted((m) => !m)}
        onTouchEnd={(e) => {
          e.preventDefault();
          setMuted((m) => !m);
        }}
        className="absolute right-1 top-1 z-20 rounded-full border-[2px] border-white/70 bg-black/60 px-2 py-1 font-mono text-[11px] text-white"
        style={{ touchAction: "manipulation" }}
        aria-label={muted ? "BGM 켜기" : "BGM 끄기"}
      >
        {muted ? "🔇" : "🔊"}
      </button>
      {phase === "title" && (
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border-[3px] border-[#0d1530] bg-gradient-to-b from-[#0a1230] via-[#1a2a5a] to-[#3a5dab] font-mono text-white">
          <div className="flex h-full w-full flex-col items-center justify-center gap-3">
            <div className="text-[10px] uppercase tracking-[0.3em] text-amber-300">
              Wedding Adventure
            </div>
            <div className="text-center text-[18px] leading-tight">
              결혼이라는
              <br />
              신비한 모험
            </div>
            <div className="text-[10px] text-white/70">RPG → Runner</div>
            <button
              onClick={begin}
              onTouchEnd={(e) => {
                e.preventDefault();
                begin();
              }}
              className="mt-3 rounded-md border-[3px] border-amber-300 bg-amber-400 px-6 py-2 text-[13px] font-bold tracking-widest text-[#1a2240]"
              style={{ touchAction: "manipulation" }}
            >
              ▶ 모험 시작
            </button>
            <button
              onClick={skipAll}
              onTouchEnd={(e) => {
                e.preventDefault();
                skipAll();
              }}
              className="text-[11px] text-white/60 underline"
              style={{ touchAction: "manipulation" }}
            >
              연출 건너뛰고 게임만
            </button>
          </div>
        </div>
      )}

      {phase === "intro" && (
        <OpeningIntro
          onComplete={() => setPhase("select")}
          onSkip={() => setPhase("select")}
        />
      )}

      {phase === "select" && (
        <CharacterSelect
          onComplete={({ character: c, nickname: n }) => {
            setCharacter(c);
            setNickname(n);
            setPhase("town");
          }}
        />
      )}

      {phase === "town" && (
        <TownScroll
          onComplete={() => setPhase("runner")}
          onSkip={() => setPhase("runner")}
        />
      )}

      {phase === "runner" && (
        <Phase4Runner
          character={character}
          nickname={nickname}
          onComplete={({ score, cleared }) => {
            const entry: LeaderboardEntry = {
              nickname,
              score,
              cleared,
              ts: Date.now(),
            };
            saveScore(entry);
            setLastEntry(entry);
            setPhase("ending");
          }}
        />
      )}

      {phase === "ending" && lastEntry && (
        <div className="space-y-3">
          <div className="rounded-md border-[3px] border-[#0d1530] bg-[#1a2240] p-4 text-center font-mono text-white">
            <div className="text-[11px] uppercase tracking-[0.3em] text-amber-300">
              {lastEntry.cleared ? "결혼했다!" : "Game Over"}
            </div>
            <div className="mt-2 text-[28px] font-bold text-amber-300">
              {lastEntry.score}pt
            </div>
            <div className="text-[12px] text-white/70">{lastEntry.nickname}</div>
          </div>
          <Leaderboard
            highlight={lastEntry}
            onRetry={() => setPhase("runner")}
            onClose={() => setPhase("title")}
          />
        </div>
      )}
    </div>
  );
}
