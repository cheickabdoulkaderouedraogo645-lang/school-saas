"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type ClassRow = {
  id: string;
  name: string;
};

type StudentRow = {
  id: string;
  name: string;
  class_id: string | null;
  average: number | null;
};

export default function StudentDetailPage() {
  const params = useParams<{ id: string; studentId: string }>();
  const classId = params?.id;
  const studentId = params?.studentId;

  const [classItem, setClassItem] = useState<ClassRow | null>(null);
  const [student, setStudent] = useState<StudentRow | null>(null);
  const [studentName, setStudentName] = useState("");
  const [isEditingStudentName, setIsEditingStudentName] = useState(false);
  const [averageInput, setAverageInput] = useState("");

  const fetchData = async () => {
    if (!classId || !studentId) return;

    const [{ data: classData }, { data: studentData }] = await Promise.all([
      supabase.from("classes").select("id, name").eq("id", classId).maybeSingle(),
      supabase
        .from("students")
        .select("id, name, class_id, average")
        .eq("id", studentId)
        .maybeSingle(),
    ]);

    const typedStudent = (studentData as StudentRow | null) || null;
    setClassItem((classData as ClassRow | null) || null);
    setStudent(typedStudent);
    setStudentName(typedStudent?.name || "");
    setAverageInput(
      typedStudent?.average !== null && typedStudent?.average !== undefined
        ? String(typedStudent.average)
        : "",
    );
  };

  useEffect(() => {
    fetchData();
  }, [classId, studentId]);

  const updateStudentName = async () => {
    if (!studentId || !studentName.trim()) return;

    await supabase
      .from("students")
      .update({ name: studentName.trim() })
      .eq("id", studentId);

    setIsEditingStudentName(false);
    fetchData();
  };

  const updateAverage = async () => {
    if (!studentId) return;

    const trimmedAverage = averageInput.trim();
    if (!trimmedAverage.length) {
      await supabase.from("students").update({ average: null }).eq("id", studentId);
      fetchData();
      return;
    }

    const numericAverage = Number(trimmedAverage);
    if (!Number.isFinite(numericAverage)) return;

    await supabase.from("students").update({ average: numericAverage }).eq("id", studentId);
    fetchData();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">Classe: {classItem?.name || "—"}</p>
          <div className="mt-1 flex items-center gap-2">
            {isEditingStudentName ? (
              <>
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
                />
                <button
                  onClick={updateStudentName}
                  className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-500"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditingStudentName(false);
                    setStudentName(student?.name || "");
                  }}
                  className="rounded bg-gray-700 px-3 py-1 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{student?.name || "Fiche élève"}</h1>
                <button
                  onClick={() => setIsEditingStudentName(true)}
                  className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-500"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
        <Link
          href={`/classes/${classId}`}
          className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
        >
          Retour à la classe
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
        <p className="text-sm text-gray-400">Moyenne</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            step="0.01"
            value={averageInput}
            onChange={(e) => setAverageInput(e.target.value)}
            placeholder="Saisir la moyenne"
            className="w-44 rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <button
            onClick={updateAverage}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
