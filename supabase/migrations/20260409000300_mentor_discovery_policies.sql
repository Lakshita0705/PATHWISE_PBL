-- Policies to allow students to discover mentors.

alter table mentors enable row level security;
alter table profiles enable row level security;

drop policy if exists "mentors_select_all_authenticated" on mentors;
create policy "mentors_select_all_authenticated" on mentors
for select
using (auth.uid() is not null);

drop policy if exists "profiles_select_mentor_rows" on profiles;
create policy "profiles_select_mentor_rows" on profiles
for select
using (role = 'mentor');
