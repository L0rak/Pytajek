"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PasswordInput } from "@/src/components/ui/password-input";
import {
  Loader2,
  Eye,
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
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < strength.level
                ? strength.colorClass[i]
                : "bg-zinc-700"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-xs transition-colors ${
          strength.label === "Weak"
            ? "text-red-400"
            : strength.label === "Fair"
            ? "text-yellow-400"
            : strength.label === "Good"
            ? "text-blue-400"
            : "text-green-400"
        }`}
      >
        {strength.label} password
      </p>
    </div>
  );
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-red-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  return {
    level: score,
    label: levels[score],
    colorClass: colors,
  };
}

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
        setError("Please agree to the terms and conditions.");
        return;
      }

      if (passwordsDontMatch) {
        setError("Passwords do not match.");
        return;
      }

      setIsLoading(true);

      try {
        const res = await authClient.signUp.email(
          {
            name,
            email,
            password,
          },
          {
            onSuccess: () => {
              setSuccess(true);
              router.push("/sign-in?registered=true");
            },
            onError: (ctx) => {
              setError(
                ctx.error.message ||
                  "Failed to create account. Email may already be in use."
              );
            },
          }
        );
      } catch {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [name, email, password, confirmPassword, agreedToTerms, passwordsDontMatch, router]
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-white">Pytajek</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <div className="space-y-2 mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Create an account
            </h1>
            <p className="text-sm text-zinc-400">
              Get your child started on pytajek
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/50 border border-red-800/50 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-400 bg-green-950/50 border border-green-800/50 rounded-xl mb-6">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p>Account created! Redirecting to sign in...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-zinc-200 text-sm font-medium">
                Full Name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-200 text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-200 text-sm font-medium">
                Password
              </Label>
              <PasswordInput
                id="password"
                name="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                showToggle={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
              {password && <PasswordStrength password={password} />}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="confirmPassword"
                className="text-zinc-200 text-sm font-medium"
              >
                Confirm Password
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                showToggle={showConfirm}
                onToggle={() => setShowConfirm(!showConfirm)}
                className={`bg-zinc-800/50 text-white placeholder:text-zinc-500 focus:ring-2 focus:border-transparent ${
                  passwordsDontMatch
                    ? "border-red-700 focus:ring-red-500/50 focus:border-red-500"
                    : passwordsMatch
                    ? "border-green-700 focus:ring-green-500/50 focus:border-green-500"
                    : "border-zinc-700 focus:ring-blue-500/50 focus:border-blue-500"
                }`}
              />
              {confirmPassword && (
                <p
                  className={`text-xs flex items-center gap-1 ${
                    passwordsDontMatch ? "text-red-400" : "text-green-400"
                  }`}
                >
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Passwords match
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3" /> Passwords don&apos;t match
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-blue-600 focus:ring-blue-500/50"
              />
              <label
                htmlFor="terms"
                className="text-sm text-zinc-400 leading-relaxed"
              >
                I agree to the{" "}
                <Link
                  href="#"
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="#"
                  className="text-blue-400 hover:text-blue-300 transition"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 rounded-xl transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-blue-400 hover:text-blue-300 font-medium transition"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
