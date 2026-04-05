create extension if not exists pgcrypto;

create table if not exists public.volunteer_notifications (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null,
  event_id uuid not null,
  application_id uuid null,
  kind text not null check (kind in ('application_accepted', 'application_rejected', 'event_completed')),
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists idx_volunteer_notifications_volunteer_created_at
  on public.volunteer_notifications (volunteer_id, created_at desc);

create index if not exists idx_volunteer_notifications_unread
  on public.volunteer_notifications (volunteer_id, read_at)
  where read_at is null;

alter table public.volunteer_notifications enable row level security;

grant select, update on public.volunteer_notifications to authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'volunteer_notifications'
      and policyname = 'Volunteers can view own notifications'
  ) then
    create policy "Volunteers can view own notifications"
      on public.volunteer_notifications
      for select
      to authenticated
      using (volunteer_id = auth.uid());
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'volunteer_notifications'
      and policyname = 'Volunteers can update own notifications'
  ) then
    create policy "Volunteers can update own notifications"
      on public.volunteer_notifications
      for update
      to authenticated
      using (volunteer_id = auth.uid())
      with check (volunteer_id = auth.uid());
  end if;
end
$$;

create or replace function public.notify_volunteer_on_application_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_title text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;

  if new.status not in ('Accepted', 'Declined') then
    return new;
  end if;

  select coalesce(e.title, 'This event')
  into event_title
  from public.events e
  where e.id = new.event_id;

  if new.status = 'Accepted' then
    insert into public.volunteer_notifications (
      volunteer_id,
      event_id,
      application_id,
      kind,
      title,
      message,
      metadata
    )
    values (
      new.volunteer_id,
      new.event_id,
      new.id,
      'application_accepted',
      'Application accepted',
      format('Your application for %s was accepted.', event_title),
      jsonb_build_object('application_id', new.id, 'event_id', new.event_id, 'status', new.status)
    );
  elsif new.status = 'Declined' then
    insert into public.volunteer_notifications (
      volunteer_id,
      event_id,
      application_id,
      kind,
      title,
      message,
      metadata
    )
    values (
      new.volunteer_id,
      new.event_id,
      new.id,
      'application_rejected',
      'Application update',
      format('Your application for %s was not accepted.', event_title),
      jsonb_build_object('application_id', new.id, 'event_id', new.event_id, 'status', new.status)
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_notify_volunteer_on_application_status_change on public.event_applications;

create trigger trg_notify_volunteer_on_application_status_change
after update of status on public.event_applications
for each row
execute function public.notify_volunteer_on_application_status_change();

create or replace function public.notify_volunteers_on_event_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(coalesce(new.status, '')) <> 'completed' or lower(coalesce(old.status, '')) = 'completed' then
    return new;
  end if;

  insert into public.volunteer_notifications (
    volunteer_id,
    event_id,
    application_id,
    kind,
    title,
    message,
    metadata
  )
  select distinct on (ea.volunteer_id)
    ea.volunteer_id,
    new.id,
    ea.id,
    'event_completed',
    'Event completed',
    format('%s has been marked as completed.', coalesce(new.title, 'This event')),
    jsonb_build_object('application_id', ea.id, 'event_id', new.id, 'event_status', new.status)
  from public.event_applications ea
  where ea.event_id = new.id
    and ea.status = 'Accepted';

  return new;
end;
$$;

drop trigger if exists trg_notify_volunteers_on_event_completed on public.events;

create trigger trg_notify_volunteers_on_event_completed
after update of status on public.events
for each row
execute function public.notify_volunteers_on_event_completed();
