"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "DB" },
  { href: "/students", label: "Students", icon: "ST" },
  { href: "/classes", label: "Classes", icon: "CL" },
  { href: "/notes", label: "Notes", icon: "NT" },
];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 border-r border-gray-800 bg-gray-950/70 p-6 md:block">
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
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-4 border-t border-gray-800 bg-gray-950 p-2 md:hidden">
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