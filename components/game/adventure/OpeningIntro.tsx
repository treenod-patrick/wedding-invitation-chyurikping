"use client";
import DialogBox from "./DialogBox";
import PixelCanvas from "./PixelCanvas";
import { drawSprite } from "./pixel";
import { ELDER_PROFESSOR, PALETTE } from "./sprites";

const SCRIPT = [
  { speaker: "축박사", text: "안녕! 이 세계에 온 걸 환영하네!" },
  { speaker: "축박사", text: "이 세상은… 결혼이라 불리는 신비한 이벤트로 가득 차 있다네." },
  { speaker: "축박사", text: "내 이름은 종현 박사. 사람들은 나를 '축박사'라고 부른다네." },
  { speaker: "축박사", text: "오늘은 자네 인생 최고의 모험이 시작되는 날이지." },
  { speaker: "축박사", text: "그래서 말인데… 자네는 어떤 예복을 입겠는가?" },
];

type Props = {
  onComplete: () => void;
  onSkip?: () => void;
};

export default function OpeningIntro({ onComplete, onSkip }: Props) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border-[3px] border-[#0d1530] bg-gradient-to-b from-[#0a1230] via-[#1a2a5a] to-[#3a5dab]">
      <PixelCanvas
        width={160}
        height={120}
        scale={3}
        fps={2}
        draw={(ctx, frame) => {
          ctx.imageSmoothingEnabled = false;
          ctx.fillStyle = "#0a1230";
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
          for (let i = 0; i < 40; i++) {
            const x = (i * 37) % ctx.canvas.width;
            const y = (i * 53) % (ctx.canvas.height * 0.55);
            ctx.fillStyle = i % 5 === 0 ? "#ffffff" : "#a3c4ff";
            const size = i % 7 === 0 ? 6 : 3;
            ctx.fillRect(x, y, size, size);
          }
          ctx.fillStyle = "#1a2240";
          ctx.fillRect(0, ctx.canvas.height * 0.7, ctx.canvas.width, ctx.canvas.height * 0.3);
          ctx.strokeStyle = "#3a5dab";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, ctx.canvas.height * 0.7);
          ctx.lineTo(ctx.canvas.width, ctx.canvas.height * 0.7);
          ctx.stroke();
          const cx = ctx.canvas.width / 2 - 8 * 12;
          const cy = ctx.canvas.height / 2 - 8 * 12;
          const bob = frame % 2 === 0 ? 0 : 6;
          drawSprite(ctx, ELDER_PROFESSOR, PALETTE, cx, cy + bob, 12);
        }}
      />
      <DialogBox lines={SCRIPT} onComplete={onComplete} onSkip={onSkip} />
    </div>
  );
}
