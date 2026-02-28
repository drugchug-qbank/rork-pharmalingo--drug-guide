import type { ImageSourcePropType } from 'react-native';

export type AvatarDef = {
  id: string;
  label: string;
  /**
   * "full" is kept for backwards compatibility with existing code.
   * Since we're now head-only, "full" points to the same asset as "head".
   */
  full: ImageSourcePropType;
  head: ImageSourcePropType;
};

// Pick whatever default you want new users to start with.
export const DEFAULT_AVATAR_ID = 'beaver';

/**
 * IMPORTANT:
 * React Native/Expo requires static image requires.
 * That’s why this is a hard-coded map, not a dynamic string path.
 *
 * Folder + file names are CASE-SENSITIVE in the build environment.
 */
export const AVATARS: AvatarDef[] = [
  {
    id: 'cat',
    label: 'Cat',
    head: require('../assets/avatars/head_256/Cat_Head.png'),
    full: require('../assets/avatars/head_256/Cat_Head.png'),
  },
  {
    id: 'hedgehog',
    label: 'Hedgehog',
    head: require('../assets/avatars/head_256/Hedgehog_Head.png'),
    full: require('../assets/avatars/head_256/Hedgehog_Head.png'),
  },
  {
    id: 'giraffe',
    label: 'Giraffe',
    head: require('../assets/avatars/head_256/Giraffe_Head.png'),
    full: require('../assets/avatars/head_256/Giraffe_Head.png'),
  },
  {
    id: 'frog',
    label: 'Frog',
    head: require('../assets/avatars/head_256/Frog_Head.png'),
    full: require('../assets/avatars/head_256/Frog_Head.png'),
  },
  {
    id: 'elephant',
    label: 'Elephant',
    head: require('../assets/avatars/head_256/Elephant_Head.png'),
    full: require('../assets/avatars/head_256/Elephant_Head.png'),
  },
  {
    id: 'bird',
    label: 'Bird',
    head: require('../assets/avatars/head_256/Bird_Head.png'),
    full: require('../assets/avatars/head_256/Bird_Head.png'),
  },
  {
    id: 'monkey',
    label: 'Monkey',
    head: require('../assets/avatars/head_256/Monkey_Head.png'),
    full: require('../assets/avatars/head_256/Monkey_Head.png'),
  },
  {
    id: 'beaver',
    label: 'Beaver',
    head: require('../assets/avatars/head_256/Beaver_Head.png'),
    full: require('../assets/avatars/head_256/Beaver_Head.png'),
  },

  // NOTE: The new asset pack uses Bunny_Head.png.
  // We keep the avatar id as "rabbit" so existing user data doesn't break.
  {
    id: 'rabbit',
    label: 'Rabbit',
    head: require('../assets/avatars/head_256/Bunny_Head.png'),
    full: require('../assets/avatars/head_256/Bunny_Head.png'),
  },

  {
    id: 'lion',
    label: 'Lion',
    head: require('../assets/avatars/head_256/Lion_Head.png'),
    full: require('../assets/avatars/head_256/Lion_Head.png'),
  },
  {
    id: 'octopus',
    label: 'Octopus',
    head: require('../assets/avatars/head_256/Octopus_Head.png'),
    full: require('../assets/avatars/head_256/Octopus_Head.png'),
  },
  {
    id: 'dragon',
    label: 'Dragon',
    head: require('../assets/avatars/head_256/Dragon_Head.png'),
    full: require('../assets/avatars/head_256/Dragon_Head.png'),
  },
  {
    id: 'owl',
    label: 'Owl',
    head: require('../assets/avatars/head_256/Owl_Head.png'),
    full: require('../assets/avatars/head_256/Owl_Head.png'),
  },
  {
    id: 'horse',
    label: 'Horse',
    head: require('../assets/avatars/head_256/Horse_Head.png'),
    full: require('../assets/avatars/head_256/Horse_Head.png'),
  },
  {
    id: 'panda',
    label: 'Panda',
    head: require('../assets/avatars/head_256/Panda_Head.png'),
    full: require('../assets/avatars/head_256/Panda_Head.png'),
  },
  {
    id: 'unicorn',
    label: 'Unicorn',
    head: require('../assets/avatars/head_256/Unicorn_Head.png'),
    full: require('../assets/avatars/head_256/Unicorn_Head.png'),
  },
  {
    id: 'sloth',
    label: 'Sloth',
    head: require('../assets/avatars/head_256/Sloth_Head.png'),
    full: require('../assets/avatars/head_256/Sloth_Head.png'),
  },
  {
    id: 'turtle',
    label: 'Turtle',
    head: require('../assets/avatars/head_256/Turtle_Head.png'),
    full: require('../assets/avatars/head_256/Turtle_Head.png'),
  },
  {
    id: 'seal',
    label: 'Seal',
    head: require('../assets/avatars/head_256/Seal_Head.png'),
    full: require('../assets/avatars/head_256/Seal_Head.png'),
  },
  {
    id: 'racoon',
    label: 'Racoon',
    head: require('../assets/avatars/head_256/Racoon_Head.png'),
    full: require('../assets/avatars/head_256/Racoon_Head.png'),
  },
];

const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(AVATARS.map((a) => [a.id, a]));

export function getAvatar(avatarId?: string | null): AvatarDef {
  const id = (avatarId ?? DEFAULT_AVATAR_ID).toLowerCase();
  return AVATAR_MAP[id] ?? AVATAR_MAP[DEFAULT_AVATAR_ID];
}
