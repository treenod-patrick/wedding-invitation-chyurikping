"use client";
import { useState } from "react";
import PixelCanvas from "./PixelCanvas";
import { drawSprite } from "./pixel";
import {
  BRIDE_IDLE,
  GROOM_RABBIT_IDLE,
  GROOM_RABBIT_RUN,
  PALETTE,
} from "./sprites";

export type CharacterId = "groom" | "bride";

export type CharacterChoice = {
  id: CharacterId;
  name: string;
  role: string;
  tagline: string;
};

export const CHARACTER_NAMES: Record<CharacterId, string> = {
  groom: "채종현",
  bride: "최수빈",
};

export const PARTNER_OF: Record<CharacterId, CharacterId> = {
  groom: "bride",
  bride: "groom",
};

const CHOICES: CharacterChoice[] = [
  { id: "groom", name: "채종현", role: "신랑", tagline: "늦으면 안 되는데…" },
  { id: "bride", name: "최수빈", role: "신부", tagline: "부케를 꼭 받아야 해…" },
];

const SPRITE_FOR: Record<CharacterId, string[]> = {
  groom: GROOM_RABBIT_IDLE,
  bride: BRIDE_IDLE,
};

const SPRITE_RUN: Partial<Record<CharacterId, string[]>> = {
  groom: GROOM_RABBIT_RUN,
};

type Props = {
  onComplete: (data: { character: CharacterId; nickname: string }) => void;
};

export default function CharacterSelect({ onComplete }: Props) {
  const [picked, setPicked] = useState<CharacterId>("groom");
  const [nickname, setNickname] = useState("");
  const choice = CHOICES.find((c) => c.id === picked)!;

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border-[3px] border-[#0d1530] bg-[#1a2240] p-3 font-mono text-white">
      <div className="text-center text-[11px] uppercase tracking-[0.3em] text-amber-300">
        Choose Your Hero
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {CHOICES.map((c) => {
          const active = c.id === picked;
          return (
            <button
              key={c.id}
              onClick={() => setPicked(c.id)}
              onTouchEnd={(e) => {
                e.preventDefault();
                setPicked(c.id);
              }}
              className={`flex flex-col items-center rounded-md border-[3px] p-2 transition ${
                active ? "border-amber-300 bg-[#2a3470]" : "border-[#0d1530] bg-[#0d1530]/60"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              <PixelCanvas
                width={16}
                height={16}
                scale={5}
                fps={3}
                draw={(ctx, frame) => {
                  ctx.imageSmoothingEnabled = false;
                  ctx.fillStyle = active ? "#3a5dab" : "#0d1530";
                  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                  const runSprite = SPRITE_RUN[c.id];
                  const idle = SPRITE_FOR[c.id];
                  const sprite = active && runSprite && frame % 2 === 1 ? runSprite : idle;
                  drawSprite(ctx, sprite, PALETTE, 0, 0, 5);
                }}
              />
              <div className="mt-1 text-[12px] font-bold">{c.name}</div>
              <div className="text-[10px] text-white/70">{c.role}</div>
            </button>
          );
        })}
      </div>

      <div className="mt-2 rounded-md border-[3px] border-white bg-[#0d1530] px-2 py-1.5 text-[11px] leading-snug">
        <div className="text-amber-300">{choice.name} ({choice.role})</div>
        <div className="text-white/90">&ldquo;{choice.tagline}&rdquo;</div>
      </div>

      <div className="mt-2">
        <label className="block text-[10px] uppercase tracking-[0.3em] text-amber-300">
          닉네임
        </label>
        <input
          value={nickname}
          onChange={(e) => setNickname(e.target.value.slice(0, 10))}
          placeholder="기본값: 하객"
          maxLength={10}
          className="mt-1 w-full rounded-sm border-[3px] border-white bg-[#0d1530] px-2 py-1.5 text-[13px] text-white placeholder-white/40 focus:outline-none focus:ring-0"
        />
      </div>

      <button
        onClick={() => onComplete({ character: picked, nickname: nickname || "하객" })}
        onTouchEnd={(e) => {
          e.preventDefault();
          onComplete({ character: picked, nickname: nickname || "하객" });
        }}
        className="absolute inset-x-3 bottom-3 rounded-md border-[3px] border-amber-300 bg-amber-400 py-2 text-[13px] font-bold tracking-widest text-[#1a2240] shadow-[inset_0_0_0_2px_#fff5cc]"
        style={{ touchAction: "manipulation" }}
      >
        모험을 시작한다 ▶
      </button>
    </div>
  );
}
