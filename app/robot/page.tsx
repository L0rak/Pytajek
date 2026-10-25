"use client";

import { RobotPanel } from "@/src/components/robot/RobotPanel";
import { SkyBackground } from "@/src/components/robot/SkyBackground";
import { useChildTime } from "@/src/hooks/useChildTime";

// Ekran dziecka: tylko robot i przycisk "ZADAJ PYTANIE".
export default function ChildRobotPage() {
  const secondsLeft = useChildTime();

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden px-6 pt-6 text-ink">
      <SkyBackground />
      <RobotPanel timeUp={secondsLeft === 0} />
    </div>
  );
}
