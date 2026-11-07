"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AlertCircle, Check, Copy, Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { useChildren } from "@/src/hooks/useChildren";
import { ChildPicker, NoChildrenHint } from "@/src/components/parent/ChildPicker";
import { LoadError } from "@/src/components/parent/LoadError";

type ChildCode = {
  id: string;
  code: string;
  child: { id: string; name: string };
  secondsLimit: number;
  secondsUsed: number;
  createdAt: string;
};

const PRESETS = [
  { label: "5 min", seconds: 300 },
  { label: "15 min", seconds: 900 },
  { label: "30 min", seconds: 1800 },
];

const INPUT_CLASS =
  "h-12 w-full rounded-2xl border-2 border-cream-dark bg-cream px-4 text-base font-semibold text-ink placeholder:text-ink-soft/60 transition focus:border-sky focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky/25";

// Odświeżamy listę, żeby rodzic widział na bieżąco zużycie czasu przez dziecko.
const REFRESH_MS = 1_000;

function formatSeconds(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ChildCodesPanel() {
  const [codes, setCodes] = useState<ChildCode[] | null>(null);
  const [codesFailed, setCodesFailed] = useState(false);
  const { children, reload: reloadChildren, failed: childrenFailed } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [seconds, setSeconds] = useState("300");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  // Rośnie po każdej zmianie listy: spóźniona odpowiedź odświeżania nie może jej cofnąć.
  const codesVersionRef = useRef(0);

  // Domyślnie zaznaczone pierwsze dziecko, dopóki rodzic nie wybierze innego.
  const childId =
    children?.find((c) => c.id === selectedChildId)?.id ?? children?.[0]?.id ?? null;

  const loadCodes = useCallback(async () => {
    const version = codesVersionRef.current;
    try {
      const res = await fetch("/api/child-codes");
      if (!res.ok) {
        setCodesFailed(true);
        return;
      }
      const data: { codes: ChildCode[] } = await res.json();
      if (version !== codesVersionRef.current) return;
      setCodes(data.codes);
      setCodesFailed(false);
    } catch {
      setCodesFailed(true);
    }
  }, []);

  // Strona jest tylko ukrywana przy nawigacji: bez tego po powrocie wracałby stary błąd.
  useLayoutEffect(() => () => setError(null), []);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      if (!cancelled && document.visibilityState === "visible") void loadCodes();
    };
    const initial = setTimeout(load, 0);
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [loadCodes]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/child-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ childId, seconds: Number(seconds) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Nie udało się wygenerować kodu.");
        return;
      }
      codesVersionRef.current++;
      setCodes((prev) => [data.code, ...(prev ?? [])]);
    } catch {
      setError("Nie udało się wygenerować kodu.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/child-codes/${id}`, { method: "DELETE" });
      if (res.ok) {
        codesVersionRef.current++;
        setCodes((prev) => prev?.filter((c) => c.id !== id) ?? null);
      } else {
        setError("Nie udało się usunąć kodu.");
      }
    } catch {
      setError("Nie udało się usunąć kodu.");
    }
  };

  const handleCopy = async (code: ChildCode) => {
    try {
      // Przeglądarka udostępnia schowek tylko przez HTTPS lub localhost.
      await navigator.clipboard.writeText(code.code);
      setCopiedId(code.id);
      setTimeout(() => setCopiedId((id) => (id === code.id ? null : id)), 1500);
    } catch {
      setError(`Nie udało się skopiować kodu. Przepisz go ręcznie: ${code.code}`);
    }
  };

  const secondsNumber = Number(seconds);

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Generowanie kodu */}
      <section className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sun-light text-orange">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Nowy kod dla dziecka</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Dziecko wpisuje kod na stronie{" "}
              <span className="rounded-md bg-cream px-1.5 py-0.5 font-mono text-ink">/kod</span>.
              Czas liczy się, gdy ekran z robotem jest otwarty.
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-orange-light p-3 text-sm font-semibold text-orange-deep">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {children === null ? (
          childrenFailed ? (
            <div className="mt-6">
              <LoadError text="Nie udało się wczytać listy dzieci." onRetry={reloadChildren} />
            </div>
          ) : (
            <Loader2 className="mt-6 h-6 w-6 animate-spin text-orange" />
          )
        ) : children.length === 0 ? (
          <div className="mt-6">
            <NoChildrenHint text="Najpierw dodaj dziecko do konta — potem wybierzesz je tutaj." />
          </div>
        ) : (
        <form onSubmit={handleCreate} className="mt-6 space-y-5">
          <div className="space-y-2">
            <p className="text-sm font-bold text-ink">Dla kogo?</p>
            <ChildPicker
              options={children}
              selectedId={childId}
              onSelect={setSelectedChildId}
              label="Wybierz dziecko"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="seconds" className="block text-sm font-bold text-ink">
                Czas (sekundy)
                {secondsNumber > 0 && (
                  <span className="ml-2 font-semibold text-ink-soft">= {formatSeconds(secondsNumber)} min</span>
                )}
              </label>
              <input
                id="seconds"
                type="number"
                required
                min={1}
                step={1}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Szybki wybór czasu">
              {PRESETS.map((p) => {
                const selected = secondsNumber === p.seconds;
                return (
                  <button
                    key={p.seconds}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSeconds(String(p.seconds))}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-bold transition active:translate-y-0.5",
                      selected
                        ? "bg-sun text-ink shadow-[0_3px_0_#e0ad3c]"
                        : "bg-cream text-ink-soft shadow-[0_3px_0_var(--color-cream-dark)] hover:text-ink"
                    )}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
            <button
              type="submit"
              disabled={creating || !childId}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange px-7 font-display text-lg font-semibold text-white shadow-[0_4px_0_var(--color-orange-deep)] transition hover:brightness-105 active:translate-y-1 active:shadow-none disabled:opacity-60"
            >
              {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              Generuj kod
            </button>
          </div>
        </form>
        )}
      </section>

      {/* Lista kodów */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Kody dzieci</h2>

        {codes === null ? (
          codesFailed ? (
            <LoadError text="Nie udało się wczytać kodów. Próbuję ponownie..." />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-orange" />
          )
        ) : codes.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-cream-dark p-8 text-center text-sm font-semibold text-ink-soft">
            Nie masz jeszcze żadnych kodów. Wygeneruj pierwszy powyżej!
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {codes.map((code) => {
              const left = Math.max(0, code.secondsLimit - code.secondsUsed);
              const active = left > 0;
              const leftPct = Math.min(100, (left / code.secondsLimit) * 100);
              return (
                <div
                  key={code.id}
                  className={cn("rounded-[1.75rem] bg-white p-5 shadow-soft transition", !active && "opacity-80")}
                >
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold",
                          active ? "bg-mint-light text-mint-deep" : "bg-cream-dark text-ink-soft"
                        )}
                      >
                        {active ? "Aktywny" : "Wykorzystany"}
                      </span>
                      <p className="mt-2 truncate font-mono text-xl font-bold tracking-wider text-ink">{code.code}</p>
                      <p className="text-sm font-semibold text-ink-soft">{code.child.name}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Kopiuj kod"
                      onClick={() => handleCopy(code)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-light text-sky-deep transition hover:brightness-95"
                    >
                      {copiedId === code.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      aria-label="Usuń kod"
                      onClick={() => handleDelete(code.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-light text-orange-deep transition hover:brightness-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div
                    className="mt-4 h-3.5 overflow-hidden rounded-full bg-cream-dark"
                    role="progressbar"
                    aria-label={`Pozostały czas dla ${code.code}`}
                    aria-valuemin={0}
                    aria-valuemax={code.secondsLimit}
                    aria-valuenow={left}
                  >
                    {active && (
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-mint to-[#7be0c9] transition-[width] duration-700"
                        style={{ width: `${leftPct}%` }}
                      />
                    )}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-ink-soft">
                    {active ? (
                      <>
                        Zostało <span className="text-mint-deep">{formatSeconds(left)}</span> z{" "}
                        {formatSeconds(code.secondsLimit)}
                      </>
                    ) : (
                      <>Czas wykorzystany ({formatSeconds(code.secondsLimit)})</>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
