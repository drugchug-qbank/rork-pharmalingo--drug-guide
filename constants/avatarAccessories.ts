// Avatar accessories (cosmetics) + helper functions
//
// NOTE: This file is intentionally small + stable, because it's imported by UI screens.
// Keep exports backward-compatible.

export type AvatarAccessoryId =
  | 'none'
  | 'crown'
  | 'star'
  | 'sparkle'
  | 'pill'
  | 'book'
  | 'heart';

export type AvatarAccessoryDef = {
  id: AvatarAccessoryId;
  label: string;
  /** Optional image overlay (recommended). If omitted, UI can fall back to emoji/text. */
  image?: any;
  /**
   * Scale multiplier applied in AvatarHead.
   * 1.0 = fill the avatar circle.
   */
  scale?: number;
  /**
   * Price in coins (for future shop/unlocks).
   * 0 means free.
   */
  price: number;
};

// If you add new accessories, also update AvatarAccessoryId above.
export const AVATAR_ACCESSORIES: AvatarAccessoryDef[] = [
  { id: 'none', label: 'None', price: 0 },

  // You can replace these with proper PNG overlays later.
  // Keeping prices here makes it easy to build the Shop/unlocks flow.
  { id: 'crown', label: 'Crown', price: 250 },
  { id: 'star', label: 'Star', price: 150 },
  { id: 'sparkle', label: 'Sparkle', price: 200 },
  { id: 'pill', label: 'Pill', price: 100 },
  { id: 'book', label: 'Book', price: 100 },
  { id: 'heart', label: 'Heart', price: 75 },
];

export function normalizeAccessoryId(input?: string | null): AvatarAccessoryId {
  const v = String(input ?? '').trim().toLowerCase();
  const found = AVATAR_ACCESSORIES.find((a) => a.id === (v as AvatarAccessoryId));
  return (found?.id ?? 'none') as AvatarAccessoryId;
}

export function getAccessoryDef(input?: string | null): AvatarAccessoryDef {
  const id = normalizeAccessoryId(input);
  return AVATAR_ACCESSORIES.find((a) => a.id === id) ?? AVATAR_ACCESSORIES[0];
}

/**
 * ✅ FIX: some screens call getAccessoryPrice(), but older versions of this file didn't export it.
 */
export function getAccessoryPrice(input?: string | null): number {
  return getAccessoryDef(input).price ?? 0;
}

/**
 * Placeholder unlock logic.
 *
 * Later, when you add an avatar shop, you can replace this with:
 * - a Supabase table of unlocked cosmetics
 * - or a JSON array in profiles
 */
export function isAccessoryUnlocked(_accessoryId: AvatarAccessoryId, _unlockedIds?: string[] | null): boolean {
  // For now, everything is unlocked.
  return true;
}
