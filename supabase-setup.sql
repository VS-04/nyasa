create table if not exists public.interactions (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  session_id text,
  event_type text not null default 'answer_click',
  question_text text,
  selected_answer text,
  page_path text,
  device_info jsonb,
  section_dwell jsonb,
  time_on_site_ms integer
);

alter table public.interactions enable row level security;

drop policy if exists "anonymous visitors can insert interactions" on public.interactions;
create policy "anonymous visitors can insert interactions"
on public.interactions
for insert
to anon, authenticated
with check (true);

drop policy if exists "only configured admin can read interactions" on public.interactions;
create policy "only configured admin can read interactions"
on public.interactions
for select
to authenticated
using (
  auth.email() = 'vansh.sharma9283@gmail.com'
);

create index if not exists interactions_created_at_idx on public.interactions (created_at desc);
create index if not exists interactions_event_type_idx on public.interactions (event_type);
