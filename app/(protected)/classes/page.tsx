"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

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

  const startEdit = (classItem: any) => {
    setEditingId(classItem.id);
    setName(classItem.name);
  };

  const updateClass = async () => {
    if (!editingId || !name.trim()) return;
    await supabase.from("classes").update({ name }).eq("id", editingId);
    setEditingId(null);
    setName("");
    fetchClasses();
  };

  const deleteClass = async (id: string) => {
    if (!confirm("Supprimer cette classe ?")) return;

    await supabase.from("classes").delete().eq("id", id);
    fetchClasses();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Classes</h1>
        <Link
          href="/students"
          className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
        >
          Voir les élèves
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-gray-800 bg-gray-900 p-3">
        <input
          placeholder="Nom classe"
          className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {editingId ? (
          <button
            onClick={updateClass}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
        ) : (
          <button
            onClick={addClass}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Add
          </button>
        )}
      </div>

      <div className="border border-gray-700 rounded bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="text-white" style={{ backgroundColor: "#2563eb" }}>
            <tr>
              <th className="p-3 text-left">Classe</th>
              <th className="p-3 text-right w-40">Actions</th>
            </tr>
          </thead>
          <tbody>
          {classes.map((c) => (
            <tr
              key={c.id}
              className="border-t border-gray-700 hover:bg-gray-800"
            >
              <td className="p-3">{c.name}</td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteClass(c.id)}
                    className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {classes.length === 0 && (
            <tr>
              <td colSpan={2} className="p-4 text-center text-gray-400">
                Aucune classe
              </td>
            </tr>
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}