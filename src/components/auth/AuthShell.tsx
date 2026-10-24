import type { ReactNode } from "react";

// Wspólny układ stron logowania i rejestracji rodzica: ciepłe tło, logo (bez linku) i karta.
export function AuthShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-4 py-12 text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-sky/25 blur-3xl" />
        <div className="absolute top-1/4 -right-32 h-96 w-96 rounded-full bg-sun/30 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-96 w-96 rounded-full bg-mint/25 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sun to-orange shadow-[0_4px_0_var(--color-orange-deep)]">
            <span className="font-display text-2xl font-semibold text-white">P</span>
          </div>
          <span className="font-display text-3xl font-semibold text-ink">Pytajek</span>
        </div>

        <div className="rounded-[2rem] bg-white p-8 shadow-lift">{children}</div>

        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </div>
  );
}

export function AuthAlert({ tone, children }: { tone: "error" | "success"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={
        tone === "error"
          ? "mb-6 flex items-center gap-2 rounded-2xl bg-orange-light p-3 text-sm font-semibold text-orange-deep"
          : "mb-6 flex items-center gap-2 rounded-2xl bg-mint-light p-3 text-sm font-semibold text-mint-deep"
      }
    >
      {children}
    </div>
  );
}

export const AUTH_BUTTON_CLASS =
  "flex h-13 w-full items-center justify-center rounded-full bg-orange font-display text-lg font-semibold text-white shadow-[0_4px_0_var(--color-orange-deep)] transition-[transform,box-shadow,filter] duration-100 hover:brightness-105 active:translate-y-1 active:shadow-none disabled:opacity-60";

export const AUTH_LINK_CLASS = "font-bold text-sky-deep transition hover:text-ink";
