export type LeagueTier = 'Bronze' | 'Silver' | 'Gold';

export interface LeagueWeekResult {
  previousTier: LeagueTier;
  newTier: LeagueTier;
  rank: number;
  xpEarned: number;
  promoted: boolean;
  demoted: boolean;
  stayed: boolean;
}

export interface Drug {
  id: string;
  brandName: string;
  genericName: string;
  drugClass: string;
  indications: string[];
  commonDosing: string;
  sideEffects: string[];
  keyFact: string;
}

export interface MatchPair {
  brand: string;
  generic: string;
  drugId: string;
}

export interface QuizQuestion {
  id: string;
  type: 'brand_to_generic' | 'generic_to_brand' | 'indication' | 'side_effect' | 'dosing' | 'drug_class' | 'matching';
  question: string;
  correctAnswer: string;
  options: string[];
  drugId: string;
  matchPairs?: MatchPair[];
  shuffledGenerics?: string[];
}

export interface LessonPart {
  id: string;
  title: string;
  description: string;
  drugIds: string[];
  questionCount: number;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  parts: LessonPart[];
}

export interface UserStats {
  xpTotal: number;
  xpThisWeek: number;
  streakCurrent: number;
  streakBest: number;
  lastActiveDateISO: string;
  hearts: number;
  heartsMax: number;
  coins: number;
  lessonsCompleted: number;
  accuracyCorrect: number;
  accuracyTotal: number;
  selectedSchoolId: string | null;
  selectedSchoolName: string | null;
  streakSaves: number;
  xpToday: number;
  dailyGoalXP: number;
  lastXpDateISO: string;
  lastDailyRewardDateISO: string;
  nextHeartAtISO: string;
  remindersEnabled: boolean;
  leagueTier: LeagueTier;
  leagueWeekStartISO: string;
  dailyQuestsDateISO: string;
  dailyQuestLessonsDone: number;
  dailyQuestHighestCombo: number;
  dailyQuestPracticeDone: number;
  dailyQuestClaimed1: boolean;
  dailyQuestClaimed2: boolean;
  dailyQuestClaimed3: boolean;
  doubleXpNextLesson: boolean;
  lastLootDateISO: string;
}

export interface MistakeBankEntry {
  drugId: string;
  questionType: string;
  dateISO: string;
  lessonId: string;
}

export interface DrugMastery {
  masteryLevel: number;
  lastSeenISO: string;
  nextReviewISO: string;
}

export interface DailyQuest {
  id: number;
  title: string;
  description: string;
  reward: number;
  current: number;
  target: number;
  claimed: boolean;
  completed: boolean;
}

export type LootRewardType = 'coins' | 'double_xp' | 'streak_save' | 'big_coins';

export interface LootReward {
  type: LootRewardType;
  amount: number;
  label: string;
  emoji: string;
}

export interface UserProgress {
  stats: UserStats;
  completedLessons: Record<string, number>;
  chapterProgress: Record<string, number>;
  drugMastery: Record<string, DrugMastery>;
  mistakeBank: MistakeBankEntry[];
  level: number;
}

export const DEFAULT_STATS: UserStats = {
  xpTotal: 0,
  xpThisWeek: 0,
  streakCurrent: 0,
  streakBest: 0,
  lastActiveDateISO: '',
  hearts: 5,
  heartsMax: 5,
  coins: 50,
  lessonsCompleted: 0,
  accuracyCorrect: 0,
  accuracyTotal: 0,
  selectedSchoolId: null,
  selectedSchoolName: null,
  streakSaves: 0,
  xpToday: 0,
  dailyGoalXP: 50,
  lastXpDateISO: '',
  lastDailyRewardDateISO: '',
  nextHeartAtISO: '',
  remindersEnabled: false,
  leagueTier: 'Bronze' as LeagueTier,
  leagueWeekStartISO: '',
  dailyQuestsDateISO: '',
  dailyQuestLessonsDone: 0,
  dailyQuestHighestCombo: 0,
  dailyQuestPracticeDone: 0,
  dailyQuestClaimed1: false,
  dailyQuestClaimed2: false,
  dailyQuestClaimed3: false,
  doubleXpNextLesson: false,
  lastLootDateISO: '',
};

export const DEFAULT_PROGRESS: UserProgress = {
  stats: { ...DEFAULT_STATS },
  completedLessons: {},
  chapterProgress: {},
  drugMastery: {},
  mistakeBank: [],
  level: 1,
};
