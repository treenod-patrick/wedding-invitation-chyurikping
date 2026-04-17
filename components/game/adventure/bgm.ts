"use client";

export type BgmTrack = "title" | "intro" | "town" | "runner" | "ending";

type Note = { freq: number; dur: number };

const N = (f: number, d = 0.2): Note => ({ freq: f, dur: d });
const R = (d = 0.2): Note => ({ freq: 0, dur: d });

const F = {
  c4: 261.63, d4: 293.66, e4: 329.63, f4: 349.23, g4: 392.0, a4: 440.0, b4: 493.88,
  c5: 523.25, d5: 587.33, e5: 659.25, f5: 698.46, g5: 783.99, a5: 880.0, b5: 987.77,
  c6: 1046.5, d6: 1174.66, e6: 1318.51,
};

const TRACKS: Record<BgmTrack, { bpm: number; notes: Note[] }> = {
  title: {
    bpm: 96,
    notes: [
      N(F.c5, 0.5), N(F.e5, 0.5), N(F.g5, 0.5), N(F.e5, 0.5),
      N(F.f5, 0.5), N(F.a5, 0.5), N(F.g5, 1.0),
      N(F.d5, 0.5), N(F.f5, 0.5), N(F.a5, 0.5), N(F.f5, 0.5),
      N(F.e5, 0.5), N(F.g5, 0.5), N(F.c5, 1.0),
    ],
  },
  intro: {
    bpm: 88,
    notes: [
      N(F.a4, 0.5), N(F.c5, 0.5), N(F.e5, 1.0),
      N(F.d5, 0.5), N(F.c5, 0.5), N(F.a4, 1.0),
      N(F.g4, 0.5), N(F.a4, 0.5), N(F.c5, 1.0),
      N(F.b4, 0.5), N(F.a4, 0.5), N(F.g4, 1.0),
    ],
  },
  town: {
    bpm: 132,
    notes: [
      N(F.c5, 0.25), N(F.e5, 0.25), N(F.g5, 0.25), N(F.c6, 0.25),
      N(F.b5, 0.25), N(F.g5, 0.25), N(F.e5, 0.25), N(F.g5, 0.25),
      N(F.a5, 0.25), N(F.c6, 0.25), N(F.e6, 0.5),
      N(F.d6, 0.25), N(F.b5, 0.25), N(F.g5, 0.25), N(F.e5, 0.25),
      N(F.f5, 0.25), N(F.a5, 0.25), N(F.c6, 0.5),
      N(F.e5, 0.25), N(F.g5, 0.25), N(F.c5, 0.5),
    ],
  },
  runner: {
    bpm: 160,
    notes: [
      N(F.e5, 0.2), N(F.e5, 0.2), R(0.1), N(F.e5, 0.2),
      R(0.1), N(F.c5, 0.2), N(F.e5, 0.2), N(F.g5, 0.4), R(0.4),
      N(F.g4, 0.4), R(0.4),
      N(F.c5, 0.3), R(0.2), N(F.g4, 0.3), R(0.2),
      N(F.e4, 0.3), R(0.2), N(F.a4, 0.3), N(F.b4, 0.2),
      N(F.a4, 0.2), N(F.g4, 0.3), N(F.e5, 0.2),
      N(F.g5, 0.2), N(F.a5, 0.3), N(F.f5, 0.2), N(F.g5, 0.3),
    ],
  },
  ending: {
    bpm: 80,
    notes: [
      N(F.c5, 0.5), N(F.c5, 0.25), N(F.c5, 0.25), N(F.c5, 0.5), N(F.f5, 0.5),
      N(F.f5, 0.5), N(F.e5, 0.5), N(F.d5, 0.5), N(F.c5, 0.5),
      N(F.g5, 0.5), N(F.e5, 0.5), N(F.c5, 1.0),
      N(F.a4, 0.5), N(F.g4, 0.5), N(F.f4, 0.5), N(F.g4, 0.5),
      N(F.c5, 1.0),
    ],
  },
};

class BgmPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private current: BgmTrack | null = null;
  private muted = false;
  private stopToken = 0;

  private ensure() {
    if (this.ctx) return;
    const w = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = window.AudioContext || w.webkitAudioContext;
    if (!Ctor) return;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.12;
    this.master.connect(this.ctx.destination);
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.12;
  }

  play(track: BgmTrack) {
    this.ensure();
    if (!this.ctx || !this.master) return;
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    if (this.current === track && this.timer) return;
    this.stop();
    this.current = track;
    this.stopToken++;
    const token = this.stopToken;
    const cfg = TRACKS[track];
    const beat = 60 / cfg.bpm;

    const scheduleLoop = () => {
      if (token !== this.stopToken) return;
      const ctx = this.ctx;
      const master = this.master;
      if (!ctx || !master) return;
      let t = ctx.currentTime;
      let totalMs = 0;
      for (const note of cfg.notes) {
        const dur = note.dur * beat;
        if (note.freq > 0) {
          const osc = ctx.createOscillator();
          osc.type = "square";
          osc.frequency.value = note.freq;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.9, t + 0.01);
          g.gain.linearRampToValueAtTime(0.0001, t + dur * 0.9);
          osc.connect(g).connect(master);
          osc.start(t);
          osc.stop(t + dur);
        }
        t += dur;
        totalMs += dur * 1000;
      }
      this.timer = setTimeout(scheduleLoop, totalMs);
    };
    scheduleLoop();
  }

  stop() {
    this.stopToken++;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.current = null;
  }
}

let singleton: BgmPlayer | null = null;

export function getBgm(): BgmPlayer {
  if (typeof window === "undefined") {
    return {
      setMuted() {},
      play() {},
      stop() {},
    } as unknown as BgmPlayer;
  }
  if (!singleton) singleton = new BgmPlayer();
  return singleton;
}

const MUTE_KEY = "wedding_bgm_muted_v1";

export function loadMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}
