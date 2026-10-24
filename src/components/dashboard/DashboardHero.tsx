import { APP_TIME_ZONE } from "@/lib/constants/locale";
import React from "react";
import { HeroDateTimeBadge } from "./DashboardCharts";

export interface DashboardHeroProps {
  displayName: string;
  today: Date;
}

export function DashboardHero({ displayName, today }: DashboardHeroProps) {
  return (
    <div className="relative bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 overflow-hidden text-primary-foreground shadow-xl shadow-primary/20 flex justify-between items-center h-48 border border-white/10">
      <div className="relative z-10">
        <HeroDateTimeBadge />
        <h1 className="font-display text-4xl font-bold mb-1 tracking-tight">
          ¡Buen día, {displayName}!
        </h1>
        <p className="text-primary-foreground/90 font-medium">
          ¡Que tengas un excelente{" "}
          {today.toLocaleDateString("es-ES", { timeZone: APP_TIME_ZONE, weekday: "long" })}!
        </p>
      </div>

      {/* Abstract Doctor Illustration using CSS/Icons */}
      <div className="absolute right-0 bottom-0 top-0 w-1/2 overflow-hidden hidden md:block">
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path
              fill="currentColor"
              className="text-card"
              d="M0,100 C150,200 250,0 400,100 L400,200 L0,200 Z"
            />
            <path
              fill="currentColor"
              className="text-card"
              d="M0,50 C150,-50 250,250 400,50 L400,200 L0,200 Z"
              opacity="0.5"
            />
          </svg>
        </div>

        <div className="absolute bottom-0 right-16 w-32 h-40 bg-card/10 rounded-t-[3rem] border border-white/20 flex flex-col items-center justify-end overflow-hidden">
          <div className="w-16 h-16 bg-[#ffd166] rounded-full mb-2" />
          <div className="w-24 h-24 bg-card rounded-t-full" />
        </div>
        <div className="absolute top-8 right-8 text-primary-foreground/50 text-2xl rotate-12">💊</div>
        <div className="absolute bottom-12 right-4 text-primary-foreground/50 text-2xl -rotate-12">🩺</div>
        <div className="absolute top-16 right-48 text-primary-foreground/50 text-2xl rotate-45">📋</div>
      </div>
    </div>
  );
}
