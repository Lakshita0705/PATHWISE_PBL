-- Add unread message tracking and allow receiver to mark messages as read.

alter table messages
  add column if not exists is_read boolean not null default false;

create index if not exists idx_messages_receiver_unread
  on messages(receiver_id, is_read, created_at desc);

alter table messages enable row level security;

drop policy if exists "messages_update_receiver_read" on messages;
create policy "messages_update_receiver_read" on messages
for update
using (auth.uid() = receiver_id)
with check (
  auth.uid() = receiver_id
  and receiver_id = receiver_id
);
