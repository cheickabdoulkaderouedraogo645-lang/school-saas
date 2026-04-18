"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState("");

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*");
    setClasses(data || []);
  };

  const addClass = async () => {
    if (!name.trim()) return;

    await supabase.from("classes").insert({ name });

    setName("");
    fetchClasses();
  };

  const deleteClass = async (id: string) => {
    if (!confirm("Supprimer cette classe ?")) return;

    await supabase.from("classes").delete().eq("id", id);
    fetchClasses();
  };

  return (
    <main>
      <h1 className="text-2xl font-bold mb-6">Classes</h1>

      {/* FORM */}
      <div className="flex gap-2 mb-6">
        <input
          placeholder="Nom classe"
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <button
          onClick={addClass}
          className="bg-white text-black px-4 rounded"
        >
          Ajouter
        </button>
      </div>

      {/* LIST */}
      <div className="border border-gray-700 rounded bg-gray-900 overflow-hidden">
        <ul>
          {classes.map((c) => (
            <li
              key={c.id}
              className="flex justify-between items-center border-b border-gray-700 p-3 hover:bg-gray-800"
            >
              <span>{c.name}</span>

              <button
                onClick={() => deleteClass(c.id)}
                className="bg-red-500 px-3 py-1 rounded"
              >
                Delete
              </button>
            </li>
          ))}

          {classes.length === 0 && (
            <li className="p-4 text-center text-gray-400">
              Aucune classe
            </li>
          )}
        </ul>
      </div>
    </main>
  );
}