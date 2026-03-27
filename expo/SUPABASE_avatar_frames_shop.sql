-- Avatar cosmetics (accessories + frames + unlocks)
-- Run this in Supabase SQL Editor.

-- 1) Add new columns (safe to run multiple times)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_accessory text,
  ADD COLUMN IF NOT EXISTS avatar_frame text,
  ADD COLUMN IF NOT EXISTS unlocked_avatar_accessories text[],
  ADD COLUMN IF NOT EXISTS unlocked_avatar_frames text[];

-- 2) Backfill defaults for existing users
UPDATE public.profiles
SET avatar_accessory = COALESCE(avatar_accessory, 'none')
WHERE avatar_accessory IS NULL;

UPDATE public.profiles
SET avatar_frame = COALESCE(avatar_frame, 'none')
WHERE avatar_frame IS NULL;

-- Default unlocked cosmetics:
-- - accessories: none + heart
-- - frames: none
UPDATE public.profiles
SET unlocked_avatar_accessories = COALESCE(unlocked_avatar_accessories, ARRAY['none','heart']::text[])
WHERE unlocked_avatar_accessories IS NULL;

UPDATE public.profiles
SET unlocked_avatar_frames = COALESCE(unlocked_avatar_frames, ARRAY['none']::text[])
WHERE unlocked_avatar_frames IS NULL;

-- 3) Enforce NOT NULL + defaults going forward
ALTER TABLE public.profiles
  ALTER COLUMN avatar_accessory SET DEFAULT 'none',
  ALTER COLUMN avatar_accessory SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN avatar_frame SET DEFAULT 'none',
  ALTER COLUMN avatar_frame SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN unlocked_avatar_accessories SET DEFAULT ARRAY['none','heart']::text[],
  ALTER COLUMN unlocked_avatar_accessories SET NOT NULL;

ALTER TABLE public.profiles
  ALTER COLUMN unlocked_avatar_frames SET DEFAULT ARRAY['none']::text[],
  ALTER COLUMN unlocked_avatar_frames SET NOT NULL;
