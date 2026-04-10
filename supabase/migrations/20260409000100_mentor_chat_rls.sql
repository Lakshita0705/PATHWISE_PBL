-- Mentor application automation + chat + RLS policies
-- Run via Supabase migrations or SQL editor.

create extension if not exists pgcrypto;

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null,
  receiver_id uuid not null,
  text text not null check (char_length(trim(text)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_sender_receiver_created
  on messages(sender_id, receiver_id, created_at desc);
create index if not exists idx_messages_receiver_sender_created
  on messages(receiver_id, sender_id, created_at desc);

alter table messages replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table messages;
  end if;
end;
$$;

create table if not exists mentors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text default 'Mentor',
  company text,
  rating numeric default 5.0,
  expertise text[] default '{}',
  image_url text,
  created_at timestamptz not null default now()
);

-- Add optional applicant_user_id so approved applicants can be linked to auth/profile id when available.
alter table mentor_applications
  add column if not exists applicant_user_id uuid;

alter table mentor_applications
  add column if not exists updated_at timestamptz default now();

create or replace function set_mentor_application_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_mentor_application_updated_at on mentor_applications;
create trigger trg_set_mentor_application_updated_at
before update on mentor_applications
for each row
execute function set_mentor_application_updated_at();

create or replace function handle_mentor_approval()
returns trigger as $$
begin
  if new.status = 'approved' and old.status is distinct from 'approved' then
    if new.applicant_user_id is not null then
      insert into mentors (id, name, expertise)
      values (
        new.applicant_user_id,
        new.full_name,
        array[new.stream_of_mentoring]
      )
      on conflict (id) do update
      set
        name = excluded.name,
        expertise = excluded.expertise;

      update profiles
      set role = 'mentor'
      where id = new.applicant_user_id;
    else
      insert into mentors (id, name, expertise)
      values (
        gen_random_uuid(),
        new.full_name,
        array[new.stream_of_mentoring]
      );
    end if;

    new.reviewed_at = coalesce(new.reviewed_at, now());
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists on_mentor_approved on mentor_applications;
create trigger on_mentor_approved
before update on mentor_applications
for each row
when (new.status = 'approved')
execute function handle_mentor_approval();

alter table profiles enable row level security;
alter table mentor_applications enable row level security;
alter table messages enable row level security;

drop policy if exists "profiles_select_own" on profiles;
drop policy if exists "profiles_insert_own" on profiles;
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_select_own" on profiles
for select
using (auth.uid() = id);
create policy "profiles_insert_own" on profiles
for insert
with check (auth.uid() = id);
create policy "profiles_update_own" on profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "mentor_applications_insert_own" on mentor_applications;
drop policy if exists "mentor_applications_select_admin_all" on mentor_applications;
drop policy if exists "mentor_applications_update_admin_all" on mentor_applications;
create policy "mentor_applications_insert_own" on mentor_applications
for insert
with check (
  applicant_user_id = auth.uid()
  or applicant_user_id is null
);
create policy "mentor_applications_select_admin_all" on mentor_applications
for select
using ((auth.jwt() ->> 'role') = 'admin');
create policy "mentor_applications_update_admin_all" on mentor_applications
for update
using ((auth.jwt() ->> 'role') = 'admin')
with check ((auth.jwt() ->> 'role') = 'admin');

drop policy if exists "messages_select_own" on messages;
drop policy if exists "messages_insert_as_sender" on messages;
create policy "messages_select_own" on messages
for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_insert_as_sender" on messages
for insert
with check (auth.uid() = sender_id);
