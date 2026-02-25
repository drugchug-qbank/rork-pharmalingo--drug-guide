export type AvatarAccessoryId =
  | 'none'
  | 'crown'
  | 'star'
  | 'pill'
  | 'book'
  | 'heart'
  | 'sparkles';

export const DEFAULT_AVATAR_ACCESSORY: AvatarAccessoryId = 'none';

export const AVATAR_ACCESSORIES: Array<{
  id: AvatarAccessoryId;
  label: string;
  emoji: string | null;
}> = [
  { id: 'none', label: 'None', emoji: null },
  { id: 'crown', label: 'Crown', emoji: '👑' },
  { id: 'star', label: 'Star', emoji: '⭐️' },
  { id: 'sparkles', label: 'Sparkle', emoji: '✨' },
  { id: 'pill', label: 'Pill', emoji: '💊' },
  { id: 'book', label: 'Book', emoji: '📚' },
  { id: 'heart', label: 'Heart', emoji: '❤️' },
];
