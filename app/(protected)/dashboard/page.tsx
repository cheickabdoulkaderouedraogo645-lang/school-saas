"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [studentsCount, setStudentsCount] = useState(0);
  const [classesCount, setClassesCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  // 🟢 FETCH DATA (optimisé)
  const fetchData = async () => {
    const { count: students } = await supabase
      .from("students")
      .select("*", { count: "exact", head: true });

    const { count: classes } = await supabase
      .from("classes")
      .select("*", { count: "exact", head: true });

    setStudentsCount(students || 0);
    setClassesCount(classes || 0);
  };

  // 🟢 LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <button
          onClick={handleLogout}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500"
        >
          Logout
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Total Students</p>
          <p className="mt-2 text-3xl font-bold">{studentsCount}</p>
          <Link
            href="/students"
            className="mt-4 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Gérer les élèves
          </Link>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Total Classes</p>
          <p className="mt-2 text-3xl font-bold">{classesCount}</p>
          <Link
            href="/classes"
            className="mt-4 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Gérer les classes
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 text-lg font-semibold">Navigation rapide</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/students"
            className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            Students
          </Link>
          <Link
            href="/classes"
            className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            Classes
          </Link>
          <Link
            href="/notes"
            className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            Notes
          </Link>
        </div>
      </div>
    </div>
  );
}