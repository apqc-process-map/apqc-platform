-- Complete covering indexes reported by the Supabase foreign-key advisor.
create index if not exists comment_mentions_profile_id_idx on public.comment_mentions(profile_id);
create index if not exists finding_participants_profile_id_idx on public.finding_participants(profile_id);
create index if not exists finding_reactions_profile_id_idx on public.finding_reactions(profile_id);