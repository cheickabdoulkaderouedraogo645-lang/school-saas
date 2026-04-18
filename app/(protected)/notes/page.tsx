"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

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
    <main>
      <h1 className="text-2xl font-bold mb-6">Notes</h1>

      {/* FORM */}
      <div className="flex gap-2 mb-6">
        <select
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
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
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />

        <input
          placeholder="Note"
          type="number"
          className="border border-gray-700 bg-gray-900 text-white p-2 rounded w-24"
          value={score}
          onChange={(e) => setScore(e.target.value)}
        />

        <button
          onClick={addNote}
          className="bg-white text-black px-4 rounded"
        >
          Ajouter
        </button>
      </div>

      {/* FILTER */}
      <select
        className="border border-gray-700 bg-gray-900 text-white p-2 rounded mb-4"
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

      {/* TABLE */}
      <div className="border border-gray-700 rounded bg-gray-900 overflow-hidden">
        <table className="w-full">
          <thead className="text-white" style={{ backgroundColor: '#93c5fd' }}>
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