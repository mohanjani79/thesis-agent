-- Accounts: one per person. Each person signs in with a personal invite link
-- whose secret token maps to a row here. The first account is the owner, who
-- can invite others. Agents belong to one account.

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  token text not null unique,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now()
);

alter table agents add column if not exists account_id uuid references accounts(id) on delete cascade;
create index if not exists agents_account_id on agents (account_id);

alter table accounts enable row level security;
