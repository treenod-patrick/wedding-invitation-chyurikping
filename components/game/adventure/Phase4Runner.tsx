"use client";
import { useEffect, useRef, useState } from "react";
import { drawSprite } from "./pixel";
import {
  BRIDE_IDLE,
  CAKE_HAZARD,
  CHAMPAGNE_ITEM,
  ENVELOPE_HAZARD,
  GROOM_RABBIT_IDLE,
  HEART_ITEM,
  PALETTE,
  RING_ITEM,
} from "./sprites";
import type { CharacterId } from "./CharacterSelect";
import { CHARACTER_NAMES, PARTNER_OF } from "./CharacterSelect";

const LANE_COUNT = 3;
const GAME_DURATION_MS = 60_000;
const SPAWN_INTERVAL_MS = 700;

type ItemKind = "ring" | "heart" | "champagne" | "envelope" | "kid" | "cake";

type GameItem = {
  id: number;
  lane: number;
  y: number;
  kind: ItemKind;
};

const ITEM_SCORE: Record<ItemKind, number> = {
  ring: 100,
  heart: 50,
  champagne: 150,
  envelope: -100,
  kid: -200,
  cake: -9999,
};

const SPRITE_BY_KIND: Record<ItemKind, string[]> = {
  ring: RING_ITEM,
  heart: HEART_ITEM,
  champagne: CHAMPAGNE_ITEM,
  envelope: ENVELOPE_HAZARD,
  kid: ENVELOPE_HAZARD,
  cake: CAKE_HAZARD,
};

const PLAYER_SPRITE: Record<CharacterId, string[]> = {
  groom: GROOM_RABBIT_IDLE,
  bride: BRIDE_IDLE,
};

const TRAIL_DELAY_MS = 450;

type Props = {
  character: CharacterId;
  nickname: string;
  onComplete: (result: { score: number; cleared: boolean; nickname: string }) => void;
};

type GameState = "idle" | "playing" | "ended";

