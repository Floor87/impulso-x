begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

select has_column('public', 'user_states', 'revision', 'state revision exists');
select has_function(
  'public',
  'save_user_state',
  array['bigint', 'integer', 'jsonb'],
  'atomic state save function exists'
);
select has_table('public', 'legal_acceptances', 'legal acceptance evidence exists');

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '00000000-0000-0000-0000-000000000011',
    'commercial-a@example.test',
    '{"terms_version":"2026-07-27-beta","privacy_version":"2026-07-27-beta"}'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000012',
    'commercial-b@example.test',
    '{"terms_version":"2026-07-27-beta","privacy_version":"2026-07-27-beta"}'::jsonb
  );

select is(
  (
    select count(*)
    from public.legal_acceptances
    where user_id in (
      '00000000-0000-0000-0000-000000000011',
      '00000000-0000-0000-0000-000000000012'
    )
  ),
  2::bigint,
  'signup records one immutable acceptance per account'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000011', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000011","role":"authenticated"}',
  true
);

select results_eq(
  $$select saved, revision from public.save_user_state(0, 4, '{"owner":"a"}'::jsonb)$$,
  $$values (true, 1::bigint)$$,
  'first atomic save creates revision one'
);

select results_eq(
  $$select saved, revision from public.save_user_state(0, 4, '{"owner":"stale"}'::jsonb)$$,
  $$values (false, 1::bigint)$$,
  'stale atomic save is rejected'
);

select is(
  (
    select state ->> 'owner'
    from public.user_states
    where user_id = '00000000-0000-0000-0000-000000000011'
  ),
  'a',
  'rejected save does not overwrite state'
);

select is(
  (select count(*) from public.legal_acceptances),
  1::bigint,
  'a user reads only their own legal acceptance'
);

select is(
  has_table_privilege('authenticated', 'public.legal_acceptances', 'INSERT'),
  false,
  'authenticated users cannot forge legal evidence'
);

reset role;

select is(
  (select public from storage.buckets where id = 'profile-avatars'),
  false,
  'profile avatar bucket is private'
);

select is(
  (
    select count(*)
    from pg_catalog.pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname like 'users_%_own_profile_avatar'
  ),
  4::bigint,
  'profile avatar bucket has select, insert, update and delete policies'
);

select * from finish();

rollback;
