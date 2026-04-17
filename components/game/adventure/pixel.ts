export type Palette = Record<string, string>;
export type SpriteFrame = string[];

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  frame: SpriteFrame,
  palette: Palette,
  x: number,
  y: number,
  scale = 1,
) {
  ctx.imageSmoothingEnabled = false;
  for (let row = 0; row < frame.length; row++) {
    const line = frame[row];
    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      const color = palette[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
    }
  }
}

export function spriteSize(frame: SpriteFrame): { w: number; h: number } {
  return { w: frame[0]?.length ?? 0, h: frame.length };
}
