create extension if not exists pgcrypto;

create table if not exists public.organization_notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  event_id uuid not null,
  application_id uuid not null,
  volunteer_id uuid not null,
  kind text not null check (kind in ('new_application')),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_org_notifications_org_created_at
  on public.organization_notifications (org_id, created_at desc);

create index if not exists idx_org_notifications_unread
  on public.organization_notifications (org_id, read_at)
  where read_at is null;

alter table public.organization_notifications enable row level security;

grant select, update on public.organization_notifications to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_notifications'
      and policyname = 'Organizations can view own notifications'
  ) then
    create policy "Organizations can view own notifications"
      on public.organization_notifications
      for select
      to authenticated
      using (org_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organization_notifications'
      and policyname = 'Organizations can update own notifications'
  ) then
    create policy "Organizations can update own notifications"
      on public.organization_notifications
      for update
      to authenticated
      using (org_id = auth.uid())
      with check (org_id = auth.uid());
  end if;
end
$$;

create or replace function public.notify_org_on_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_org_id uuid;
  event_title text;
  volunteer_name text;
begin
  if tg_op = 'INSERT' then
    if new.status not in ('Applied', 'Waitlisted', 'Needs skill verification') then
      return new;
    end if;
  elsif tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then
      return new;
    end if;

    if old.status <> 'Withdrawn' then
      return new;
    end if;

    if new.status not in ('Applied', 'Waitlisted', 'Needs skill verification') then
      return new;
    end if;
  end if;

  select e.org_id, coalesce(e.title, 'an event')
  into target_org_id, event_title
  from public.events e
  where e.id = new.event_id;

  if target_org_id is null then
    return new;
  end if;

  select coalesce(v.name, 'A volunteer')
  into volunteer_name
  from public.volunteers v
  where v.id = new.volunteer_id;

  if volunteer_name is null then
    volunteer_name := 'A volunteer';
  end if;

  insert into public.organization_notifications (
    org_id,
    event_id,
    application_id,
    volunteer_id,
    kind,
    title,
    message,
    metadata
  )
  values (
    target_org_id,
    new.event_id,
    new.id,
    new.volunteer_id,
    'new_application',
    'New applicant',
    format('%s applied to %s.', volunteer_name, event_title),
    jsonb_build_object(
      'application_id', new.id,
      'event_id', new.event_id,
      'volunteer_id', new.volunteer_id,
      'status', new.status
    )
  );

  return new;
end;
$$;

drop trigger if exists trg_notify_org_on_new_application_insert on public.event_applications;
create trigger trg_notify_org_on_new_application_insert
after insert on public.event_applications
for each row
execute function public.notify_org_on_new_application();

drop trigger if exists trg_notify_org_on_new_application_update on public.event_applications;
create trigger trg_notify_org_on_new_application_update
after update of status on public.event_applications
for each row
execute function public.notify_org_on_new_application();
