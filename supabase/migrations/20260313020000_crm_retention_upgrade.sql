-- CRM + retention upgrade

create table if not exists public.client_tags (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  tag text not null,
  created_by text,
  created_at timestamptz not null default now(),
  unique (client_email, tag)
);

create index if not exists idx_client_tags_email on public.client_tags(client_email);

create table if not exists public.retention_offers (
  id uuid primary key default gen_random_uuid(),
  client_email text,
  segment text,
  offer_type text not null,
  offer_code text not null,
  discount_percent integer,
  expires_at timestamptz,
  status text not null default 'unused' check (status in ('unused','used','expired','cancelled')),
  created_by text,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists idx_retention_offers_email on public.retention_offers(client_email);
create index if not exists idx_retention_offers_status on public.retention_offers(status);

create table if not exists public.client_followups (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  status text not null default 'open' check (status in ('open','done')),
  reason text,
  due_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_client_followups_email on public.client_followups(client_email);
create index if not exists idx_client_followups_status on public.client_followups(status);
