alter table public.user_states
add column revision bigint not null default 0
check (revision >= 0);

comment on column public.user_states.revision is
  'Monotonic revision used to reject stale writes from another device.';

create function private.enforce_next_user_state_revision()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.revision <> old.revision + 1 then
    raise check_violation using message = 'State revision must advance exactly once';
  end if;
  return new;
end;
$$;

revoke all on function private.enforce_next_user_state_revision()
from public, anon, authenticated;

create trigger enforce_next_user_state_revision
before update on public.user_states
for each row execute function private.enforce_next_user_state_revision();

create function public.save_user_state(
  p_expected_revision bigint,
  p_schema_version integer,
  p_state jsonb
)
returns table (
  saved boolean,
  revision bigint,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  saved_row public.user_states%rowtype;
  current_revision bigint;
  current_updated_at timestamptz;
begin
  if current_user_id is null then
    raise insufficient_privilege using message = 'Authentication required';
  end if;

  if p_expected_revision < 0 then
    raise check_violation using message = 'Expected revision must be non-negative';
  end if;

  update public.user_states
  set
    schema_version = p_schema_version,
    state = p_state,
    revision = public.user_states.revision + 1
  where user_id = current_user_id
    and public.user_states.revision = p_expected_revision
  returning * into saved_row;

  if found then
    return query
    select true, saved_row.revision, saved_row.updated_at;
    return;
  end if;

  if p_expected_revision = 0 then
    insert into public.user_states (
      user_id,
      schema_version,
      state,
      revision
    )
    values (
      current_user_id,
      p_schema_version,
      p_state,
      1
    )
    on conflict (user_id) do nothing
    returning * into saved_row;

    if found then
      return query
      select true, saved_row.revision, saved_row.updated_at;
      return;
    end if;
  end if;

  select user_states.revision, user_states.updated_at
  into current_revision, current_updated_at
  from public.user_states
  where user_id = current_user_id;

  return query
  select false, coalesce(current_revision, 0), current_updated_at;
end;
$$;

revoke all on function public.save_user_state(bigint, integer, jsonb)
from public, anon;
grant execute on function public.save_user_state(bigint, integer, jsonb)
to authenticated;