export default function Phase4Runner({ character, nickname, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [hp, setHp] = useState(3);
  const [shieldUntil, setShieldUntil] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS / 1000);
  const laneRef = useRef(1);
  const laneHistoryRef = useRef<{ t: number; lane: number }[]>([]);
  const itemsRef = useRef<GameItem[]>([]);
  const idCounterRef = useRef(0);
  const startedAtRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const stateRef = useRef<GameState>("idle");
  const scoreRef = useRef(0);
  const hpRef = useRef(3);
  const shieldRef = useRef(0);
  const tickAccRef = useRef(0);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    hpRef.current = hp;
  }, [hp]);
  useEffect(() => {
    shieldRef.current = shieldUntil;
  }, [shieldUntil]);

  const start = () => {
    setState("playing");
    setScore(0);
    setHp(3);
    setShieldUntil(0);
    setTimeLeft(GAME_DURATION_MS / 1000);
    laneRef.current = 1;
    laneHistoryRef.current = [];
    itemsRef.current = [];
    idCounterRef.current = 0;
    startedAtRef.current = performance.now();
    lastSpawnRef.current = 0;
  };

  const finish = (cleared: boolean) => {
    setState("ended");
    onComplete({
      score: scoreRef.current + (cleared ? 500 : 0),
      cleared,
      nickname,
    });
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const W = c.width;
    const H = c.height;
    const laneW = W / LANE_COUNT;

    let raf = 0;
    let lastT = 0;

    const draw = () => {
      ctx.fillStyle = "#3a1a4a";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#5a2a6a";
      ctx.fillRect(W / 2 - laneW * 1.5, 0, laneW * 3, H);
      ctx.fillStyle = "#ffd860";
      const now = performance.now();
      const stripeOffset = (now / 8) % 30;
      for (let i = -1; i < H / 30 + 2; i++) {
        const y = i * 30 - stripeOffset;
        ctx.fillRect(W / 2 - 3, y, 6, 14);
      }
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      for (let l = 1; l < LANE_COUNT; l++) {
        const x = laneW * l;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }

      for (const it of itemsRef.current) {
        const x = laneW * it.lane + laneW / 2 - 24;
        drawSprite(ctx, SPRITE_BY_KIND[it.kind], PALETTE, x, it.y, 3);
      }

      const px = laneW * laneRef.current + laneW / 2 - 24;
      const py = H - 80;

      const partnerId = PARTNER_OF[character];
      const nowT = performance.now();
      let partnerLane = laneRef.current;
      const hist = laneHistoryRef.current;
      for (let i = hist.length - 1; i >= 0; i--) {
        if (nowT - hist[i].t >= TRAIL_DELAY_MS) {
          partnerLane = hist[i].lane;
          break;
        }
      }
      const ppx = laneW * partnerLane + laneW / 2 - 24;
      const ppy = H - 40;
      ctx.globalAlpha = 0.9;
      drawSprite(ctx, PLAYER_SPRITE[partnerId], PALETTE, ppx, ppy, 3);
      ctx.globalAlpha = 1;

      const invuln = stateRef.current === "playing" && performance.now() < shieldRef.current;
      if (!invuln || Math.floor(performance.now() / 100) % 2 === 0) {
        drawSprite(ctx, PLAYER_SPRITE[character], PALETTE, px, py, 3);
      }

      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(ppx + 10, ppy - 10, 32, 9);
      ctx.fillStyle = "#ffd860";
      ctx.font = "8px monospace";
      ctx.fillText(CHARACTER_NAMES[partnerId], ppx + 12, ppy - 3);
    };

    const loop = (t: number) => {
      const dt = lastT ? t - lastT : 16;
      lastT = t;

      if (stateRef.current === "playing") {
        const elapsed = t - startedAtRef.current;
        const remaining = Math.max(0, GAME_DURATION_MS - elapsed);
        setTimeLeft(Math.ceil(remaining / 1000));

        if (elapsed - lastSpawnRef.current > SPAWN_INTERVAL_MS) {
          lastSpawnRef.current = elapsed;
          const lane = Math.floor(Math.random() * LANE_COUNT);
          const r = Math.random();
          let kind: ItemKind = "ring";
          if (r < 0.32) kind = "ring";
          else if (r < 0.55) kind = "heart";
          else if (r < 0.65) kind = "champagne";
          else if (r < 0.8) kind = "envelope";
          else if (r < 0.92) kind = "kid";
          else kind = "cake";
          itemsRef.current.push({ id: ++idCounterRef.current, lane, y: -60, kind });
        }

        const speed = 0.18 + Math.min(0.18, elapsed / 600_000);
        for (const it of itemsRef.current) it.y += speed * dt;

        const playerY = H - 80;
        const playerLane = laneRef.current;
        const remain: GameItem[] = [];
        const playerInvuln = performance.now() < shieldRef.current;
        for (const it of itemsRef.current) {
          if (it.y > H + 60) continue;
          const hit = it.lane === playerLane && it.y > playerY - 30 && it.y < playerY + 40;
          if (hit) {
            const delta = ITEM_SCORE[it.kind];
            if (it.kind === "champagne") {
              setShieldUntil(performance.now() + 3000);
              setScore((s) => s + delta);
            } else if (it.kind === "cake") {
              if (!playerInvuln) {
                setHp(0);
                hpRef.current = 0;
                setTimeout(() => finish(false), 0);
              }
            } else if (it.kind === "envelope" || it.kind === "kid") {
              if (!playerInvuln) {
                setHp((h) => {
                  const next = Math.max(0, h - 1);
                  hpRef.current = next;
                  if (next <= 0) setTimeout(() => finish(false), 0);
                  return next;
                });
                setScore((s) => s + delta);
              }
            } else {
              setScore((s) => s + delta);
            }
            continue;
          }
          remain.push(it);
        }
        itemsRef.current = remain;

        tickAccRef.current += dt;
        if (tickAccRef.current >= 1000) {
          tickAccRef.current -= 1000;
          setScore((s) => s + 10);
        }

        if (remaining <= 0) {
          setTimeout(() => finish(true), 0);
        }
      }

      draw();
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [character, nickname, onComplete]);

  const recordLane = () => {
    const hist = laneHistoryRef.current;
    hist.push({ t: performance.now(), lane: laneRef.current });
    if (hist.length > 120) hist.splice(0, hist.length - 120);
  };

  useEffect(() => {
    if (state !== "playing") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a") {
        laneRef.current = Math.max(0, laneRef.current - 1);
        recordLane();
      }
      if (e.key === "ArrowRight" || e.key === "d") {
        laneRef.current = Math.min(LANE_COUNT - 1, laneRef.current + 1);
        recordLane();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state]);

  const move = (dir: -1 | 1) => {
    if (stateRef.current !== "playing") return;
    laneRef.current = Math.max(0, Math.min(LANE_COUNT - 1, laneRef.current + dir));
    recordLane();
  };

  return (
    <div className="relative aspect-[3/4] w-full max-w-[420px] mx-auto overflow-hidden rounded-md border-[3px] border-[#0d1530] bg-[#1a0a2a]">
      <canvas
        ref={canvasRef}
        width={360}
        height={480}
        style={{
          imageRendering: "pixelated",
          display: "block",
          width: "100%",
          height: "auto",
          touchAction: state === "playing" ? "none" : "auto",
        }}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-2 py-1 font-mono text-[11px] text-white">
        <div>♥ {hp}</div>
        <div className="rounded bg-black/60 px-1.5">{nickname}</div>
        <div>{timeLeft}s</div>
      </div>

      <div className="pointer-events-none absolute right-2 top-7 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[12px] text-amber-300">
        {score} pt
      </div>

      {state === "playing" && (
        <>
          <button
            onClick={() => move(-1)}
            onTouchStart={(e) => {
              e.preventDefault();
              move(-1);
            }}
            className="absolute bottom-3 left-3 h-14 w-14 rounded-full border-[3px] border-white bg-black/60 font-mono text-2xl text-white"
            style={{ touchAction: "manipulation" }}
          >
            ◀
          </button>
          <button
            onClick={() => move(1)}
            onTouchStart={(e) => {
              e.preventDefault();
              move(1);
            }}
            className="absolute bottom-3 right-3 h-14 w-14 rounded-full border-[3px] border-white bg-black/60 font-mono text-2xl text-white"
            style={{ touchAction: "manipulation" }}
          >
            ▶
          </button>
        </>
      )}

      {state === "idle" && (
        <button
          onClick={start}
          onTouchEnd={(e) => {
            e.preventDefault();
            start();
          }}
          className="absolute inset-x-3 bottom-3 rounded-md border-[3px] border-amber-300 bg-amber-400 py-2 text-[13px] font-bold tracking-widest text-[#1a2240] shadow-[inset_0_0_0_2px_#fff5cc]"
          style={{ touchAction: "manipulation" }}
        >
          ▶ START
        </button>
      )}
    </div>
  );
}
