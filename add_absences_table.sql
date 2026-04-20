create extension if not exists "pgcrypto";

create table if not exists public.absences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  subject text not null,
  status text not null check (status in ('present', 'absent')),
  reason text null check (reason in ('maladie', 'exclu', 'sans_motif', 'autre') or reason is null),
  trimestre int not null check (trimestre in (1, 2, 3)),
  created_at timestamp with time zone not null default now()
);

create index if not exists absences_student_id_idx on public.absences(student_id);
create index if not exists absences_date_idx on public.absences(date);
