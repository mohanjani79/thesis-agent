-- Personal Thesis Agent: single-user prototype schema.
-- The app talks to these tables with the service-role key from server code only,
-- so RLS is enabled with no policies (nothing is reachable with the anon key).

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  symbols text[] not null default '{}',
  thesis text not null default '',
  assumptions text[] not null default '{}',
  notes text not null default '',
  tips text not null default '',
  rules jsonb not null default '[]',
  entry_prices jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checks (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references agents(id) on delete cascade,
  ran_at timestamptz not null default now(),
  status text not null check (status in ('intact', 'watch', 'broken')),
  summary text not null,
  pillars jsonb not null default '[]',
  triggered_rules jsonb not null default '[]',
  quotes jsonb not null default '[]',
  news_count int not null default 0,
  evaluator text not null,
  guard_flags text[] not null default '{}'
);

create index if not exists checks_agent_ran_at on checks (agent_id, ran_at desc);

create or replace view latest_checks as
  select distinct on (agent_id) * from checks order by agent_id, ran_at desc;

alter table agents enable row level security;
alter table checks enable row level security;
