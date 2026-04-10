-- Allow users to read profile rows for people they have chatted with.
-- This keeps profile visibility scoped while enabling chat participant names.

alter table profiles enable row level security;

drop policy if exists "profiles_select_chat_contacts" on profiles;
create policy "profiles_select_chat_contacts" on profiles
for select
using (
  exists (
    select 1
    from messages m
    where (
      (m.sender_id = auth.uid() and m.receiver_id = profiles.id)
      or
      (m.receiver_id = auth.uid() and m.sender_id = profiles.id)
    )
  )
);
