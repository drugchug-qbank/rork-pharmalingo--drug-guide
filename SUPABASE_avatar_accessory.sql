-- Avatar Accessories (optional)
-- Adds profiles.avatar_accessory so users can add a small emoji accessory overlay on their avatar.
-- Safe to run multiple times.

alter table public.profiles
  add column if not exists avatar_accessory text;

-- Backfill existing rows
update public.profiles
set avatar_accessory = 'none'
where avatar_accessory is null;

-- Enforce default + not-null going forward
alter table public.profiles
  alter column avatar_accessory set default 'none';

alter table public.profiles
  alter column avatar_accessory set not null;
