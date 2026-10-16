-- Admin-only APQC maintenance through the authenticated Data API.
grant insert, update, delete on public.apqc_frameworks, public.apqc_elements, public.apqc_metrics to authenticated;

create policy "admins insert APQC frameworks" on public.apqc_frameworks for insert to authenticated
with check ((select public.current_profile_role()) = 'admin');
create policy "admins update APQC frameworks" on public.apqc_frameworks for update to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');
create policy "admins delete APQC frameworks" on public.apqc_frameworks for delete to authenticated
using ((select public.current_profile_role()) = 'admin');

create policy "admins insert APQC elements" on public.apqc_elements for insert to authenticated
with check ((select public.current_profile_role()) = 'admin');
create policy "admins update APQC elements" on public.apqc_elements for update to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');
create policy "admins delete APQC elements" on public.apqc_elements for delete to authenticated
using ((select public.current_profile_role()) = 'admin');

create policy "admins insert APQC metrics" on public.apqc_metrics for insert to authenticated
with check ((select public.current_profile_role()) = 'admin');
create policy "admins update APQC metrics" on public.apqc_metrics for update to authenticated
using ((select public.current_profile_role()) = 'admin')
with check ((select public.current_profile_role()) = 'admin');
create policy "admins delete APQC metrics" on public.apqc_metrics for delete to authenticated
using ((select public.current_profile_role()) = 'admin');
