-- SUPABASE_avatar_eyes_mouth.sql
-- Adds Duolingo-style face part selections (eyes + mouth) to profiles
-- AND updates the existing "*_with_avatar" performance RPCs to include these fields.
--
-- ✅ IMPORTANT:
-- In Supabase SQL Editor, you must paste the CONTENTS of this file (not the filename).
-- Then click RUN.
--
-- Safe to run multiple times.

begin;

-- ------------------------------------------------------------
-- 1) Add new columns (eyes + mouth) to profiles
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists avatar_eyes  text,
  add column if not exists avatar_mouth text;

-- Backfill existing rows
update public.profiles
set avatar_eyes = 'eyes_1'
where avatar_eyes is null or btrim(avatar_eyes) = '';

update public.profiles
set avatar_mouth = 'mouth_1'
where avatar_mouth is null or btrim(avatar_mouth) = '';

-- Defaults for new rows
alter table public.profiles
  alter column avatar_eyes  set default 'eyes_1',
  alter column avatar_mouth set default 'mouth_1';

-- Enforce NOT NULL (prevents the "null value violates not-null constraint" issues)
alter table public.profiles
  alter column avatar_eyes  set not null,
  alter column avatar_mouth set not null;

-- ------------------------------------------------------------
-- 2) Update the performance RPC wrappers to also return eyes/mouth
--    These are the same RPC names you already deployed in:
--    SUPABASE_avatar_performance_rpcs.sql
-- ------------------------------------------------------------

-- ----------------------------
-- search_users_with_avatar(p_query text)
-- ----------------------------
drop function if exists public.search_users_with_avatar(text);

create function public.search_users_with_avatar(p_query text)
returns table (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  relationship text,
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
    s.user_id,
    s.username,
    s.display_name,
    s.avatar_url,
    s.relationship,
    coalesce(p.avatar_id, 'hedgehog') as avatar_id,
    coalesce(p.avatar_color, '#FFFFFF') as avatar_color,
    coalesce(p.avatar_accessory, 'none') as avatar_accessory,
    coalesce(p.avatar_frame, 'none') as avatar_frame,
    coalesce(p.avatar_eyes, 'eyes_1') as avatar_eyes,
    coalesce(p.avatar_mouth, 'mouth_1') as avatar_mouth
  from public.search_users(p_query) s
  left join public.profiles p on p.id = s.user_id;
$$;

-- ----------------------------
-- get_my_friends_v2_with_avatar()
-- ----------------------------
drop function if exists public.get_my_friends_v2_with_avatar();

create function public.get_my_friends_v2_with_avatar()
returns table (
  friend_user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  weekly_xp bigint,
  streak integer,
  mutual_count integer,
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
    f.avatar_url,
    f.weekly_xp,
    f.streak,
    coalesce(f.mutual_count, 0) as mutual_count,
    coalesce(p.avatar_id, 'hedgehog') as avatar_id,
    coalesce(p.avatar_color, '#FFFFFF') as avatar_color,
    coalesce(p.avatar_accessory, 'none') as avatar_accessory,
    coalesce(p.avatar_frame, 'none') as avatar_frame,
    coalesce(p.avatar_eyes, 'eyes_1') as avatar_eyes,
    coalesce(p.avatar_mouth, 'mouth_1') as avatar_mouth
  from public.get_my_friends_v2() f
  left join public.profiles p on p.id = f.friend_user_id;
$$;

-- ----------------------------
-- get_my_friend_requests_with_avatar()
-- ----------------------------
drop function if exists public.get_my_friend_requests_with_avatar();

create function public.get_my_friend_requests_with_avatar()
returns table (
  request_id uuid,
  direction text,
  friend_user_id uuid,
  username text,
  display_name text,
  avatar_url text,
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
    r.direction,
    r.friend_user_id,
    r.username,
    r.display_name,
    r.avatar_url,
    r.created_at,
    coalesce(p.avatar_id, 'hedgehog') as avatar_id,
    coalesce(p.avatar_color, '#FFFFFF') as avatar_color,
    coalesce(p.avatar_accessory, 'none') as avatar_accessory,
    coalesce(p.avatar_frame, 'none') as avatar_frame,
    coalesce(p.avatar_eyes, 'eyes_1') as avatar_eyes,
    coalesce(p.avatar_mouth, 'mouth_1') as avatar_mouth
  from public.get_my_friend_requests() r
  left join public.profiles p on p.id = r.friend_user_id;
$$;

grant execute on function public.search_users_with_avatar(text) to authenticated;
grant execute on function public.get_my_friends_v2_with_avatar() to authenticated;
grant execute on function public.get_my_friend_requests_with_avatar() to authenticated;

commit;
