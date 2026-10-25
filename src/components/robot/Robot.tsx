"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/src/lib/utils";

// Docelowe grafiki od Marcina wystarczy podmienić w public/robot/ (te same nazwy plików).
const IDLE_SRC = "/robot/robot-idle.png";
const TALKING_SRC = "/robot/robot-talking.png";

// Co ile ms przełączamy klatki "usta zamknięte / otwarte" podczas mówienia.
const MOUTH_FRAME_MS = 160;

type RobotProps = {
  speaking: boolean;
  className?: string;
};

export function Robot({ speaking, className }: RobotProps) {
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    if (!speaking) return;
    const id = setInterval(() => setMouthOpen((open) => !open), MOUTH_FRAME_MS);
    return () => {
      clearInterval(id);
      setMouthOpen(false);
    };
  }, [speaking]);

  const showTalking = speaking && mouthOpen;

  return (
    <div className={cn("relative aspect-square w-full", className)}>
      {/* Miękki cień "na ziemi" pod unoszącym się robotem. */}
      <div className="absolute bottom-[8%] left-1/2 h-[7%] w-[46%] -translate-x-1/2 rounded-[50%] bg-ink/15 blur-md" />
      {/* Obie klatki są wyrenderowane cały czas, żeby nie migały przy przełączaniu. */}
      <div className="absolute inset-0 animate-bob drop-shadow-[0_18px_24px_rgba(61,155,214,0.25)]">
      <Image
        src={IDLE_SRC}
        alt="Robot Pytajek"
        fill
        priority
        sizes="(max-width: 768px) 80vw, 420px"
        className={cn("object-contain", showTalking && "invisible")}
      />
      <Image
        src={TALKING_SRC}
        alt=""
        aria-hidden
        fill
        priority
        sizes="(max-width: 768px) 80vw, 420px"
        className={cn("object-contain", !showTalking && "invisible")}
      />
      </div>
    </div>
  );
}
