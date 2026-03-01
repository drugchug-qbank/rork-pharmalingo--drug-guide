-- =========================================================
-- Avatar Performance RPCs (avoid N+1 profile queries)
-- =========================================================
-- What this does:
--   - Adds new RPCs that return avatar fields directly:
--       • search_users_with_avatar(p_query)
--       • get_my_friends_v2_with_avatar()
--       • get_my_friend_requests_with_avatar()
--
-- Why:
--   Your app was doing lots of small `.from('profiles')` lookups
--   (one per row) to render avatars. These RPCs join profiles once
--   on the server, so the client gets everything in one response.
--
-- Notes:
--   • These wrapper RPCs call your existing RPCs and then join to profiles.
--   • If you run "SELECT ..." tests in the SQL editor, you may see
--     "Not authenticated" — that’s normal because auth.uid() is null there.
--     They will work when called from your app (authenticated user).
-- =========================================================

-- 1) Search users + avatar fields
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
  avatar_frame text
)
language sql
security definer
set search_path = public
as $$
  select
    (s.user_id)::uuid as user_id,
    s.username::text as username,
    s.display_name::text as display_name,
    s.avatar_url::text as avatar_url,
    s.relationship::text as relationship,
    coalesce(p.avatar_id::text, 'beaver') as avatar_id,
    coalesce(p.avatar_color::text, '#FFFFFF') as avatar_color,
    coalesce(p.avatar_accessory::text, 'none') as avatar_accessory,
    coalesce(p.avatar_frame::text, 'none') as avatar_frame
  from public.search_users(p_query) s
  left join public.profiles p
    on p.id = (s.user_id)::uuid;
$$;

grant execute on function public.search_users_with_avatar(text) to authenticated;


-- 2) Friends list + avatar fields
drop function if exists public.get_my_friends_v2_with_avatar();

create function public.get_my_friends_v2_with_avatar()
returns table (
  friend_user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  weekly_xp numeric,
  streak integer,
  mutual_count integer,
  avatar_id text,
  avatar_color text,
  avatar_accessory text,
  avatar_frame text
)
language sql
security definer
set search_path = public
as $$
  select
    (f.friend_user_id)::uuid as friend_user_id,
    f.username::text as username,
    f.display_name::text as display_name,
    f.avatar_url::text as avatar_url,
    coalesce(f.weekly_xp, 0)::numeric as weekly_xp,
    coalesce(f.streak, 0)::int as streak,
    coalesce(f.mutual_count, 0)::int as mutual_count,
    coalesce(p.avatar_id::text, 'beaver') as avatar_id,
    coalesce(p.avatar_color::text, '#FFFFFF') as avatar_color,
    coalesce(p.avatar_accessory::text, 'none') as avatar_accessory,
    coalesce(p.avatar_frame::text, 'none') as avatar_frame
  from public.get_my_friends_v2() f
  left join public.profiles p
    on p.id = (f.friend_user_id)::uuid;
$$;

grant execute on function public.get_my_friends_v2_with_avatar() to authenticated;


-- 3) Friend requests + avatar fields
drop function if exists public.get_my_friend_requests_with_avatar();

create function public.get_my_friend_requests_with_avatar()
returns table (
  request_id uuid,
  direction text,
  friend_user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  created_at text,
  avatar_id text,
  avatar_color text,
  avatar_accessory text,
  avatar_frame text
)
language sql
security definer
set search_path = public
as $$
  select
    (r.request_id)::uuid as request_id,
    r.direction::text as direction,
    (r.friend_user_id)::uuid as friend_user_id,
    r.username::text as username,
    r.display_name::text as display_name,
    r.avatar_url::text as avatar_url,
    (r.created_at)::text as created_at,
    coalesce(p.avatar_id::text, 'beaver') as avatar_id,
    coalesce(p.avatar_color::text, '#FFFFFF') as avatar_color,
    coalesce(p.avatar_accessory::text, 'none') as avatar_accessory,
    coalesce(p.avatar_frame::text, 'none') as avatar_frame
  from public.get_my_friend_requests() r
  left join public.profiles p
    on p.id = (r.friend_user_id)::uuid;
$$;

grant execute on function public.get_my_friend_requests_with_avatar() to authenticated;
