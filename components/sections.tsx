"use client";
import { useEffect, useState } from "react";
import { wedding } from "@/lib/data";

/* ────────── 공통 ────────── */

export function Section({ children, className = "", card = false }: { children: React.ReactNode; className?: string; card?: boolean }) {
  return (
    <section className={`px-5 py-12 ${className}`}>
      <div className={`mx-auto max-w-md ${card ? "text-card" : ""}`}>{children}</div>
    </section>
  );
}

export function FloralDivider() {
  return (
    <div className="flex items-center justify-center py-6">
      <svg viewBox="0 0 120 24" className="h-6 w-32 text-[color:var(--color-rose)]" fill="none" stroke="currentColor" strokeWidth="0.8">
        <path d="M2 12 H44" strokeLinecap="round" />
        <path d="M76 12 H118" strokeLinecap="round" />
        <g transform="translate(60 12)">
          <circle r="2.6" fill="currentColor" opacity="0.85" />
          <ellipse cx="-7" cy="0" rx="4" ry="1.6" opacity="0.55" />
          <ellipse cx="7" cy="0" rx="4" ry="1.6" opacity="0.55" />
          <ellipse cx="0" cy="-5" rx="1.6" ry="3.2" opacity="0.55" />
          <ellipse cx="0" cy="5" rx="1.6" ry="3.2" opacity="0.55" />
        </g>
      </svg>
    </div>
  );
}

export function SectionTitle({ en, ko }: { en: string; ko: string }) {
  return (
    <div className="mb-10 text-center">
      <p className="eyebrow">{en}</p>
      <h2 className="section-title mt-3">{ko}</h2>
    </div>
  );
}

/* ────────── 메인 ────────── */

export function Hero() {
  const d = wedding.date;
  const ymd = `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, "0")}. ${String(d.getDate()).padStart(2, "0")}`;
  const weekday = d.toLocaleString("ko", { weekday: "short" });
  return (
    <section className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[color:var(--color-blush)]/40 via-[color:var(--color-paper)] to-[color:var(--color-paper)] px-7 text-center">
      {/* 배경 식물 */}
      <svg className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[color:var(--color-rose)]/40" width="180" height="60" viewBox="0 0 180 60" fill="none" stroke="currentColor" strokeWidth="0.6">
        <path d="M90 0 V60" />
        <path d="M90 12 Q70 18 60 30" />
        <path d="M90 12 Q110 18 120 30" />
        <path d="M90 26 Q72 32 64 44" />
        <path d="M90 26 Q108 32 116 44" />
        <ellipse cx="60" cy="30" rx="6" ry="2" />
        <ellipse cx="120" cy="30" rx="6" ry="2" />
        <ellipse cx="64" cy="44" rx="5" ry="1.8" />
        <ellipse cx="116" cy="44" rx="5" ry="1.8" />
      </svg>

      <div className="fade-in">
        <p className="eyebrow mb-6">We Invite You</p>
        <h1 className="font-[family-name:var(--font-accent)] text-[3rem] leading-tight text-[color:var(--color-charcoal)]">
          {wedding.groom.nameEn}
        </h1>
        <p className="my-3 font-[family-name:var(--font-accent)] italic text-lg text-[color:var(--color-rose-deep)]">&amp;</p>
        <h1 className="font-[family-name:var(--font-accent)] text-[3rem] leading-tight text-[color:var(--color-charcoal)]">
          {wedding.bride.nameEn}
        </h1>

        <FloralDivider />

        <p className="mt-2 text-base tracking-[0.25em] text-[color:var(--color-mute)]">{ymd} · {weekday}</p>
        <p className="mt-2 text-sm tracking-[0.2em] text-[color:var(--color-mute)]">{wedding.venue.name}</p>
      </div>

      <div className="absolute bottom-8 text-[24px] tracking-[0.4em] text-[color:var(--color-mute)] animate-pulse">SCROLL</div>
    </section>
  );
}

/* ────────── 인사말 ────────── */

