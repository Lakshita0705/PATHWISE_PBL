-- User goals table for personalized goal setting with deadlines
-- Run in Supabase SQL Editor

create table if not exists user_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  goal_title text not null,
  description text,
  deadline date not null,
  status text default 'active' check (status in ('active', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes
create index if not exists idx_user_goals_user_id on user_goals(user_id);
create index if not exists idx_user_goals_status on user_goals(status);
create index if not exists idx_user_goals_deadline on user_goals(deadline);

comment on table user_goals is 'User-defined personalized goals with deadlines';
comment on column user_goals.status is 'active | completed | cancelled';

-- RLS (if enabled, allow users to manage their own goals)
-- create policy "Users can manage own goals" on user_goals for all using (auth.uid() = user_id);
