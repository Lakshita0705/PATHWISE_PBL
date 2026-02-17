-- Mentor applications table for "Become a Mentor" form submissions
-- Run in Supabase SQL Editor

create table if not exists mentor_applications (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  educational_qualification text not null,
  stream_of_mentoring text not null,
  certificate_url text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  reviewed_at timestamptz,
  notes text
);

-- Index for faster queries
create index if not exists idx_mentor_applications_status on mentor_applications(status);
create index if not exists idx_mentor_applications_email on mentor_applications(email);

comment on table mentor_applications is 'Stores mentor application submissions from the landing page form.';
comment on column mentor_applications.status is 'pending | approved | rejected';
comment on column mentor_applications.certificate_url is 'URL to uploaded certificate file in Supabase Storage';

-- IMPORTANT: If RLS is enabled, you MUST create a policy to allow inserts
-- Uncomment the following if you enable RLS:
-- alter table mentor_applications enable row level security;
-- create policy "Anyone can insert mentor applications" on mentor_applications for insert with check (true);
-- create policy "Only admins can view applications" on mentor_applications for select using (auth.jwt() ->> 'role' = 'admin');

-- If RLS is already enabled globally, run this to allow public inserts:
-- create policy "Public can insert mentor applications" on mentor_applications for insert with check (true);
