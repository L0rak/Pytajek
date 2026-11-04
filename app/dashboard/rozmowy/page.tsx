"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, Loader2, MessageCircle } from "lucide-react";
import { useChildren } from "@/src/hooks/useChildren";
import { ChildPicker, NoChildrenHint } from "@/src/components/parent/ChildPicker";
import { formatDay, formatTime } from "@/src/lib/format";

type Message = { id: string; question: string; answer: string; createdAt: string };

// Nowe rozmowy dziecka pojawiają się bez odświeżania strony.
const REFRESH_MS = 5_000;

function ChatHistory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { children } = useChildren();
  const [history, setHistory] = useState<{ childId: string; messages: Message[] } | null>(null);

  const requestedId = searchParams.get("dziecko");
  const childId =
    children?.find((c) => c.id === requestedId)?.id ?? children?.[0]?.id ?? null;
  const child = children?.find((c) => c.id === childId);

  useEffect(() => {
    if (!childId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/children/${childId}/chats`);
        if (!res.ok || cancelled) return;
        const data: { messages: Message[] } = await res.json();
        if (!cancelled) setHistory({ childId, messages: data.messages });
      } catch {
        // Spróbujemy przy następnym odświeżeniu.
      }
    };
    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [childId]);

  const messages = history?.childId === childId ? history.messages : null;

  if (children === null) {
    return <Loader2 className="h-6 w-6 animate-spin text-orange" />;
  }
  if (children.length === 0) {
    return (
      <div className="w-full max-w-3xl">
        <NoChildrenHint text="Dodaj dziecko do konta, a tutaj zobaczysz jego rozmowy z Pytajkiem." />
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl space-y-6">
      <ChildPicker
        options={children}
        selectedId={childId}
        onSelect={(id) => router.replace(`/dashboard/rozmowy?dziecko=${id}`, { scroll: false })}
        label="Czyje rozmowy pokazać"
      />

      {messages && messages.length > 0 && (
        <div className="flex justify-end">
          {/* Plik generuje serwer, więc zawiera całą historię, nie tylko wczytane wiadomości. */}
          <a
            href={`/api/children/${childId}/chats/export`}
            download
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-orange px-6 font-display font-semibold text-white shadow-[0_4px_0_var(--color-orange-deep)] transition hover:brightness-105 active:translate-y-1 active:shadow-none"
          >
            <Download className="h-5 w-5" />
            Pobierz rozmowy (.md)
          </a>
        </div>
      )}

      <section className="rounded-[2rem] bg-white p-5 sm:p-8 shadow-soft">
        {messages === null ? (
          <Loader2 className="h-6 w-6 animate-spin text-orange" />
        ) : messages.length === 0 ? (
          <div className="py-10 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-sky" />
            <p className="mt-3 font-display text-xl font-semibold text-ink">Jeszcze nic tu nie ma</p>
            <p className="mt-1 text-sm text-ink-soft">
              Gdy {child?.name} zada Pytajkowi pytanie, rozmowa pojawi się tutaj.
            </p>
          </div>
        ) : (
          <ol className="space-y-6">
            {groupByDay(messages).map(([day, dayMessages]) => (
              <li key={day}>
                <p className="mb-4 text-center text-xs font-bold uppercase tracking-wide text-ink-soft">{day}</p>
                <ol className="space-y-5">
                  {dayMessages.map((m) => (
                    <li key={m.id} className="space-y-2">
                      {/* Pytanie dziecka */}
                      <div className="flex items-end gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky to-mint text-xs font-bold text-white">
                          {child?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="max-w-[80%] rounded-3xl rounded-bl-md bg-sky-light px-4 py-3 text-[15px] font-semibold text-ink">
                          {m.question}
                        </div>
                        <span className="pb-1 text-xs text-ink-soft">{formatTime(m.createdAt)}</span>
                      </div>
                      {/* Odpowiedź robota */}
                      <div className="flex flex-row-reverse items-end gap-2">
                        <div className="relative h-8 w-8 shrink-0">
                          <Image src="/robot/robot-idle.png" alt="Pytajek" fill sizes="32px" className="object-contain" />
                        </div>
                        <div className="max-w-[80%] rounded-3xl rounded-br-md bg-sun-light px-4 py-3 text-[15px] text-ink">
                          {m.answer}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function groupByDay(messages: Message[]): [string, Message[]][] {
  const groups = new Map<string, Message[]>();
  for (const m of messages) {
    const day = formatDay(m.createdAt);
    groups.set(day, [...(groups.get(day) ?? []), m]);
  }
  return [...groups.entries()];
}

export default function ChatsPage() {
  return (
    <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-orange" />}>
      <ChatHistory />
    </Suspense>
  );
}
