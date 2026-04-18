"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

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
    <main className="p-10">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>

      {/* STATS */}
      <div className="flex gap-6">
        <div className="border p-4 rounded w-40">
          <h2>Élèves</h2>
          <p className="text-2xl font-bold">{studentsCount}</p>
        </div>

        <div className="border p-4 rounded w-40">
          <h2>Classes</h2>
          <p className="text-2xl font-bold">{classesCount}</p>
        </div>
      </div>
    </main>
  );
}