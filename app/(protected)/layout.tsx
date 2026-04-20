"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "DB" },
  { href: "/classes", label: "Classes", icon: "CL" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  useEffect(() => {
    let isMounted = true;

    const ensureAuthenticated = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (!data.session) {
        router.replace("/login");
        return;
      }

      setIsCheckingSession(false);
    };

    ensureAuthenticated();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
        return;
      }

      setIsCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-gray-800 bg-gray-950/70 p-6 md:flex">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <span className="text-xs font-bold text-white">SS</span>
            </div>
            <div>
              <p className="text-sm text-gray-400">School SaaS</p>
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition ${
                    active
                      ? "border-blue-500/40 bg-blue-600 text-white"
                      : "border-transparent text-gray-300 hover:border-gray-700 hover:bg-gray-900"
                  }`}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-black/20 text-[10px] font-semibold">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto rounded-lg border border-red-500/30 bg-red-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-red-500"
          >
            Déconnexion
          </button>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-2 border-t border-gray-800 bg-gray-950 p-2 md:hidden">
        {navItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-md py-1 text-xs ${
                active ? "bg-blue-600 text-white" : "text-gray-300"
              }`}
            >
              <span className="mb-1 text-[10px] font-semibold">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}