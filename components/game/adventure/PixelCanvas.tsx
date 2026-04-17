"use client";
import { useEffect, useRef } from "react";

type Props = {
  width: number;
  height: number;
  scale?: number;
  draw: (ctx: CanvasRenderingContext2D, frame: number) => void;
  fps?: number;
  className?: string;
};

export default function PixelCanvas({ width, height, scale = 2, draw, fps = 8, className }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(0);
  const drawRef = useRef(draw);
  drawRef.current = draw;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    let raf = 0;
    let last = 0;
    const interval = 1000 / fps;
    const loop = (t: number) => {
      if (t - last >= interval) {
        last = t;
        drawRef.current(ctx, frameRef.current);
        frameRef.current += 1;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps]);

  return (
    <canvas
      ref={ref}
      width={width * scale}
      height={height * scale}
      className={className}
      style={{ imageRendering: "pixelated", display: "block", width: "100%", height: "auto" }}
    />
  );
}
