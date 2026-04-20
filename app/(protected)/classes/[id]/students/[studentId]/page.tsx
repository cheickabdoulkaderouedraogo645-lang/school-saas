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

type FeeRow = {
  id: string;
  student_id: string;
  academic_year: string;
  total_amount: number | string | null;
  tranche1_amount: number | string | null;
  tranche1_paid: boolean;
  tranche1_date: string | null;
  tranche2_amount: number | string | null;
  tranche2_paid: boolean;
  tranche2_date: string | null;
  note: string | null;
};

const num = (value: number | string | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const computeRemaining = (fee: FeeRow) => {
  let remaining = 0;
  if (fee.tranche1_paid !== true) remaining += num(fee.tranche1_amount);
  if (fee.tranche2_paid !== true) remaining += num(fee.tranche2_amount);
  return remaining;
};

const formatTrancheCell = (
  amount: number | string | null,
  paid: boolean,
  date: string | null,
) => {
  const a = num(amount);
  const status = paid ? "Payé" : "Non payé";
  const datePart = paid && date ? ` · ${date}` : "";
  return `${a.toFixed(2)} € — ${status}${datePart}`;
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

  const [fees, setFees] = useState<FeeRow[]>([]);
  const [feeYear, setFeeYear] = useState("");
  const [feeTotal, setFeeTotal] = useState("");
  const [feeT1Amount, setFeeT1Amount] = useState("");
  const [feeT1Paid, setFeeT1Paid] = useState(false);
  const [feeT1Date, setFeeT1Date] = useState("");
  const [feeT2Amount, setFeeT2Amount] = useState("");
  const [feeT2Paid, setFeeT2Paid] = useState(false);
  const [feeT2Date, setFeeT2Date] = useState("");
  const [feeNote, setFeeNote] = useState("");

  const fetchData = async () => {
    if (!classId || !studentId) return;

    const [{ data: classData }, { data: studentData }, { data: absencesData }, { data: feesData }] =
      await Promise.all([
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
      supabase
        .from("fees")
        .select(
          "id, student_id, academic_year, total_amount, tranche1_amount, tranche1_paid, tranche1_date, tranche2_amount, tranche2_paid, tranche2_date, note",
        )
        .eq("student_id", studentId)
        .order("academic_year", { ascending: false }),
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
    setFees((feesData as FeeRow[]) || []);
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

  const saveFee = async () => {
    if (!studentId || !feeYear.trim() || !feeTotal.trim()) return;

    const totalAmount = Number(feeTotal);
    const t1 = Number(feeT1Amount);
    const t2 = Number(feeT2Amount);
    if (!Number.isFinite(totalAmount) || !Number.isFinite(t1) || !Number.isFinite(t2)) return;

    await supabase.from("fees").insert({
      student_id: studentId,
      academic_year: feeYear.trim(),
      total_amount: totalAmount,
      tranche1_amount: t1,
      tranche1_paid: feeT1Paid,
      tranche1_date: feeT1Paid && feeT1Date ? feeT1Date : null,
      tranche2_amount: t2,
      tranche2_paid: feeT2Paid,
      tranche2_date: feeT2Paid && feeT2Date ? feeT2Date : null,
      note: feeNote.trim() || null,
    });

    setFeeYear("");
    setFeeTotal("");
    setFeeT1Amount("");
    setFeeT1Paid(false);
    setFeeT1Date("");
    setFeeT2Amount("");
    setFeeT2Paid(false);
    setFeeT2Date("");
    setFeeNote("");
    fetchData();
  };

  const deleteFee = async (feeId: string) => {
    await supabase.from("fees").delete().eq("id", feeId);
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

      <div className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h2 className="text-lg font-semibold">Frais Scolaires</h2>

        <div className="mt-4 space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-gray-400">Année scolaire</p>
              <input
                type="text"
                placeholder="ex: 2024-2025"
                value={feeYear}
                onChange={(e) => setFeeYear(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <p className="mb-1 text-xs text-gray-400">Montant total annuel (€)</p>
              <input
                type="number"
                step="0.01"
                value={feeTotal}
                onChange={(e) => setFeeTotal(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-gray-800 bg-gray-950/50 p-3">
              <p className="mb-2 text-sm font-medium text-gray-300">Tranche 1</p>
              <div className="space-y-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Montant (€)"
                  value={feeT1Amount}
                  onChange={(e) => setFeeT1Amount(e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
                />
                <select
                  value={feeT1Paid ? "paid" : "unpaid"}
                  onChange={(e) => setFeeT1Paid(e.target.value === "paid")}
                  className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="unpaid">Non payé</option>
                  <option value="paid">Payé</option>
                </select>
                <input
                  type="date"
                  disabled={!feeT1Paid}
                  value={feeT1Date}
                  onChange={(e) => setFeeT1Date(e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
            <div className="rounded-md border border-gray-800 bg-gray-950/50 p-3">
              <p className="mb-2 text-sm font-medium text-gray-300">Tranche 2</p>
              <div className="space-y-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Montant (€)"
                  value={feeT2Amount}
                  onChange={(e) => setFeeT2Amount(e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
                />
                <select
                  value={feeT2Paid ? "paid" : "unpaid"}
                  onChange={(e) => setFeeT2Paid(e.target.value === "paid")}
                  className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="unpaid">Non payé</option>
                  <option value="paid">Payé</option>
                </select>
                <input
                  type="date"
                  disabled={!feeT2Paid}
                  value={feeT2Date}
                  onChange={(e) => setFeeT2Date(e.target.value)}
                  className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-gray-400">Remarque (optionnel)</p>
            <input
              type="text"
              value={feeNote}
              onChange={(e) => setFeeNote(e.target.value)}
              className="w-full rounded-md border border-gray-700 bg-black px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={saveFee}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded border border-gray-700 bg-gray-900">
        <table className="w-full">
          <thead className="text-white" style={{ backgroundColor: "#2563eb" }}>
            <tr>
              <th className="p-3 text-left">Année</th>
              <th className="p-3 text-left">Total</th>
              <th className="p-3 text-left">Tranche 1</th>
              <th className="p-3 text-left">Tranche 2</th>
              <th className="p-3 text-left">Reste à payer</th>
              <th className="p-3 text-left">Remarque</th>
              <th className="p-3 text-right">Supprimer</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((fee) => (
              <tr key={fee.id} className="border-t border-gray-700 hover:bg-gray-800">
                <td className="p-3">{fee.academic_year}</td>
                <td className="p-3">{num(fee.total_amount).toFixed(2)} €</td>
                <td className="p-3 text-sm">
                  {formatTrancheCell(
                    fee.tranche1_amount,
                    fee.tranche1_paid === true,
                    fee.tranche1_date,
                  )}
                </td>
                <td className="p-3 text-sm">
                  {formatTrancheCell(
                    fee.tranche2_amount,
                    fee.tranche2_paid === true,
                    fee.tranche2_date,
                  )}
                </td>
                <td className="p-3 font-medium">{computeRemaining(fee).toFixed(2)} €</td>
                <td className="p-3 text-sm text-gray-300">{fee.note || "—"}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => deleteFee(fee.id)}
                    className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-500"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {fees.length === 0 && (
              <tr>
                <td colSpan={7} className="p-4 text-center text-gray-400">
                  Aucun frais enregistré.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
