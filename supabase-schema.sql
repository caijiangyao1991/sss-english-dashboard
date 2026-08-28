create table if not exists public.shared_app_state (
  app_id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.shared_app_state enable row level security;

create policy "shared ledger can read"
  on public.shared_app_state for select to anon using (true);

create policy "shared ledger can insert"
  on public.shared_app_state for insert to anon with check (true);

create policy "shared ledger can update"
  on public.shared_app_state for update to anon using (true) with check (true);
