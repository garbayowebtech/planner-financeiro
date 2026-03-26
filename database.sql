-- ============================================================
-- Planner Financeiro - Supabase Database Schema
-- Execute this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- 1. User profiles (extends Supabase auth.users)
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null,
  avatar_url text,
  settings   jsonb not null default '{"cardClosingDay": 11, "cardDueDay": 20, "darkMode": false}',
  created_at timestamptz default now()
);

-- 2. Categories
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  color      text not null default '#3B82F6',
  text_color text not null default '#ffffff',
  goal       numeric(12,2) not null default 0,
  created_at timestamptz default now()
);

-- 3. Credit Expenses
create table public.credit_expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  amount      numeric(12,2) not null,
  date        text not null,
  category_id uuid references public.categories(id) on delete set null,
  cycle_start text,
  cycle_end   text,
  due_date    text,
  created_at  timestamptz default now()
);

-- 4. Debit Transactions
create table public.debit_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  amount      numeric(12,2) not null,
  date        text not null,
  category_id uuid references public.categories(id) on delete set null,
  type        text not null check (type in ('income', 'expense')),
  created_at  timestamptz default now()
);

-- 5. Installments
create table public.installments (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users(id) on delete cascade,
  name                 text not null,
  installment_amount   numeric(12,2) not null,
  total_installments   integer not null,
  current_installment  integer not null,
  date                 text not null,
  category_id          uuid references public.categories(id) on delete set null,
  created_at           timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.credit_expenses   enable row level security;
alter table public.debit_transactions enable row level security;
alter table public.installments      enable row level security;

-- Profiles: each user manages only their own row
create policy "owner_all_profiles"          on public.profiles          for all using (auth.uid() = id);
-- Categories: each user manages only their own rows
create policy "owner_all_categories"        on public.categories        for all using (auth.uid() = user_id);
-- Credit expenses
create policy "owner_all_credit_expenses"   on public.credit_expenses   for all using (auth.uid() = user_id);
-- Debit transactions
create policy "owner_all_debit_txns"        on public.debit_transactions for all using (auth.uid() = user_id);
-- Installments
create policy "owner_all_installments"      on public.installments      for all using (auth.uid() = user_id);

-- ============================================================
-- Trigger: auto-create profile + default categories on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create profile
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Usuário'));

  -- Create default categories
  insert into public.categories (user_id, name, color, text_color, goal) values
    (new.id, 'Alimentação',         '#10B981', '#ffffff', 1000),
    (new.id, 'Transporte',          '#3B82F6', '#ffffff',  300),
    (new.id, 'Lazer',               '#8B5CF6', '#ffffff',  500),
    (new.id, 'Delivery',            '#F59E0B', '#ffffff',  200),
    (new.id, 'Pets',                '#EC4899', '#ffffff',  150),
    (new.id, 'Assinaturas Digitais','#6366F1', '#ffffff',  100),
    (new.id, 'Contas de Casa',      '#64748B', '#ffffff',  600);

  return new;
end;
$$;

-- Attach trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- STORAGE: Avatars Bucket
-- ============================================================
-- Note: Depending on your Supabase permissions, you may need to 
-- run this via the SQL Editor in the Dashboard.

insert into storage.buckets (id, name, public) 
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Cover Images are publicly accessible."
  on storage.objects for select
  using ( bucket_id = 'avatars' );

create policy "Users can upload their own avatars."
  on storage.objects for insert
  with check ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

create policy "Users can update their own avatars."
  on storage.objects for update
  using ( bucket_id = 'avatars' and auth.role() = 'authenticated' );

-- ============================================================
-- 6. AI Reports (controle de uso mensal da IA)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    month_year TEXT NOT NULL,
    report_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Garante apenas 1 relatório por mês por usuário
alter table public.ai_reports
  add constraint unique_user_month unique (user_id, month_year);

alter table public.ai_reports enable row level security;

-- Usuários só enxergam e gerenciam os próprios registros
create policy "owner_all_ai_reports"
  on public.ai_reports for all
  using (auth.uid() = user_id);
