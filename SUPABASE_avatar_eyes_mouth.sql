-- =========================================================
-- Avatar eyes + mouth support
--
-- 1) Adds profiles.avatar_eyes + profiles.avatar_mouth
-- 2) Updates the avatar performance RPC wrappers to return these fields
--
-- Run this in Supabase SQL Editor (copy/paste the CONTENTS of this file).
-- =========================================================

-- 1) Columns
alter table public.profiles
  add column if not exists avatar_eyes text,
  add column if not exists avatar_mouth text;

-- Backfill + defaults
update public.profiles
set
  avatar_eyes = coalesce(avatar_eyes, 'eyes_1'),
  avatar_mouth = coalesce(avatar_mouth, 'mouth_1')
where avatar_eyes is null or avatar_mouth is null;

alter table public.profiles
  alter column avatar_eyes set default 'eyes_1',
  alter column avatar_mouth set default 'mouth_1';

alter table public.profiles
  alter column avatar_eyes set not null,
  alter column avatar_mouth set not null;


-- 2) RPC wrappers (avoid N+1 queries in the app)

-- Friends list
-- Returns ONE row per friend with avatar fields already included.
drop function if exists public.get_my_friends_v2_with_avatar();
create or replace function public.get_my_friends_v2_with_avatar()
returns table (
  friend_user_id uuid,
  username text,
  display_name text,
  friend_xp bigint,
  league_id uuid,
  league_name text,
  is_current_user boolean,
  avatar_id text,
  avatar_color text,
  avatar_accessory text,
  avatar_frame text,
  avatar_eyes text,
  avatar_mouth text
)
language sql
security definer
set search_path = public
as $$
  select
    f.friend_user_id,
    f.username,
    f.display_name,
    f.friend_xp,
    f.league_id,
    f.league_name,
    f.is_current_user,
    p.avatar_id,
    p.avatar_color,
    p.avatar_accessory,
    p.avatar_frame,
    p.avatar_eyes,
    p.avatar_mouth
  from public.get_my_friends_v2() f
  join public.profiles p on p.id = f.friend_user_id;
$$;


-- Friend requests
-- Returns incoming/outgoing requests with avatar fields included.
drop function if exists public.get_my_friend_requests_with_avatar();
create or replace function public.get_my_friend_requests_with_avatar()
returns table (
  request_id uuid,
  requester_id uuid,
  requester_username text,
  requester_display_name text,
  requester_xp bigint,
  status text,
  created_at timestamptz,
  avatar_id text,
  avatar_color text,
  avatar_accessory text,
  avatar_frame text,
  avatar_eyes text,
  avatar_mouth text
)
language sql
security definer
set search_path = public
as $$
  select
    r.request_id,
    r.requester_id,
    r.requester_username,
    r.requester_display_name,
    r.requester_xp,
    r.status,
    r.created_at,
    p.avatar_id,
    p.avatar_color,
    p.avatar_accessory,
    p.avatar_frame,
    p.avatar_eyes,
    p.avatar_mouth
  from public.get_my_friend_requests() r
  join public.profiles p on p.id = r.requester_id;
$$;


-- User search suggestions
-- Returns up to 10 users matching query with avatar fields.
drop function if exists public.search_users_with_avatar(text);
create or replace function public.search_users_with_avatar(search_query text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_id text,
  avatar_color text,
  avatar_accessory text,
  avatar_frame text,
  avatar_eyes text,
  avatar_mouth text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_id,
    p.avatar_color,
    p.avatar_accessory,
    p.avatar_frame,
    p.avatar_eyes,
    p.avatar_mouth
  from public.profiles p
  where
    p.username ilike ('%' || search_query || '%')
    or p.display_name ilike ('%' || search_query || '%')
  order by p.username
  limit 10;
$$;
