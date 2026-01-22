-- Create quotes table for storing calculator quotes
-- Run this in Supabase SQL editor. Ensures pgcrypto extension for gen_random_uuid().
create extension if not exists pgcrypto;

create table if not exists public.quotes (
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

create index if not exists quotes_created_at_idx on public.quotes (created_at desc);
create index if not exists quotes_user_id_idx on public.quotes (user_id);
