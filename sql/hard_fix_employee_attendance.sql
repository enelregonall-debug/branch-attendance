-- KATRINAS DIGITAL ATTENDANCE HARD FIX
-- Run this once in Supabase SQL Editor.
-- Purpose: employee phone reads branch + employee roster through a SECURITY DEFINER RPC,
-- so normal employee attendance does not depend on anon SELECT policies.

create or replace function public.employee_get_roster(p_branch_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch jsonb;
  v_employees jsonb;
begin
  select jsonb_build_object(
    'id', b.id,
    'name', b.name,
    'latitude', b.latitude,
    'longitude', b.longitude,
    'radius_m', b.radius_m
  )
  into v_branch
  from public.branches b
  where b.id = p_branch_id;

  if v_branch is null then
    raise exception 'Branch could not be verified.';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'employee_code', e.employee_code,
      'full_name', e.full_name,
      'position', e.position,
      'branch_id', e.branch_id,
      'active', e.active
    )
    order by e.full_name
  ), '[]'::jsonb)
  into v_employees
  from public.employees e
  where e.active = true
    and (e.branch_id = p_branch_id or e.branch_id is null);

  return jsonb_build_object(
    'branch', v_branch,
    'employees', v_employees
  );
end;
$$;

revoke all on function public.employee_get_roster(bigint) from public;
grant execute on function public.employee_get_roster(bigint) to anon, authenticated;
