-- ============================================================
-- 1. PROFILES TABLE
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_admin boolean not null default false
);

alter table public.profiles enable row level security;

-- Users can read/update only their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, is_admin)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), true);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. ORGANIZATIONS TABLE
-- ============================================================
create type org_type as enum ('school', 'nonprofit', 'business');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type org_type not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Conditional fields
  school_district text,  -- required when type = 'school'
  ein text,              -- required when type = 'nonprofit'
  industry text          -- required when type = 'business'
);

alter table public.organizations enable row level security;

-- Owner-only access
create policy "Owner can select own orgs"
  on public.organizations for select
  using (auth.uid() = created_by);

create policy "Owner can insert orgs"
  on public.organizations for insert
  with check (auth.uid() = created_by);

create policy "Owner can update own orgs"
  on public.organizations for update
  using (auth.uid() = created_by);

create policy "Owner can delete own orgs"
  on public.organizations for delete
  using (auth.uid() = created_by);

-- ============================================================
-- 3. ORGANIZATION MEMBERS TABLE
-- ============================================================
create type member_status as enum ('invited', 'active');

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  status member_status not null default 'invited',
  role text not null default 'member',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (organization_id, email)
);

alter table public.organization_members enable row level security;

-- Only org owner can see members
create policy "Org owner can select members"
  on public.organization_members for select
  using (
    exists (
      select 1 from public.organizations
      where id = organization_members.organization_id
        and created_by = auth.uid()
    )
  );

-- Only org owner can insert members
create policy "Org owner can insert members"
  on public.organization_members for insert
  with check (
    exists (
      select 1 from public.organizations
      where id = organization_members.organization_id
        and created_by = auth.uid()
    )
  );
