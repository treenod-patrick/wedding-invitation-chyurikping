"use client";
import { useEffect, useRef, useState } from "react";

type GameStatus = "intro" | "playing" | "ending" | "gameover";
type ItemKind = "ring" | "heart" | "champagne" | "envelope" | "cake";
type Score = { name: string; score: number; ts: number };

const LEADERBOARD_KEY = "wedding_runner_leaderboard_v1";
const NICK_KEY = "wedding_runner_nick";

function readBoard(): Score[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LEADERBOARD_KEY);
    return raw ? (JSON.parse(raw) as Score[]) : [];
  } catch {
    return [];
  }
}

function writeBoard(board: Score[]) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(board.slice(0, 10)));
  } catch {}
}

const ITEM_META: Record<ItemKind, { label: string; value: number; isHazard: boolean }> = {
  ring: { label: "💍", value: 100, isHazard: false },
  heart: { label: "♥", value: 50, isHazard: false },
  champagne: { label: "🥂", value: 150, isHazard: false },
  envelope: { label: "✉", value: -100, isHazard: true },
  cake: { label: "🎂", value: -1, isHazard: true },
};

type Sprite = { x: number; y: number; lane: number; kind: ItemKind; hit?: boolean };

export default function WeddingRunner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);

  const [status, setStatus] = useState<GameStatus>("intro");
  const [finalScore, setFinalScore] = useState(0);
  const [nick, setNick] = useState("");
  const [board, setBoard] = useState<Score[]>([]);
  const [reason, setReason] = useState<"clear" | "crash">("clear");

  useEffect(() => {
    setBoard(readBoard());
    if (typeof window !== "undefined") {
      const n = localStorage.getItem(NICK_KEY);
      if (n) setNick(n);
    }
  }, []);

  useEffect(() => () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const startGame = () => {
    if (runningRef.current) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    setStatus("playing");

    const cssW = Math.max(260, Math.min(380, container.clientWidth || 320));
    const cssH = Math.min(520, Math.round(cssW * 1.4));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = cssW;
    const H = cssH;
    const LANES = 3;
    const laneX = (i: number) => W * (0.2 + i * 0.3);

    let lane = 1;
    let score = 0;
    let elapsed = 0;
    let invuln = 0;
    let speed = 220;
    const DURATION_MS = 60_000;
    let last = performance.now();
    let spawnAcc = 0;

    const sprites: Sprite[] = [];
    let cleared = false;
    let finished = false;

    runningRef.current = true;

    const end = (why: "clear" | "crash", finalS: number) => {
      if (finished) return;
      finished = true;
      runningRef.current = false;
      setReason(why);
      setFinalScore(Math.max(0, finalS));
      setStatus(why === "clear" ? "ending" : "gameover");
    };

    const spawn = () => {
      const kinds: ItemKind[] = ["ring", "ring", "heart", "champagne", "envelope", "cake"];
      const kind = kinds[Math.floor(Math.random() * kinds.length)];
      sprites.push({ x: laneX(Math.floor(Math.random() * LANES)), y: -30, lane: Math.floor(Math.random() * LANES), kind });
    };

    const drawBackdrop = () => {
      ctx.fillStyle = "#fff5ec";
      ctx.fillRect(0, 0, W, H);
      // side grass
      ctx.fillStyle = "rgba(216,229,210,0.5)";
      ctx.fillRect(0, 0, W * 0.12, H);
      ctx.fillRect(W * 0.88, 0, W * 0.12, H);
      // carpet
      ctx.fillStyle = "rgba(255,228,214,0.8)";
      ctx.fillRect(W * 0.12, 0, W * 0.76, H);
      // scroll lines
      const offset = (elapsed * 0.1) % 24;
      ctx.strokeStyle = "rgba(232,147,120,0.4)";
      ctx.lineWidth = 1.5;
      for (let y = -24 + offset; y < H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(W * 0.12, y);
        ctx.lineTo(W * 0.88, y);
        ctx.stroke();
      }
      // lane guides
      ctx.strokeStyle = "rgba(232,147,120,0.25)";
      for (let i = 1; i < LANES; i++) {
        const x = W * (0.12 + (i * 0.76) / LANES);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    };

    const drawPlayer = (x: number, y: number) => {
      // body
      ctx.fillStyle = "#4a3c36";
      roundRect(ctx, x - 14, y - 14, 28, 32, 4);
      ctx.fill();
      // shirt
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 4, y - 10, 8, 20);
      // bow
      ctx.fillStyle = "#e89378";
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 10);
      ctx.lineTo(x + 3, y - 10);
      ctx.lineTo(x, y - 2);
      ctx.closePath();
      ctx.fill();
      // head
      ctx.fillStyle = "#fde0c5";
      ctx.beginPath();
      ctx.arc(x, y - 28, 11, 0, Math.PI * 2);
      ctx.fill();
      // hair
      ctx.fillStyle = "#3a2a20";
      ctx.fillRect(x - 9, y - 38, 18, 6);
      // eyes
      ctx.fillStyle = "#2f2a28";
      ctx.beginPath();
      ctx.arc(x - 4, y - 28, 1.5, 0, Math.PI * 2);
      ctx.arc(x + 4, y - 28, 1.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawItem = (s: Sprite) => {
      const { x, y, kind } = s;
      if (kind === "ring") {
        ctx.strokeStyle = "#ffcf66";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#fff6b0";
        ctx.beginPath();
        ctx.arc(x, y - 10, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "heart") {
        ctx.fillStyle = "#ff7a8a";
        ctx.beginPath();
        ctx.arc(x - 5, y - 2, 6, 0, Math.PI * 2);
        ctx.arc(x + 5, y - 2, 6, 0, Math.PI * 2);
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x + 10, y);
        ctx.lineTo(x, y + 12);
        ctx.closePath();
        ctx.fill();
      } else if (kind === "champagne") {
        ctx.fillStyle = "#fff2cc";
        roundRect(ctx, x - 6, y - 12, 12, 18, 2);
        ctx.fill();
        ctx.fillStyle = "#e6b35c";
        ctx.fillRect(x - 8, y - 14, 16, 4);
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x - 3, y - 8, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "envelope") {
        ctx.fillStyle = "#ffe0e0";
        ctx.fillRect(x - 12, y - 8, 24, 16);
        ctx.strokeStyle = "#d97a7a";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 12, y - 8, 24, 16);
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 8);
        ctx.lineTo(x, y + 2);
        ctx.lineTo(x + 12, y - 8);
        ctx.stroke();
      } else if (kind === "cake") {
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, x - 14, y - 4, 28, 14, 2);
        ctx.fill();
        ctx.fillStyle = "#ff5b78";
        roundRect(ctx, x - 10, y - 10, 20, 8, 2);
        ctx.fill();
        ctx.fillStyle = "#fff2cc";
        ctx.beginPath();
        ctx.arc(x, y - 12, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawHud = () => {
      ctx.fillStyle = "#4a3c36";
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.fillText(String(score), 12, 28);
      ctx.textAlign = "right";
      const remain = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
      ctx.fillText(String(remain), W - 12, 28);
      ctx.textAlign = "left";
    };

    const step = (now: number) => {
      if (!runningRef.current) return;
      const dt = Math.min(48, now - last);
      last = now;
      elapsed += dt;
      if (invuln > 0) invuln -= dt;

      // speed ramp
      speed = 220 + Math.min(200, elapsed * 0.003);

      // spawn
      spawnAcc += dt;
      const spawnInterval = Math.max(400, 900 - elapsed * 0.008);
      if (spawnAcc > spawnInterval) {
        spawnAcc = 0;
        spawn();
      }

      // move
      const dy = (speed * dt) / 1000;
      for (const s of sprites) s.y += dy;

      drawBackdrop();

      // items
      for (const s of sprites) drawItem(s);

      // player
      const px = laneX(lane);
      const py = H - 90;
      if (invuln > 0 && Math.floor(elapsed / 80) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      drawPlayer(px, py);
      ctx.globalAlpha = 1;

      drawHud();

      // collision
      for (const s of sprites) {
        if (s.hit) continue;
        if (Math.abs(s.x - px) < 22 && Math.abs(s.y - py + 14) < 28) {
          s.hit = true;
          const meta = ITEM_META[s.kind];
          if (s.kind === "cake") {
            if (invuln <= 0) {
              end("crash", score);
              return;
            }
          } else if (s.kind === "champagne") {
            score += meta.value;
            invuln = 3000;
          } else {
            score += meta.value;
          }
        }
      }

      // cleanup
      for (let i = sprites.length - 1; i >= 0; i--) {
        if (sprites[i].y > H + 40 || sprites[i].hit) sprites.splice(i, 1);
      }

      if (elapsed >= DURATION_MS && !cleared) {
        cleared = true;
        end("clear", score + 500);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // input
    let touchStartX = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0]?.clientX ?? 0;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX ?? touchStartX;
      const dx = endX - touchStartX;
      if (Math.abs(dx) > 30) {
        lane = Math.max(0, Math.min(LANES - 1, lane + (dx > 0 ? 1 : -1)));
      } else {
        const rect = canvas.getBoundingClientRect();
        const rel = (endX - rect.left) / rect.width;
        lane = rel < 0.33 ? 0 : rel > 0.66 ? 2 : 1;
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") lane = Math.max(0, lane - 1);
      if (e.key === "ArrowRight") lane = Math.min(LANES - 1, lane + 1);
    };
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);

    const cleanup = () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };

    // attach cleanup on status change
    const prevOnStatus = runningRef.current;
    void prevOnStatus;
    (canvas as HTMLCanvasElement & { __cleanup?: () => void }).__cleanup = cleanup;

    last = performance.now();
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    if (status !== "playing") {
      const c = canvasRef.current as (HTMLCanvasElement & { __cleanup?: () => void }) | null;
      if (c?.__cleanup) {
        c.__cleanup();
        c.__cleanup = undefined;
      }
    }
  }, [status]);

  const submitScore = () => {
    if (!nick.trim()) return;
    localStorage.setItem(NICK_KEY, nick.trim());
    const next = [...board, { name: nick.trim(), score: finalScore, ts: Date.now() }]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    writeBoard(next);
    setBoard(next);
    setStatus("intro");
  };

  const restart = () => {
    setStatus("intro");
    setFinalScore(0);
  };

  const moveLane = (delta: number) => {
    // Left/Right touch buttons dispatch a synthetic key event
    window.dispatchEvent(new KeyboardEvent("keydown", { key: delta < 0 ? "ArrowLeft" : "ArrowRight" }));
  };

  return (
    <div className="flex flex-col items-center px-2 pb-12">
      <div
        ref={containerRef}
        className="my-4 w-full max-w-[380px] overflow-hidden rounded-2xl shadow-lg ring-1 ring-[color:var(--color-line)]"
      >
        <canvas
          ref={canvasRef}
          className="block w-full"
          style={{ touchAction: status === "playing" ? "none" : "auto", background: "#fff5ec", minHeight: 240 }}
        />
      </div>

      {status === "playing" && (
        <div className="mt-2 flex w-full max-w-[380px] gap-3">
          <button
            onClick={() => moveLane(-1)}
            className="flex-1 rounded-full bg-white py-3 text-[14px] font-medium tracking-[0.3em] text-[color:var(--color-rose-deep)] shadow-md ring-1 ring-[color:var(--color-line)]"
          >
            ← LEFT
          </button>
          <button
            onClick={() => moveLane(1)}
            className="flex-1 rounded-full bg-white py-3 text-[14px] font-medium tracking-[0.3em] text-[color:var(--color-rose-deep)] shadow-md ring-1 ring-[color:var(--color-line)]"
          >
            RIGHT →
          </button>
        </div>
      )}

      {status === "intro" && (
        <div className="mt-2 w-full max-w-md rounded-3xl bg-white/80 p-6 text-center shadow-md ring-1 ring-[color:var(--color-line)]">
          <p className="eyebrow">How to play</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-charcoal)]/85">
            좌우로 스와이프(또는 ← →)해 레인을 옮기며<br />
            💍 반지·♥ 하트·🥂 샴페인을 모으세요.<br />
            ✉ 축의금 봉투는 −100, 🎂 케이크 충돌은 게임 오버.<br />
            <span className="text-[color:var(--color-rose-deep)]">60초 버티면 식장 도착!</span>
          </p>
          <button
            onClick={startGame}
            onTouchEnd={(e) => { e.preventDefault(); startGame(); }}
            className="mt-6 rounded-full bg-[color:var(--color-rose-deep)] px-8 py-3 text-[14px] font-medium tracking-[0.3em] text-white shadow-md"
          >
            START
          </button>

          {board.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow">Top 10</p>
              <ol className="mt-3 space-y-1 text-[14px]">
                {board.map((s, i) => (
                  <li key={`${s.name}-${s.ts}`} className="flex justify-between rounded-lg bg-[color:var(--color-blush)]/40 px-4 py-1.5">
                    <span><b className="mr-2 text-[color:var(--color-rose-deep)]">{i + 1}</b>{s.name}</span>
                    <span className="font-mono">{s.score}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {(status === "ending" || status === "gameover") && (
        <div className="mt-2 w-full max-w-md rounded-3xl bg-white/95 p-6 text-center shadow-xl ring-1 ring-[color:var(--color-line)]">
          <p className="eyebrow">{status === "ending" ? "Wedding Day" : "Game Over"}</p>
          <p className="mt-3 font-[family-name:var(--font-accent)] text-3xl text-[color:var(--color-charcoal)]">
            {status === "ending" ? "결혼했다!" : reason === "crash" ? "케이크에 부딪혔어요" : ""}
          </p>
          <p className="mt-2 text-[15px] text-[color:var(--color-mute)]">
            {status === "ending" ? "끝까지 달려주셔서 감사합니다 (+500 보너스)" : "다시 도전해 보세요"}
          </p>
          <p className="mt-6 font-mono text-4xl text-[color:var(--color-rose-deep)]">{finalScore}</p>

          <div className="mt-6">
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="닉네임"
              maxLength={12}
              className="mb-3 w-full rounded-xl border border-[color:var(--color-line)] bg-white px-4 py-3 text-center text-[15px] outline-none focus:border-[color:var(--color-rose-deep)]"
            />
            <div className="flex gap-2">
              <button
                onClick={restart}
                className="flex-1 rounded-full border border-[color:var(--color-line)] py-3 text-[14px] text-[color:var(--color-mute)]"
              >
                다시 하기
              </button>
              <button
                onClick={submitScore}
                disabled={!nick.trim()}
                className="flex-1 rounded-full bg-[color:var(--color-rose-deep)] py-3 text-[14px] font-medium text-white disabled:opacity-50"
              >
                기록 등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
