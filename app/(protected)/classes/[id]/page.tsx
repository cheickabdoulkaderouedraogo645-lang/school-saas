"use client";

import { useEffect, useMemo, useState } from "react";
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
  student_id: string;
  status: "present" | "absent";
};

type FeeSummaryRow = {
  student_id: string;
  tranche1_amount: number | string | null;
  tranche1_paid: boolean | null;
  tranche2_amount: number | string | null;
  tranche2_paid: boolean | null;
};

type FeeGlobalStatus = "paid" | "partial" | "unpaid" | "none";

const feeNum = (value: number | string | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const computeFeeGlobalStatus = (fees: FeeSummaryRow[]): FeeGlobalStatus => {
  if (!fees.length) return "none";

  let totalSlots = 0;
  let paidSlots = 0;

  for (const fee of fees) {
    const a1 = feeNum(fee.tranche1_amount);
    const a2 = feeNum(fee.tranche2_amount);
    if (a1 > 0) {
      totalSlots += 1;
      if (fee.tranche1_paid === true) paidSlots += 1;
    }
    if (a2 > 0) {
      totalSlots += 1;
      if (fee.tranche2_paid === true) paidSlots += 1;
    }
  }

  if (totalSlots === 0) return "none";
  if (paidSlots === totalSlots) return "paid";
  if (paidSlots === 0) return "unpaid";
  return "partial";
};

const feeStatusLabel: Record<FeeGlobalStatus, string> = {
  paid: "✅ Payé",
  partial: "⚠️ Partiel",
  unpaid: "❌ Non payé",
  none: "—",
};

const getOrdinalRank = (rank: number) => (rank === 1 ? "1er" : `${rank}ème`);

export default function ClassStudentsPage() {
  const params = useParams<{ id: string }>();
  const classId = params?.id;

  const [classItem, setClassItem] = useState<ClassRow | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [absenceCountByStudentId, setAbsenceCountByStudentId] = useState<Record<string, number>>({});
  const [feeStatusByStudentId, setFeeStatusByStudentId] = useState<Record<string, FeeGlobalStatus>>({});
  const [name, setName] = useState("");

  const fetchData = async () => {
    if (!classId) return;

    const [{ data: classData }, { data: studentsData }] = await Promise.all([
      supabase.from("classes").select("id, name").eq("id", classId).maybeSingle(),
      supabase
        .from("students")
        .select("id, name, class_id, average")
        .eq("class_id", classId),
    ]);

    const typedStudents = (studentsData as StudentRow[]) || [];
    setClassItem((classData as ClassRow | null) || null);
    setStudents(typedStudents);

    if (!typedStudents.length) {
      setAbsenceCountByStudentId({});
      setFeeStatusByStudentId({});
      return;
    }

    const studentIds = typedStudents.map((student) => student.id);
    const [{ data: absencesData }, { data: feesData }] = await Promise.all([
      supabase
        .from("absences")
        .select("student_id, status")
        .in("student_id", studentIds)
        .eq("status", "absent"),
      supabase
        .from("fees")
        .select("student_id, tranche1_amount, tranche1_paid, tranche2_amount, tranche2_paid")
        .in("student_id", studentIds),
    ]);

    const typedAbsences = (absencesData as AbsenceRow[]) || [];
    const absenceCounts = typedAbsences.reduce<Record<string, number>>((acc, absence) => {
      acc[absence.student_id] = (acc[absence.student_id] || 0) + 1;
      return acc;
    }, {});

    setAbsenceCountByStudentId(absenceCounts);

    const typedFees = (feesData as FeeSummaryRow[]) || [];
    const feesByStudent = typedFees.reduce<Record<string, FeeSummaryRow[]>>((acc, fee) => {
      if (!acc[fee.student_id]) acc[fee.student_id] = [];
      acc[fee.student_id].push(fee);
      return acc;
    }, {});

    const feeStatuses = studentIds.reduce<Record<string, FeeGlobalStatus>>((acc, id) => {
      acc[id] = computeFeeGlobalStatus(feesByStudent[id] || []);
      return acc;
    }, {});

    setFeeStatusByStudentId(feeStatuses);
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const rankedStudents = useMemo(() => {
    const sorted = [...students].sort((a, b) => (b.average ?? -1) - (a.average ?? -1));

    return sorted.map((student, index) => ({
      ...student,
      rank: index + 1,
    }));
  }, [students]);

  const addStudent = async () => {
    if (!classId || !name.trim()) return;

    await supabase.from("students").insert({
      name: name.trim(),
      class_id: classId,
    });

    setName("");
    fetchData();
  };

  const deleteStudent = async (studentId: string) => {
    await supabase.from("students").delete().eq("id", studentId);
    fetchData();
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-400">Classe</p>
          <h1 className="text-2xl font-bold">{classItem?.name || "Classe inconnue"}</h1>
        </div>
        <Link
          href="/classes"
          className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
        >
          Retour aux classes
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 rounded-lg border border-gray-800 bg-gray-900 p-3">
        <input
          placeholder="Nom de l'élève"
          className="rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          onClick={addStudent}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Ajouter un élève
        </button>
      </div>

      <div className="overflow-hidden rounded border border-gray-700 bg-gray-900">
        <table className="w-full">
          <thead className="text-white" style={{ backgroundColor: "#2563eb" }}>
            <tr>
              <th className="p-3 text-left">Nom</th>
              <th className="p-3 text-left">Moyenne</th>
              <th className="p-3 text-left">Absences</th>
              <th className="p-3 text-left">Frais</th>
              <th className="p-3 text-left">Rang</th>
              <th className="p-3 text-right w-56">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rankedStudents.map((student) => (
              <tr key={student.id} className="border-t border-gray-700 hover:bg-gray-800">
                <td className="p-3">
                  <Link
                    href={`/classes/${classId}/students/${student.id}`}
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    {student.name}
                  </Link>
                </td>
                <td className="p-3">
                  {student.average !== null ? student.average.toFixed(2) : "—"}
                </td>
                <td className="p-3">{absenceCountByStudentId[student.id] || 0}</td>
                <td className="p-3 text-sm">
                  {feeStatusLabel[feeStatusByStudentId[student.id] || "none"]}
                </td>
                <td className="p-3">{getOrdinalRank(student.rank)}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/classes/${classId}/students/${student.id}`}
                      className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-500"
                    >
                      Fiche élève
                    </Link>
                    <button
                      onClick={() => deleteStudent(student.id)}
                      className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rankedStudents.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-400">
                  Aucun élève dans cette classe.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
