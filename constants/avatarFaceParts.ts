// Avatar face parts (eyes + mouths)
//
// IMPORTANT: Do NOT make the require() paths dynamic.
// Metro needs static strings.

export type AvatarEyesId = 'eyes_1' | 'eyes_2' | 'eyes_3';
export type AvatarMouthId = 'mouth_1' | 'mouth_2' | 'mouth_3' | 'mouth_4';

export type AvatarFacePart<TId extends string> = {
  id: TId;
  label: string;
  image: any; // require('...')
};

export const DEFAULT_AVATAR_EYES_ID: AvatarEyesId = 'eyes_1';
export const DEFAULT_AVATAR_MOUTH_ID: AvatarMouthId = 'mouth_1';

export const AVATAR_EYES: AvatarFacePart<AvatarEyesId>[] = [
  {
    id: 'eyes_1',
    label: 'Classic',
    image: require('../assets/avatars/face_parts_512/eyes_1.png'),
  },
  {
    id: 'eyes_2',
    label: 'Bright',
    image: require('../assets/avatars/face_parts_512/eyes_2.png'),
  },
  {
    id: 'eyes_3',
    label: 'Sparkle',
    image: require('../assets/avatars/face_parts_512/eyes_3.png'),
  },
];

export const AVATAR_MOUTHS: AvatarFacePart<AvatarMouthId>[] = [
  {
    id: 'mouth_1',
    label: 'Tongue',
    image: require('../assets/avatars/face_parts_512/mouth_1.png'),
  },
  {
    id: 'mouth_2',
    label: 'Smile',
    image: require('../assets/avatars/face_parts_512/mouth_2.png'),
  },
  {
    id: 'mouth_3',
    label: 'Tongue 2',
    image: require('../assets/avatars/face_parts_512/mouth_3.png'),
  },
  {
    id: 'mouth_4',
    label: 'Lips',
    image: require('../assets/avatars/face_parts_512/mouth_4.png'),
  },
];

export function normalizeEyesId(input?: string | null): AvatarEyesId {
  const v = (input ?? '').trim() as AvatarEyesId;
  return (AVATAR_EYES.some((x) => x.id === v) ? v : DEFAULT_AVATAR_EYES_ID) as AvatarEyesId;
}

export function normalizeMouthId(input?: string | null): AvatarMouthId {
  const v = (input ?? '').trim() as AvatarMouthId;
  return (AVATAR_MOUTHS.some((x) => x.id === v) ? v : DEFAULT_AVATAR_MOUTH_ID) as AvatarMouthId;
}

export function getEyesDef(id?: string | null): AvatarFacePart<AvatarEyesId> {
  const normalized = normalizeEyesId(id);
  return AVATAR_EYES.find((x) => x.id === normalized) ?? AVATAR_EYES[0];
}

export function getMouthDef(id?: string | null): AvatarFacePart<AvatarMouthId> {
  const normalized = normalizeMouthId(id);
  return AVATAR_MOUTHS.find((x) => x.id === normalized) ?? AVATAR_MOUTHS[0];
}
