AVATAR PATCH v5 (Friends + Requests + Search show avatar headshots)

How to apply (Idiot-proof overwrite):
1) Unzip this file.
2) Open the folder: avatar_patch_v5
3) Copy these folders INTO your repo root and allow overwrite/replace:
   - app
   - components
   - constants
   - supabase

That’s it. Then commit + push using GitHub Desktop.

What this patch changes:
- Leaderboard -> Friends tab:
  - Friends list now shows each friend's avatar headshot (UserAvatar) instead of 👤.
  - Friend Requests (incoming + outgoing) now show avatar headshots.
  - Username search suggestions now show avatar headshots.

- League list:
  - If the backend doesn't send avatar_id for a user yet, we fall back to UserAvatar(userId=...) so you still see a headshot.

- Avatar picker screen:
  - Includes background color swatches and saves BOTH avatar_id + avatar_color.

Supabase (optional but recommended right now):
- Run BOTH SQL files in Supabase SQL Editor (in this order):
  1) supabase/SUPABASE_avatar_color_default.sql
  2) supabase/SUPABASE_avatar_color_migrate_blue_to_white.sql

Those scripts will:
- Make the DEFAULT avatar_color white for new users.
- Convert the old default blue to white for existing users (so circles stop being blue).

If you already let users pick colors, skip the migrate script (it will convert those specific blues to white).
