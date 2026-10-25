"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { PasswordInput } from "@/src/components/ui/password-input";
import { Loader2, Mail, AlertCircle } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const registered = searchParams.get("registered");
    if (registered === "true") {
      setError("Account created successfully! Please sign in.");
    }
  }, [searchParams]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await authClient.signIn.email(
        { email, password },
        {
          onSuccess: () => {
            router.push("/dashboard");
            router.refresh();
          },
          onError: (ctx) => {
            setError(ctx.error.message || "Invalid credentials. Please try again.");
          },
        }
      );
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
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
            <h1 className="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
            <p className="text-sm text-zinc-400">Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/50 border border-red-800/50 rounded-xl mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p>{error}</p>
            </div>
          )}


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                autoComplete="current-password"
                placeholder="••••••••"
                showToggle={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              />
            </div>

            <Link
              href="#"
              className="text-sm text-blue-400 hover:text-blue-300 transition"
            >
              Forgot password?
            </Link>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 rounded-xl transition"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-zinc-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-blue-400 hover:text-blue-300 font-medium transition">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-950"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>}>
      <SignInForm />
    </Suspense>
  );
}
