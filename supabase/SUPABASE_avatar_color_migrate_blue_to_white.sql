-- Avatar color migration
--
-- If you previously used Colors.primary as the default avatar background,
-- your DB may have many rows with that blue value.
--
-- This script changes that legacy default to WHITE so everyone starts with a neutral background
-- (users can still pick a different color later).

begin;

-- 1) Convert legacy default blue (Colors.primary in this project) to white.
--    Colors.primary = '#0EA5E9'
update public.profiles
set avatar_color = '#FFFFFF'
where avatar_color is null
   or avatar_color = '#0EA5E9';

-- 2) Make sure new rows default to white
alter table public.profiles
  alter column avatar_color set default '#FFFFFF';

-- 3) Enforce NOT NULL (safe after the update above)
alter table public.profiles
  alter column avatar_color set not null;

commit;
