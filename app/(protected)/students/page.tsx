"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type StudentRow = {
  id: string;
  name: string;
  class_id: string | null;
};

const getOrdinalRank = (rank: number) => (rank === 1 ? "1er" : `${rank}ème`);

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [classId, setClassId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*");
    setClasses(data || []);
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("id, name, class_id");
    setStudents((data as StudentRow[]) || []);
  };

  const addStudent = async () => {
    if (!name.trim()) return;

    await supabase.from("students").insert({
      name,
      class_id: classId || null,
    });

    setName("");
    setClassId("");
    fetchStudents();
  };

  const deleteStudent = async (id: string) => {
    await supabase.from("students").delete().eq("id", id);
    fetchStudents();
  };

  const startEdit = (student: any) => {
    setEditingId(student.id);
    setName(student.name);
    setClassId(student.class_id || "");
  };

  const updateStudent = async () => {
    if (!editingId) return;

    await supabase
      .from("students")
      .update({
        name,
        class_id: classId || null,
      })
      .eq("id", editingId);

    setEditingId(null);
    setName("");
    setClassId("");
    fetchStudents();
  };

  const rankedStudents = useMemo(() => {
    return students.map((student, index) => ({
      ...student,
      average: null,
      rank: index + 1,
    }));
  }, [students]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Students</h1>
        <Link
          href="/classes"
          className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
        >
          Voir les classes
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-gray-800 bg-gray-900 p-3">
        <input
          placeholder="Nom"
          className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
        >
          <option value="">Classe</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        {editingId ? (
          <button
            onClick={updateStudent}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Save
          </button>
        ) : (
          <button
            onClick={addStudent}
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
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Classe</th>
              <th className="p-3 text-left">Moyenne</th>
              <th className="p-3 text-left">Rang</th>
              <th className="p-3 text-right w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            {rankedStudents.map((s) => (
              <tr
                key={s.id}
                className="border-t border-gray-700 hover:bg-gray-800"
              >
                <td className="p-3">{s.name}</td>
                <td className="p-3">
                  {classes.find((c) => c.id === s.class_id)?.name || "—"}
                </td>
                <td className="p-3">—</td>
                <td className="p-3">{getOrdinalRank(s.rank)}</td>

                <td className="p-3 text-right w-40">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-500"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteStudent(s.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rankedStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  Aucun élève trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}