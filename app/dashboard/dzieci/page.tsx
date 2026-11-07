"use client";

import { useLayoutEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";
import { useChildren } from "@/src/hooks/useChildren";
import { LoadError } from "@/src/components/parent/LoadError";
import { formatDateTime } from "@/src/lib/format";

export default function ChildrenPage() {
  const { children, setChildren, reload, failed } = useChildren();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Strona jest tylko ukrywana przy nawigacji: bez tego po powrocie wracałby stary błąd i otwarte potwierdzenie.
  useLayoutEffect(() => {
    return () => {
      setError(null);
      setConfirmDeleteId(null);
    };
  }, []);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setAdding(true);
    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Nie udało się dodać dziecka.");
        return;
      }
      setChildren((prev) => [...(prev ?? []), data.child]);
      setName("");
    } catch {
      setError("Nie udało się dodać dziecka.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/children/${id}`, { method: "DELETE" });
      if (res.ok) setChildren((prev) => prev?.filter((c) => c.id !== id) ?? null);
      else setError("Nie udało się usunąć dziecka.");
    } catch {
      setError("Nie udało się usunąć dziecka.");
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="w-full max-w-4xl space-y-8">
      {/* Dodawanie dziecka */}
      <section className="rounded-[2rem] bg-white p-6 sm:p-8 shadow-soft">
        <h2 className="font-display text-2xl font-semibold text-ink">Dodaj dziecko</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Imię pojawi się w kodzie dostępu (np. <span className="font-mono text-ink">KAROL-5545</span>) i w historii rozmów.
        </p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-orange-light p-3 text-sm font-semibold text-orange-deep">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleAdd} className="mt-6 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="childName" className="sr-only">
            Imię dziecka
          </label>
          <input
            id="childName"
            required
            maxLength={30}
            placeholder="Imię dziecka, np. Karol"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 flex-1 rounded-2xl border-2 border-cream-dark bg-cream px-4 text-base font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/60 transition focus:border-sky focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky/25"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-orange px-7 font-display text-lg font-semibold text-white shadow-[0_4px_0_var(--color-orange-deep)] transition hover:brightness-105 active:translate-y-1 active:shadow-none disabled:opacity-60"
          >
            {adding ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            Dodaj
          </button>
        </form>
      </section>

      {/* Lista dzieci */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-semibold text-ink">Twoje dzieci</h2>

        {children === null ? (
          failed ? (
            <LoadError text="Nie udało się wczytać listy dzieci." onRetry={reload} />
          ) : (
            <Loader2 className="h-6 w-6 animate-spin text-orange" />
          )
        ) : children.length === 0 ? (
          <div className="rounded-[2rem] border-2 border-dashed border-cream-dark p-8 text-center text-sm font-semibold text-ink-soft">
            Nie dodano jeszcze żadnego dziecka.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child) => (
              <div key={child.id} className="rounded-[1.75rem] bg-white p-5 shadow-soft">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky to-mint font-display text-2xl font-semibold text-white">
                    {child.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-xl font-semibold text-ink">{child.name}</p>
                    <p className="text-sm text-ink-soft">
                      {child.messageCount === 0
                        ? "Brak rozmów"
                        : `${child.messageCount} ${pluralQuestions(child.messageCount)} · ostatnie ${formatDateTime(child.lastMessageAt!)}`}
                    </p>
                  </div>
                </div>

                {confirmDeleteId === child.id ? (
                  <div className="mt-4 rounded-2xl bg-orange-light p-3">
                    <p className="text-sm font-semibold text-orange-deep">
                      Usunąć {child.name}? Znikną też kody i cała historia rozmów.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(child.id)}
                        className="rounded-full bg-orange-deep px-4 py-1.5 text-sm font-bold text-white"
                      >
                        Tak, usuń
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-ink-soft"
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/dashboard/rozmowy?dziecko=${child.id}`}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-sky-light px-4 py-2.5 text-sm font-bold text-sky-deep transition hover:brightness-95"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Historia rozmów
                    </Link>
                    <button
                      type="button"
                      aria-label={`Usuń ${child.name}`}
                      onClick={() => setConfirmDeleteId(child.id)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-light text-orange-deep transition hover:brightness-95"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function pluralQuestions(n: number): string {
  if (n === 1) return "pytanie";
  const lastTwo = n % 100;
  const last = n % 10;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "pytania";
  return "pytań";
}
