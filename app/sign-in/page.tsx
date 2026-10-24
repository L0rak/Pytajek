"use client";

import { useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import { authErrorMessage } from "@/src/lib/auth-errors";
import { AuthInput } from "@/src/components/auth/AuthInput";
import {
  AUTH_BUTTON_CLASS,
  AUTH_LINK_CLASS,
  AuthAlert,
  AuthShell,
} from "@/src/components/auth/AuthShell";
import { Loader2, Mail, Lock, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");

  const justRegistered = searchParams.get("registered") === "true";

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => {
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            setError(authErrorMessage(ctx.error, "Nie udało się zalogować. Spróbuj ponownie."));
          },
        }
      );
    } catch {
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <AuthShell
      footer={
        <Link
          href="/kod"
          className="flex items-center justify-center gap-2 rounded-full bg-white/70 px-5 py-3 text-sm font-semibold text-ink-soft shadow-soft transition hover:bg-white hover:text-ink"
        >
          <Sparkles className="h-4 w-4 text-orange" />
          Masz kod dziecka? <span className="font-bold text-sky-deep">Wpisz kod</span>
        </Link>
      }
    >
      <div className="mb-6 space-y-1">
        <h1 className="font-display text-3xl font-semibold text-ink">Witaj ponownie</h1>
        <p className="text-sm text-ink-soft">Zaloguj się, aby zarządzać czasem dzieci</p>
      </div>

      {error ? (
        <AuthAlert tone="error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </AuthAlert>
      ) : (
        justRegistered && (
          <AuthAlert tone="success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <p>Konto zostało utworzone! Teraz możesz się zalogować.</p>
          </AuthAlert>
        )
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          id="email"
          name="email"
          type="email"
          label="E-mail"
          icon={Mail}
          autoComplete="email"
          required
          placeholder="ty@przyklad.pl"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <AuthInput
          id="password"
          name="password"
          type="password"
          label="Hasło"
          icon={Lock}
          required
          autoComplete="current-password"
          placeholder="••••••••"
        />

        <Link href="#" className={`inline-block text-sm ${AUTH_LINK_CLASS}`}>
          Nie pamiętasz hasła?
        </Link>

        <button type="submit" disabled={isLoading} className={AUTH_BUTTON_CLASS}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Logowanie...
            </>
          ) : (
            "Zaloguj się"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Nie masz konta?{" "}
        <Link href="/sign-up" className={AUTH_LINK_CLASS}>
          Zarejestruj się
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-cream"><Loader2 className="w-8 h-8 text-orange animate-spin" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
