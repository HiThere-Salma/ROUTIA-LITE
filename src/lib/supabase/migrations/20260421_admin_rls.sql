-- Enforce role-based access on public.admin so only super admins can manage admins.

alter table if exists public.admin enable row level security;

-- Helper used by policies to check super-admin role of current authenticated user.
create or replace function public.is_super_admin(_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin a
    where a.id = _uid
      and coalesce(a.issuper, false) = true
  );
$$;

revoke all on function public.is_super_admin(uuid) from public;
grant execute on function public.is_super_admin(uuid) to authenticated;

-- Clean up previous policies if this migration is re-applied.
drop policy if exists admin_select_own on public.admin;
drop policy if exists admin_select_super on public.admin;
drop policy if exists admin_insert_super_only on public.admin;
drop policy if exists admin_update_super_only on public.admin;
drop policy if exists admin_delete_super_only on public.admin;

-- Every authenticated admin can read only their own profile.
create policy admin_select_own
on public.admin
for select
to authenticated
using (
  id = auth.uid()
  or email = (auth.jwt() ->> 'email')
);

-- Super admins can list all admin records.
create policy admin_select_super
on public.admin
for select
to authenticated
using (public.is_super_admin(auth.uid()));

-- Only super admins can insert admins, and they cannot create another super admin from client flow.
create policy admin_insert_super_only
on public.admin
for insert
to authenticated
with check (
  public.is_super_admin(auth.uid())
  and coalesce(issuper, false) = false
);

-- Only super admins can update admin records.
create policy admin_update_super_only
on public.admin
for update
to authenticated
using (public.is_super_admin(auth.uid()))
with check (public.is_super_admin(auth.uid()));

-- Only super admins can delete admin records.
create policy admin_delete_super_only
on public.admin
for delete
to authenticated
using (public.is_super_admin(auth.uid()));
