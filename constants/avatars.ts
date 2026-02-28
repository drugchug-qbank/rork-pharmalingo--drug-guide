/**
 * Avatar asset registry.
 *
 * NOTE:
 * - We are moving to a "head-only" avatar style.
 * - For backward compatibility, we still export `full`, but it currently points
 *   to the same head image (so old `variant="full"` code keeps working).
 * - We also keep the legacy id `rabbit` (stored in Supabase for some users)
 *   but map it to the new Bunny head image.
 */

export type AvatarAsset = {
  id: string;
  label: string;
  head: any;
  full: any;
};

export const DEFAULT_AVATAR_ID = 'beaver';

export const AVATARS: AvatarAsset[] = [
  {
    id: 'beaver',
    label: 'Beaver',
    head: require('../assets/avatars/head_256/Beaver_Head.png'),
    full: require('../assets/avatars/head_256/Beaver_Head.png'),
  },
  {
    id: 'bird',
    label: 'Bird',
    head: require('../assets/avatars/head_256/Bird_Head.png'),
    full: require('../assets/avatars/head_256/Bird_Head.png'),
  },
  {
    id: 'cat',
    label: 'Cat',
    head: require('../assets/avatars/head_256/Cat_Head.png'),
    full: require('../assets/avatars/head_256/Cat_Head.png'),
  },
  {
    id: 'dragon',
    label: 'Dragon',
    head: require('../assets/avatars/head_256/Dragon_Head.png'),
    full: require('../assets/avatars/head_256/Dragon_Head.png'),
  },
  {
    id: 'elephant',
    label: 'Elephant',
    head: require('../assets/avatars/head_256/Elephant_Head.png'),
    full: require('../assets/avatars/head_256/Elephant_Head.png'),
  },
  {
    id: 'frog',
    label: 'Frog',
    head: require('../assets/avatars/head_256/Frog_Head.png'),
    full: require('../assets/avatars/head_256/Frog_Head.png'),
  },
  {
    id: 'giraffe',
    label: 'Giraffe',
    head: require('../assets/avatars/head_256/Giraffe_Head.png'),
    full: require('../assets/avatars/head_256/Giraffe_Head.png'),
  },
  {
    id: 'hedgehog',
    label: 'Hedgehog',
    head: require('../assets/avatars/head_256/Hedgehog_Head.png'),
    full: require('../assets/avatars/head_256/Hedgehog_Head.png'),
  },
  {
    id: 'horse',
    label: 'Horse',
    head: require('../assets/avatars/head_256/Horse_Head.png'),
    full: require('../assets/avatars/head_256/Horse_Head.png'),
  },
  {
    id: 'lion',
    label: 'Lion',
    head: require('../assets/avatars/head_256/Lion_Head.png'),
    full: require('../assets/avatars/head_256/Lion_Head.png'),
  },
  {
    id: 'monkey',
    label: 'Monkey',
    head: require('../assets/avatars/head_256/Monkey_Head.png'),
    full: require('../assets/avatars/head_256/Monkey_Head.png'),
  },
  {
    id: 'octopus',
    label: 'Octopus',
    head: require('../assets/avatars/head_256/Octopus_Head.png'),
    full: require('../assets/avatars/head_256/Octopus_Head.png'),
  },
  {
    id: 'owl',
    label: 'Owl',
    head: require('../assets/avatars/head_256/Owl_Head.png'),
    full: require('../assets/avatars/head_256/Owl_Head.png'),
  },
  {
    id: 'panda',
    label: 'Panda',
    head: require('../assets/avatars/head_256/Panda_Head.png'),
    full: require('../assets/avatars/head_256/Panda_Head.png'),
  },
  {
    id: 'panda2',
    label: 'Panda 2',
    head: require('../assets/avatars/head_256/Panda2_Head.png'),
    full: require('../assets/avatars/head_256/Panda2_Head.png'),
  },
  {
    id: 'rabbit', // legacy id used in older builds / DB
    label: 'Rabbit',
    head: require('../assets/avatars/head_256/Bunny_Head.png'),
    full: require('../assets/avatars/head_256/Bunny_Head.png'),
  },
  {
    id: 'racoon', // file is spelled Racoon_Head.png
    label: 'Raccoon',
    head: require('../assets/avatars/head_256/Racoon_Head.png'),
    full: require('../assets/avatars/head_256/Racoon_Head.png'),
  },
  {
    id: 'seal',
    label: 'Seal',
    head: require('../assets/avatars/head_256/Seal_Head.png'),
    full: require('../assets/avatars/head_256/Seal_Head.png'),
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
    id: 'unicorn',
    label: 'Unicorn',
    head: require('../assets/avatars/head_256/Unicorn_Head.png'),
    full: require('../assets/avatars/head_256/Unicorn_Head.png'),
  },
];
