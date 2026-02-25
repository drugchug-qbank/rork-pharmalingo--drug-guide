-- Sets a sane default for avatar_color and backfills any missing values.
-- Safe to run multiple times.

alter table public.profiles
  alter column avatar_color set default '#FFFFFF';

update public.profiles
set avatar_color = '#FFFFFF'
where avatar_color is null;
