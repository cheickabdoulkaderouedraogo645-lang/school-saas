"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
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
    const { data } = await supabase.from("students").select("*");
    setStudents(data || []);
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

  return (
    <main>
      <h1 className="text-2xl font-bold mb-6">Students</h1>

      {/* FORM */}
      <div className="flex gap-2 mb-6">
        <input
          placeholder="Nom"
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <select
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
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
            className="bg-blue-500 text-white px-4 rounded"
          >
            Save
          </button>
        ) : (
          <button
            onClick={addStudent}
            className="bg-white text-black px-4 rounded"
          >
            Ajouter
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="border border-gray-700 rounded bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="text-white" style={{ backgroundColor: '#93c5fd' }}>
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Classe</th>
              <th className="p-3 text-right w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            {students.map((s) => (
              <tr
                key={s.id}
                className="border-t border-gray-700 hover:bg-gray-800"
              >
                <td className="p-3">{s.name}</td>
                <td className="p-3">
                  {classes.find((c) => c.id === s.class_id)?.name || "—"}
                </td>

                <td className="p-3 text-right w-40">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => startEdit(s)}
                      className="bg-blue-500 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => deleteStudent(s.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}