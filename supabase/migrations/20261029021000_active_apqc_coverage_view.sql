-- Keep governance coverage scoped to the single active APQC framework.
create or replace view public.apqc_coverage_view with (security_invoker=true) as
select element.id as apqc_element_id,
       element.pcf_id,
       element.name,
       element.level_number,
       count(mapping.id) filter (where mapping.status='verified') as verified_process_mappings
from public.apqc_elements element
join public.apqc_frameworks framework
  on framework.id=element.framework_id and framework.is_active
left join public.process_apqc_mappings mapping
  on mapping.apqc_element_id=element.id
group by element.id,element.pcf_id,element.name,element.level_number;

grant select on public.apqc_coverage_view to authenticated;