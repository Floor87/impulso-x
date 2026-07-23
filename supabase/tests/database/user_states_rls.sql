begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select has_table('public', 'user_states', 'user_states exists');
select is(
  (
    select relrowsecurity and relforcerowsecurity
    from pg_catalog.pg_class
    where oid = 'public.user_states'::regclass
  ),
  true,
  'RLS is enabled and forced'
);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'user-a@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'user-b@example.test');

insert into public.user_states (user_id, schema_version, state)
values
  ('00000000-0000-0000-0000-000000000001', 2, '{"owner":"a"}'::jsonb),
  ('00000000-0000-0000-0000-000000000002', 2, '{"owner":"b"}'::jsonb);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

select results_eq(
  $$select user_id from public.user_states order by user_id$$,
  array['00000000-0000-0000-0000-000000000001'::uuid],
  'user A reads only their state'
);

select lives_ok(
  $$update public.user_states set state = '{"owner":"a","updated":true}' where user_id = '00000000-0000-0000-0000-000000000001'$$,
  'user A can update their state'
);

select lives_ok(
  $$update public.user_states set state = '{"owner":"a"}' where user_id = '00000000-0000-0000-0000-000000000002'$$,
  'updating user B is filtered without leaking the row'
);

select lives_ok(
  $$delete from public.user_states where user_id = '00000000-0000-0000-0000-000000000002'$$,
  'deleting user B is filtered without leaking the row'
);

reset role;

select is(
  (select state ->> 'updated' from public.user_states where user_id = '00000000-0000-0000-0000-000000000001'),
  'true',
  'user A update was persisted'
);

select is(
  (select state ->> 'owner' from public.user_states where user_id = '00000000-0000-0000-0000-000000000002'),
  'b',
  'user B state was not changed or deleted by user A'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000002","role":"authenticated"}',
  true
);

select results_eq(
  $$select state ->> 'owner' from public.user_states$$,
  array['b'::text],
  'user B reads only their state'
);

select throws_ok(
  $$insert into public.user_states (user_id, schema_version, state) values ('00000000-0000-0000-0000-000000000003', 2, '{}'::jsonb)$$,
  '42501',
  'new row violates row-level security policy for table "user_states"',
  'user B cannot create state for another user'
);

select * from finish();

rollback;
