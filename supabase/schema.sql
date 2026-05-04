create extension if not exists "pgcrypto";

create table if not exists public.practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  topic_title text not null,
  topic_source text not null default 'unknown',
  topic_difficulty text not null default 'unknown',
  duration_seconds integer not null default 0,
  audio_path text not null,
  transcript text not null default '',
  ai_feedback jsonb not null default '{}'::jsonb,
  overall_score numeric(4,1) not null default 0,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_practice_sessions_user_completed
  on public.practice_sessions (user_id, completed_at desc);
