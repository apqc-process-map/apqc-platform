-- Give every active demo account document/process editing capability while
-- retaining the three Admin accounts required for approval and governance.
do $$
declare
  target_names constant text[] := array['linhdoan', 'tuanhpham', 'nhatle'];
  matched_count integer;
begin
  select count(*) into matched_count
  from public.profiles
  where display_name = any(target_names)
    and is_active;

  if matched_count <> cardinality(target_names) then
    raise exception 'Expected % active profiles, found %', cardinality(target_names), matched_count;
  end if;

  update public.profiles
  set role = 'editor'
  where display_name = any(target_names)
    and is_active
    and role = 'viewer';
end
$$;