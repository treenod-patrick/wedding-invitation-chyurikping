"use client";
import { useState } from "react";
import FontPicker from "@/components/FontPicker";
import { Hero, Greeting, People, Countdown, Calendar, Gallery, Location, Account, Guestbook, GameBanner, Share } from "@/components/sections";
import { fonts, type FontId } from "@/lib/data";

export default function Home() {
  const [font, setFont] = useState<FontId>("gowun-batang");
  const cls = fonts.find((f) => f.id === font)?.cls ?? "font-gowun-batang";
  return (
    <main className={cls}>
      <Hero />
      <Greeting />
      <People />
      <Countdown />
      <Calendar />
      <Gallery />
      <Location />
      <GameBanner />
      <Account />
      <Guestbook />
      <Share />
      <FontPicker value={font} onChange={setFont} />
    </main>
  );
}
