// constants/avatarFrames.ts
// Defines avatar frame (border) options and helpers.
// NOTE: Keep this file dependency-free (no React Native imports) so it can be used everywhere.

export type AvatarFrameId = string;

export type AvatarFrameDef = {
  id: AvatarFrameId;
  label: string;
  /** Border (ring) color used by AvatarHead */
  borderColor: string;
  /** Border width used by AvatarHead */
  borderWidth: number;
  /** Coin price to unlock (0 = free/default) */
  price: number;
};

/** Default frame if user has not selected one */
export const DEFAULT_AVATAR_FRAME: AvatarFrameId = 'none';

/**
 * Frame catalog.
 * You can add more frames later without changing the rest of the app
 * (just append a new object here).
 */
export const AVATAR_FRAMES: AvatarFrameDef[] = [
  { id: 'none', label: 'None', borderColor: 'transparent', borderWidth: 0, price: 0 },

  // Free / starter frames
  { id: 'bronze', label: 'Bronze', borderColor: '#CD7F32', borderWidth: 3, price: 0 },
  { id: 'silver', label: 'Silver', borderColor: '#C0C0C0', borderWidth: 3, price: 0 },
  { id: 'gold', label: 'Gold', borderColor: '#FFD700', borderWidth: 3, price: 0 },

  // Paid / shop frames (example placeholders)
  { id: 'neon', label: 'Neon', borderColor: '#22C55E', borderWidth: 3, price: 250 },
  { id: 'midnight', label: 'Midnight', borderColor: '#111827', borderWidth: 3, price: 250 },
  { id: 'rainbow', label: 'Rainbow', borderColor: '#A855F7', borderWidth: 3, price: 500 },
];

export function normalizeFrameId(input?: string | null): AvatarFrameId {
  const raw = String(input ?? '').trim().toLowerCase();
  if (!raw) return DEFAULT_AVATAR_FRAME;

  // If the id exists in our catalog, use it; otherwise fall back safely
  const exists = AVATAR_FRAMES.some((f) => String(f.id).toLowerCase() === raw);
  return exists ? raw : DEFAULT_AVATAR_FRAME;
}

export function getFrameDef(input?: string | null): AvatarFrameDef {
  const id = normalizeFrameId(input);
  return (
    AVATAR_FRAMES.find((f) => String(f.id).toLowerCase() === id) ??
    AVATAR_FRAMES[0] ??
    { id: DEFAULT_AVATAR_FRAME, label: 'None', borderColor: 'transparent', borderWidth: 0, price: 0 }
  );
}

/** Used by AvatarEditorScreen to show the cost for locked frames */
export function getFramePrice(frameId?: string | null): number {
  return Number(getFrameDef(frameId).price ?? 0) || 0;
}

export function isFrameUnlocked(frameId: string, unlockedFrames?: string[] | null): boolean {
  const id = normalizeFrameId(frameId);
  if (id === DEFAULT_AVATAR_FRAME) return true; // "none" is always unlocked

  const list = Array.isArray(unlockedFrames) ? unlockedFrames : [];
  return list.map((x) => String(x).toLowerCase()).includes(String(id).toLowerCase());
}
