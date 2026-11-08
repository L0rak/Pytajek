"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { authClient } from "@/src/lib/auth-client";
import { Loader2, LogOut, User, Home, MessageCircle, Menu, X } from "lucide-react";

type NavItem = {
  icon: typeof Home;
  label: string;
  href: string;
  title: string;
  subtitle: (name?: string) => string;
};

const NAV_ITEMS: NavItem[] = [
  {
    icon: Home,
    label: "Przegląd",
    href: "/dashboard",
    title: "Panel rodzica",
    subtitle: (name) => `Cześć${name ? `, ${name}` : ""}! Tu zarządzasz czasem dzieci z Pytajkiem.`,
  },
  {
    icon: MessageCircle,
    label: "Rozmowy",
    href: "/dashboard/rozmowy",
    title: "Rozmowy",
    subtitle: () => "Zobacz, o co dzieci pytały Pytajka i co odpowiedział.",
  },
  {
    icon: User,
    label: "Dzieci",
    href: "/dashboard/dzieci",
    title: "Dzieci",
    subtitle: () => "Dodaj dzieci do konta, żeby generować dla nich kody.",
  },
];

// Wspólny układ panelu rodzica: menu boczne, nagłówek i sprawdzenie sesji.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, isPending } = authClient.useSession();
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pełne przeładowanie zamiast router.push: panel jest tylko ukrywany przez <Activity>, więc jego stan
  // (signingOut, dane dzieci) dotrwałby do kolejnego logowania, także na inne konto w tej samej karcie.
  useEffect(() => {
    if (!isPending && !session && !signingOut) window.location.replace("/sign-in");
  }, [isPending, session, signingOut]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      // Better Auth zwraca błąd serwera w `error` zamiast go rzucać.
      const { error } = await authClient.signOut();
      if (error) {
        setSigningOut(false);
        return;
      }
      window.location.replace("/sign-in");
    } catch {
      setSigningOut(false);
    }
  };

  // Brak sesji (po wczytaniu) = przekierowanie na logowanie, nie pokazujemy panelu.
  if (!isPending && !session) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange animate-spin" />
      </div>
    );
  }

  // Szkielet panelu renderuje się od razu; tylko dane rodzica czekają na sesję.
  const user = session?.user;
  const current = NAV_ITEMS.find((item) => item.href === pathname) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-cream text-ink flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky lg:top-0 lg:h-screen inset-y-0 left-0 z-50 w-72 p-4 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full rounded-[2rem] bg-white shadow-soft">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 pt-7 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-sun to-orange rounded-2xl flex items-center justify-center shadow-[0_4px_0_var(--color-orange-deep)]">
                <span className="font-display text-white font-semibold text-xl">P</span>
              </div>
              <span className="font-display text-2xl font-semibold text-ink">Pytajek</span>
            </div>
            <button
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center text-ink-soft hover:bg-cream-dark"
              onClick={() => setSidebarOpen(false)}
              aria-label="Zamknij menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const active = item.href === current.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[15px] font-semibold transition ${
                    active
                      ? "bg-sky-light text-sky-deep"
                      : "text-ink-soft hover:text-ink hover:bg-cream"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1 text-left">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="m-4 p-4 rounded-3xl bg-cream">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-mint to-sky flex items-center justify-center text-white font-bold text-lg">
                {user?.name?.charAt(0).toUpperCase() || ""}
              </div>
              <div className="flex-1 min-w-0">
                {user ? (
                  <>
                    <p className="text-sm font-bold text-ink truncate">
                      {user.name || "Rodzic"}
                    </p>
                    <p className="text-xs text-ink-soft truncate">
                      {user.email}
                    </p>
                  </>
                ) : (
                  <div className="space-y-1.5" aria-hidden>
                    <div className="h-3.5 w-20 rounded-full bg-cream-dark" />
                    <div className="h-3 w-32 rounded-full bg-cream-dark" />
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full h-10 flex items-center justify-center rounded-full bg-white text-sm font-semibold text-ink-soft shadow-soft transition hover:text-ink disabled:opacity-60"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {signingOut ? "Wylogowywanie..." : "Wyloguj się"}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-cream/85 backdrop-blur-lg">
          <div className="flex items-center gap-4 px-6 lg:px-10 pt-8 pb-4">
            <button
              className="lg:hidden w-10 h-10 shrink-0 rounded-full bg-white shadow-soft flex items-center justify-center text-ink-soft"
              onClick={() => setSidebarOpen(true)}
              aria-label="Otwórz menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">{current.title}</h1>
              <p className="text-sm text-ink-soft">{current.subtitle(user?.name)}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 px-6 lg:px-10 pb-10 pt-2">{children}</div>
      </main>
    </div>
  );
}
