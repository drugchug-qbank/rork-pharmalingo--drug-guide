// Face part overlays (eyes + mouths) used by the Duolingo-style avatar builder.
//
// Design goal:
// - Eyes/mouth PNGs should be transparent.
// - Ideally, they are aligned to the same square canvas as the base "blank" head.
//
// If a specific eyes/mouth asset is slightly off, use `offsetX/offsetY/scale` below
// (fraction of avatar size) instead of editing layout code.

export type AvatarEyesId = 'none' | 'eyes_default' | 'eyes_round' | 'eyes_sparkle';
export type AvatarMouthId = 'none' | 'mouth_smile' | 'mouth_open' | 'mouth_tongue' | 'mouth_pout';

export type AvatarFacePart = {
  id: string;
  label: string;
  image?: any;

  /**
   * Optional tuning for alignment.
   *
   * Values are expressed as fractions of avatar size.
   * Example: offsetY: -0.1 means move up by 10% of the avatar size.
   */
  scale?: number;
  offsetX?: number;
  offsetY?: number;
};

export const AVATAR_EYES: AvatarFacePart[] = [
  { id: 'none', label: 'None' },

  // These new assets tend to sit a little low in the canvas,
  // so we nudge them upward slightly.
  { id: 'eyes_default', label: 'Default', image: require('../assets/avatars/face_parts_512/eyes_1.png'), offsetY: -0.14 },
  { id: 'eyes_round', label: 'Round', image: require('../assets/avatars/face_parts_512/eyes_2.png'), offsetY: -0.14 },

  // Sparkle eyes are already centered well.
  { id: 'eyes_sparkle', label: 'Sparkle', image: require('../assets/avatars/face_parts_512/eyes_3.png') },
];

export const AVATAR_MOUTHS: AvatarFacePart[] = [
  { id: 'none', label: 'None' },

  { id: 'mouth_smile', label: 'Smile', image: require('../assets/avatars/face_parts_512/mouth_1.png') },
  { id: 'mouth_open', label: 'Open', image: require('../assets/avatars/face_parts_512/mouth_2.png') },
  { id: 'mouth_tongue', label: 'Tongue', image: require('../assets/avatars/face_parts_512/mouth_3.png') },

  // This mouth asset is lower than the others; nudge up.
  { id: 'mouth_pout', label: 'Pout', image: require('../assets/avatars/face_parts_512/mouth_4.png'), offsetY: -0.14 },
];

export function getEyesDef(input?: string | null): AvatarFacePart | null {
  const id = normalizeEyesId(input);
  if (id === 'none') return null;
  return AVATAR_EYES.find((e) => e.id === id) ?? null;
}

export function getMouthDef(input?: string | null): AvatarFacePart | null {
  const id = normalizeMouthId(input);
  if (id === 'none') return null;
  return AVATAR_MOUTHS.find((m) => m.id === id) ?? null;
}

export function normalizeEyesId(input?: string | null): AvatarEyesId {
  const v = String(input ?? '').trim().toLowerCase();
  const found = AVATAR_EYES.find((e) => e.id === v);
  return (found?.id ?? 'none') as AvatarEyesId;
}

export function normalizeMouthId(input?: string | null): AvatarMouthId {
  const v = String(input ?? '').trim().toLowerCase();
  const found = AVATAR_MOUTHS.find((m) => m.id === v);
  return (found?.id ?? 'none') as AvatarMouthId;
}
