-- Black Card system hardening: requests, usage history, activity log

create table if not exists public.code_creation_requests (
  id uuid primary key default gen_random_uuid(),
  client_name text,
  client_email text,
  client_phone text,
  client_id text,
  offer_id uuid references public.pricing(id) on delete set null,
  offer_name text,
  credits_total integer not null default 10,
  payment_method text not null check (payment_method in ('online','cash_on_site')),
  payment_status text not null default 'pending' check (payment_status in ('pending','paid')),
  request_source text not null default 'frontend' check (request_source in ('frontend','admin')),
  request_status text not null default 'pending' check (request_status in ('pending','approved','rejected','auto_generated')),
  payzone_order_id text,
  generated_pack_id uuid references public.packs(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_code_creation_requests_status on public.code_creation_requests(request_status);
create index if not exists idx_code_creation_requests_order on public.code_creation_requests(payzone_order_id);
create index if not exists idx_code_creation_requests_email on public.code_creation_requests(client_email);

create table if not exists public.blackcard_usage (
  id uuid primary key default gen_random_uuid(),
  blackcard_id uuid not null references public.packs(id) on delete cascade,
  client_id text,
  client_email text,
  session_id uuid,
  used_at timestamptz not null default now()
);

create index if not exists idx_blackcard_usage_blackcard_id on public.blackcard_usage(blackcard_id);
create index if not exists idx_blackcard_usage_session_id on public.blackcard_usage(session_id);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  action text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_log_action on public.activity_log(action);
create index if not exists idx_activity_log_created_at on public.activity_log(created_at desc);

alter table public.packs
  add column if not exists payment_source text,
  add column if not exists offer_id uuid references public.pricing(id) on delete set null,
  add column if not exists request_id uuid references public.code_creation_requests(id) on delete set null,
  add column if not exists status text;

update public.packs
set payment_source = case
  when coalesce(payment_status,'') in ('paid','Payé') then 'online_payzone'
  when coalesce(payment_status,'') in ('pay_on_site','pending') then 'pending_cash'
  else 'admin_created'
end
where payment_source is null;

update public.packs
set status = case
  when coalesce(is_active,false) = false then 'cancelled'
  when credits_used >= credits_total then 'used'
  when expires_at is not null and expires_at < now() then 'expired'
  when coalesce(payment_status,'') in ('pending') then 'pending'
  else 'active'
end
where status is null;

alter table public.packs
  alter column payment_source set default 'admin_created',
  alter column status set default 'active';

alter table public.packs
  add constraint packs_payment_source_check check (payment_source in ('online_payzone','admin_created','pending_cash','paid_on_site')) not valid;
alter table public.packs validate constraint packs_payment_source_check;

alter table public.packs
  add constraint packs_status_check check (status in ('active','pending','used','expired','cancelled')) not valid;
alter table public.packs validate constraint packs_status_check;
