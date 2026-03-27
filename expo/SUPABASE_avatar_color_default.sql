-- Fix avatar_color NOT NULL save errors + default to white
-- Run this in Supabase SQL Editor (safe to run multiple times).

-- 1) Backfill any existing NULL avatar_color (just in case)
update profiles
set avatar_color = '#FFFFFF'
where avatar_color is null;

-- 2) Default new profiles to white if avatar_color isn't provided
alter table profiles
alter column avatar_color set default '#FFFFFF';

-- (Optional) If you *want* avatar_color to be allowed to be NULL instead,
-- you can drop the NOT NULL constraint with:
-- alter table profiles alter column avatar_color drop not null;
