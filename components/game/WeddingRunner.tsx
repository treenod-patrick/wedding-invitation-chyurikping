"use client";
import { useEffect, useRef, useState } from "react";
import type Phaser from "phaser";

type GameStatus = "intro" | "playing" | "ending" | "gameover";

const LEADERBOARD_KEY = "wedding_runner_leaderboard_v1";
const NICK_KEY = "wedding_runner_nick";

type Score = { name: string; score: number; ts: number };

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

export default function WeddingRunner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
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

  const startGame = async () => {
    if (!containerRef.current || gameRef.current) return;
    setStatus("playing");

    const Phaser = (await import("phaser")).default;

    const W = Math.min(420, window.innerWidth - 16);
    const H = Math.min(640, window.innerHeight - 160);
    const LANES = 3;
    const laneX = (i: number) => W * (0.2 + i * 0.3);

    let lane = 1;
    let score = 0;
    let elapsed = 0;
    let invuln = 0;
    let speed = 220;
    const DURATION_MS = 60_000;

    let scoreText: Phaser.GameObjects.Text;
    let timerText: Phaser.GameObjects.Text;
    let player: Phaser.GameObjects.Container;
    let items: Phaser.GameObjects.Group;
    let obstacles: Phaser.GameObjects.Group;
    let cleared = false;

    const TYPES = {
      ring: { color: 0xfff6b0, ring: 0xffcf66, value: 100, label: "💍" },
      heart: { color: 0xffb6c1, ring: 0xff7a8a, value: 50, label: "♥" },
      champagne: { color: 0xfff2cc, ring: 0xe6b35c, value: 150, label: "🥂" },
      envelope: { color: 0xffe0e0, ring: 0xd97a7a, value: -100, label: "✉" },
      cake: { color: 0xffffff, ring: 0xff5b78, value: -1, label: "🎂" },
    } as const;

    type ItemKind = keyof typeof TYPES;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: W,
      height: H,
      backgroundColor: "#fff5ec",
      physics: { default: "arcade", arcade: { gravity: { x: 0, y: 0 }, debug: false } },
      scene: {
        preload() {},
        create(this: Phaser.Scene) {
          const scene = this;

          // 카펫(레드 카펫이 아니라 부드러운 핑크 카펫)
          const carpet = scene.add.graphics();
          carpet.fillStyle(0xffe4d6, 0.8);
          carpet.fillRect(W * 0.12, 0, W * 0.76, H);
          carpet.lineStyle(2, 0xe89378, 0.4);
          for (let y = 0; y < H; y += 24) {
            carpet.lineBetween(W * 0.12, y, W * 0.88, y);
          }
          // 양옆 하객 영역
          const sideL = scene.add.graphics();
          sideL.fillStyle(0xd8e5d2, 0.5);
          sideL.fillRect(0, 0, W * 0.12, H);
          const sideR = scene.add.graphics();
          sideR.fillStyle(0xd8e5d2, 0.5);
          sideR.fillRect(W * 0.88, 0, W * 0.12, H);

          // 플레이어 (도트풍 신랑 캐릭터 - 원형 머리 + 사각형 몸)
          player = scene.add.container(laneX(lane), H - 90);
          const body = scene.add.graphics();
          body.fillStyle(0x4a3c36, 1); // 검정 턱시도
          body.fillRoundedRect(-14, -14, 28, 32, 4);
          body.fillStyle(0xffffff, 1);
          body.fillRect(-4, -10, 8, 20); // 셔츠
          body.fillStyle(0xe89378, 1);
          body.fillTriangle(-3, -10, 3, -10, 0, -2); // 보타이
          const head = scene.add.graphics();
          head.fillStyle(0xfde0c5, 1);
          head.fillCircle(0, -28, 11);
          head.fillStyle(0x3a2a20, 1);
          head.fillRect(-9, -38, 18, 6);
          head.fillStyle(0x2f2a28, 1);
          head.fillCircle(-4, -28, 1.5);
          head.fillCircle(4, -28, 1.5);
          player.add([body, head]);
          scene.physics.world.enable(player);
          (player.body as Phaser.Physics.Arcade.Body).setSize(28, 60).setOffset(-14, -40);

          items = scene.physics.add.group();
          obstacles = scene.physics.add.group();

          scoreText = scene.add.text(12, 12, "0", {
            fontFamily: "Courier New, monospace",
            fontSize: "22px",
            color: "#4a3c36",
          });
          timerText = scene.add.text(W - 12, 12, "60", {
            fontFamily: "Courier New, monospace",
            fontSize: "22px",
            color: "#e89378",
          }).setOrigin(1, 0);

          const moveTo = (newLane: number) => {
            lane = Phaser.Math.Clamp(newLane, 0, LANES - 1);
            scene.tweens.add({ targets: player, x: laneX(lane), duration: 120, ease: "Quad.easeOut" });
          };

          scene.input.keyboard?.on("keydown-LEFT", () => moveTo(lane - 1));
          scene.input.keyboard?.on("keydown-RIGHT", () => moveTo(lane + 1));
          scene.input.keyboard?.on("keydown-A", () => moveTo(lane - 1));
          scene.input.keyboard?.on("keydown-D", () => moveTo(lane + 1));

          let startX = 0;
          scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => { startX = p.x; });
          scene.input.on("pointerup", (p: Phaser.Input.Pointer) => {
            const dx = p.x - startX;
            if (Math.abs(dx) < 18) {
              if (p.x < W / 2) moveTo(lane - 1);
              else moveTo(lane + 1);
            } else if (dx > 18) moveTo(lane + 1);
            else if (dx < -18) moveTo(lane - 1);
          });

          // 스폰 타이머
          scene.time.addEvent({
            delay: 700,
            loop: true,
            callback: () => {
              if (cleared) return;
              const choices: ItemKind[] = ["ring", "ring", "heart", "heart", "champagne", "envelope", "envelope", "cake"];
              const kind = Phaser.Math.RND.pick(choices);
              spawn(scene, kind);
            },
          });
        },
        update(this: Phaser.Scene, _time: number, delta: number) {
          if (cleared) return;
          elapsed += delta;
          invuln = Math.max(0, invuln - delta);

          const remaining = Math.max(0, Math.ceil((DURATION_MS - elapsed) / 1000));
          timerText.setText(String(remaining));

          // 점수 자연 증가 (생존 보너스)
          if (Math.floor(elapsed / 1000) > Math.floor((elapsed - delta) / 1000)) {
            score += 10;
            scoreText.setText(String(score));
          }

          const dy = (speed * delta) / 1000;
          [items, obstacles].forEach((grp) => {
            grp.getChildren().slice().forEach((c) => {
              const sprite = c as Phaser.GameObjects.Container;
              sprite.y += dy;
              if (sprite.y > H + 40) sprite.destroy();
            });
          });

          // 충돌 체크
          const checkHit = (grp: Phaser.GameObjects.Group, onHit: (kind: ItemKind, sprite: Phaser.GameObjects.Container) => void) => {
            grp.getChildren().slice().forEach((c) => {
              const sprite = c as Phaser.GameObjects.Container & { kind?: ItemKind; hit?: boolean };
              if (sprite.hit) return;
              const dx = sprite.x - player.x;
              const dy2 = sprite.y - player.y;
              if (Math.abs(dx) < 22 && Math.abs(dy2) < 28) {
                sprite.hit = true;
                onHit(sprite.kind!, sprite);
              }
            });
          };

          checkHit(items, (kind, sprite) => {
            const t = TYPES[kind];
            score += t.value;
            scoreText.setText(String(score));
            if (kind === "champagne") invuln = 3000;
            sprite.destroy();
            this.cameras.main.flash(80, 255, 240, 220);
          });

          checkHit(obstacles, (kind, sprite) => {
            if (kind === "envelope") {
              if (invuln <= 0) score = Math.max(0, score - 100);
              scoreText.setText(String(score));
              sprite.destroy();
              this.cameras.main.shake(120, 0.005);
            } else if (kind === "cake") {
              if (invuln > 0) {
                sprite.destroy();
                return;
              }
              cleared = true;
              endGame("crash", score);
            }
          });

          // 속도 점진 가속
          speed = 220 + Math.min(180, elapsed / 350);

          // 종료
          if (elapsed >= DURATION_MS) {
            cleared = true;
            endGame("clear", score + 500);
          }
        },
      },
    };

    function spawn(scene: Phaser.Scene, kind: ItemKind) {
      const t = TYPES[kind];
      const x = laneX(Phaser.Math.Between(0, LANES - 1));
      const c = scene.add.container(x, -30);
      const g = scene.add.graphics();
      if (kind === "ring") {
        g.lineStyle(4, t.ring, 1);
        g.strokeCircle(0, 0, 10);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, -10, 3);
      } else if (kind === "heart") {
        g.fillStyle(t.ring, 1);
        g.fillCircle(-5, -2, 6);
        g.fillCircle(5, -2, 6);
        g.fillTriangle(-10, 0, 10, 0, 0, 12);
      } else if (kind === "champagne") {
        g.fillStyle(t.color, 1);
        g.fillRoundedRect(-6, -12, 12, 18, 2);
        g.fillStyle(t.ring, 1);
        g.fillRect(-8, -14, 16, 4);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(-3, -8, 2);
      } else if (kind === "envelope") {
        g.fillStyle(t.color, 1);
        g.fillRect(-12, -8, 24, 16);
        g.lineStyle(2, t.ring, 1);
        g.lineBetween(-12, -8, 0, 2);
        g.lineBetween(12, -8, 0, 2);
        g.strokeRect(-12, -8, 24, 16);
      } else if (kind === "cake") {
        g.fillStyle(t.color, 1);
        g.fillRoundedRect(-14, -4, 28, 14, 2);
        g.fillStyle(t.ring, 1);
        g.fillRoundedRect(-10, -10, 20, 8, 2);
        g.fillStyle(0xfff2cc, 1);
        g.fillCircle(0, -12, 2);
      }
      c.add(g);
      (c as Phaser.GameObjects.Container & { kind: ItemKind }).kind = kind;
      if (kind === "envelope" || kind === "cake") obstacles.add(c);
      else items.add(c);
      scene.physics.world.enable(c);
    }

    const endGame = (why: "clear" | "crash", finalS: number) => {
      setReason(why);
      setFinalScore(Math.max(0, finalS));
      setStatus(why === "clear" ? "ending" : "gameover");
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };

    gameRef.current = new Phaser.Game(config);
  };

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

  useEffect(() => () => { gameRef.current?.destroy(true); gameRef.current = null; }, []);

  return (
    <div className="flex flex-col items-center px-2 pb-12">
      <div ref={containerRef} className="my-4 overflow-hidden rounded-2xl shadow-lg ring-1 ring-[color:var(--color-line)]" />

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
