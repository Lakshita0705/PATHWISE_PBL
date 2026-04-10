-- Allow users to read their own mentor application status.
-- Required for pending/approved UI flow on login.

alter table mentor_applications enable row level security;

drop policy if exists "mentor_applications_select_own" on mentor_applications;
create policy "mentor_applications_select_own" on mentor_applications
for select
using (applicant_user_id = auth.uid());
