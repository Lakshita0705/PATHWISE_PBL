-- Mentor schedules + student ratings + mentor self-write policies

create table if not exists mentor_schedules (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null,
  schedule_date date not null,
  slot_time text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (mentor_id, schedule_date, slot_time)
);

create index if not exists idx_mentor_schedules_mentor_date
  on mentor_schedules(mentor_id, schedule_date);

create table if not exists mentor_ratings (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null,
  student_id uuid not null,
  rating int not null check (rating between 1 and 5),
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, student_id)
);

create index if not exists idx_mentor_ratings_mentor
  on mentor_ratings(mentor_id);

create or replace function set_mentor_ratings_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_set_mentor_ratings_updated_at on mentor_ratings;
create trigger trg_set_mentor_ratings_updated_at
before update on mentor_ratings
for each row
execute function set_mentor_ratings_updated_at();

create or replace function refresh_mentor_avg_rating()
returns trigger as $$
declare
  target_mentor_id uuid;
  avg_rating numeric;
begin
  target_mentor_id := coalesce(new.mentor_id, old.mentor_id);
  select round(avg(rating)::numeric, 2)
  into avg_rating
  from mentor_ratings
  where mentor_id = target_mentor_id;

  update mentors
  set rating = coalesce(avg_rating, 0)
  where id = target_mentor_id;

  return coalesce(new, old);
end;
$$ language plpgsql;

drop trigger if exists trg_refresh_mentor_avg_rating_ins on mentor_ratings;
drop trigger if exists trg_refresh_mentor_avg_rating_upd on mentor_ratings;
drop trigger if exists trg_refresh_mentor_avg_rating_del on mentor_ratings;
create trigger trg_refresh_mentor_avg_rating_ins
after insert on mentor_ratings
for each row execute function refresh_mentor_avg_rating();
create trigger trg_refresh_mentor_avg_rating_upd
after update on mentor_ratings
for each row execute function refresh_mentor_avg_rating();
create trigger trg_refresh_mentor_avg_rating_del
after delete on mentor_ratings
for each row execute function refresh_mentor_avg_rating();

alter table mentors enable row level security;
alter table mentor_schedules enable row level security;
alter table mentor_ratings enable row level security;

drop policy if exists "mentors_insert_own" on mentors;
drop policy if exists "mentors_update_own" on mentors;
create policy "mentors_insert_own" on mentors
for insert
with check (auth.uid() = id);
create policy "mentors_update_own" on mentors
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "mentor_schedules_select_all_authenticated" on mentor_schedules;
drop policy if exists "mentor_schedules_write_own" on mentor_schedules;
create policy "mentor_schedules_select_all_authenticated" on mentor_schedules
for select
using (auth.uid() is not null);
create policy "mentor_schedules_write_own" on mentor_schedules
for all
using (auth.uid() = mentor_id)
with check (auth.uid() = mentor_id);

drop policy if exists "mentor_ratings_select_all_authenticated" on mentor_ratings;
drop policy if exists "mentor_ratings_insert_own_student" on mentor_ratings;
drop policy if exists "mentor_ratings_update_own_student" on mentor_ratings;
create policy "mentor_ratings_select_all_authenticated" on mentor_ratings
for select
using (auth.uid() is not null);
create policy "mentor_ratings_insert_own_student" on mentor_ratings
for insert
with check (auth.uid() = student_id);
create policy "mentor_ratings_update_own_student" on mentor_ratings
for update
using (auth.uid() = student_id)
with check (auth.uid() = student_id);
