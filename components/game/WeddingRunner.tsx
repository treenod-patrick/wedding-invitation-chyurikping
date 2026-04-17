"use client";
import { useEffect, useRef, useState } from "react";

type GameStatus = "intro" | "playing" | "ending" | "gameover";
type EntityKind = "ring" | "heart" | "champagne" | "envelope" | "cake" | "fence";
type Score = { name: string; score: number; ts: number };

const LEADERBOARD_KEY = "wedding_runner_leaderboard_v2";
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

type Entity = {
  x: number;
  y: number;
  kind: EntityKind;
  hit?: boolean;
  vy?: number;
  bob?: number;
};

const VALUES: Record<EntityKind, number> = {
  ring: 100,
  heart: 50,
  champagne: 150,
  envelope: -100,
  cake: 0,
  fence: 0,
};

export default function WeddingRunner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const jumpRef = useRef<() => void>(() => {});

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

    // Side-scroller: wider than tall for landscape feel inside a card
    const cssW = Math.max(280, Math.min(380, container.clientWidth || 320));
    const cssH = Math.round(cssW * 0.95); // near-square but slightly landscape feel
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
    const GROUND_Y = H * 0.78;
    const PLAYER_X = W * 0.22;
    const GRAVITY = 1800; // px/s^2
    const JUMP_V = -640; // px/s
    const SCROLL_BASE = 180; // px/s

    let score = 0;
    let elapsed = 0;
    let invuln = 0;
    let scroll = SCROLL_BASE;
    const DURATION_MS = 60_000;
    let last = performance.now();
    let spawnAcc = 0;
    let runFrame = 0;

    let py = GROUND_Y;
    let pvy = 0;
    let onGround = true;
    let jumpCount = 0; // double-jump support
    let bgScroll = 0;
    let cloudScroll = 0;

    const entities: Entity[] = [];
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

    const doJump = () => {
      if (!runningRef.current) return;
      if (jumpCount < 2) {
        pvy = JUMP_V * (jumpCount === 0 ? 1 : 0.85);
        onGround = false;
        jumpCount += 1;
      }
    };
    jumpRef.current = doJump;

    const spawn = () => {
      // Pick kind with weighting
      const r = Math.random();
      let kind: EntityKind;
      if (r < 0.32) kind = "ring";
      else if (r < 0.5) kind = "heart";
      else if (r < 0.6) kind = "champagne";
      else if (r < 0.78) kind = "envelope"; // ground hazard, low
      else if (r < 0.92) kind = "fence"; // ground obstacle, must jump
      else kind = "cake"; // taller obstacle, must jump high

      let y = GROUND_Y - 18;
      if (kind === "ring" || kind === "heart" || kind === "champagne") {
        // sometimes airborne so player jumps to grab
        y = Math.random() < 0.5 ? GROUND_Y - 18 : GROUND_Y - 80 - Math.random() * 40;
      } else if (kind === "fence") {
        y = GROUND_Y - 14;
      } else if (kind === "envelope") {
        y = GROUND_Y - 16;
      } else if (kind === "cake") {
        y = GROUND_Y - 22;
      }
      entities.push({ x: W + 30, y, kind, bob: Math.random() * Math.PI * 2 });
    };

    const drawBackdrop = () => {
      // sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
      sky.addColorStop(0, "#fde8e0");
      sky.addColorStop(1, "#fff5ec");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, GROUND_Y);

      // sun
      ctx.fillStyle = "rgba(255,205,180,0.55)";
      ctx.beginPath();
      ctx.arc(W * 0.78, H * 0.18, 22, 0, Math.PI * 2);
      ctx.fill();

      // far hills (parallax slow)
      const hillsOff = (bgScroll * 0.15) % W;
      ctx.fillStyle = "#f0c9c0";
      drawHills(-hillsOff, GROUND_Y - 36, 60, 18);
      drawHills(W - hillsOff, GROUND_Y - 36, 60, 18);

      // mid hills
      const midOff = (bgScroll * 0.3) % W;
      ctx.fillStyle = "#e8b3a8";
      drawHills(-midOff, GROUND_Y - 18, 40, 12);
      drawHills(W - midOff, GROUND_Y - 18, 40, 12);

      // clouds
      const cOff = cloudScroll % (W + 80);
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      drawCloud(W * 0.2 - cOff, H * 0.18, 14);
      drawCloud(W * 0.55 - cOff, H * 0.1, 18);
      drawCloud(W * 0.9 - cOff + W, H * 0.22, 12);
      drawCloud(W * 1.4 - cOff, H * 0.15, 16);

      // ground band
      ctx.fillStyle = "#dcb59f";
      ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      // grass top
      ctx.fillStyle = "#bcd6a4";
      ctx.fillRect(0, GROUND_Y - 4, W, 6);

      // ground stripes (motion lines)
      const gOff = bgScroll % 32;
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      for (let x = -gOff; x < W; x += 32) {
        ctx.fillRect(x, GROUND_Y + 14, 16, 3);
      }
    };

    const drawHills = (x: number, baseY: number, w: number, h: number) => {
      ctx.beginPath();
      ctx.moveTo(x, baseY);
      for (let i = 0; i < W / w + 2; i++) {
        const cx = x + i * w + w / 2;
        ctx.quadraticCurveTo(cx, baseY - h, x + (i + 1) * w, baseY);
      }
      ctx.lineTo(x + W + w * 2, baseY + 60);
      ctx.lineTo(x, baseY + 60);
      ctx.closePath();
      ctx.fill();
    };

    const drawCloud = (x: number, y: number, r: number) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.arc(x + r * 0.9, y + 2, r * 0.85, 0, Math.PI * 2);
      ctx.arc(x - r * 0.85, y + 3, r * 0.75, 0, Math.PI * 2);
      ctx.fill();
    };

    // Original character: a round bunny-like creature in a tuxedo (the groom)
    const drawPlayer = (x: number, baseY: number) => {
      const inAir = !onGround;
      const t = runFrame;
      const bob = inAir ? 0 : Math.sin(t * 0.35) * 1.2;

      // shadow
      const shadowAlpha = inAir ? 0.18 : 0.35;
      const shadowW = inAir ? 18 : 26;
      ctx.fillStyle = `rgba(60,40,40,${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(x, GROUND_Y + 6, shadowW, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      const cy = baseY - 22 + bob; // body center

      // legs (running animation when grounded)
      ctx.strokeStyle = "#3a2a25";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      if (!inAir) {
        const swing = Math.sin(t * 0.45) * 6;
        ctx.beginPath();
        ctx.moveTo(x - 6, baseY - 4);
        ctx.lineTo(x - 6 + swing, baseY + 2);
        ctx.moveTo(x + 6, baseY - 4);
        ctx.lineTo(x + 6 - swing, baseY + 2);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(x - 5, baseY - 6);
        ctx.lineTo(x - 7, baseY - 1);
        ctx.moveTo(x + 5, baseY - 6);
        ctx.lineTo(x + 7, baseY - 1);
        ctx.stroke();
      }

      // body (egg shape, white tuxedo body)
      ctx.fillStyle = "#fdf8f4";
      ctx.beginPath();
      ctx.ellipse(x, cy, 14, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      // tuxedo lapels
      ctx.fillStyle = "#3a2a25";
      ctx.beginPath();
      ctx.moveTo(x - 14, cy - 4);
      ctx.lineTo(x - 4, cy - 12);
      ctx.lineTo(x - 2, cy + 4);
      ctx.lineTo(x - 12, cy + 8);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 14, cy - 4);
      ctx.lineTo(x + 4, cy - 12);
      ctx.lineTo(x + 2, cy + 4);
      ctx.lineTo(x + 12, cy + 8);
      ctx.closePath();
      ctx.fill();
      // bow tie
      ctx.fillStyle = "#c54a5b";
      ctx.beginPath();
      ctx.moveTo(x - 6, cy - 14);
      ctx.lineTo(x - 1, cy - 11);
      ctx.lineTo(x - 6, cy - 8);
      ctx.closePath();
      ctx.moveTo(x + 6, cy - 14);
      ctx.lineTo(x + 1, cy - 11);
      ctx.lineTo(x + 6, cy - 8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#a03345";
      ctx.fillRect(x - 1.5, cy - 12, 3, 3);

      // head (round, peach skin)
      const headY = cy - 22;
      ctx.fillStyle = "#fde0c5";
      ctx.beginPath();
      ctx.arc(x, headY, 13, 0, Math.PI * 2);
      ctx.fill();
      // bunny ears (long, leaning back)
      ctx.fillStyle = "#fde0c5";
      ctx.beginPath();
      ctx.ellipse(x - 6, headY - 14, 4, 11, -0.2, 0, Math.PI * 2);
      ctx.ellipse(x + 6, headY - 14, 4, 11, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f3aebb";
      ctx.beginPath();
      ctx.ellipse(x - 6, headY - 14, 1.8, 7, -0.2, 0, Math.PI * 2);
      ctx.ellipse(x + 6, headY - 14, 1.8, 7, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // hair tuft
      ctx.fillStyle = "#3a2a20";
      ctx.beginPath();
      ctx.arc(x, headY - 10, 5, Math.PI, 0);
      ctx.fill();
      // eyes (closed when blinking)
      const blink = Math.sin(t * 0.05) > 0.97;
      ctx.fillStyle = "#2f2a28";
      if (blink) {
        ctx.fillRect(x - 6, headY - 1, 4, 1);
        ctx.fillRect(x + 2, headY - 1, 4, 1);
      } else {
        ctx.beginPath();
        ctx.arc(x - 4, headY - 1, 1.8, 0, Math.PI * 2);
        ctx.arc(x + 4, headY - 1, 1.8, 0, Math.PI * 2);
        ctx.fill();
        // eye shine
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x - 3.4, headY - 1.4, 0.6, 0, Math.PI * 2);
        ctx.arc(x + 4.6, headY - 1.4, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // cheeks
      ctx.fillStyle = "rgba(245,140,140,0.35)";
      ctx.beginPath();
      ctx.arc(x - 7, headY + 3, 2, 0, Math.PI * 2);
      ctx.arc(x + 7, headY + 3, 2, 0, Math.PI * 2);
      ctx.fill();
      // mouth
      ctx.strokeStyle = "#2f2a28";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(x, headY + 4, 2, 0.1, Math.PI - 0.1);
      ctx.stroke();

      if (inAir && pvy < 0) {
        // motion sparkle
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.arc(x - 14, baseY + 4, 1.6, 0, Math.PI * 2);
        ctx.arc(x + 14, baseY + 4, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawEntity = (e: Entity) => {
      const { x, y, kind } = e;
      const bob = (e.bob ?? 0) + elapsed * 0.005;
      const yy = y + Math.sin(bob) * 2;
      if (kind === "ring") {
        ctx.strokeStyle = "#e6b35c";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, yy, 9, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "#fff7c2";
        ctx.beginPath();
        ctx.arc(x, yy - 9, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (kind === "heart") {
        ctx.fillStyle = "#ff7a8a";
        ctx.beginPath();
        ctx.arc(x - 4, yy - 2, 5, 0, Math.PI * 2);
        ctx.arc(x + 4, yy - 2, 5, 0, Math.PI * 2);
        ctx.moveTo(x - 9, yy);
        ctx.lineTo(x + 9, yy);
        ctx.lineTo(x, yy + 11);
        ctx.closePath();
        ctx.fill();
      } else if (kind === "champagne") {
        ctx.fillStyle = "#fff2cc";
        roundRect(ctx, x - 5, yy - 10, 10, 16, 2);
        ctx.fill();
        ctx.fillStyle = "#e6b35c";
        ctx.fillRect(x - 7, yy - 12, 14, 3);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x - 2, yy - 6, 1.6, 0, Math.PI * 2);
        ctx.fill();
        // sparkle
        ctx.fillStyle = "#ffd54a";
        ctx.fillRect(x + 8, yy - 14, 2, 2);
        ctx.fillRect(x + 6, yy - 9, 2, 2);
      } else if (kind === "envelope") {
        ctx.fillStyle = "#fff2f4";
        roundRect(ctx, x - 14, y - 9, 28, 18, 2);
        ctx.fill();
        ctx.strokeStyle = "#c54a5b";
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 14, y - 9, 28, 18);
        ctx.beginPath();
        ctx.moveTo(x - 14, y - 9);
        ctx.lineTo(x, y + 1);
        ctx.lineTo(x + 14, y - 9);
        ctx.stroke();
        // dollar sign
        ctx.fillStyle = "#c54a5b";
        ctx.font = "bold 11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("₩", x, y + 4);
        ctx.textAlign = "left";
      } else if (kind === "fence") {
        // small wooden fence to jump over
        ctx.fillStyle = "#a87454";
        ctx.fillRect(x - 14, y - 6, 28, 14);
        ctx.fillStyle = "#7c5238";
        ctx.fillRect(x - 14, y, 28, 2);
        ctx.fillRect(x - 10, y - 6, 2, 14);
        ctx.fillRect(x - 2, y - 6, 2, 14);
        ctx.fillRect(x + 6, y - 6, 2, 14);
      } else if (kind === "cake") {
        // tall wedding cake = obstacle to jump over high
        // base
        ctx.fillStyle = "#fff";
        roundRect(ctx, x - 16, y + 4, 32, 12, 3);
        ctx.fill();
        ctx.fillStyle = "#fbe3e7";
        roundRect(ctx, x - 12, y - 6, 24, 12, 3);
        ctx.fill();
        ctx.fillStyle = "#fff";
        roundRect(ctx, x - 8, y - 14, 16, 10, 3);
        ctx.fill();
        // cherry top
        ctx.fillStyle = "#c54a5b";
        ctx.beginPath();
        ctx.arc(x, y - 18, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7da062";
        ctx.fillRect(x, y - 22, 1.5, 4);
      }
    };

    const drawHud = () => {
      // score
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundRect(ctx, 8, 6, 78, 26, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.fillText("SCORE", 14, 18);
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillText(String(score).padStart(5, "0"), 14, 30);

      // timer
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      roundRect(ctx, W - 70, 6, 62, 26, 8);
      ctx.fill();
      ctx.fillStyle = "#fff";
      const remain = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
      ctx.textAlign = "left";
      ctx.fillText("TIME", W - 64, 18);
      ctx.fillText(String(remain).padStart(2, "0") + "s", W - 64, 30);
    };

    const step = (now: number) => {
      if (!runningRef.current) return;
      const dt = Math.min(48, now - last);
      last = now;
      elapsed += dt;
      runFrame += 1;
      if (invuln > 0) invuln -= dt;

      scroll = SCROLL_BASE + Math.min(160, elapsed * 0.0025);
      bgScroll += scroll * dt * 0.001;
      cloudScroll += dt * 0.012;

      // physics
      pvy += GRAVITY * (dt / 1000);
      py += pvy * (dt / 1000);
      if (py >= GROUND_Y) {
        py = GROUND_Y;
        pvy = 0;
        onGround = true;
        jumpCount = 0;
      } else {
        onGround = false;
      }

      // spawn
      spawnAcc += dt;
      const spawnInterval = Math.max(520, 1100 - elapsed * 0.005);
      if (spawnAcc > spawnInterval) {
        spawnAcc = 0;
        spawn();
      }

      // move entities left
      const dx = scroll * (dt / 1000);
      for (const e of entities) e.x -= dx;

      drawBackdrop();
      for (const e of entities) drawEntity(e);

      // player blink during invuln
      if (invuln > 0 && Math.floor(elapsed / 80) % 2 === 0) {
        ctx.globalAlpha = 0.5;
      }
      drawPlayer(PLAYER_X, py);
      ctx.globalAlpha = 1;

      drawHud();

      // collision check
      const playerL = PLAYER_X - 12;
      const playerR = PLAYER_X + 12;
      const playerT = py - 44;
      const playerB = py - 2;
      for (const e of entities) {
        if (e.hit) continue;
        const ew = e.kind === "envelope" ? 14 : e.kind === "fence" ? 14 : e.kind === "cake" ? 16 : 10;
        const eh = e.kind === "envelope" ? 9 : e.kind === "fence" ? 14 : e.kind === "cake" ? 24 : 11;
        const eL = e.x - ew;
        const eR = e.x + ew;
        const eT = (e.kind === "cake" ? e.y - 18 : e.y - eh);
        const eB = e.y + (e.kind === "cake" ? 16 : eh - 2);
        if (playerR < eL || playerL > eR || playerB < eT || playerT > eB) continue;
        e.hit = true;
        if (e.kind === "ring" || e.kind === "heart") {
          score += VALUES[e.kind];
        } else if (e.kind === "champagne") {
          score += VALUES.champagne;
          invuln = 3000;
        } else if (e.kind === "envelope") {
          if (invuln <= 0) score = Math.max(0, score + VALUES.envelope);
        } else if (e.kind === "fence" || e.kind === "cake") {
          if (invuln <= 0) {
            end("crash", score);
            return;
          }
        }
      }

      // cleanup
      for (let i = entities.length - 1; i >= 0; i--) {
        if (entities[i].x < -40 || entities[i].hit) entities.splice(i, 1);
      }

      if (elapsed >= DURATION_MS && !cleared) {
        cleared = true;
        end("clear", score + 500);
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // input
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        doJump();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      doJump();
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);

    const cleanup = () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
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

  // Pre-render an idle preview so the canvas isn't blank in intro state
  useEffect(() => {
    if (status !== "intro") return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const cssW = Math.max(280, Math.min(380, container.clientWidth || 320));
    const cssH = Math.round(cssW * 0.95);
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
    const GROUND_Y = H * 0.78;
    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    sky.addColorStop(0, "#fde8e0");
    sky.addColorStop(1, "#fff5ec");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, GROUND_Y);
    ctx.fillStyle = "rgba(255,205,180,0.55)";
    ctx.beginPath();
    ctx.arc(W * 0.78, H * 0.18, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#dcb59f";
    ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);
    ctx.fillStyle = "#bcd6a4";
    ctx.fillRect(0, GROUND_Y - 4, W, 6);
    // small idle character preview at left
    const x = W * 0.5;
    const baseY = GROUND_Y;
    const cy = baseY - 22;
    ctx.fillStyle = `rgba(60,40,40,0.35)`;
    ctx.beginPath();
    ctx.ellipse(x, baseY + 6, 26, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fdf8f4";
    ctx.beginPath();
    ctx.ellipse(x, cy, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde0c5";
    ctx.beginPath();
    ctx.arc(x, cy - 22, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fde0c5";
    ctx.beginPath();
    ctx.ellipse(x - 6, cy - 36, 4, 11, -0.2, 0, Math.PI * 2);
    ctx.ellipse(x + 6, cy - 36, 4, 11, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#c54a5b";
    ctx.beginPath();
    ctx.moveTo(x - 6, cy - 14);
    ctx.lineTo(x - 1, cy - 11);
    ctx.lineTo(x - 6, cy - 8);
    ctx.closePath();
    ctx.moveTo(x + 6, cy - 14);
    ctx.lineTo(x + 1, cy - 11);
    ctx.lineTo(x + 6, cy - 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2f2a28";
    ctx.beginPath();
    ctx.arc(x - 4, cy - 23, 1.8, 0, Math.PI * 2);
    ctx.arc(x + 4, cy - 23, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(245,140,140,0.35)";
    ctx.beginPath();
    ctx.arc(x - 7, cy - 19, 2, 0, Math.PI * 2);
    ctx.arc(x + 7, cy - 19, 2, 0, Math.PI * 2);
    ctx.fill();
    // label
    ctx.fillStyle = "#7a5c52";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TAP / SPACE TO JUMP", W * 0.5, H * 0.12);
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
        <button
          onPointerDown={(e) => { e.preventDefault(); jumpRef.current(); }}
          className="mt-2 w-full max-w-[380px] rounded-full bg-[color:var(--color-rose-deep)] py-4 text-[14px] font-medium tracking-[0.4em] text-white shadow-md active:scale-[0.98]"
          style={{ touchAction: "manipulation" }}
        >
          ↑ JUMP
        </button>
      )}

      {status === "intro" && (
        <div className="mt-2 w-full max-w-md rounded-3xl bg-white/80 p-6 text-center shadow-md ring-1 ring-[color:var(--color-line)]">
          <p className="eyebrow">웨딩 러너</p>
          <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-charcoal)]/85">
            신랑이 식장으로 달려갑니다.<br />
            화면을 탭(또는 SPACE / ↑)해서 점프!<br />
            💍 반지·♥ 하트·🥂 샴페인은 모으고,<br />
            ✉ 봉투는 −100점, 🪵 울타리·🎂 케이크는 점프해서 피하세요.<br />
            <span className="text-[color:var(--color-rose-deep)]">60초 살아남으면 식장 도착!</span>
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
            {status === "ending" ? "결혼했다!" : reason === "crash" ? "장애물에 부딪혔어요" : ""}
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
