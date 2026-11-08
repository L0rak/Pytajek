"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import { authErrorMessage } from "@/src/lib/auth-errors";
import { AuthInput } from "@/src/components/auth/AuthInput";
import { ResetOnHide } from "@/src/components/ResetOnHide";
import {
  AUTH_BUTTON_CLASS,
  AUTH_LINK_CLASS,
  AuthAlert,
  AuthShell,
} from "@/src/components/auth/AuthShell";
import {
  Loader2,
  Lock,
  Mail,
  User,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              i < strength.level
                ? strength.colorClass[strength.level]
                : "bg-cream-dark"
            }`}
          />
        ))}
      </div>
      <p className="text-xs font-semibold text-ink-soft">
        Siła hasła: {strength.label}
      </p>
    </div>
  );
}

function getPasswordStrength(password: string) {
  let score = 0;
  // Krótszego hasła serwer nie przyjmie, więc nie może dostać dobrej oceny.
  if (password.length >= 8) {
    score = 1;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
  }

  const levels = ["za krótkie", "słabe", "średnie", "dobre", "silne"];
  const colors = [
    "bg-orange",
    "bg-orange",
    "bg-sun",
    "bg-sky",
    "bg-mint",
  ];

  return {
    level: score,
    label: levels[score],
    colorClass: colors,
  };
}

function SignUpForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const passwordsMatch = confirmPassword && password === confirmPassword;
  const passwordsDontMatch =
    confirmPassword && password !== confirmPassword;

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setSuccess(false);

      if (!agreedToTerms) {
        setError("Zaakceptuj regulamin i politykę prywatności.");
        return;
      }

      if (passwordsDontMatch) {
        setError("Hasła nie są takie same.");
        return;
      }

      setIsLoading(true);

      try {
        await authClient.signUp.email(
          {
            name,
            email,
            password,
          },
          {
            onSuccess: () => {
              setSuccess(true);
              // Better Auth loguje od razu po rejestracji, więc rodzic przechodzi prosto do panelu.
              router.push("/dashboard");
            },
            onError: (ctx) => {
              setError(
                authErrorMessage(
                  ctx.error,
                  "Nie udało się utworzyć konta. Ten e-mail może być już zajęty."
                )
              );
            },
          }
        );
      } catch {
        setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, password, agreedToTerms, passwordsDontMatch, router]
  );

  return (
    <AuthShell>
      <div className="mb-6 space-y-1">
        <h1 className="font-display text-3xl font-semibold text-ink">
          Załóż konto rodzica
        </h1>
        <p className="text-sm text-ink-soft">
          Pozwól dziecku zadawać pytania Pytajkowi
        </p>
      </div>

      {error && (
        <AuthAlert tone="error">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{error}</p>
        </AuthAlert>
      )}

      {success && (
        <AuthAlert tone="success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p>Konto utworzone! Przekierowuję do panelu...</p>
        </AuthAlert>
      )}

      {/* method="post": wysłanie przed załadowaniem JS nie może umieścić hasła w adresie URL. */}
      <form method="post" onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          id="name"
          name="name"
          type="text"
          label="Imię i nazwisko"
          icon={User}
          required
          autoComplete="name"
          placeholder="Jan Kowalski"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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

        <div className="space-y-2">
          <AuthInput
            id="password"
            name="password"
            type="password"
            label="Hasło"
            icon={Lock}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {password && <PasswordStrength password={password} />}
        </div>

        <div className="space-y-2">
          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            label="Powtórz hasło"
            icon={Lock}
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            tone={passwordsDontMatch ? "error" : passwordsMatch ? "success" : "default"}
          />
          {confirmPassword && (
            <p
              className={`flex items-center gap-1 text-xs font-semibold ${
                passwordsDontMatch ? "text-orange-deep" : "text-mint-deep"
              }`}
            >
              {passwordsMatch ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Hasła są takie same
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Hasła nie są takie same
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="terms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded-md accent-orange"
          />
          <label
            htmlFor="terms"
            className="text-sm leading-relaxed text-ink-soft"
          >
            Akceptuję regulamin i politykę prywatności
          </label>
        </div>

        <button type="submit" disabled={isLoading} className={AUTH_BUTTON_CLASS}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Tworzenie konta...
            </>
          ) : (
            "Załóż konto"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Masz już konto?{" "}
        <Link href="/sign-in" className={AUTH_LINK_CLASS}>
          Zaloguj się
        </Link>
      </p>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <ResetOnHide>
      <SignUpForm />
    </ResetOnHide>
  );
}
