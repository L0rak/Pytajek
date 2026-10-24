"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";

type AuthInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: string;
  icon?: LucideIcon;
  // Kolor ramki, np. przy porównywaniu haseł.
  tone?: "default" | "error" | "success";
};

const TONE_CLASS = {
  default: "border-cream-dark focus:border-sky focus:ring-sky/25",
  error: "border-orange focus:border-orange focus:ring-orange/25",
  success: "border-mint focus:border-mint focus:ring-mint/25",
};

// Jasne pole formularza dla stron logowania/rejestracji; dla type="password" ma przycisk pokaż/ukryj.
export function AuthInput({ label, icon: Icon, tone = "default", id, type, ...props }: AuthInputProps) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-bold text-ink">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-soft/70" />
        )}
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          className={cn(
            "h-12 w-full rounded-2xl border-2 bg-cream text-base font-semibold text-ink placeholder:font-normal placeholder:text-ink-soft/60 transition focus:bg-white focus:outline-none focus:ring-4",
            Icon ? "pl-12" : "pl-4",
            isPassword ? "pr-12" : "pr-4",
            TONE_CLASS[tone]
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition hover:bg-cream-dark hover:text-ink"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
