-- Create bridge_quotes table for storing bridge/bridging calculator quotes
create extension if not exists pgcrypto;

create table if not exists public.bridge_quotes (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  name text,
  calculator_type text,
  payload jsonb not null,
  loan_amount numeric,
  ltv numeric,
  status text default 'draft',
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists bridge_quotes_created_at_idx on public.bridge_quotes (created_at desc);
create index if not exists bridge_quotes_user_id_idx on public.bridge_quotes (user_id);
