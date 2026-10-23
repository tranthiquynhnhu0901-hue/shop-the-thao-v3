-- SPORTHUB V3 - run in Supabase SQL Editor (signed in as database owner).
-- Does NOT create an administrator automatically. See admin-grant.sql below.
-- Requires Supabase Auth Email + Google OAuth to be enabled.

create schema if not exists private;

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text not null default '',
  source text not null default 'SportHub V3',
  marketing_consent boolean not null default false,
  created_at timestamptz not null default now()
);
-- Only customer accounts are available for public registration.
alter table public.profiles add column if not exists account_type text not null default 'customer';
alter table public.profiles add column if not exists company_name text not null default '';
alter table public.profiles add column if not exists terms_accepted_at timestamptz;

create index if not exists profiles_created_at_idx on public.profiles(created_at desc);
create index if not exists profiles_email_idx on public.profiles(lower(email));

create table if not exists public.crm_details (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stage text not null default 'Mới'
    check (stage in ('Mới','Đã liên hệ','Tiềm năng','Khách hàng','Không phù hợp')),
  tags text[] not null default '{}'::text[],
  notes text not null default '',
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_content (
  key text primary key check (key ~ '^[a-zA-Z0-9._:-]{1,100}$'),
  kind text not null check (kind in ('text','image')),
  value text not null check (length(value) <= 15000),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

-- Sensitive authorization rules MUST execute inside Postgres, not the browser.
-- `security definer` allows the function to check admins without policy recursion.
create or replace function private.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.admins a
    join auth.users u on u.id = a.user_id
    where a.user_id = (select auth.uid())
      and lower(u.email) = 'tranthiquynhnhu0901@gmail.com'
      and u.email_confirmed_at is not null
      and (u.raw_app_meta_data ->> 'provider') = 'google'
  );
$$;
revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

alter table public.admins enable row level security;
alter table public.profiles enable row level security;
alter table public.crm_details enable row level security;
alter table public.site_content enable row level security;

revoke all on table public.admins, public.profiles, public.crm_details, public.site_content from anon, authenticated;
grant select on table public.admins to authenticated;
grant select on table public.profiles to authenticated;
grant select,insert,update on table public.crm_details to authenticated;
grant select on table public.site_content to anon, authenticated;
grant insert,update,delete on table public.site_content to authenticated;

create policy "Admin identity only self" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "Customer profile self or authorized admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "CRM read admins only" on public.crm_details
  for select to authenticated using ((select private.is_admin()));
create policy "CRM create admins only" on public.crm_details
  for insert to authenticated with check ((select private.is_admin()));
create policy "CRM change admins only" on public.crm_details
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Public site content read" on public.site_content
  for select to anon,authenticated using (true);
create policy "Admins create content" on public.site_content
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins update content" on public.site_content
  for update to authenticated using ((select private.is_admin()))
  with check ((select private.is_admin()));
create policy "Admins delete content" on public.site_content
  for delete to authenticated using ((select private.is_admin()));

-- Trigger runs with database privileges, regardless of client grants.
-- Kept minimal to avoid breaking signups if optional data is malformed.
create or replace function private.create_new_profile()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles(id,email,full_name,phone,source,marketing_consent,account_type,company_name,terms_accepted_at)
  values (
    new.id,
    coalesce(new.email,''),
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 200),
    left(coalesce(new.raw_user_meta_data ->> 'phone',''),30),
    left(coalesce(new.raw_user_meta_data ->> 'source','SportHub V3'),50),
    coalesce(new.raw_user_meta_data ->> 'marketing_consent','false') = 'true',
    'customer',
    '',
    case when new.raw_user_meta_data ? 'terms_accepted_at' then now() else null end
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists sporthub_auth_profile_created on auth.users;
create trigger sporthub_auth_profile_created
  after insert on auth.users
  for each row execute function private.create_new_profile();

-- Public product images, but only the authorized admin can upload.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('site-images','site-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Admin upload site images" on storage.objects
  for insert to authenticated
  with check (
    bucket_id='site-images' and (select private.is_admin())
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
-- No UPDATE/DELETE policies for simplicity; old uploaded versions remain available.

-- Optional backfill for existing Auth users created before the trigger (run once only as owner):
-- insert into public.profiles(id,email,full_name,source)
-- select id,coalesce(email,''),left(coalesce(raw_user_meta_data->>'full_name',''),200),'existing'
-- from auth.users on conflict(id) do nothing;
