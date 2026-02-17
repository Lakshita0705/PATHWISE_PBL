-- Community Q&A tables for public question and answer forum
-- Run in Supabase SQL Editor

-- Questions table
create table if not exists community_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete set null,
  question text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Answers table
create table if not exists community_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references community_questions(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete set null,
  answer text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_community_questions_user_id on community_questions(user_id);
create index if not exists idx_community_questions_created_at on community_questions(created_at desc);
create index if not exists idx_community_answers_question_id on community_answers(question_id);
create index if not exists idx_community_answers_user_id on community_answers(user_id);
create index if not exists idx_community_answers_created_at on community_answers(created_at desc);

comment on table community_questions is 'Public questions posted by users - visible to everyone';
comment on table community_answers is 'Answers to community questions - visible to everyone';

-- RLS (if enabled, allow public read, authenticated write)
-- alter table community_questions enable row level security;
-- alter table community_answers enable row level security;
-- create policy "Anyone can read questions" on community_questions for select using (true);
-- create policy "Anyone can read answers" on community_answers for select using (true);
-- create policy "Authenticated users can post questions" on community_questions for insert with check (auth.uid() = user_id);
-- create policy "Authenticated users can post answers" on community_answers for insert with check (auth.uid() = user_id);
-- create policy "Users can update own questions" on community_questions for update using (auth.uid() = user_id);
-- create policy "Users can update own answers" on community_answers for update using (auth.uid() = user_id);
