create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  direction text not null,
  content text not null,
  provider text,
  receiver text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  constraint messages_direction_check check (direction in ('inbound', 'outbound'))
);

create index if not exists messages_phone_direction_created_at_idx
  on public.messages (phone, direction, created_at);

-- Enable realtime for messages table
alter publication supabase_realtime add table messages;
