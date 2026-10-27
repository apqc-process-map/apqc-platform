-- Enable governed relationship metadata entry for Editor/Admin users.
-- The trigger validates controlled relationship types and polymorphic endpoints at the database boundary.

create unique index if not exists object_relationships_canonical_unique_idx
  on public.object_relationships(source_type, source_id, target_type, target_id, relationship_type_id);
create index if not exists object_relationships_created_by_idx on public.object_relationships(created_by);

create or replace function public.validate_object_relationship_metadata()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  type_row public.relationship_types%rowtype;
  endpoint_type public.relationship_object_type;
  endpoint_id uuid;
  object_exists boolean;
  actor uuid := (select auth.uid());
begin
  select * into type_row
  from public.relationship_types
  where id = new.relationship_type_id and is_active;

  if not found then
    raise exception 'Relationship type is missing or inactive';
  end if;

  if cardinality(type_row.allowed_source_types) > 0
     and not (new.source_type::text = any(type_row.allowed_source_types)) then
    raise exception 'Source type % is not allowed for relationship type %', new.source_type, type_row.code;
  end if;

  if cardinality(type_row.allowed_target_types) > 0
     and not (new.target_type::text = any(type_row.allowed_target_types)) then
    raise exception 'Target type % is not allowed for relationship type %', new.target_type, type_row.code;
  end if;

  for endpoint_type, endpoint_id in
    select new.source_type, new.source_id
    union all
    select new.target_type, new.target_id
  loop
    object_exists := case endpoint_type
      when 'process' then exists(select 1 from public.processes where id = endpoint_id and archived_at is null)
      when 'document' then exists(select 1 from public.documents where id = endpoint_id and archived_at is null)
      when 'business_object' then exists(select 1 from public.business_objects where id = endpoint_id and is_active)
      when 'system' then exists(select 1 from public.systems where id = endpoint_id and is_active)
      when 'risk' then exists(select 1 from public.risks where id = endpoint_id and is_active)
      when 'kpi' then exists(select 1 from public.kpis where id = endpoint_id and is_active)
      when 'business_role' then exists(select 1 from public.business_roles where id = endpoint_id and is_active)
      when 'finding' then exists(select 1 from public.findings where id = endpoint_id)
      else false
    end;

    if not object_exists then
      raise exception 'Relationship endpoint %:% is missing or inactive', endpoint_type, endpoint_id;
    end if;
  end loop;

  if actor is not null then
    if tg_op = 'INSERT' then
      new.created_by := actor;
    else
      new.created_by := old.created_by;
    end if;
    new.updated_by := actor;

    if new.status = 'verified' then
      if (select public.current_profile_role()) <> 'admin'::public.system_role then
        raise exception 'Only Admin can verify a relationship';
      end if;
      new.verified_by := actor;
    else
      new.verified_by := null;
    end if;
  end if;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists object_relationships_validate_metadata on public.object_relationships;
create trigger object_relationships_validate_metadata
before insert or update on public.object_relationships
for each row execute function public.validate_object_relationship_metadata();

grant insert, update on public.object_relationships to authenticated;

drop policy if exists "editors create proposed relationships" on public.object_relationships;
create policy "editors create proposed relationships"
on public.object_relationships for insert to authenticated
with check (
  (select public.current_profile_role()) = 'editor'::public.system_role
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and status = 'proposed'::public.relationship_status
  and verified_by is null
);

drop policy if exists "admins create relationships" on public.object_relationships;
create policy "admins create relationships"
on public.object_relationships for insert to authenticated
with check (
  (select public.current_profile_role()) = 'admin'::public.system_role
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (
    (status = 'verified'::public.relationship_status and verified_by = (select auth.uid()))
    or (status <> 'verified'::public.relationship_status and verified_by is null)
  )
);

drop policy if exists "editors update own proposed relationships" on public.object_relationships;
create policy "editors update own proposed relationships"
on public.object_relationships for update to authenticated
using (
  (select public.current_profile_role()) = 'editor'::public.system_role
  and created_by = (select auth.uid())
  and status in ('proposed'::public.relationship_status, 'rejected'::public.relationship_status)
)
with check (
  (select public.current_profile_role()) = 'editor'::public.system_role
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and status = 'proposed'::public.relationship_status
  and verified_by is null
);

drop policy if exists "admins update relationships" on public.object_relationships;
create policy "admins update relationships"
on public.object_relationships for update to authenticated
using ((select public.current_profile_role()) = 'admin'::public.system_role)
with check (
  (select public.current_profile_role()) = 'admin'::public.system_role
  and updated_by = (select auth.uid())
  and (
    (status = 'verified'::public.relationship_status and verified_by = (select auth.uid()))
    or (status <> 'verified'::public.relationship_status and verified_by is null)
  )
);
