-- Migration: create transfers_events table for Transfer Intelligence
create extension if not exists pgcrypto;

create table if not exists public.transfers_events (
  id uuid primary key default gen_random_uuid(),
  topic text,
  actor text,
  content text,
  url text unique,
  source text,
  stage text,
  confidence numeric,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  raw jsonb
);

create index if not exists transfers_events_topic_idx on public.transfers_events (topic);
create index if not exists transfers_events_published_idx on public.transfers_events (published_at);
