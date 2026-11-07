"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const HEARTBEAT_MS = 1_000;

// Odlicza czas dziecka po stronie serwera: co 1 s (gdy karta jest widoczna) wysyła heartbeat.
// Zwraca pozostałe sekundy (null, dopóki nie przyjdzie pierwsza odpowiedź).
export function useChildTime() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const beat = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/child/heartbeat", { method: "POST" });
        if (cancelled) return;
        if (res.status === 401) {
          router.replace("/kod");
          return;
        }
        if (!res.ok) return;
        const data: { secondsLeft: number } = await res.json();
        if (!cancelled) setSecondsLeft(data.secondsLeft);
      } catch {
        // Chwilowy brak sieci: spróbujemy przy następnym heartbeacie.
      }
    };

    void beat();
    const id = setInterval(beat, HEARTBEAT_MS);
    document.addEventListener("visibilitychange", beat);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", beat);
      // Strona jest tylko ukrywana: po wejściu z nowym kodem nie może mignąć stary, wyczerpany czas.
      setSecondsLeft(null);
    };
  }, [router]);

  return secondsLeft;
}
