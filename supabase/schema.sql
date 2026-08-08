-- Esquema de FinBot para Supabase.
-- Ejecutar en el SQL Editor del proyecto.

create table if not exists expenses (
  id bigint generated always as identity primary key,
  user_id text not null,
  amount numeric not null check (amount > 0),
  category text not null,
  description text not null default 'gasto',
  created_at timestamptz not null default now()
);

create index if not exists expenses_user_month on expenses (user_id, created_at);

create table if not exists budgets (
  user_id text primary key,
  amount numeric not null check (amount > 0),
  updated_at timestamptz not null default now()
);

-- RLS activado: el bot accede con la service key; ningún acceso anónimo.
alter table expenses enable row level security;
alter table budgets enable row level security;
