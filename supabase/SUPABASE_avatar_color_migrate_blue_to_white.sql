-- Optional one-time cleanup:
-- If you previously used a "default blue" background, this converts it to white.
-- Run this ONCE (before you let users pick colors in production).

update public.profiles
set avatar_color = '#FFFFFF'
where avatar_color in (
  '#0EA5E9', -- current Colors.primary in the app
  '#1D4ED8'  -- legacy default blue
);
