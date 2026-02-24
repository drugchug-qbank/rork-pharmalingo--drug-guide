PharmaLingo UI Update (drop-in files)

How to apply:
1) In your repo root, copy each folder/file from this zip into the same path.
2) Overwrite/replace when prompted.
3) Restart your dev server (or re-run your Rork preview) so the UI refreshes.

Files included:
- components/StreakPill.tsx
- components/StreakFlameIcon.tsx
- components/XPIcon.tsx (NEW)
- components/ProfessionLeaderboardTab.tsx
- app/(tabs)/(learn)/index.tsx
- app/(tabs)/practice/index.tsx
- app/(tabs)/leaderboard/index.tsx
- app/(tabs)/shop/index.tsx
- app/(tabs)/profile/index.tsx

What changed in this drop:
- Top blue headers (Ranks/Shop/Profile): stronger separation
  - Thicker white outlines
  - "White‑blue" card fill so the cards don't blend into the blue gradient
- XP icon refresh
  - New consistent XP bolt icon (XPIcon)
  - Replaced mixed Zap variants (white/yellow) with a single bolt style
