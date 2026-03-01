export type AvatarAccessoryId =
  | 'none'
  | 'crown'
  | 'star'
  | 'sparkle'
  | 'pill'
  | 'book'
  | 'heart';

export const DEFAULT_AVATAR_ACCESSORY: AvatarAccessoryId = 'none';

export type AvatarAccessoryDef = {
  id: AvatarAccessoryId;
  label: string;
  emoji: string;
  /** Coin cost to unlock (0 = free) */
  price: number;
  /** If true, newly created profiles should start with this unlocked */
  defaultUnlocked?: boolean;
};

// ⚠️ Keep this list small/simple for now — we can tweak prices and visuals later.
export const AVATAR_ACCESSORIES: AvatarAccessoryDef[] = [
  { id: 'none', label: 'None', emoji: '🚫', price: 0, defaultUnlocked: true },
  { id: 'crown', label: 'Crown', emoji: '👑', price: 120 },
  { id: 'star', label: 'Star', emoji: '⭐️', price: 80 },
  { id: 'sparkle', label: 'Sparkle', emoji: '✨', price: 60 },
  { id: 'pill', label: 'Pill', emoji: '💊', price: 40 },
  { id: 'book', label: 'Book', emoji: '📚', price: 40 },
  { id: 'heart', label: 'Heart', emoji: '❤️', price: 0, defaultUnlocked: true },
];

export function normalizeAccessoryId(input: any): AvatarAccessoryId {
  const raw = String(input ?? '')
    .trim()
    .toLowerCase();

  const ids = new Set(AVATAR_ACCESSORIES.map((a) => a.id));
  return (ids.has(raw as AvatarAccessoryId) ? (raw as AvatarAccessoryId) : DEFAULT_AVATAR_ACCESSORY);
}

export function getAccessoryDef(id: AvatarAccessoryId): AvatarAccessoryDef {
  return AVATAR_ACCESSORIES.find((a) => a.id === id) ?? AVATAR_ACCESSORIES[0];
}

export function getAccessoryPrice(id: AvatarAccessoryId): number {
  return getAccessoryDef(id).price;
}

export function isAccessoryUnlocked(unlocked: string[] | null | undefined, id: AvatarAccessoryId): boolean {
  const def = getAccessoryDef(id);
  if (def.price <= 0) return true;
  const set = new Set((unlocked ?? []).map((x) => String(x).trim().toLowerCase()));
  return set.has(id);
}
