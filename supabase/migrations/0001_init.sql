-- LeadVoice multi-tenant schema (Supabase Postgres).
-- Every row belongs to a workspace; row-level security lets a signed-in user see only
-- workspaces they are a member of. The voice + scheduler workers use the service role.

create extension if not exists "pgcrypto";

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  credits_paise bigint not null default 5000,          -- ₹50 free credits on sign-up
  spend_floor_paise bigint not null default 5000,      -- calls pause below this
  webhook_url text,
  webhook_secret text not null default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now()
);

create table members (
  workspace_id uuid references workspaces on delete cascade,
  user_id uuid references auth.users on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member', 'viewer')),
  primary key (workspace_id, user_id)
);

create table agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  name text not null,
  role text not null,
  template text not null,
  language text not null check (language in ('te', 'hi', 'en')),
  voice_id text not null,
  direction text not null default 'both' check (direction in ('inbound', 'outbound', 'both')),
  opening text not null,
  script text not null,
  knowledge text not null default '',
  actions text[] not null default '{}',
  outcome text not null,
  status text not null default 'live' check (status in ('live', 'paused', 'draft')),
  created_at timestamptz not null default now()
);

create table numbers (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  e164 text not null unique,
  provider text not null,
  sip_trunk_id text,
  inbound_agent_id uuid references agents on delete set null,
  status text not null default 'kyc_pending' check (status in ('kyc_pending', 'active', 'suspended')),
  dlt_header text,
  created_at timestamptz not null default now()
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  agent_id uuid references agents on delete set null,
  name text not null default '',
  phone text not null,                                  -- E.164
  source text not null default 'Upload',
  status text not null default 'new' check (status in ('new', 'hot', 'warm', 'cold', 'do_not_call')),
  fields jsonb not null default '{}',                   -- budget, needs, timeline…
  consent_at timestamptz,                               -- when the lead agreed to be called
  next_action text,
  created_at timestamptz not null default now(),
  unique (workspace_id, phone)
);

create table calls (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  agent_id uuid references agents on delete set null,
  lead_id uuid references leads on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  purpose text not null default 'new_lead',
  attempt int not null default 1,
  status text not null check (status in ('live', 'connected', 'no_answer', 'voicemail', 'failed')),
  outcome text,
  lead_status text,
  summary text,
  transcript jsonb not null default '[]',
  actions jsonb not null default '[]',
  recording_url text,
  duration_sec int not null default 0,
  cost_paise bigint not null default 0,
  carrier_code text,                                    -- SIP status, for auto-pause on refusals
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index calls_ws_started on calls (workspace_id, started_at desc);

create table tasks (                                    -- scheduler: retries, callbacks, reminders
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  lead_id uuid not null references leads on delete cascade,
  agent_id uuid references agents on delete set null,
  kind text not null check (kind in ('new_lead', 'retry', 'callback', 'reminder', 'after_visit', 'campaign')),
  due_at timestamptz not null,
  dedupe_key text not null,
  done_at timestamptz,
  unique (workspace_id, dedupe_key)
);
create index tasks_due on tasks (due_at) where done_at is null;

create table wallet_ledger (
  id bigserial primary key,
  workspace_id uuid not null references workspaces on delete cascade,
  amount_paise bigint not null,                         -- + top-up, - call
  reason text not null,
  call_id uuid references calls on delete set null,
  razorpay_payment_id text unique,
  created_at timestamptz not null default now()
);

create table api_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces on delete cascade,
  label text not null,
  prefix text not null,
  hash text not null unique,                            -- sha256 of the secret; the secret is never stored
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

-- Row-level security: members only.
create or replace function is_member(ws uuid) returns boolean
language sql security definer stable as $$
  select exists (select 1 from members where workspace_id = ws and user_id = auth.uid())
$$;

alter table workspaces enable row level security;
alter table members enable row level security;
create policy ws_read on workspaces for select using (is_member(id));
create policy ws_update on workspaces for update using (is_member(id));
create policy members_read on members for select using (user_id = auth.uid() or is_member(workspace_id));

do $$
declare t text;
begin
  foreach t in array array['agents', 'numbers', 'leads', 'calls', 'tasks', 'wallet_ledger', 'api_keys'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I on %I for all using (is_member(workspace_id)) with check (is_member(workspace_id))', t || '_member', t);
  end loop;
end $$;

-- Credits can only change through the ledger (written by the server with the service role).
revoke update (credits_paise) on workspaces from authenticated;
