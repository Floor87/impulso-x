create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table public.user_states (
  user_id uuid primary key references auth.users (id) on delete cascade,
  schema_version integer not null check (schema_version > 0),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint user_states_state_size check (pg_column_size(state) <= 1048576)
);

comment on table public.user_states is
  'Versioned IMPULSOX state document owned by one authenticated user.';
comment on column public.user_states.schema_version is
  'Version used by application state migrations.';

alter table public.user_states enable row level security;
alter table public.user_states force row level security;

revoke all on table public.user_states from public, anon;
grant select, insert, update, delete on table public.user_states to authenticated;

create policy "users_select_own_state"
on public.user_states
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "users_insert_own_state"
on public.user_states
for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "users_update_own_state"
on public.user_states
for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "users_delete_own_state"
on public.user_states
for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger set_user_states_updated_at
before update on public.user_states
for each row execute function private.set_updated_at();
