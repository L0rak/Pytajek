"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import type { ChildSummary } from "@/src/hooks/useChildren";
import { cn } from "@/src/lib/utils";

type ChildPickerProps = {
  options: ChildSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  label: string;
};

// Wybór dziecka jako "pigułki" (radio). Na końcu link do dodania kolejnego dziecka.
export function ChildPicker({ options, selectedId, onSelect, label }: ChildPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
      {options.map((child) => {
        const selected = child.id === selectedId;
        return (
          <button
            key={child.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onSelect(child.id)}
            className={cn(
              "flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-sm font-bold transition active:translate-y-0.5",
              selected
                ? "bg-sky-deep text-white shadow-[0_3px_0_#2a7bb0]"
                : "bg-cream text-ink-soft shadow-[0_3px_0_var(--color-cream-dark)] hover:text-ink"
            )}
          >
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs",
                selected ? "bg-white/25" : "bg-white text-sky-deep"
              )}
            >
              {child.name.charAt(0).toUpperCase()}
            </span>
            {child.name}
          </button>
        );
      })}
      <Link
        href="/dashboard/dzieci"
        className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-cream-dark px-4 py-1.5 text-sm font-bold text-ink-soft transition hover:border-sky hover:text-sky-deep"
      >
        <UserPlus className="h-4 w-4" />
        Dodaj dziecko
      </Link>
    </div>
  );
}

export function NoChildrenHint({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border-2 border-dashed border-cream-dark p-6 text-center">
      <p className="text-sm font-semibold text-ink-soft">{text}</p>
      <Link
        href="/dashboard/dzieci"
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-sky-deep px-5 py-2.5 text-sm font-bold text-white shadow-[0_3px_0_#2a7bb0] transition active:translate-y-0.5"
      >
        <UserPlus className="h-4 w-4" />
        Dodaj dziecko
      </Link>
    </div>
  );
}
