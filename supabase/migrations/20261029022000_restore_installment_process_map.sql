-- Restore the installment process landscape against the active controlled APQC framework.
-- Historical mappings and archived documents remain untouched for audit.

do $$
declare
  expected_process_codes constant text[] := array[
    'TG-L0','PNJ-QT-VPBL-BH-BHTG','QTTG.1','QTTG.2','QTTG.3','QTTG.4',
    'QTTG.5','QTTG.6','QTTG.7','QTTG.8','QTTG.9'
  ];
  expected_document_codes constant text[] := array[
    'PNJ-QT-VPBL-BH-BHTG',
    '221-2026-TB-PPTDTKD-NHADTG2026 -PNJ',
    '69-2026-TB-PPTDTKD-QĐTGQTTD– PNJ',
    '495-2025-PVHBL-TNCĐHĐCSTG-PNJ',
    '81-2022-TBHN-BDATG',
    '72-2022-TB-BDATG-TBCSTG-PNJ'
  ];
  actual_count integer;
begin
  select count(*) into actual_count
  from public.processes
  where archived_at is null and process_code = any(expected_process_codes);
  if actual_count <> 11 then
    raise exception 'Expected 11 active installment processes, found %', actual_count;
  end if;

  select count(*) into actual_count
  from public.documents d
  join public.document_versions dv on dv.document_id = d.id
  where d.archived_at is null
    and dv.replaced_at is null
    and d.document_code = any(expected_document_codes);
  if actual_count <> 6 then
    raise exception 'Expected 6 exact active installment document versions, found %', actual_count;
  end if;

  with source_mapping(process_code, hierarchy_id) as (
    values
      ('TG-L0','3.0'),
      ('PNJ-QT-VPBL-BH-BHTG','3.5'),
      ('QTTG.1','3.5'),
      ('QTTG.2','3.5.4'),
      ('QTTG.3','3.5.4'),
      ('QTTG.4','3.5.4'),
      ('QTTG.5','3.5'),
      ('QTTG.6','3.5'),
      ('QTTG.7','3.5'),
      ('QTTG.8','3.5'),
      ('QTTG.9','3.5')
  ),
  targets as (
    select distinct on (p.id)
      pv.id process_version_id,
      ae.id apqc_element_id,
      sm.hierarchy_id
    from source_mapping sm
    join public.processes p on p.process_code = sm.process_code and p.archived_at is null
    join public.process_versions pv on pv.process_id = p.id
    join public.apqc_elements ae on ae.hierarchy_id = sm.hierarchy_id
    join public.apqc_frameworks af on af.id = ae.framework_id and af.is_active is true
    order by p.id, pv.version_number desc
  )
  insert into public.process_apqc_mappings (
    process_version_id, apqc_element_id, mapping_role, match_type, status, rationale
  )
  select process_version_id, apqc_element_id, 'primary', 'related', 'proposed',
    'Restored from the prior installment-process mapping to the equivalent hierarchy ID in the active controlled APQC framework; Process Owner validation remains required.'
  from targets
  on conflict (process_version_id, apqc_element_id, mapping_role) do update
  set match_type = excluded.match_type,
      status = case when public.process_apqc_mappings.status = 'verified' then 'verified' else excluded.status end,
      rationale = case when public.process_apqc_mappings.status = 'verified'
        then public.process_apqc_mappings.rationale else excluded.rationale end;

  with source_link(document_code, process_code) as (
    values
      ('PNJ-QT-VPBL-BH-BHTG','PNJ-QT-VPBL-BH-BHTG'),
      ('221-2026-TB-PPTDTKD-NHADTG2026 -PNJ','QTTG.1'),
      ('69-2026-TB-PPTDTKD-QĐTGQTTD– PNJ','PNJ-QT-VPBL-BH-BHTG'),
      ('495-2025-PVHBL-TNCĐHĐCSTG-PNJ','QTTG.4'),
      ('81-2022-TBHN-BDATG','PNJ-QT-VPBL-BH-BHTG'),
      ('72-2022-TB-BDATG-TBCSTG-PNJ','PNJ-QT-VPBL-BH-BHTG')
  ),
  targets as (
    select distinct on (d.id, p.id)
      dv.id document_version_id,
      p.id process_id,
      pv.id process_version_id
    from source_link sl
    join public.documents d on d.document_code = sl.document_code and d.archived_at is null
    join public.document_versions dv on dv.document_id = d.id and dv.replaced_at is null
    join public.processes p on p.process_code = sl.process_code and p.archived_at is null
    join public.process_versions pv on pv.process_id = p.id
    order by d.id, p.id, dv.version_number desc, pv.version_number desc
  )
  insert into public.document_process_links (
    document_version_id, process_id, process_version_id, link_role
  )
  select document_version_id, process_id, process_version_id, 'primary'
  from targets
  on conflict (document_version_id, process_id, link_role) do update
  set process_version_id = excluded.process_version_id;

  select count(*) into actual_count
  from public.process_apqc_mappings pam
  join public.process_versions pv on pv.id = pam.process_version_id
  join public.processes p on p.id = pv.process_id
  join public.apqc_elements ae on ae.id = pam.apqc_element_id
  join public.apqc_frameworks af on af.id = ae.framework_id
  where p.process_code = any(expected_process_codes) and af.is_active is true;
  if actual_count <> 11 then
    raise exception 'Expected 11 active-framework installment mappings, found %', actual_count;
  end if;

  select count(*) into actual_count
  from public.document_process_links dpl
  join public.document_versions dv on dv.id = dpl.document_version_id and dv.replaced_at is null
  join public.documents d on d.id = dv.document_id and d.archived_at is null
  where d.document_code = any(expected_document_codes);
  if actual_count <> 6 then
    raise exception 'Expected 6 active installment document links, found %', actual_count;
  end if;
end
$$;
