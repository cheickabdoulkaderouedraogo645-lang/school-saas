"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";

type ClassRow = {
  id: string;
  name: string;
};

type StudentRow = {
  class_id: string | null;
};

type StudentsPerClass = {
  classId: string;
  className: string;
  studentsCount: number;
};

export default function Dashboard() {
  const [studentsCount, setStudentsCount] = useState(0);
  const [classesCount, setClassesCount] = useState(0);
  const [studentsPerClass, setStudentsPerClass] = useState<StudentsPerClass[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  // 🟢 FETCH DATA
  const fetchData = async () => {
    const [
      { count: students },
      { count: classes },
      { data: classesData },
      { data: studentsData },
    ] = await Promise.all([
      supabase.from("students").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("*", { count: "exact", head: true }),
      supabase.from("classes").select("id, name").order("name", { ascending: true }),
      supabase.from("students").select("class_id"),
    ]);

    setStudentsCount(students || 0);
    setClassesCount(classes || 0);

    const typedClasses = (classesData as ClassRow[]) || [];
    const typedStudents = (studentsData as StudentRow[]) || [];

    const countsByClassId = typedStudents.reduce<Record<string, number>>((acc, student) => {
      if (!student.class_id) return acc;
      acc[student.class_id] = (acc[student.class_id] || 0) + 1;
      return acc;
    }, {});

    const perClass = typedClasses.map((classItem) => ({
      classId: classItem.id,
      className: classItem.name,
      studentsCount: countsByClassId[classItem.id] || 0,
    }));

    setStudentsPerClass(perClass);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Nombre total d&apos;élèves</p>
          <p className="mt-2 text-3xl font-bold">{studentsCount}</p>
          <Link
            href="/classes"
            className="mt-4 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Voir les classes
          </Link>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <p className="text-sm text-gray-400">Nombre total de classes</p>
          <p className="mt-2 text-3xl font-bold">{classesCount}</p>
          <Link
            href="/classes"
            className="mt-4 inline-flex rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Gérer les classes
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-lg font-semibold">Nombre d&apos;élèves par classe</h2>
        <div className="mt-4 space-y-2">
          {studentsPerClass.map((item) => (
            <div
              key={item.classId}
              className="flex items-center justify-between rounded-md bg-gray-800 px-3 py-2"
            >
              <span className="text-sm text-white">{item.className}</span>
              <span className="text-sm font-semibold text-blue-400">{item.studentsCount}</span>
            </div>
          ))}
          {studentsPerClass.length === 0 && (
            <p className="text-sm text-gray-400">Aucune classe disponible.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
        <h2 className="mb-4 text-lg font-semibold">Navigation rapide</h2>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/classes"
            className="rounded-md bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
          >
            Classes
          </Link>
        </div>
      </div>
    </div>
  );
}