export function Greeting() {
  return (
    <Section card>
      <SectionTitle en="Invitation" ko="초대합니다" />
      <p className="whitespace-pre-line text-center leading-[2.1] text-[17px] text-[color:var(--color-charcoal)]/85">
        {wedding.greeting.body}
      </p>
      <FloralDivider />
      <div className="text-center text-[15px] leading-loose text-[color:var(--color-mute)]">
        <p>
          <span className="text-[color:var(--color-charcoal)]/70">{wedding.groom.father}</span>
          <span className="mx-2">·</span>
          <span className="text-[color:var(--color-charcoal)]/70">{wedding.groom.mother}</span>
          <span className="ml-2">의 아들</span>
          <span className="ml-2 font-medium text-[color:var(--color-charcoal)]">{wedding.groom.name}</span>
        </p>
        <p className="mt-1.5">
          <span className="text-[color:var(--color-charcoal)]/70">{wedding.bride.father}</span>
          <span className="mx-2">·</span>
          <span className="text-[color:var(--color-charcoal)]/70">{wedding.bride.mother}</span>
          <span className="ml-2">의 딸</span>
          <span className="ml-2 font-medium text-[color:var(--color-charcoal)]">{wedding.bride.name}</span>
        </p>
      </div>
    </Section>
  );
}

/* ────────── 신랑신부 ────────── */

export function People() {
  const Card = ({ who }: { who: "groom" | "bride" }) => {
    const p = wedding[who];
    const label = who === "groom" ? "Groom" : "Bride";
    return (
      <div className="text-center">
        <p className="eyebrow">{label}</p>
        <p className="mt-3 font-[family-name:var(--font-accent)] text-2xl text-[color:var(--color-charcoal)]">
          {p.nameEn}
        </p>
        <p className="mt-1 text-base text-[color:var(--color-charcoal)]">{p.name}</p>
        <p className="mt-2 text-sm text-[color:var(--color-mute)]">
          {p.father} · {p.mother}의 {who === "groom" ? "장남" : "장녀"}
        </p>
      </div>
    );
  };
  return (
    <Section card>
      <SectionTitle en="The Couple" ko="신랑 · 신부" />
      <div className="grid grid-cols-2 gap-4 items-start">
        <Card who="groom" />
        <Card who="bride" />
      </div>
    </Section>
  );
}

/* ────────── D-day ────────── */

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
    <Section card>
      <SectionTitle en="D-Day" ko="우리의 그 날까지" />
      <div className="grid grid-cols-4 gap-2 text-center">
        {cells.map((c) => (
          <div key={c.l} className="rounded-sm border border-[color:var(--color-line)] bg-white py-5">
            <div className="font-[family-name:var(--font-accent)] text-[1.9rem] text-[color:var(--color-rose-deep)]">
              {String(c.n).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[24px] tracking-[0.3em] text-[color:var(--color-mute)]">{c.l}</div>
          </div>
        ))}
      </div>
      <p className="mt-8 text-center text-[15px] text-[color:var(--color-mute)]">
        <span className="text-[color:var(--color-charcoal)]">{wedding.groom.name}</span>
        <span className="mx-2 text-[color:var(--color-rose)]">♥</span>
        <span className="text-[color:var(--color-charcoal)]">{wedding.bride.name}</span>
        의 결혼식이 <b className="text-[color:var(--color-rose-deep)]">{days}</b>일 남았습니다.
      </p>
    </Section>
  );
}

/* ────────── 캘린더 ────────── */

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
    <Section card>
      <SectionTitle en="When" ko="예식일" />
      <div className="mx-auto max-w-xs rounded-sm bg-white p-5 shadow-[0_2px_24px_rgba(184,125,120,0.08)]">
        <p className="text-center font-[family-name:var(--font-accent)] tracking-[0.2em] text-[color:var(--color-rose-deep)]">
          {monthName} · {year}
        </p>
        <div className="mt-4 grid grid-cols-7 text-center text-[13px] tracking-widest text-[color:var(--color-mute)]">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => (
            <div key={i} className={`py-2 ${i === 0 ? "text-[color:var(--color-rose-deep)]" : ""}`}>{w}</div>
          ))}
          {cells.map((c, i) => (
            <div key={i} className="py-2 text-[15px] text-[color:var(--color-charcoal)]/80">
              {c === day ? (
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-rose)] text-white">
                  {c}
                </span>
              ) : (
                c ?? ""
              )}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-6 text-center text-[15px] text-[color:var(--color-mute)]">
        {year}년 {month + 1}월 {day}일 {weekday}
      </p>
      <p className="mt-1 text-center text-[15px] text-[color:var(--color-rose-deep)]">{timeLabel}</p>
    </Section>
  );
}

/* ────────── 갤러리 ────────── */

