"use client";

import { Loader2, Mic, Moon, Square } from "lucide-react";
import { Robot } from "@/src/components/robot/Robot";
import { useVoiceQuestion, type VoiceStatus } from "@/src/hooks/useVoiceQuestion";
import { cn } from "@/src/lib/utils";

const STATUS_HINT: Record<VoiceStatus, string> = {
  idle: "",
  listening: "Słucham…",
  thinking: "Myślę…",
  speaking: "",
  error: "",
};

type RobotPanelProps = {
  // Gdy czas się skończy, trwająca odpowiedź może się dokończyć, ale nowego pytania nie da się zadać.
  timeUp?: boolean;
};

export function RobotPanel({ timeUp = false }: RobotPanelProps) {
  const { status, error, supported, ask, stop } = useVoiceQuestion();
  const busy = status === "listening" || status === "thinking" || status === "speaking";
  const locked = timeUp && !busy;

  const hint = !supported
    ? "Twoja przeglądarka nie obsługuje rozpoznawania mowy. Użyj Chrome lub Edge."
    : locked
      ? ""
      : error ?? STATUS_HINT[status];

  return (
    <div className="relative flex flex-1 flex-col items-center">
      <div className="flex w-full flex-1 flex-col items-center justify-center gap-6">
        <Robot speaking={status === "speaking"} className="max-w-[440px]" />
        <p
          aria-live="polite"
          className={cn(
            "min-h-10 rounded-full px-5 py-2 text-center font-display text-lg font-medium text-ink transition-opacity",
            hint ? "bg-white/80 shadow-soft opacity-100" : "opacity-0"
          )}
        >
          {hint}
        </p>
      </div>

      <div className="w-full pb-8 pt-4">
        {locked ? (
          <div
            role="status"
            className="mx-auto flex h-20 w-full max-w-md items-center justify-center gap-3 rounded-full bg-white/80 px-6 text-center font-display text-lg font-semibold text-ink-soft shadow-soft sm:text-xl"
          >
            <Moon className="h-7 w-7 shrink-0 text-sky-deep" />
            Pytajek odpoczywa!
          </div>
        ) : (
          <button
            type="button"
            onClick={busy ? stop : ask}
            disabled={!supported}
            className={cn(
              "relative mx-auto flex h-20 w-full max-w-md items-center justify-center rounded-full font-display text-2xl font-semibold tracking-wide text-white transition-[transform,box-shadow] duration-100",
              "active:translate-y-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white disabled:pointer-events-none disabled:opacity-50",
              busy
                ? "bg-sky-deep shadow-[0_8px_0_#2a7bb0,0_18px_30px_-10px_rgba(61,155,214,0.6)] active:shadow-[0_0_0_#2a7bb0]"
                : "bg-orange shadow-[0_8px_0_var(--color-orange-deep),0_18px_30px_-10px_rgba(255,140,66,0.6)] active:shadow-[0_0_0_var(--color-orange-deep)]"
            )}
          >
            {status === "listening" && (
              <span className="absolute inset-0 rounded-full bg-sky-deep/40 animate-ping" aria-hidden />
            )}
            <span className="relative flex items-center gap-3">
              {status === "thinking" ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : busy ? (
                <Square className="h-6 w-6 fill-current" />
              ) : (
                <Mic className="h-7 w-7" />
              )}
              {busy ? "ZATRZYMAJ" : "ZADAJ PYTANIE"}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
