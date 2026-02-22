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

export type QuizQuestionPhase = 'intro' | 'quiz' | 'review' | 'mastery';

export type QuizQuestionType =
  | 'brand_to_generic'
  | 'generic_to_brand'
  | 'indication'
  | 'not_indication'
  | 'side_effect'
  | 'not_side_effect'
  | 'dosing'
  | 'drug_class'
  | 'key_fact'
  | 'class_comparison'
  | 'suffix'
  | 'clinical_pearl'
  | 'true_false'
  | 'matching'
  | 'cloze'
  | 'multi_select'
  /** Multiple-choice item sourced from an external question bank (End Game). */
  | 'external_mcq';

export interface ClozeSpec {
  /**
   * Text split into parts surrounding blanks.
   * Example for 1 blank: ["ACE inhibitors end in ", "."]
   */
  parts: string[];
  /** Word bank shown to the user */
  wordBank: string[];
  /** Correct words in order of blanks */
  correctWords: string[];
}

/**
 * Pre-quiz "teaching slides" shown only on the first attempt for a subsection.
 * Designed to be short, high-yield, and tappable (facts reveal one-by-one).
 */
export interface TeachingSlide {
  /** Stable id within a deck (e.g., "ace", "arb") */
  id: string;
  /** Title shown at the top of the slide */
  title: string;
  /** Optional subheading (e.g., suffix hint) */
  subtitle?: string;
  /** Optional emoji shown beside the title */
  emoji?: string;
  /** Facts revealed one at a time as the user taps Next */
  facts: string[];
}

export interface TeachingSlideDeck {
  /** Deck title (usually matches the subsection title) */
  title: string;
  slides: TeachingSlide[];
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  /** Single-answer questions (multiple choice, true/false, etc.) */
  correctAnswer?: string;
  /** Multi-answer questions (select all that apply) */
  correctAnswers?: string[];
  options: string[];
  /** Some concept questions may not map 1:1 to a specific drug */
  drugId?: string;
  matchPairs?: MatchPair[];
  shuffledGenerics?: string[];
  cloze?: ClozeSpec;

  /**
   * Optional explanation shown after answering. If missing, we fall back to drug.keyFact.
   */
  explanation?: string;

  /**
   * Optional concept identifier (e.g., "m1-p2-ace-suffix") used to decide
   * whether to show (or re-show) introductory teaching items.
   */
  conceptId?: string;

  /**
   * Optional label for session mixing (intro vs quiz vs review vs mastery).
   */
  phase?: QuizQuestionPhase;
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

export interface ConceptMastery {
  mastered: boolean;
  correctStreak: number;
  wrongSinceMastered: number;
  lastSeenISO: string;
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
  conceptMastery: Record<string, ConceptMastery>;
  /** Tracks whether the user has seen the pre-quiz teaching deck for a subsection (partId). */
  teachingSlidesSeen: Record<string, boolean>;
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
  conceptMastery: {},
  teachingSlidesSeen: {},
  mistakeBank: [],
  level: 1,
};
