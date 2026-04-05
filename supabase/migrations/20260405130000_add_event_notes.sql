create extension if not exists pgcrypto;

create table if not exists public.event_notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  volunteer_id uuid not null,
  event_name text not null,
  note_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_notes_org_created_at
  on public.event_notes (org_id, created_at desc);

create index if not exists idx_event_notes_volunteer_created_at
  on public.event_notes (volunteer_id, created_at desc);

alter table public.event_notes enable row level security;

grant select, insert, update on public.event_notes to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'event_notes'
      and policyname = 'Volunteers can view own event notes'
  ) then
    create policy "Volunteers can view own event notes"
      on public.event_notes
      for select
      to authenticated
      using (volunteer_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'event_notes'
      and policyname = 'Volunteers can insert own event notes'
  ) then
    create policy "Volunteers can insert own event notes"
      on public.event_notes
      for insert
      to authenticated
      with check (volunteer_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'event_notes'
      and policyname = 'Volunteers can update own event notes'
  ) then
    create policy "Volunteers can update own event notes"
      on public.event_notes
      for update
      to authenticated
      using (volunteer_id = auth.uid())
      with check (volunteer_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'event_notes'
      and policyname = 'Organizations can view notes for own events'
  ) then
    create policy "Organizations can view notes for own events"
      on public.event_notes
      for select
      to authenticated
      using (org_id = auth.uid());
  end if;
end
$$;
