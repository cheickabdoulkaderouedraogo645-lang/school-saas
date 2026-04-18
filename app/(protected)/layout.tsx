"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const linkClass = (path: string) =>
    `block p-3 rounded ${
      pathname === path
        ? "bg-blue-600 text-white"
        : "text-gray-300 hover:bg-gray-800"
    }`;

  return (
    <div className="flex min-h-screen">
      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 space-y-2">
        <h2 className="text-xl font-bold mb-4">School SaaS</h2>

        <Link href="/dashboard" className={linkClass("/dashboard")}>
          Dashboard
        </Link>

        <Link href="/classes" className={linkClass("/classes")}>
          Classes
        </Link>

        <Link href="/students" className={linkClass("/students")}>
          Students
        </Link>

        <Link href="/notes" className={linkClass("/notes")}>
          Notes
        </Link>
      </aside>

      {/* CONTENT */}
      <main className="flex-1 bg-black p-6">{children}</main>
    </div>
  );
}