export function Gallery() {
  const [idx, setIdx] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? wedding.gallery : wedding.gallery.slice(0, 6);
  return (
    <Section>
      <SectionTitle en="Gallery" ko="우리의 순간" />
      <div className="grid grid-cols-3 gap-1.5">
        {items.map((src, i) => (
          <button
            key={src}
            onClick={() => setIdx(i)}
            className="aspect-[3/4] overflow-hidden bg-[color:var(--color-blush)]/30"
          >
            <img src={src} alt={`gallery-${i}`} className="h-full w-full object-cover transition duration-500 hover:scale-105" loading="lazy" />
          </button>
        ))}
      </div>
      {wedding.gallery.length > 6 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mx-auto mt-6 block rounded-full border border-[color:var(--color-line)] px-6 py-2 text-sm tracking-[0.25em] text-[color:var(--color-rose-deep)]"
        >
          {expanded ? "접기" : "MORE +"}
        </button>
      )}
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

/* ────────── 오시는 길 ────────── */

export function Location() {
  const { name, address, detail, lat, lng, tel, naverMapUrl } = wedding.venue;

  const naverWeb = naverMapUrl;
  const naverApp = `nmap://place?lat=${lat}&lng=${lng}&name=${encodeURIComponent(name)}&appname=wedding.chyurikping`;
  const naverRouteWeb = `https://map.naver.com/p/directions/-/-/-/car?c=15,0,0,0,dh&destination=${encodeURIComponent(name)},${lng},${lat}`;
  const naverRouteApp = `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=wedding.chyurikping`;

  const kakaoMapWeb = `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`;
  const kakaoRouteWeb = `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
  const kakaoNaviApp = `kakaomap://route?ep=${lat},${lng}&by=CAR`;

  const tmapApp = `tmap://route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`;

  const openWithFallback = (appUrl: string, webUrl: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    const ua = navigator.userAgent || "";
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);
    if (!isMobile) return;
    e.preventDefault();
    const t = Date.now();
    const fallback = setTimeout(() => {
      if (Date.now() - t < 1600) window.location.href = webUrl;
    }, 1200);
    window.location.href = appUrl;
    window.addEventListener("pagehide", () => clearTimeout(fallback), { once: true });
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("주소가 복사되었습니다.");
    } catch {}
  };

  return (
    <Section>
      <SectionTitle en="Location" ko="오시는 길" />
      <div className="text-card mb-6 text-center">
        <p className="font-[family-name:var(--font-accent)] text-xl tracking-wide text-[color:var(--color-charcoal)]">{name}</p>
        <p className="mt-2 text-[15px] text-[color:var(--color-mute)]">{address}</p>
        <p className="text-[15px] text-[color:var(--color-mute)]">{detail} · {tel}</p>
        <button
          onClick={() => copy(address)}
          className="mt-3 rounded-full border border-[color:var(--color-line)] bg-white px-4 py-1.5 text-[13px] tracking-widest text-[color:var(--color-rose-deep)]"
        >
          주소 복사
        </button>
      </div>
      <a
        href={naverWeb}
        onClick={openWithFallback(naverApp, naverWeb)}
        target="_blank"
        rel="noreferrer"
        className="relative block h-64 w-full overflow-hidden rounded-sm border border-[color:var(--color-line)] bg-white"
      >
        <svg
          viewBox="0 0 400 256"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <defs>
            <pattern id="map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="400" height="256" fill="url(#map-grid)" className="text-[color:var(--color-charcoal)]" />
          <path d="M 0 180 Q 120 120 240 160 T 400 140" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" className="text-[color:var(--color-rose-deep)]" />
          <path d="M 60 40 Q 160 90 260 60 T 400 90" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeWidth="2" className="text-[color:var(--color-rose-deep)]" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-rose-deep)] text-white shadow-md">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
              <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.05 11.3 7.35 11.56a1 1 0 0 0 1.3 0C12.95 21.3 20 15.25 20 10c0-4.42-3.58-8-8-8Zm0 10.75A2.75 2.75 0 1 1 14.75 10 2.75 2.75 0 0 1 12 12.75Z" />
            </svg>
          </div>
          <p className="mt-3 font-[family-name:var(--font-accent)] text-xl tracking-wide text-[color:var(--color-charcoal)]">{name}</p>
          <p className="mt-1 text-[14px] text-[color:var(--color-mute)]">{address}</p>
          <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-white/85 px-4 py-1.5 text-[13px] tracking-widest text-[color:var(--color-rose-deep)]">
            네이버 지도에서 열기 →
          </span>
        </div>
      </a>
      <div className="mt-8">
        <p className="mb-3 text-center text-[24px] tracking-[0.35em] text-[color:var(--color-mute)]">MAP</p>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={naverWeb}
            onClick={openWithFallback(naverApp, naverWeb)}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm border border-[color:var(--color-line)] bg-white py-3 text-center text-[15px] text-[color:var(--color-charcoal)]"
          >
            네이버 지도
          </a>
          <a
            href={kakaoMapWeb}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm border border-[color:var(--color-line)] bg-white py-3 text-center text-[15px] text-[color:var(--color-charcoal)]"
          >
            카카오맵
          </a>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-3 text-center text-[24px] tracking-[0.35em] text-[color:var(--color-mute)]">NAVIGATION</p>
        <div className="grid grid-cols-3 gap-2">
          <a
            href={naverRouteWeb}
            onClick={openWithFallback(naverRouteApp, naverRouteWeb)}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm bg-[color:var(--color-charcoal)] py-3 text-center text-[14px] text-[color:var(--color-paper)]"
          >
            네이버내비
          </a>
          <a
            href={kakaoRouteWeb}
            onClick={openWithFallback(kakaoNaviApp, kakaoRouteWeb)}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm bg-[color:var(--color-rose-deep)] py-3 text-center text-[14px] text-white"
          >
            카카오내비
          </a>
          <a
            href={tmapApp}
            className="rounded-sm border border-[color:var(--color-line)] bg-white py-3 text-center text-[14px] text-[color:var(--color-charcoal)]"
          >
            티맵
          </a>
        </div>
      </div>

      <div className="text-card mt-8 space-y-3 text-[15px] text-[color:var(--color-charcoal)]/80">
        <div className="flex gap-3">
          <span className="min-w-[48px] text-[color:var(--color-rose-deep)]">지하철</span>
          <span>7호선 하계역 도보 약 7분</span>
        </div>
        <div className="flex gap-3">
          <span className="min-w-[48px] text-[color:var(--color-rose-deep)]">주소</span>
          <span>{address}</span>
        </div>
        <div className="flex gap-3">
          <span className="min-w-[48px] text-[color:var(--color-rose-deep)]">주차</span>
          <span>건물 주차장 이용 가능</span>
        </div>
      </div>
    </Section>
  );
}

