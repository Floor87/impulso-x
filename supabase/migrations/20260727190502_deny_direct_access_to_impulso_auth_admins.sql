create policy "deny_direct_access"
on public.impulso_auth_admins
for all
to anon, authenticated
using (false)
with check (false);
