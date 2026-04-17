"use client";
import { useEffect, useRef, useState } from "react";
import DialogBox from "./DialogBox";
import { drawSprite } from "./pixel";
import {
  CHAPEL_BUILDING,
  ELDER_PROFESSOR,
  GROOM_RABBIT_IDLE,
  GROOM_RABBIT_RUN,
  KID_NPC,
  PALETTE,
  TILE_GRASS,
  TILE_HOUSE_ROOF,
  TILE_PATH,
  TILE_TREE,
} from "./sprites";

const NPC_LINES = [
  { speaker: "꼬마", text: "와! 진짜 결혼한대! 어른이다!" },
  { speaker: "할머니", text: "총각, 결혼 안 하나~? 아 했네." },
  { speaker: "라이벌", text: "흥, 너 같은 녀석이 결혼이라니… 농담이고, 축하한다 친구!" },
  { speaker: "직장 동료", text: "야생의 직장 동료가 나타났다! …반갑다고 인사했다!" },
  { speaker: "트레이너", text: "여기는 결혼 도장이다! 도전하려면 서약이 필요하다!" },
];

type Props = {
  onComplete: () => void;
  onSkip?: () => void;
};

export default function TownScroll({ onComplete, onSkip }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [lineIdx, setLineIdx] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const W = c.width;
    const H = c.height;
    const TILE = 16 * 3;
    let raf = 0;
    let last = 0;
    let frameCount = 0;
    const speed = 0.45;
    const maxScroll = TILE * 14;
    let scroll = 0;

    const loop = (t: number) => {
      const dt = last ? t - last : 16;
      last = t;
      frameCount += 1;

      if (!arrived) {
        scroll = Math.min(maxScroll, scroll + speed * (dt / 16));
        setScrollX(scroll);
        if (scroll >= maxScroll) {
          setArrived(true);
        }
      }

      ctx.fillStyle = "#a0d8f5";
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "#5fbf6f";
      ctx.fillRect(0, H * 0.55, W, H * 0.45);

      const grassRow = Math.floor(H * 0.55);
      for (let i = -1; i < Math.ceil(W / TILE) + 1; i++) {
        const x = i * TILE - (scroll % TILE);
        drawSprite(ctx, TILE_GRASS, PALETTE, x, grassRow, 3);
        drawSprite(ctx, TILE_GRASS, PALETTE, x, grassRow + TILE, 3);
        drawSprite(ctx, TILE_PATH, PALETTE, x, grassRow + TILE * 1.5, 3);
        drawSprite(ctx, TILE_PATH, PALETTE, x, grassRow + TILE * 2.5, 3);
      }

      const treePositions = [120, 320, 520, 720, 980, 1240];
      for (const tx of treePositions) {
        const x = tx - scroll;
        if (x > -TILE && x < W) {
          drawSprite(ctx, TILE_TREE, PALETTE, x, grassRow - TILE, 3);
        }
      }

      const housePositions = [220, 480, 820];
      for (const hx of housePositions) {
        const x = hx - scroll;
        if (x > -TILE * 2 && x < W) {
          drawSprite(ctx, TILE_HOUSE_ROOF, PALETTE, x, grassRow - TILE * 1.2, 3);
        }
      }

      const npcPositions = [
        { x: 380, sprite: KID_NPC },
        { x: 660, sprite: ELDER_PROFESSOR },
        { x: 920, sprite: KID_NPC },
      ];
      for (const npc of npcPositions) {
        const x = npc.x - scroll;
        if (x > -TILE && x < W) {
          drawSprite(ctx, npc.sprite, PALETTE, x, grassRow - 8, 3);
        }
      }

      const chapelX = maxScroll + 60 - scroll;
      drawSprite(ctx, CHAPEL_BUILDING, PALETTE, chapelX, grassRow - TILE * 1.4, 3);

      const playerSprite = arrived
        ? GROOM_RABBIT_IDLE
        : frameCount % 12 < 6
        ? GROOM_RABBIT_RUN
        : GROOM_RABBIT_IDLE;
      drawSprite(ctx, playerSprite, PALETTE, W / 2 - 24, grassRow + 4, 3);

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [arrived]);

  const lines = NPC_LINES.slice(0, lineIdx + 1);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border-[3px] border-[#0d1530] bg-[#1a2240]">
      <canvas
        ref={ref}
        width={480}
        height={360}
        style={{ imageRendering: "pixelated", display: "block", width: "100%", height: "auto" }}
      />
      {!arrived && lineIdx < NPC_LINES.length && (
        <DialogBox
          key={lineIdx}
          lines={[NPC_LINES[lineIdx]]}
          onComplete={() => setLineIdx((i) => Math.min(NPC_LINES.length, i + 1))}
          onSkip={onSkip}
        />
      )}
      {arrived && (
        <div className="absolute inset-x-0 bottom-0 p-3">
          <button
            onClick={onComplete}
            onTouchEnd={(e) => {
              e.preventDefault();
              onComplete();
            }}
            className="w-full rounded-md border-[3px] border-amber-300 bg-amber-400 py-2 text-[13px] font-bold tracking-widest text-[#1a2240] shadow-[inset_0_0_0_2px_#fff5cc]"
            style={{ touchAction: "manipulation" }}
          >
            식장에 입장한다 ▶
          </button>
        </div>
      )}
      <div className="pointer-events-none absolute left-2 top-2 rounded-sm bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white">
        {Math.floor((scrollX / (16 * 3 * 14)) * 100)}%
      </div>
    </div>
  );
}
