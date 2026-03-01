import type { ImageSourcePropType } from 'react-native';

export type AvatarDef = {
  id: string;
  label: string;
  full: ImageSourcePropType;
  head: ImageSourcePropType;
};

export const DEFAULT_AVATAR_ID = 'cat';

/**
 * IMPORTANT:
 * React Native/Expo requires static image requires.
 * That’s why this is a hard-coded map, not a dynamic string path.
 */
export const AVATARS: AvatarDef[] = [
  {
    id: 'cat',
    label: 'Cat',
    full: require('../assets/avatars/full_1024/Cat.png'),
    head: require('../assets/avatars/head_256/Cat_Head.png'),
  },
  {
    id: 'hedgehog',
    label: 'Hedgehog',
    full: require('../assets/avatars/full_1024/HedgeHog.png'),
    head: require('../assets/avatars/head_256/HedgeHog_Head.png'),
  },
  {
    id: 'giraffe',
    label: 'Giraffe',
    full: require('../assets/avatars/full_1024/Giraffe.png'),
    head: require('../assets/avatars/head_256/Giraffe_Head.png'),
  },
  {
    id: 'frog',
    label: 'Frog',
    full: require('../assets/avatars/full_1024/Frog.png'),
    head: require('../assets/avatars/head_256/Frog_Head.png'),
  },
  {
    id: 'elephant',
    label: 'Elephant',
    full: require('../assets/avatars/full_1024/Elephant.png'),
    head: require('../assets/avatars/head_256/Elephant_Head.png'),
  },
  {
    id: 'bird',
    label: 'Bird',
    full: require('../assets/avatars/full_1024/Bird.png'),
    head: require('../assets/avatars/head_256/Bird_Head.png'),
  },
  {
    id: 'monkey',
    label: 'Monkey',
    full: require('../assets/avatars/full_1024/Monkey.png'),
    head: require('../assets/avatars/head_256/Monkey_Head.png'),
  },
  {
    id: 'beaver',
    label: 'Beaver',
    full: require('../assets/avatars/full_1024/Beaver.png'),
    head: require('../assets/avatars/head_256/Beaver_Head.png'),
  },
  {
    id: 'rabbit',
    label: 'Rabbit',
    full: require('../assets/avatars/full_1024/Rabbit.png'),
    head: require('../assets/avatars/head_256/Rabbit_Head.png'),
  },
  {
    id: 'lion',
    label: 'Lion',
    full: require('../assets/avatars/full_1024/Lion.png'),
    head: require('../assets/avatars/head_256/Lion_Head.png'),
  },
  {
    id: 'octopus',
    label: 'Octopus',
    full: require('../assets/avatars/full_1024/Octopus.png'),
    head: require('../assets/avatars/head_256/Octopus_Head.png'),
  },
  {
    id: 'dragon',
    label: 'Dragon',
    full: require('../assets/avatars/full_1024/Dragon.png'),
    head: require('../assets/avatars/head_256/Dragon_Head.png'),
  },
  {
    id: 'owl',
    label: 'Owl',
    full: require('../assets/avatars/full_1024/Owl.png'),
    head: require('../assets/avatars/head_256/Owl_Head.png'),
  },
  {
    id: 'horse',
    label: 'Horse',
    full: require('../assets/avatars/full_1024/Horse.png'),
    head: require('../assets/avatars/head_256/Horse_Head.png'),
  },
  {
    id: 'panda',
    label: 'Panda',
    full: require('../assets/avatars/full_1024/Panda.png'),
    head: require('../assets/avatars/head_256/Panda_Head.png'),
  },
  {
    id: 'unicorn',
    label: 'Unicorn',
    full: require('../assets/avatars/full_1024/Unicorn.png'),
    head: require('../assets/avatars/head_256/Unicorn_Head.png'),
  },
  {
    id: 'sloth',
    label: 'Sloth',
    full: require('../assets/avatars/full_1024/Sloth.png'),
    head: require('../assets/avatars/head_256/Sloth_Head.png'),
  },
  {
    id: 'turtle',
    label: 'Turtle',
    full: require('../assets/avatars/full_1024/Turtle.png'),
    head: require('../assets/avatars/head_256/Turtle_Head.png'),
  },
  {
    id: 'seal',
    label: 'Seal',
    full: require('../assets/avatars/full_1024/Seal.png'),
    head: require('../assets/avatars/head_256/Seal_Head.png'),
  },
  {
    id: 'racoon',
    label: 'Racoon',
    full: require('../assets/avatars/full_1024/Racoon.png'),
    head: require('../assets/avatars/head_256/Racoon_Head.png'),
  },
];

const AVATAR_MAP: Record<string, AvatarDef> = Object.fromEntries(
  AVATARS.map((a) => [a.id, a])
);

export function getAvatar(avatarId?: string | null): AvatarDef {
  const id = (avatarId ?? DEFAULT_AVATAR_ID).toLowerCase();
  return AVATAR_MAP[id] ?? AVATAR_MAP[DEFAULT_AVATAR_ID];
}