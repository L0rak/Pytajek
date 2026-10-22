"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/src/lib/auth-client";
import { Button } from "@/src/components/ui/button";
import {
  Loader2,
  LogOut,
  User,
  Bell,
  Home,
  BarChart3,
  HelpCircle,
  Moon,
  Sun,
  Menu,
  X,
  Sparkles,
  TrendingUp,
} from "lucide-react";

type NavItem = {
  icon: typeof Home;
  label: string;
  active?: boolean;
  badge?: string;
};


export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; image?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const navItems: NavItem[] = [
    { icon: Home, label: "Overview", active: true },
    { icon: BarChart3, label: "Chats" },
    { icon: User, label: "Children" },
    { icon: HelpCircle, label: "Help & Support" },
  ];


  const fetchUser = useCallback(async () => {
    try {
      const res = await authClient.getSession();
      if (res.data?.user) {
        setUser({
          name: res.data.user.name || "",
          email: res.data.user.email || "",
          image: res.data.user.image || "",
        });
      } else {
        router.push("/sign-in");
      }
    } catch {
      router.push("/sign-in");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/sign-in");
            router.refresh();
          },
        },
      });
    } catch {
      setSigningOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-base">P</span>
              </div>
              <span className="text-lg font-semibold text-white">Pytajek</span>
            </Link>
            <button
              className="lg:hidden text-zinc-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  item.active
                    ? "bg-blue-600/10 text-blue-400"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 h-10"
            >
              {signingOut ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4 mr-2" />
              )}
              {signingOut ? "Signing out..." : "Sign Out"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                className="lg:hidden text-zinc-400 hover:text-white"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-400 hover:text-white hover:bg-zinc-800 relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6">

       
        </div>
      </main>
    </div>
  );
}
