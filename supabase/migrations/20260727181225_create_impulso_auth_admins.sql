create table if not exists public.impulso_auth_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.impulso_auth_admins enable row level security;
revoke all on table public.impulso_auth_admins from anon, authenticated;
