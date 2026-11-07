import { AlertCircle } from "lucide-react";

// Komunikat zamiast nieskończonego kółka ładowania, gdy lista się nie wczytała.
export function LoadError({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl bg-orange-light p-3 text-sm font-semibold text-orange-deep">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p className="flex-1">{text}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="rounded-full bg-white px-4 py-1.5 text-sm font-bold text-ink-soft">
          Spróbuj ponownie
        </button>
      )}
    </div>
  );
}
