-- Trusted devices table for tracking user login devices
create table if not exists public.trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  device_type text not null,
  device_icon text not null,
  user_agent text not null,
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(user_id, user_agent)
);

create index if not exists trusted_devices_user_id_idx on public.trusted_devices(user_id);

-- Enable RLS
alter table public.trusted_devices enable row level security;

-- Users can only see their own devices
create policy "Users can view own devices"
  on public.trusted_devices for select
  using (auth.uid() = user_id);

-- Users can insert their own devices
create policy "Users can insert own devices"
  on public.trusted_devices for insert
  with check (auth.uid() = user_id);

-- Users can update their own devices
create policy "Users can update own devices"
  on public.trusted_devices for update
  using (auth.uid() = user_id);

-- Users can delete their own devices
create policy "Users can delete own devices"
  on public.trusted_devices for delete
  using (auth.uid() = user_id);
