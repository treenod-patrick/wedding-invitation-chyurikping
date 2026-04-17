"use client";
import { useEffect, useState } from "react";
import { wedding } from "@/lib/data";

export function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-6 py-14 ${className}`}>
      <div className="mx-auto max-w-md">{children}</div>
    </section>
  );
}

export function SectionTitle({ en, ko }: { en: string; ko: string }) {
  return (
    <div className="mb-8 text-center">
      <p className="text-xs tracking-[0.3em] text-[color:var(--color-gold)]" style={{ fontFamily: "Cormorant Garamond, serif" }}>
        {en.toUpperCase()}
      </p>
      <div className="divider my-2" />
      <h2 className="text-xl">{ko}</h2>
    </div>
  );
}

export function Hero() {
  const d = wedding.date;
  const ymd = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center bg-gradient-to-b from-[color:var(--color-blush)]/30 via-[color:var(--color-ivory)] to-[color:var(--color-ivory)] px-6 text-center">
      <div className="fade-up">
        <p className="mb-4 text-xs tracking-[0.4em] text-[color:var(--color-gold)]" style={{ fontFamily: "Cormorant Garamond, serif" }}>
          WE ARE GETTING MARRIED
        </p>
        <div className="divider mb-8 mx-auto w-32" />
        <p className="text-sm text-[color:var(--color-warm-gray)] mb-2">{ymd}</p>
        <h1 className="text-3xl leading-relaxed">
          {wedding.groom.name}
          <span className="mx-3 text-[color:var(--color-gold)]">&</span>
          {wedding.bride.name}
        </h1>
        <p className="mt-6 text-sm text-[color:var(--color-warm-gray)]">
          {wedding.venue.name} · {wedding.venue.detail}
        </p>
      </div>
      <div className="absolute bottom-6 animate-bounce text-xs text-[color:var(--color-warm-gray)]">scroll ↓</div>
    </section>
  );
}

export function Greeting() {
  return (
    <Section>
      <SectionTitle en="Invitation" ko="초대합니다" />
      <p className="whitespace-pre-line text-center leading-loose text-[color:var(--color-ink)]/80">
        {wedding.greeting.body}
      </p>
      <div className="mt-8 text-center text-sm text-[color:var(--color-warm-gray)]">
        <p>
          {wedding.groom.father} · {wedding.groom.mother}의 아들 <b className="text-[color:var(--color-ink)]">{wedding.groom.name}</b>
        </p>
        <p className="mt-1">
          {wedding.bride.father} · {wedding.bride.mother}의 딸 <b className="text-[color:var(--color-ink)]">{wedding.bride.name}</b>
        </p>
      </div>
    </Section>
  );
}

function useCountdown(target: Date) {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff / 3600000) % 24);
  const mins = Math.floor((diff / 60000) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  return { days, hours, mins, secs };
}

export function Countdown() {
  const { days, hours, mins, secs } = useCountdown(wedding.date);
  const cells = [
    { n: days, l: "DAYS" },
    { n: hours, l: "HOUR" },
    { n: mins, l: "MIN" },
    { n: secs, l: "SEC" },
  ];
  return (
    <Section className="bg-[color:var(--color-ivory)]">
      <SectionTitle en="D-Day" ko="결혼식까지" />
      <div className="grid grid-cols-4 gap-2 text-center">
        {cells.map((c) => (
          <div key={c.l} className="rounded-lg border border-[color:var(--color-warm-gray)]/20 bg-white py-4">
            <div className="text-2xl font-semibold text-[color:var(--color-gold)]">{c.n}</div>
            <div className="mt-1 text-[10px] tracking-widest text-[color:var(--color-warm-gray)]">{c.l}</div>
          </div>
        ))}
      </div>
      <p className="mt-6 text-center text-sm text-[color:var(--color-warm-gray)]">
        {wedding.groom.name} ♥ {wedding.bride.name}의 결혼식이 <b className="text-[color:var(--color-ink)]">{days}일</b> 남았습니다.
      </p>
    </Section>
  );
}

export function Calendar() {
  const d = wedding.date;
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();
  const first = new Date(year, month, 1).getDay();
  const last = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let i = 1; i <= last; i++) cells.push(i);
  const monthName = d.toLocaleString("en", { month: "long" });
  const weekday = d.toLocaleString("ko", { weekday: "long" });
  const hh = d.getHours();
  const mm = d.getMinutes();
  const timeLabel = `${hh < 12 ? "오전" : "오후"} ${((hh + 11) % 12) + 1}시${mm ? ` ${mm}분` : ""}`;

  return (
    <Section>
      <SectionTitle en="When" ko="예식일" />
      <div className="mx-auto max-w-xs">
        <p className="text-center text-xs tracking-[0.3em] text-[color:var(--color-warm-gray)]" style={{ fontFamily: "Cormorant Garamond, serif" }}>
          {monthName.toUpperCase()} {year}
        </p>
        <div className="mt-4 grid grid-cols-7 text-center text-xs text-[color:var(--color-warm-gray)]">
          {["일", "월", "화", "수", "목", "금", "토"].map((w, i) => (
            <div key={w} className={`py-2 ${i === 0 ? "text-[color:var(--color-gold)]" : ""}`}>{w}</div>
          ))}
          {cells.map((c, i) => (
            <div key={i} className="py-2 text-sm">
              {c === day ? (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-gold)] text-white">
                  {c}
                </span>
              ) : (
                c ?? ""
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-sm text-[color:var(--color-warm-gray)]">
        {year}년 {month + 1}월 {day}일 {weekday} · {timeLabel}
      </p>
    </Section>
  );
}

export function Gallery() {
  const [idx, setIdx] = useState<number | null>(null);
  return (
    <Section>
      <SectionTitle en="Gallery" ko="우리의 순간" />
      <div className="grid grid-cols-3 gap-1">
        {wedding.gallery.map((src, i) => (
          <button
            key={src}
            onClick={() => setIdx(i)}
            className="aspect-[4/5] overflow-hidden bg-[color:var(--color-warm-gray)]/10"
          >
            <img src={src} alt={`gallery-${i}`} className="h-full w-full object-cover transition hover:scale-105" loading="lazy" />
          </button>
        ))}
      </div>
      {idx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setIdx(null)}
        >
          <img src={wedding.gallery[idx]} alt="preview" className="max-h-[90vh] max-w-[90vw] object-contain" />
          <div className="absolute bottom-6 text-white text-sm">{idx + 1} / {wedding.gallery.length}</div>
        </div>
      )}
    </Section>
  );
}

export function Location() {
  const { name, address, detail, lat, lng, tel } = wedding.venue;
  const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;
  const naverUrl = `https://map.naver.com/v5/search/${encodeURIComponent(address)}`;
  return (
    <Section>
      <SectionTitle en="Location" ko="오시는 길" />
      <div className="overflow-hidden rounded-lg border border-[color:var(--color-warm-gray)]/20">
        <iframe src={mapUrl} className="h-64 w-full border-0" loading="lazy" />
      </div>
      <div className="mt-4 text-center">
        <p className="text-base font-semibold">{name}</p>
        <p className="mt-1 text-sm text-[color:var(--color-warm-gray)]">{address}</p>
        <p className="text-sm text-[color:var(--color-warm-gray)]">{detail} · {tel}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2">
        <a href={naverUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-[color:var(--color-warm-gray)]/30 py-3 text-center text-sm">네이버 지도</a>
        <a href={`https://map.kakao.com/?q=${encodeURIComponent(address)}`} target="_blank" rel="noreferrer" className="rounded-lg border border-[color:var(--color-warm-gray)]/30 py-3 text-center text-sm">카카오맵</a>
      </div>
      <div className="mt-6 space-y-3 text-sm text-[color:var(--color-ink)]/80">
        <div>
          <b className="text-[color:var(--color-gold)]">지하철</b> · 2호선 OO역 3번 출구에서 도보 5분
        </div>
        <div>
          <b className="text-[color:var(--color-gold)]">버스</b> · 간선 140, 341 · 지선 3412 (OO빌딩 앞 하차)
        </div>
        <div>
          <b className="text-[color:var(--color-gold)]">주차</b> · 건물 지하 주차장 2시간 무료
        </div>
      </div>
    </Section>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {}
      }}
      className="ml-auto rounded border border-[color:var(--color-warm-gray)]/30 px-2 py-1 text-xs text-[color:var(--color-warm-gray)]"
    >
      {copied ? "복사됨" : "복사"}
    </button>
  );
}

