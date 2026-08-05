-- 0020  Rename the `sales` staff role to `hire_desk`
--
-- `public.staff_role` was declared in 0001 for a business that sold vehicles.
-- Five of its six values carried over to a hire business unchanged; `sales` did
-- not. XPDX has no sales function — the equivalent job is the hire desk, which
-- works enquiries and moves vans between availability states.
--
-- This is the last live reference to the previous product's vocabulary in an
-- identifier anywhere in the tree (CLAUDE.md §12: "zero references to cars,
-- sales, finance, dealers"). The UI label was changed alongside it, but a label
-- alone would have left `sales` in the database, in the RLS helper's argument
-- lists, and in every audit-log row.
--
-- `alter type ... rename value` rewrites the label in place: existing
-- `admin_roles` rows keep their role, no row is touched, and no policy needs
-- redefining. It is safe whether or not the target project holds data.
--
-- Guarded so it is a no-op on a database where 0001 already declared the value
-- as `hire_desk`, or where this migration has already run.

do $$
begin
  if exists (
    select 1
    from pg_enum e
    join pg_type t on t.oid = e.enumtypid
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'staff_role'
      and e.enumlabel = 'sales'
  ) then
    alter type public.staff_role rename value 'sales' to 'hire_desk';
  end if;
end
$$;
