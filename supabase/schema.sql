create extension if not exists "pgcrypto";

create table if not exists public.user_stats (
  user_id text primary key,
  streak integer not null default 0,
  sessions integer not null default 0,
  avg_score numeric(4,1) not null default 0,
  last_session timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  topic text not null,
  note text,
  audio_url text,
  transcript text,
  ai_score numeric(4,1),
  ai_clarity numeric(4,1),
  ai_confidence numeric(4,1),
  ai_filler_count integer,
  ai_feedback text,
  ai_strengths jsonb,
  ai_improvements jsonb,
  ai_structure numeric(4,1),
  ai_vocabulary numeric(4,1),
  ai_pacing numeric(4,1),
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_created
  on public.sessions (user_id, created_at desc);

drop policy if exists "user_stats_select_own" on public.user_stats;
drop policy if exists "user_stats_insert_own" on public.user_stats;
drop policy if exists "user_stats_update_own" on public.user_stats;
drop policy if exists "sessions_select_own" on public.sessions;
drop policy if exists "sessions_insert_own" on public.sessions;
drop policy if exists "sessions_update_own" on public.sessions;
drop policy if exists "sessions_delete_own" on public.sessions;
drop policy if exists "session_audio_select_own" on storage.objects;
drop policy if exists "session_audio_insert_own" on storage.objects;
drop policy if exists "session_audio_update_own" on storage.objects;
drop policy if exists "session_audio_delete_own" on storage.objects;

insert into storage.buckets (id, name, public)
values ('session-audio', 'session-audio', true)
on conflict (id) do nothing;

drop policy if exists "session_audio_select_public" on storage.objects;
drop policy if exists "session_audio_insert_public" on storage.objects;
create policy "session_audio_select_public"
on storage.objects
for select
using (bucket_id = 'session-audio');

create policy "session_audio_insert_public"
on storage.objects
for insert
with check (bucket_id = 'session-audio');