export function Account() {
  const [open, setOpen] = useState<null | "groom" | "bride">(null);
  const side = (who: "groom" | "bride") => {
    const p = wedding[who];
    const label = who === "groom" ? "신랑측" : "신부측";
    return (
      <div>
        <button
          onClick={() => setOpen(open === who ? null : who)}
          className="flex w-full items-center justify-between rounded-lg border border-[color:var(--color-warm-gray)]/20 bg-white px-4 py-3"
        >
          <span className="text-sm">{label} · {p.name}</span>
          <span className="text-[color:var(--color-warm-gray)]">{open === who ? "−" : "+"}</span>
        </button>
        {open === who && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-[color:var(--color-ivory)] px-4 py-3 text-sm">
            <span className="text-[color:var(--color-warm-gray)]">{p.bankOwner}</span>
            <span className="text-[color:var(--color-ink)]">{p.bank}</span>
            <CopyButton text={p.bank.replace(/.*\s/, "")} />
          </div>
        )}
      </div>
    );
  };
  return (
    <Section>
      <SectionTitle en="Account" ko="마음 전하실 곳" />
      <p className="mb-6 text-center text-sm text-[color:var(--color-warm-gray)]">
        참석이 어려우신 분들을 위해 계좌번호를 안내드립니다.
      </p>
      <div className="space-y-3">
        {side("groom")}
        {side("bride")}
      </div>
    </Section>
  );
}

export function Share() {
  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      try { await navigator.share({ title: "우리 결혼합니다", url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert("링크가 복사되었습니다.");
      } catch {}
    }
  };
  return (
    <Section className="pb-24">
      <SectionTitle en="Share" ko="청첩장 공유하기" />
      <button
        onClick={share}
        className="mx-auto block rounded-full bg-[color:var(--color-ink)] px-6 py-3 text-sm text-[color:var(--color-ivory)]"
      >
        링크 공유 / 복사
      </button>
      <p className="mt-10 text-center text-xs text-[color:var(--color-warm-gray)]">
        made with ♥ · {wedding.groom.nameEn} & {wedding.bride.nameEn}
      </p>
    </Section>
  );
}