/* ────────── 마음 전하실 곳 ────────── */

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
      className="ml-auto rounded-full border border-[color:var(--color-line)] px-3 py-1 text-[13px] tracking-widest text-[color:var(--color-rose-deep)]"
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
          className="flex w-full items-center justify-between rounded-sm border border-[color:var(--color-line)] bg-white px-5 py-4"
        >
          <span className="text-[15px] tracking-wide">
            <span className="text-[color:var(--color-mute)]">{label}</span>
            <span className="ml-3 text-[color:var(--color-charcoal)]">{p.name}</span>
          </span>
          <span className="text-[color:var(--color-rose-deep)] text-lg leading-none">{open === who ? "−" : "+"}</span>
        </button>
        {open === who && (
          <div className="mt-2 flex items-center gap-3 rounded-sm bg-[color:var(--color-blush)]/30 px-5 py-3 text-[15px]">
            <span className="text-[color:var(--color-mute)]">{p.bankOwner}</span>
            <span className="text-[color:var(--color-charcoal)]">{p.bank}</span>
            <CopyButton text={p.bank.replace(/.*\s/, "")} />
          </div>
        )}
      </div>
    );
  };
  return (
    <Section card>
      <SectionTitle en="Heart" ko="마음 전하실 곳" />
      <p className="mb-8 text-center text-[15px] leading-loose text-[color:var(--color-mute)]">
        참석이 어려우신 분들을 위해<br />
        조심스레 계좌번호를 안내드립니다.
      </p>
      <div className="space-y-3">
        {side("groom")}
        {side("bride")}
      </div>
    </Section>
  );
}

/* ────────── 공유 ────────── */

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
    <Section className="pb-28">
      <FloralDivider />
      <div className="text-center">
        <p className="eyebrow">Thank You</p>
        <p className="mt-4 font-[family-name:var(--font-accent)] text-2xl text-[color:var(--color-charcoal)]">
          {wedding.groom.nameEn} &amp; {wedding.bride.nameEn}
        </p>
        <button
          onClick={share}
          className="mx-auto mt-8 block rounded-full bg-[color:var(--color-charcoal)] px-7 py-3 text-[14px] tracking-[0.3em] text-[color:var(--color-paper)]"
        >
          SHARE
        </button>
        <p className="mt-10 text-[24px] tracking-[0.3em] text-[color:var(--color-mute)]">
          MADE WITH LOVE
        </p>
      </div>
    </Section>
  );
}
