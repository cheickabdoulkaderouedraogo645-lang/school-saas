"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function NotesPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const [studentId, setStudentId] = useState("");
  const [subject, setSubject] = useState("");
  const [score, setScore] = useState("");
  const [filterStudent, setFilterStudent] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [filterStudent]);

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*");
    setStudents(data || []);
  };

  const fetchNotes = async () => {
    let query = supabase
      .from("notes")
      .select("id, subject, score, student_id, students(name)");

    if (filterStudent) {
      query = query.eq("student_id", filterStudent);
    }

    const { data } = await query;
    setNotes(data || []);
  };

  const addNote = async () => {
    if (!studentId || !subject || !score) return;

    await supabase.from("notes").insert({
      student_id: studentId,
      subject,
      score: Number(score),
    });

    setStudentId("");
    setSubject("");
    setScore("");
    fetchNotes();
  };

  const deleteNote = async (id: string) => {
    await supabase.from("notes").delete().eq("id", id);
    fetchNotes();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Notes</h1>
        <Link
          href="/students"
          className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
        >
          Voir les élèves
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-gray-800 bg-gray-900 p-3">
        <select
          className="rounded-md border border-gray-700 bg-black p-2 text-white outline-none focus:border-blue-500"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        >
          <option value="">Élève</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Matière"
          className="rounded-md border border-gray-700 bg-black p-2 text-white outline-none focus:border-blue-500"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <input
          placeholder="Note"
          type="number"
          className="w-24 rounded-md border border-gray-700 bg-black p-2 text-white outline-none focus:border-blue-500"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />

        <button
          onClick={addNote}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Add
        </button>
      </div>

      <select
        className="mb-4 rounded-md border border-gray-700 bg-gray-900 p-2 text-white outline-none focus:border-blue-500"
        value={filterStudent}
        onChange={(e) => setFilterStudent(e.target.value)}
      >
        <option value="">Tous les élèves</option>
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <div className="border border-gray-700 rounded bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="text-white" style={{ backgroundColor: "#2563eb" }}>
            <tr>
              <th className="p-3 text-left">Élève</th>
              <th className="p-3 text-left">Matière</th>
              <th className="p-3 text-left">Note</th>
              <th className="p-3 text-right w-40">Actions</th>
            </tr>
          </thead>

          <tbody>
            {notes.map((n) => (
              <tr
                key={n.id}
                className="border-t border-gray-700 hover:bg-gray-800"
              >
                <td className="p-3">{n.students?.name || "—"}</td>
                <td className="p-3">{n.subject}</td>
                <td className="p-3">{n.score}</td>

                <td className="p-3 text-right w-40">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {notes.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  Aucune note trouvée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}