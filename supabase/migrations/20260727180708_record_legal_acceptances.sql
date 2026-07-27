create table public.legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  terms_version text not null check (char_length(terms_version) between 1 and 80),
  privacy_version text not null check (char_length(privacy_version) between 1 and 80),
  accepted_at timestamptz not null default pg_catalog.now(),
  source text not null default 'signup' check (source in ('signup', 'renewal')),
  unique (user_id, terms_version, privacy_version)
);

comment on table public.legal_acceptances is
  'Immutable evidence of the legal versions accepted by an IMPULSOX account.';

alter table public.legal_acceptances enable row level security;
alter table public.legal_acceptances force row level security;

revoke all on table public.legal_acceptances from public, anon, authenticated;
grant select on table public.legal_acceptances to authenticated;

create policy "users_select_own_legal_acceptances"
on public.legal_acceptances
for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create function private.record_signup_legal_acceptance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  accepted_terms text := new.raw_user_meta_data ->> 'terms_version';
  accepted_privacy text := new.raw_user_meta_data ->> 'privacy_version';
begin
  if accepted_terms is null or accepted_privacy is null then
    return new;
  end if;

  insert into public.legal_acceptances (
    user_id,
    terms_version,
    privacy_version,
    accepted_at,
    source
  )
  values (
    new.id,
    left(accepted_terms, 80),
    left(accepted_privacy, 80),
    pg_catalog.now(),
    'signup'
  )
  on conflict (user_id, terms_version, privacy_version) do nothing;

  return new;
end;
$$;

revoke all on function private.record_signup_legal_acceptance()
from public, anon, authenticated;

create trigger record_signup_legal_acceptance
after insert on auth.users
for each row execute function private.record_signup_legal_acceptance();
