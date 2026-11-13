-- Outlanders Arsenal community comments (run once in Supabase SQL Editor)
create extension if not exists pgcrypto;
create table if not exists public.community_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.community_admins enable row level security;
-- No public policies: only project administrators/service role can assign moderators.
create or replace function public.is_community_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists(select 1 from public.community_admins where user_id = (select auth.uid())); $$;
revoke all on function public.is_community_admin() from public;
grant execute on function public.is_community_admin() to authenticated;
create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 80),
  body text not null check (char_length(trim(body)) between 1 and 4000),
  parent_id uuid references public.community_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_comments_created_idx on public.community_comments(created_at desc);
create index if not exists community_comments_parent_idx on public.community_comments(parent_id);
alter table public.community_comments enable row level security;
create policy "Everyone can read comments" on public.community_comments for select to anon, authenticated using (true);
create policy "Signed-in users can post their own comments" on public.community_comments for insert to authenticated
with check (author_id = (select auth.uid()) and (parent_id is null or exists(select 1 from public.community_comments p where p.id=parent_id)));
create policy "Authors can update own comments" on public.community_comments for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));
create policy "Authors and admins can delete comments" on public.community_comments for delete to authenticated
using (author_id = (select auth.uid()) or public.is_community_admin());
-- Prevent changes to immutable ownership and parent fields via updates.
create or replace function public.community_comments_guard()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id or new.author_id is distinct from old.author_id or new.parent_id is distinct from old.parent_id or new.created_at is distinct from old.created_at or new.author_name is distinct from old.author_name then
      raise exception 'Cannot change comment ownership or metadata';
    end if;
    new.updated_at = now();
  end if;
  return new;
end; $$;
drop trigger if exists community_comments_guard_trigger on public.community_comments;
create trigger community_comments_guard_trigger before update on public.community_comments for each row execute function public.community_comments_guard();
grant select on public.community_comments to anon;
grant select, insert, update, delete on public.community_comments to authenticated;
-- After signing in, get your Supabase user UUID from Authentication > Users.
-- Then run this statement with your real UUID (never a username):
-- insert into public.community_admins(user_id) values ('YOUR-USER-UUID');
