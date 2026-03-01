export type AvatarFrameId = 'none' | 'bronze' | 'silver' | 'gold' | 'neon' | 'midnight';

export const DEFAULT_AVATAR_FRAME: AvatarFrameId = 'none';

export type AvatarFrameDef = {
  id: AvatarFrameId;
  label: string;
  borderColor: string;
  /** Border thickness in px */
  borderWidth: number;
  /** Coin cost to unlock (0 = free) */
  price: number;
  defaultUnlocked?: boolean;
};

export const AVATAR_FRAMES: AvatarFrameDef[] = [
  { id: 'none', label: 'None', borderColor: 'transparent', borderWidth: 0, price: 0, defaultUnlocked: true },
  { id: 'bronze', label: 'Bronze', borderColor: '#CD7F32', borderWidth: 3, price: 40 },
  { id: 'silver', label: 'Silver', borderColor: '#9CA3AF', borderWidth: 3, price: 60 },
  { id: 'gold', label: 'Gold', borderColor: '#F59E0B', borderWidth: 3, price: 80 },
  { id: 'neon', label: 'Neon', borderColor: '#22C55E', borderWidth: 3, price: 100 },
  { id: 'midnight', label: 'Midnight', borderColor: '#111827', borderWidth: 3, price: 50 },
];

export function normalizeFrameId(input: any): AvatarFrameId {
  const raw = String(input ?? '')
    .trim()
    .toLowerCase();

  const ids = new Set(AVATAR_FRAMES.map((f) => f.id));
  return (ids.has(raw as AvatarFrameId) ? (raw as AvatarFrameId) : DEFAULT_AVATAR_FRAME);
}

export function getFrameDef(id: AvatarFrameId): AvatarFrameDef {
  return AVATAR_FRAMES.find((f) => f.id === id) ?? AVATAR_FRAMES[0];
}

export function isFrameUnlocked(unlocked: string[] | null | undefined, id: AvatarFrameId): boolean {
  const def = getFrameDef(id);
  if (def.price <= 0) return true;
  const set = new Set((unlocked ?? []).map((x) => String(x).trim().toLowerCase()));
  return set.has(id);
}
