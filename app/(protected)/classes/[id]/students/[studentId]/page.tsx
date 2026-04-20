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

type AbsenceRow = {
  id: string;
  student_id: string;
  date: string;
  subject: string;
  status: "present" | "absent";
  reason: "maladie" | "exclu" | "sans_motif" | "autre" | null;
  trimestre: number;
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
  const [absences, setAbsences] = useState<AbsenceRow[]>([]);
  const [absenceDate, setAbsenceDate] = useState("");
  const [absenceSubject, setAbsenceSubject] = useState("");
  const [absenceReason, setAbsenceReason] = useState<"maladie" | "exclu" | "sans_motif" | "autre">(
    "sans_motif",
  );
  const [absenceTrimestre, setAbsenceTrimestre] = useState<1 | 2 | 3>(1);

  const fetchData = async () => {
    if (!classId || !studentId) return;

    const [{ data: classData }, { data: studentData }, { data: absencesData }] = await Promise.all([
      supabase.from("classes").select("id, name").eq("id", classId).maybeSingle(),
      supabase
        .from("students")
        .select("id, name, class_id, average")
        .eq("id", studentId)
        .maybeSingle(),
      supabase
        .from("absences")
        .select("id, student_id, date, subject, status, reason, trimestre")
        .eq("student_id", studentId)
        .order("date", { ascending: false }),
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
    setAbsences((absencesData as AbsenceRow[]) || []);
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

  const addAbsence = async () => {
    if (!studentId || !absenceDate || !absenceSubject.trim()) return;

    await supabase.from("absences").insert({
      student_id: studentId,
      date: absenceDate,
      subject: absenceSubject.trim(),
      status: "absent",
      reason: absenceReason,
      trimestre: absenceTrimestre,
    });

    setAbsenceDate("");
    setAbsenceSubject("");
    setAbsenceReason("sans_motif");
    setAbsenceTrimestre(1);
    fetchData();
  };

  const deleteAbsence = async (absenceId: string) => {
    await supabase.from("absences").delete().eq("id", absenceId);
    fetchData();
  };

  const absencesByTrimester = {
    1: absences.filter((absence) => absence.status === "absent" && absence.trimestre === 1).length,
    2: absences.filter((absence) => absence.status === "absent" && absence.trimestre === 2).length,
    3: absences.filter((absence) => absence.status === "absent" && absence.trimestre === 3).length,
  };

  const formatReason = (reason: AbsenceRow["reason"]) => {
    if (!reason) return "—";
    if (reason === "sans_motif") return "Sans motif";
    if (reason === "maladie") return "Maladie";
    if (reason === "exclu") return "Exclu du cours";
    return "Autre";
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

      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="text-lg font-semibold">Absences</h2>

        <div className="mt-4 grid gap-2 md:grid-cols-5">
          <input
            type="date"
            value={absenceDate}
            onChange={(e) => setAbsenceDate(e.target.value)}
            className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Matière"
            value={absenceSubject}
            onChange={(e) => setAbsenceSubject(e.target.value)}
            className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <select
            value={absenceReason}
            onChange={(e) =>
              setAbsenceReason(e.target.value as "maladie" | "exclu" | "sans_motif" | "autre")
            }
            className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="maladie">Maladie</option>
            <option value="exclu">Exclu du cours</option>
            <option value="sans_motif">Sans motif</option>
            <option value="autre">Autre</option>
          </select>
          <select
            value={absenceTrimestre}
            onChange={(e) => setAbsenceTrimestre(Number(e.target.value) as 1 | 2 | 3)}
            className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value={1}>Trimestre 1</option>
            <option value={2}>Trimestre 2</option>
            <option value={3}>Trimestre 3</option>
          </select>
          <button
            onClick={addAbsence}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Ajouter
          </button>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          <div className="rounded-md bg-gray-800 px-3 py-2 text-sm text-gray-200">
            Absences T1: <span className="font-semibold text-white">{absencesByTrimester[1]}</span>
          </div>
          <div className="rounded-md bg-gray-800 px-3 py-2 text-sm text-gray-200">
            Absences T2: <span className="font-semibold text-white">{absencesByTrimester[2]}</span>
          </div>
          <div className="rounded-md bg-gray-800 px-3 py-2 text-sm text-gray-200">
            Absences T3: <span className="font-semibold text-white">{absencesByTrimester[3]}</span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-700 bg-gray-900">
        <table className="w-full">
          <thead className="text-white" style={{ backgroundColor: "#2563eb" }}>
            <tr>
              <th className="p-3 text-left">Date</th>
              <th className="p-3 text-left">Matière</th>
              <th className="p-3 text-left">Motif</th>
              <th className="p-3 text-left">Trimestre</th>
              <th className="p-3 text-right">Supprimer</th>
            </tr>
          </thead>
          <tbody>
            {absences.map((absence) => (
              <tr key={absence.id} className="border-t border-gray-700 hover:bg-gray-800">
                <td className="p-3">{absence.date}</td>
                <td className="p-3">{absence.subject}</td>
                <td className="p-3">{formatReason(absence.reason)}</td>
                <td className="p-3">T{absence.trimestre}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => deleteAbsence(absence.id)}
                    className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {absences.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-400">
                  Aucune absence enregistrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
