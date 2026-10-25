"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AlertCircle, Loader2 } from "lucide-react";
import { SkyBackground } from "@/src/components/robot/SkyBackground";

// Logowanie dziecka kodem od rodzica, np. KAROL-5545.
export default function ChildCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/child/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Nie udało się zalogować.");
        return;
      }
      router.push("/robot");
    } catch {
      setError("Nie udało się zalogować.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 text-ink">
      <SkyBackground />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm space-y-5 rounded-[2.5rem] bg-white/90 p-8 pt-24 shadow-lift backdrop-blur"
      >
        <div className="absolute -top-16 left-1/2 h-36 w-36 -translate-x-1/2 animate-bob">
          <Image src="/robot/robot-idle.png" alt="Robot Pytajek" fill priority sizes="144px" className="object-contain" />
        </div>

        <h1 className="text-center font-display text-3xl font-semibold">Wpisz swój kod</h1>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl bg-orange-light p-3 text-sm font-semibold text-orange-deep">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <input
          name="code"
          required
          autoFocus
          autoComplete="off"
          autoCapitalize="characters"
          placeholder="KAROL-5545"
          aria-label="Kod"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-16 w-full rounded-3xl border-2 border-sky-light bg-cream text-center font-display text-2xl font-semibold tracking-widest text-ink placeholder:text-ink-soft/40 transition focus:border-sky focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky/25"
        />

        <button
          type="submit"
          disabled={isLoading || !code.trim()}
          className="flex h-16 w-full items-center justify-center rounded-full bg-orange font-display text-2xl font-semibold text-white shadow-[0_6px_0_var(--color-orange-deep)] transition-[transform,box-shadow] duration-100 active:translate-y-1.5 active:shadow-none disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : "WCHODZĘ"}
        </button>
      </form>
    </div>
  );
}
