import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createContextHook from '@nkzw/create-context-hook';
import {
  UserProgress,
  UserStats,
  DrugMastery,
  ConceptMastery,
  MistakeBankEntry,
  LeagueTier,
  LeagueWeekResult,
  DailyQuest,
  LootReward,
  LootRewardType,
  DEFAULT_PROGRESS,
  DEFAULT_STATS,
} from '@/constants/types';
import { chapters } from '@/constants/chapters';
import {
  requestNotificationPermission,
  scheduleStreakReminder,
  cancelStreakReminder,
  scheduleHeartReminder,
  cancelHeartReminder,
  cancelAllReminders,
} from '@/utils/notifications';
import { useAuth } from '@/contexts/AuthContext';

const PROGRESS_KEY_PREFIX = 'pharmalingo_state_';
const LEGACY_PROGRESS_KEY = 'pharmalingo_progress_v2';

function getProgressKey(userId: string | null): string {
  if (userId) return `${PROGRESS_KEY_PREFIX}${userId}`;
  return LEGACY_PROGRESS_KEY;
}

const HEART_REGEN_MINUTES = 60;
const HEART_REGEN_MS = HEART_REGEN_MINUTES * 60 * 1000;

// ----------------------------
// ⭐ 3-Star "Gold Mastery" maps
// ----------------------------
// We increment stars ONLY for subsection lessons (chapter parts) in Modules 1–10.
// We intentionally exclude the End Game module (mod-11) and any non-part lessons (e.g. mastery-mod-*).
const PART_ID_TO_CHAPTER_ID: Record<string, string> = {};
for (const ch of chapters) {
  for (const p of ch.parts) {
    PART_ID_TO_CHAPTER_ID[p.id] = ch.id;
  }
}

function isStarEligibleLessonId(lessonId: string): boolean {
  const chapterId = PART_ID_TO_CHAPTER_ID[lessonId];
  if (!chapterId) return false;
  // Exclude End Game module
  if (chapterId === 'mod-11') return false;
  return true;
}

function seedStarsFromCompletions(
  completedLessons: Record<string, number> | undefined,
  existingStars: Record<string, number> | undefined
): Record<string, number> {
  const next = { ...(existingStars ?? {}) };
  const completed = completedLessons ?? {};

  for (const lessonId of Object.keys(completed)) {
    const score = completed[lessonId] ?? 0;
    // If they already passed before this feature existed, grant 1 starter star.
    if (score >= 70 && isStarEligibleLessonId(lessonId) && (next[lessonId] ?? 0) < 1) {
      next[lessonId] = 1;
    }
  }

  return next;
}

function isSameDay(d1: string, d2: string): boolean {
  if (!d1 || !d2) return false;
  return d1.slice(0, 10) === d2.slice(0, 10);
}

function isYesterday(d1: string, d2: string): boolean {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diff = date2.getTime() - date1.getTime();
  return diff > 0 && diff < 172800000 && date1.getDate() !== date2.getDate();
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

const LEAGUE_TIERS: LeagueTier[] = ['Bronze', 'Silver', 'Gold'];
const PROMOTE_THRESHOLD = 10;
const DEMOTE_THRESHOLD = 25;
const TOTAL_LEAGUE_PLAYERS = 30;

function getLeagueRank(xpThisWeek: number, tier: LeagueTier): number {
  const tierMultipliers: Record<LeagueTier, number> = { Bronze: 1, Silver: 1.5, Gold: 2 };
  const mult = tierMultipliers[tier];
  const seed = tier.length * 31 + TOTAL_LEAGUE_PLAYERS;
  const seededUsers = Array.from({ length: TOTAL_LEAGUE_PLAYERS - 1 }, (_, i) => {
    const val = ((seed * (i + 1) * 7 + 13) % 400 + 30) * mult;
    return Math.floor(val);
  }).sort((a, b) => b - a);
  let rank = 1;
  for (const xp of seededUsers) {
    if (xp > xpThisWeek) rank++;
  }
  return rank;
}

function promoteTier(current: LeagueTier): LeagueTier {
  const idx = LEAGUE_TIERS.indexOf(current);
  if (idx < LEAGUE_TIERS.length - 1) return LEAGUE_TIERS[idx + 1];
  return current;
}

function demoteTier(current: LeagueTier): LeagueTier {
  const idx = LEAGUE_TIERS.indexOf(current);
  if (idx > 0) return LEAGUE_TIERS[idx - 1];
  return current;
}

function computeWeekEndResult(xpThisWeek: number, currentTier: LeagueTier): LeagueWeekResult {
  const rank = getLeagueRank(xpThisWeek, currentTier);
  let newTier = currentTier;
  let promoted = false;
  let demoted = false;

  if (rank <= PROMOTE_THRESHOLD) {
    const promoted_tier = promoteTier(currentTier);
    if (promoted_tier !== currentTier) {
      newTier = promoted_tier;
      promoted = true;
    }
  } else if (rank >= DEMOTE_THRESHOLD) {
    const demoted_tier = demoteTier(currentTier);
    if (demoted_tier !== currentTier) {
      newTier = demoted_tier;
      demoted = true;
    }
  }

  return {
    previousTier: currentTier,
    newTier,
    rank,
    xpEarned: xpThisWeek,
    promoted,
    demoted,
    stayed: !promoted && !demoted,
  };
}

// Legacy migration (kept as-is; daily goal fields may still exist in stored data)
function migrateFromV1(stored: string): UserProgress | null {
  try {
    const old = JSON.parse(stored);
    if (old.stats) return old as UserProgress;

    const migrated: UserProgress = {
      stats: {
        xpTotal: old.xp ?? 0,
        xpThisWeek: 0,
        streakCurrent: old.streak ?? 0,
        streakBest: old.streak ?? 0,
        lastActiveDateISO: old.lastActiveDate ?? '',
        hearts: old.heartsRemaining ?? 5,
        heartsMax: 5,
        coins: old.coins ?? 50,
        lessonsCompleted: Object.values(old.completedLessons ?? {}).filter((s: unknown) => (s as number) >= 70)
          .length,
        accuracyCorrect: old.correctAnswers ?? 0,
        accuracyTotal: old.totalQuestionsAnswered ?? 0,
        selectedSchoolId: null,
        selectedSchoolName: null,
        streakSaves: 0,

        // legacy goal fields (unused now)
        xpToday: 0,
        dailyGoalXP: 50,
        lastXpDateISO: '',
        lastDailyRewardDateISO: '',

        nextHeartAtISO: '',
        remindersEnabled: false,
        leagueTier: 'Bronze',
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
      },
      completedLessons: old.completedLessons ?? {},
      lessonStars: seedStarsFromCompletions(old.completedLessons ?? {}, undefined),
      chapterProgress: old.chapterProgress ?? {},
      drugMastery: {},
      conceptMastery: {},
      teachingSlidesSeen: {},
      mistakeBank: [],
      level: old.level ?? 1,
    };
    return migrated;
  } catch {
    return null;
  }
}

function isMissedDay(lastActive: string, now: string): boolean {
  if (!lastActive) return false;
  const last = new Date(lastActive);
  const current = new Date(now);
  if (isSameDay(lastActive, now)) return false;
  if (isYesterday(lastActive, now)) return false;
  return last.getTime() < current.getTime();
}

function computeHeartRegen(
  hearts: number,
  heartsMax: number,
  nextHeartAtISO: string
): { hearts: number; nextHeartAtISO: string } {
  if (hearts >= heartsMax) return { hearts: heartsMax, nextHeartAtISO: '' };
  if (!nextHeartAtISO) {
    const next = new Date(Date.now() + HEART_REGEN_MS).toISOString();
    return { hearts, nextHeartAtISO: next };
  }
  const now = Date.now();
  const nextAt = new Date(nextHeartAtISO).getTime();
  if (now < nextAt) return { hearts, nextHeartAtISO };
  const elapsed = now - nextAt;
  const extraHearts = 1 + Math.floor(elapsed / HEART_REGEN_MS);
  const newHearts = Math.min(heartsMax, hearts + extraHearts);
  if (newHearts >= heartsMax) return { hearts: heartsMax, nextHeartAtISO: '' };
  const remainder = elapsed % HEART_REGEN_MS;
  const newNext = new Date(now - remainder + HEART_REGEN_MS).toISOString();
  return { hearts: newHearts, nextHeartAtISO: newNext };
}

export const [ProgressProvider, useProgress] = createContextHook(() => {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  const storageKey = getProgressKey(userId);
  const prevUserIdRef = useRef<string | null>(userId);

  const [progress, setProgress] = useState<UserProgress>(DEFAULT_PROGRESS);
  const [streakBreakPending, setStreakBreakPending] = useState<boolean>(false);
  const [streakBreakChecked, setStreakBreakChecked] = useState<boolean>(false);
  const streakCheckedForUserRef = useRef<string | null>(null);

  const [heartCountdownSeconds, setHeartCountdownSeconds] = useState<number>(0);
  const heartTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [leagueWeekResult, setLeagueWeekResult] = useState<LeagueWeekResult | null>(null);

  useEffect(() => {
    if (prevUserIdRef.current !== userId) {
      console.log(`[ProgressContext] User changed: ${prevUserIdRef.current} -> ${userId}`);
      const prevUserId = prevUserIdRef.current;
      prevUserIdRef.current = userId;

      setProgress(DEFAULT_PROGRESS);
      setStreakBreakPending(false);
      setStreakBreakChecked(false);
      streakCheckedForUserRef.current = null;
      setLeagueWeekResult(null);
      setHeartCountdownSeconds(0);

      if (prevUserId) {
        queryClient.removeQueries({ queryKey: ['progress', prevUserId] });
      }
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['progress', userId] });
      }
    }
  }, [userId, queryClient]);

  const progressQuery = useQuery({
    queryKey: ['progress', userId],
    queryFn: async () => {
      if (!userId) {
        console.log('[ProgressContext] No userId, returning defaults');
        return DEFAULT_PROGRESS;
      }
      const key = getProgressKey(userId);
      console.log(`[ProgressContext] Loading progress for user: ${userId}, key: ${key}`);
      const stored = await AsyncStorage.getItem(key);

      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Partial<UserProgress>;
          const merged: UserProgress = {
            ...DEFAULT_PROGRESS,
            ...parsed,
            stats: {
              ...DEFAULT_STATS,
              ...(parsed.stats ?? {}),
            },
            completedLessons: parsed.completedLessons ?? {},
            lessonStars: seedStarsFromCompletions(parsed.completedLessons ?? {}, (parsed as any).lessonStars),
            chapterProgress: parsed.chapterProgress ?? {},
            drugMastery: parsed.drugMastery ?? {},
            conceptMastery: (parsed as any).conceptMastery ?? {},
            teachingSlidesSeen: (parsed as any).teachingSlidesSeen ?? {},
            mistakeBank: parsed.mistakeBank ?? [],
            level: parsed.level ?? DEFAULT_PROGRESS.level,
          };
          console.log(`[ProgressContext] Loaded existing data for user ${userId}, xp: ${merged.stats?.xpTotal ?? 0}`);
          return merged;
        } catch (e) {
          console.log('[ProgressContext] Failed to parse stored data, returning defaults');
          await AsyncStorage.removeItem(key);
          return DEFAULT_PROGRESS;
        }
      }

      try {
        await AsyncStorage.removeItem(LEGACY_PROGRESS_KEY);
        await AsyncStorage.removeItem('pharmalingo_progress');
        await AsyncStorage.setItem('pharmalingo_legacy_migrated', 'done');
      } catch (e) {
        console.log('[ProgressContext] Legacy cleanup failed (ignored):', e);
      }

      console.log('[ProgressContext] No existing data for user, returning fresh defaults');
      return DEFAULT_PROGRESS;
    },
    enabled: !!userId,
    staleTime: 1000,
  });

  const userIdForSave = useRef<string | null>(userId);
  userIdForSave.current = userId;

  const saveMutation = useMutation({
    mutationFn: async (newProgress: UserProgress) => {
      const currentUserId = userIdForSave.current;
      if (!currentUserId) {
        console.log('[ProgressContext] No userId during save, skipping');
        return newProgress;
      }
      const key = getProgressKey(currentUserId);
      await AsyncStorage.setItem(key, JSON.stringify(newProgress));
      return newProgress;
    },
    onSuccess: (data) => {
      const currentUserId = userIdForSave.current;
      if (currentUserId) {
        queryClient.setQueryData(['progress', currentUserId], data);
      }
    },
  });

  const { mutate: saveProgress } = saveMutation;

  // Load-time safeguards:
  // - heart regen
  // - league week rollover
  // NOTE: Daily Goal is removed; Daily Quests reset is handled in quest update functions.
  useEffect(() => {
    if (!progressQuery.data) return;

    const data = progressQuery.data;

    const regen = computeHeartRegen(data.stats.hearts, data.stats.heartsMax, data.stats.nextHeartAtISO ?? '');
    console.log(
      `[Hearts] Regen check on load: ${data.stats.hearts} -> ${regen.hearts}, next: ${regen.nextHeartAtISO}`
    );

    const currentWeekStart = getWeekStart(new Date());
    const storedWeekStart = data.stats.leagueWeekStartISO || '';
    const needsWeekReset = storedWeekStart !== '' && storedWeekStart !== currentWeekStart;

    let weekResetStats: Partial<UserStats> = {};
    if (needsWeekReset) {
      console.log(
        `[League] New week detected (stored: ${storedWeekStart}, current: ${currentWeekStart}). Processing week end.`
      );
      const result = computeWeekEndResult(data.stats.xpThisWeek, data.stats.leagueTier || 'Bronze');
      console.log(
        `[League] Week result: rank=${result.rank}, ${
          result.promoted ? 'PROMOTED' : result.demoted ? 'DEMOTED' : 'STAYED'
        }`
      );
      setLeagueWeekResult(result);
      weekResetStats = {
        xpThisWeek: 0,
        leagueTier: result.newTier,
        leagueWeekStartISO: currentWeekStart,
      };
    } else if (!storedWeekStart) {
      weekResetStats = { leagueWeekStartISO: currentWeekStart };
    }

    const safeguarded: UserProgress = {
      ...data,
      lessonStars: seedStarsFromCompletions(data.completedLessons ?? {}, (data as any).lessonStars),
      stats: {
        ...data.stats,
        hearts: regen.hearts,
        nextHeartAtISO: regen.nextHeartAtISO,
        leagueTier: data.stats.leagueTier || 'Bronze',
        ...weekResetStats,
      },
      drugMastery: data.drugMastery ?? {},
      conceptMastery: (data as any).conceptMastery ?? {},
      teachingSlidesSeen: (data as any).teachingSlidesSeen ?? {},
      mistakeBank: data.mistakeBank ?? [],
    };

    setProgress(safeguarded);

    const heartsChanged =
      regen.hearts !== data.stats.hearts || regen.nextHeartAtISO !== (data.stats.nextHeartAtISO ?? '');
    const weekChanged = Object.keys(weekResetStats).length > 0;

    if (heartsChanged || weekChanged) {
      saveProgress(safeguarded);
    }
  }, [progressQuery.data, saveProgress]);

  const updateProgress = useCallback(
    (updater: (prev: UserProgress) => UserProgress) => {
      setProgress((prev) => {
        const next = updater(prev);
        saveProgress(next);
        return next;
      });
    },
    [saveProgress]
  );

  const updateStreakOnLessonComplete = useCallback(
    (nowISO: string, currentStats: UserStats): Pick<UserStats, 'streakCurrent' | 'streakBest' | 'lastActiveDateISO'> => {
      const lastActive = currentStats.lastActiveDateISO;

      if (isSameDay(lastActive, nowISO)) {
        return {
          streakCurrent: currentStats.streakCurrent,
          streakBest: currentStats.streakBest,
          lastActiveDateISO: nowISO,
        };
      }

      let newStreak: number;
      if (isYesterday(lastActive, nowISO)) {
        newStreak = currentStats.streakCurrent + 1;
        console.log(`[Streak] Continued streak: ${newStreak}`);
      } else {
        newStreak = 1;
        console.log(`[Streak] Streak reset to 1`);
      }

      return {
        streakCurrent: newStreak,
        streakBest: Math.max(currentStats.streakBest, newStreak),
        lastActiveDateISO: nowISO,
      };
    },
    []
  );

  // ✅ Daily Goal removed: addXP no longer tracks xpToday / lastXpDateISO / dailyGoalXP
  const addXP = useCallback(
    (amount: number, reason: string) => {
      console.log(`[XP] +${amount} XP — reason: ${reason}`);
      updateProgress((prev) => {
        const newXpTotal = prev.stats.xpTotal + amount;
        const now = new Date();
        const currentWeekStart = getWeekStart(now);
        const lastActiveWeekStart = prev.stats.lastActiveDateISO
          ? getWeekStart(new Date(prev.stats.lastActiveDateISO))
          : '';
        const xpThisWeek = currentWeekStart === lastActiveWeekStart ? prev.stats.xpThisWeek + amount : amount;

        return {
          ...prev,
          stats: {
            ...prev.stats,
            xpTotal: newXpTotal,
            xpThisWeek,
          },
          level: Math.floor(newXpTotal / 500) + 1,
        };
      });
    },
    [updateProgress]
  );

  const addCoins = useCallback(
    (amount: number, reason: string) => {
      console.log(`[Coins] +${amount} — reason: ${reason}`);
      updateProgress((prev) => ({
        ...prev,
        stats: { ...prev.stats, coins: prev.stats.coins + amount },
      }));
    },
    [updateProgress]
  );

  const spendCoins = useCallback(
    (amount: number, reason: string): boolean => {
      let success = false;
      console.log(`[Coins] Attempting to spend ${amount} — reason: ${reason}`);
      updateProgress((prev) => {
        if (prev.stats.coins >= amount) {
          success = true;
          console.log(`[Coins] Spent ${amount}, remaining: ${prev.stats.coins - amount}`);
          return {
            ...prev,
            stats: { ...prev.stats, coins: prev.stats.coins - amount },
          };
        }
        console.log(`[Coins] Insufficient funds: have ${prev.stats.coins}, need ${amount}`);
        return prev;
      });
      return success;
    },
    [updateProgress]
  );

  const loseHeart = useCallback(() => {
    console.log('[Hearts] Lost a heart');
    updateProgress((prev) => {
      const newHearts = Math.max(0, prev.stats.hearts - 1);
      const needsTimer = newHearts < prev.stats.heartsMax && !prev.stats.nextHeartAtISO;
      return {
        ...prev,
        stats: {
          ...prev.stats,
          hearts: newHearts,
          nextHeartAtISO: needsTimer ? new Date(Date.now() + HEART_REGEN_MS).toISOString() : prev.stats.nextHeartAtISO,
        },
      };
    });
  }, [updateProgress]);

  const refillHeartsFull = useCallback(() => {
    console.log('[Hearts] Refilled to max');
    updateProgress((prev) => ({
      ...prev,
      stats: { ...prev.stats, hearts: prev.stats.heartsMax, nextHeartAtISO: '' },
    }));
  }, [updateProgress]);

  const addHeart = useCallback(() => {
    updateProgress((prev) => {
      const newHearts = Math.min(prev.stats.heartsMax, prev.stats.hearts + 1);
      return {
        ...prev,
        stats: {
          ...prev.stats,
          hearts: newHearts,
          nextHeartAtISO: newHearts >= prev.stats.heartsMax ? '' : prev.stats.nextHeartAtISO,
        },
      };
    });
  }, [updateProgress]);

  const buyHeartWithCoins = useCallback(() => {
    updateProgress((prev) => {
      if (prev.stats.coins >= 30 && prev.stats.hearts < prev.stats.heartsMax) {
        console.log('[Shop] Bought 1 heart for 30 coins');
        const newHearts = Math.min(prev.stats.heartsMax, prev.stats.hearts + 1);
        return {
          ...prev,
          stats: {
            ...prev.stats,
            coins: prev.stats.coins - 30,
            hearts: newHearts,
            nextHeartAtISO: newHearts >= prev.stats.heartsMax ? '' : prev.stats.nextHeartAtISO,
          },
        };
      }
      return prev;
    });
  }, [updateProgress]);

  const buyFullRefillWithCoins = useCallback(() => {
    updateProgress((prev) => {
      if (prev.stats.coins >= 100 && prev.stats.hearts < prev.stats.heartsMax) {
        console.log('[Shop] Bought full refill for 100 coins');
        return {
          ...prev,
          stats: {
            ...prev.stats,
            coins: prev.stats.coins - 100,
            hearts: prev.stats.heartsMax,
            nextHeartAtISO: '',
          },
        };
      }
      return prev;
    });
  }, [updateProgress]);

  const selectSchool = useCallback(
    (schoolId: string | null, schoolName: string | null) => {
      console.log(`[School] Selected: ${schoolName ?? 'None'} (${schoolId ?? 'none'})`);
      updateProgress((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          selectedSchoolId: schoolId,
          selectedSchoolName: schoolName,
        },
      }));
    },
    [updateProgress]
  );

  const getMaxStreakSaves = useCallback((streak: number): number => {
    if (streak >= 365) return 3;
    if (streak >= 100) return 2;
    return 1;
  }, []);

  const buyStreakSave = useCallback(() => {
    updateProgress((prev) => {
      const maxSaves = getMaxStreakSaves(prev.stats.streakCurrent);
      const currentSaves = prev.stats.streakSaves ?? 0;
      if (currentSaves >= maxSaves) {
        console.log(`[Shop] Already at max streak saves (${currentSaves}/${maxSaves})`);
        return prev;
      }
      if (prev.stats.coins >= 200) {
        console.log(`[Shop] Bought streak save for 200 coins (${currentSaves + 1}/${maxSaves})`);
        return {
          ...prev,
          stats: {
            ...prev.stats,
            coins: prev.stats.coins - 200,
            streakSaves: currentSaves + 1,
          },
        };
      }
      console.log('[Shop] Not enough coins for streak save');
      return prev;
    });
  }, [updateProgress, getMaxStreakSaves]);

  const useStreakSave = useCallback(() => {
    console.log('[Streak] Using streak save');
    updateProgress((prev) => {
      const saves = prev.stats.streakSaves ?? 0;
      if (saves <= 0) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        stats: {
          ...prev.stats,
          streakSaves: saves - 1,
          lastActiveDateISO: now,
        },
      };
    });
    setStreakBreakPending(false);
  }, [updateProgress]);

  const acceptStreakBreak = useCallback(() => {
    console.log('[Streak] Accepting streak break');
    updateProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        streakCurrent: 0,
        lastActiveDateISO: new Date().toISOString(),
      },
    }));
    setStreakBreakPending(false);
  }, [updateProgress]);

  /**
   * Record *any* qualifying activity as "streak safe" for today.
   *
   * Used by special practice modes (e.g., Brand Blitz) that may award 0 XP/coins
   * but still want to count toward streak when the user performs well.
   */
  const recordStreakActivity = useCallback(
    (nowISO: string = new Date().toISOString()) => {
      updateProgress((prev) => {
        const streakUpdate = updateStreakOnLessonComplete(nowISO, prev.stats);
        return {
          ...prev,
          stats: {
            ...prev.stats,
            ...streakUpdate,
          },
        };
      });
      // If a streak-break prompt was pending, completing an activity should dismiss it.
      setStreakBreakPending(false);
    },
    [updateProgress]
  );

  const dismissStreakBreak = useCallback(() => {
    setStreakBreakPending(false);
  }, []);

  const checkStreakOnAppOpen = useCallback(
    (currentProgress: UserProgress) => {
      if (streakBreakChecked) return;
      if (!userId) return;
      if (streakCheckedForUserRef.current === userId) return;

      setStreakBreakChecked(true);
      streakCheckedForUserRef.current = userId;

      const { lastActiveDateISO, streakCurrent } = currentProgress.stats;
      if (!lastActiveDateISO || streakCurrent === 0) {
        console.log('[Streak] New/fresh account — no streak to break');
        return;
      }

      const now = new Date().toISOString();
      if (isMissedDay(lastActiveDateISO, now)) {
        console.log('[Streak] Detected missed day — streak about to break');
        setStreakBreakPending(true);
      }
    },
    [streakBreakChecked, userId]
  );

  useEffect(() => {
    if (progressQuery.data && !streakBreakChecked && userId && !progressQuery.isStale && !progressQuery.isFetching) {
      checkStreakOnAppOpen(progressQuery.data);
    }
  }, [progressQuery.data, progressQuery.isStale, progressQuery.isFetching, streakBreakChecked, checkStreakOnAppOpen, userId]);

  const watchAdForHeart = useCallback(() => {
    console.log('[Ad] Watched ad for heart');
    updateProgress((prev) => {
      const newHearts = Math.min(prev.stats.heartsMax, prev.stats.hearts + 1);
      return {
        ...prev,
        stats: {
          ...prev.stats,
          hearts: newHearts,
          nextHeartAtISO: newHearts >= prev.stats.heartsMax ? '' : prev.stats.nextHeartAtISO,
        },
      };
    });
  }, [updateProgress]);

  // ✅ Daily Quests: ensure state resets correctly when day changes
  function getQuestDay(iso: string | null | undefined): string {
    return (iso ?? '').slice(0, 10);
  }

  const completeLesson = useCallback(
    (lessonId: string, earnedXp: number, correct: number, total: number, highestComboFromLesson?: number) => {
      console.log(
        `[Lesson] Completed ${lessonId} — XP: ${earnedXp}, Score: ${correct}/${total}, combo: ${highestComboFromLesson ?? 0}`
      );

      updateProgress((prev) => {
        const today = new Date().toISOString();
        const todayDay = getQuestDay(today);
        const prevQuestDay = getQuestDay(prev.stats.dailyQuestsDateISO);
        const questDateMatch = prevQuestDay === todayDay;

        const currentBest = prev.completedLessons[lessonId] ?? 0;
        const scorePercent = Math.round((correct / total) * 100);

        // ⭐ 3-star mastery (extra replayability)
        // Add +1 star each time a subsection (part) is PASSED (≥70%), capped at 3.
        // Does NOT affect unlocking logic (still only requires one pass).
        const isStarEligible = isStarEligibleLessonId(lessonId);
        const passed = scorePercent >= 70;
        const prevStars = prev.lessonStars?.[lessonId] ?? 0;
        const nextStars = isStarEligible && passed ? Math.min(3, prevStars + 1) : prevStars;
        const nextLessonStars =
          nextStars !== prevStars
            ? { ...(prev.lessonStars ?? {}), [lessonId]: nextStars }
            : (prev.lessonStars ?? {});

        const streakUpdate = updateStreakOnLessonComplete(today, prev.stats);

        const isDoubleXp = prev.stats.doubleXpNextLesson ?? false;
        const actualXp = isDoubleXp ? earnedXp * 2 : earnedXp;
        if (isDoubleXp) console.log(`[XP] Double XP active! ${earnedXp} -> ${actualXp}`);

        const newXpTotal = prev.stats.xpTotal + actualXp;
        const newLevel = Math.floor(newXpTotal / 500) + 1;
        const coinsEarned = Math.floor(actualXp / 3);

        // Weekly XP (kept as your original logic)
        const now = new Date();
        const currentWeekStart = getWeekStart(now);
        const lastActiveWeekStart = prev.stats.lastActiveDateISO ? getWeekStart(new Date(prev.stats.lastActiveDateISO)) : '';
        const xpThisWeek = currentWeekStart === lastActiveWeekStart ? prev.stats.xpThisWeek + earnedXp : earnedXp;

        // Daily Quest state (reset cleanly if new day)
        const baseLessonsDone = questDateMatch ? (prev.stats.dailyQuestLessonsDone ?? 0) : 0;
        const baseHighCombo = questDateMatch ? (prev.stats.dailyQuestHighestCombo ?? 0) : 0;
        const basePracticeDone = questDateMatch ? (prev.stats.dailyQuestPracticeDone ?? 0) : 0;

        const nextLessonsDone = baseLessonsDone + 1;
        const nextHighCombo = Math.max(baseHighCombo, highestComboFromLesson ?? 0);
        const nextPracticeDone = basePracticeDone;

        const nextClaimed1 = questDateMatch ? (prev.stats.dailyQuestClaimed1 ?? false) : false;
        const nextClaimed2 = questDateMatch ? (prev.stats.dailyQuestClaimed2 ?? false) : false;
        const nextClaimed3 = questDateMatch ? (prev.stats.dailyQuestClaimed3 ?? false) : false;

        const newCompleted = {
          ...prev.completedLessons,
          [lessonId]: Math.max(currentBest, scorePercent),
        };

        const newLessonsCompleted = Object.values(newCompleted).filter((s) => s >= 70).length;

        const newChapterProgress: Record<string, number> = { ...prev.chapterProgress };
        for (const chapter of chapters) {
          const completedParts = chapter.parts.filter((p) => (newCompleted[p.id] ?? 0) >= 70).length;
          newChapterProgress[chapter.id] = Math.round((completedParts / chapter.parts.length) * 100);
        }

        return {
          ...prev,
          completedLessons: newCompleted,
          lessonStars: nextLessonStars,
          chapterProgress: newChapterProgress,
          level: newLevel,
          stats: {
            ...prev.stats,
            xpTotal: newXpTotal,
            xpThisWeek,
            ...streakUpdate,
            coins: prev.stats.coins + coinsEarned,
            lessonsCompleted: newLessonsCompleted,
            accuracyCorrect: prev.stats.accuracyCorrect + correct,
            accuracyTotal: prev.stats.accuracyTotal + total,

            // Daily Quests (now the only daily system)
            dailyQuestsDateISO: today,
            dailyQuestLessonsDone: nextLessonsDone,
            dailyQuestHighestCombo: nextHighCombo,
            dailyQuestPracticeDone: nextPracticeDone,
            dailyQuestClaimed1: nextClaimed1,
            dailyQuestClaimed2: nextClaimed2,
            dailyQuestClaimed3: nextClaimed3,

            doubleXpNextLesson: isDoubleXp ? false : prev.stats.doubleXpNextLesson,
          },
        };
      });
    },
    [updateProgress, updateStreakOnLessonComplete]
  );

  const getNextReviewDate = useCallback((masteryLevel: number, now: Date): string => {
    const intervals = [0.5, 1, 2, 4, 8, 16];
    const days = intervals[Math.min(masteryLevel, intervals.length - 1)];
    const next = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    return next.toISOString();
  }, []);

  const updateDrugMastery = useCallback(
    (drugId: string, correct: boolean) => {
      const now = new Date();
      const nowISO = now.toISOString();
      console.log(`[Mastery] Drug ${drugId} — ${correct ? 'correct' : 'incorrect'}`);

      updateProgress((prev) => {
        const existing = prev.drugMastery?.[drugId] ?? { masteryLevel: 0, lastSeenISO: '', nextReviewISO: '' };
        let newLevel: number;
        if (correct) {
          newLevel = Math.min(5, existing.masteryLevel + 1);
        } else {
          newLevel = Math.max(0, existing.masteryLevel - 1);
        }
        const nextReview = getNextReviewDate(newLevel, now);
        console.log(
          `[Mastery] Drug ${drugId}: level ${existing.masteryLevel} -> ${newLevel}, next review: ${nextReview.slice(0, 10)}`
        );

        return {
          ...prev,
          drugMastery: {
            ...(prev.drugMastery ?? {}),
            [drugId]: {
              masteryLevel: newLevel,
              lastSeenISO: nowISO,
              nextReviewISO: nextReview,
            },
          },
        };
      });
    },
    [updateProgress, getNextReviewDate]
  );

  /**
   * Concept mastery is used for "intro" teaching prompts.
   * - Any correct answer marks the concept as mastered.
   * - If a student misses a mastered concept 3 times, we unmaster it so the intro can re-appear.
   */
  const updateConceptMastery = useCallback(
    (conceptId: string, correct: boolean) => {
      const nowISO = new Date().toISOString();
      if (!conceptId) return;
      updateProgress((prev) => {
        const existing: ConceptMastery = prev.conceptMastery?.[conceptId] ?? {
          mastered: false,
          correctStreak: 0,
          wrongSinceMastered: 0,
          lastSeenISO: '',
        };

        if (correct) {
          return {
            ...prev,
            conceptMastery: {
              ...(prev.conceptMastery ?? {}),
              [conceptId]: {
                mastered: true,
                correctStreak: existing.correctStreak + 1,
                wrongSinceMastered: 0,
                lastSeenISO: nowISO,
              },
            },
          };
        }

        const nextWrong = existing.mastered ? existing.wrongSinceMastered + 1 : existing.wrongSinceMastered;
        const shouldUnmaster = existing.mastered && nextWrong >= 3;

        return {
          ...prev,
          conceptMastery: {
            ...(prev.conceptMastery ?? {}),
            [conceptId]: {
              mastered: shouldUnmaster ? false : existing.mastered,
              correctStreak: 0,
              wrongSinceMastered: nextWrong,
              lastSeenISO: nowISO,
            },
          },
        };
      });
    },
    [updateProgress]
  );

  const isConceptMastered = useCallback(
    (conceptId: string): boolean => {
      if (!conceptId) return false;
      return progress.conceptMastery?.[conceptId]?.mastered ?? false;
    },
    [progress.conceptMastery]
  );

  /**
   * Pre-quiz teaching slides are shown ONLY once per subsection (part).
   * This is separate from concept mastery (which can re-appear if missed repeatedly).
   */
  const hasSeenTeachingSlides = useCallback(
    (partId: string): boolean => {
      if (!partId) return false;
      // Backwards-compatible fallback:
      // if they already completed the lesson before this feature existed,
      // treat slides as "seen".
      if (progress.completedLessons?.[partId] !== undefined) return true;
      return progress.teachingSlidesSeen?.[partId] ?? false;
    },
    [progress.teachingSlidesSeen, progress.completedLessons]
  );

  const markTeachingSlidesSeen = useCallback(
    (partId: string) => {
      if (!partId) return;
      updateProgress((prev) => {
        if (prev.teachingSlidesSeen?.[partId]) return prev;
        return {
          ...prev,
          teachingSlidesSeen: {
            ...(prev.teachingSlidesSeen ?? {}),
            [partId]: true,
          },
        };
      });
    },
    [updateProgress]
  );

  /**
   * A simple "what can we review?" helper: if a drug has any mastery entry, the student has seen it.
   */
  const getUnlockedDrugIds = useCallback((): string[] => {
    const mastery = progress.drugMastery ?? {};
    return Object.keys(mastery);
  }, [progress.drugMastery]);

  const getDueForReviewCount = useCallback((): number => {
    const mastery = progress.drugMastery ?? {};
    const now = new Date().toISOString();
    return Object.values(mastery).filter((m) => m.nextReviewISO <= now).length;
  }, [progress.drugMastery]);

  const getDueForReviewDrugIds = useCallback((): string[] => {
    const mastery = progress.drugMastery ?? {};
    const now = new Date().toISOString();
    return Object.entries(mastery)
      .filter(([, m]) => m.nextReviewISO <= now)
      .sort((a, b) => a[1].masteryLevel - b[1].masteryLevel)
      .map(([id]) => id);
  }, [progress.drugMastery]);

  const getLowMasteryDrugIds = useCallback((): string[] => {
    const mastery = progress.drugMastery ?? {};
    return Object.entries(mastery)
      .filter(([, m]) => m.masteryLevel < 3)
      .sort((a, b) => a[1].masteryLevel - b[1].masteryLevel)
      .map(([id]) => id);
  }, [progress.drugMastery]);

  const addMistakes = useCallback(
    (entries: MistakeBankEntry[]) => {
      if (entries.length === 0) return;
      console.log(`[MistakeBank] Adding ${entries.length} mistakes`);
      updateProgress((prev) => {
        const existing = prev.mistakeBank ?? [];
        const newBank = [...existing, ...entries];
        return { ...prev, mistakeBank: newBank };
      });
    },
    [updateProgress]
  );

  const removeMistakesByDrug = useCallback(
    (drugId: string, questionType: string) => {
      console.log(`[MistakeBank] Removing mistake: drug=${drugId}, type=${questionType}`);
      updateProgress((prev) => {
        const bank = prev.mistakeBank ?? [];
        const idx = bank.findIndex((m) => m.drugId === drugId && m.questionType === questionType);
        if (idx === -1) return prev;
        const newBank = [...bank];
        newBank.splice(idx, 1);
        return { ...prev, mistakeBank: newBank };
      });
    },
    [updateProgress]
  );

  const getRecentMistakes = useCallback(
    (days: number = 7): MistakeBankEntry[] => {
      const bank = progress.mistakeBank ?? [];
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffISO = cutoff.toISOString();
      return bank.filter((m) => m.dateISO >= cutoffISO);
    },
    [progress.mistakeBank]
  );

  const getRecentMistakeDrugIds = useCallback(
    (days: number = 7): string[] => {
      const recent = getRecentMistakes(days);
      const unique = [...new Set(recent.map((m) => m.drugId))];
      return unique;
    },
    [getRecentMistakes]
  );

  useEffect(() => {
    if (heartTimerRef.current) {
      clearInterval(heartTimerRef.current);
      heartTimerRef.current = null;
    }

    const { hearts, heartsMax, nextHeartAtISO } = progress.stats;
    if (hearts >= heartsMax || !nextHeartAtISO) {
      setHeartCountdownSeconds(0);
      return;
    }

    const tick = () => {
      const now = Date.now();
      const nextAt = new Date(nextHeartAtISO).getTime();
      const diff = Math.max(0, Math.ceil((nextAt - now) / 1000));
      setHeartCountdownSeconds(diff);

      if (diff <= 0) {
        console.log('[Hearts] Regen timer fired — adding heart');
        setProgress((prev) => {
          const regen = computeHeartRegen(prev.stats.hearts, prev.stats.heartsMax, prev.stats.nextHeartAtISO);
          const updated = {
            ...prev,
            stats: { ...prev.stats, hearts: regen.hearts, nextHeartAtISO: regen.nextHeartAtISO },
          };
          saveProgress(updated);
          return updated;
        });
      }
    };

    tick();
    heartTimerRef.current = setInterval(tick, 1000);
    return () => {
      if (heartTimerRef.current) {
        clearInterval(heartTimerRef.current);
        heartTimerRef.current = null;
      }
    };
  }, [progress.stats.hearts, progress.stats.heartsMax, progress.stats.nextHeartAtISO, saveProgress]);

  const toggleReminders = useCallback(
    async (enabled: boolean): Promise<boolean> => {
      console.log(`[Notifications] Toggling reminders: ${enabled}`);
      if (enabled) {
        const granted = await requestNotificationPermission();
        if (!granted) {
          console.log('[Notifications] Permission denied — not enabling reminders');
          return false;
        }
        updateProgress((prev) => ({
          ...prev,
          stats: { ...prev.stats, remindersEnabled: true },
        }));
        const todayISO = new Date().toISOString().slice(0, 10);
        const lastActiveDay = progress.stats.lastActiveDateISO?.slice(0, 10) ?? '';
        const hasCompletedToday = lastActiveDay === todayISO;
        await scheduleStreakReminder(hasCompletedToday);
        if (progress.stats.hearts === 0 && progress.stats.nextHeartAtISO) {
          await scheduleHeartReminder(progress.stats.nextHeartAtISO);
        }
        return true;
      } else {
        updateProgress((prev) => ({
          ...prev,
          stats: { ...prev.stats, remindersEnabled: false },
        }));
        await cancelAllReminders();
        return true;
      }
    },
    [updateProgress, progress.stats.lastActiveDateISO, progress.stats.hearts, progress.stats.nextHeartAtISO]
  );

  useEffect(() => {
    if (!progress.stats.remindersEnabled) return;
    const todayISO = new Date().toISOString().slice(0, 10);
    const lastActiveDay = progress.stats.lastActiveDateISO?.slice(0, 10) ?? '';
    const hasCompletedToday = lastActiveDay === todayISO;
    scheduleStreakReminder(hasCompletedToday);
  }, [progress.stats.remindersEnabled, progress.stats.lastActiveDateISO]);

  useEffect(() => {
    if (!progress.stats.remindersEnabled) return;
    const { hearts, heartsMax, nextHeartAtISO } = progress.stats;
    if (hearts === 0 && nextHeartAtISO) {
      scheduleHeartReminder(nextHeartAtISO);
    } else if (hearts >= heartsMax || hearts > 0) {
      cancelHeartReminder();
    }
  }, [progress.stats.remindersEnabled, progress.stats.hearts, progress.stats.heartsMax, progress.stats.nextHeartAtISO]);

  const resetProgress = useCallback(async () => {
    console.log('[Dev] Resetting all progress');
    const fresh = { ...DEFAULT_PROGRESS, stats: { ...DEFAULT_STATS }, mistakeBank: [] };
    setProgress(fresh);
    await AsyncStorage.removeItem(storageKey);
    await AsyncStorage.removeItem('pharmalingo_progress');
    await cancelAllReminders();
    queryClient.setQueryData(['progress', userId], fresh);
  }, [queryClient, storageKey, userId]);

  const getLessonScore = useCallback((lessonId: string): number => {
    return progress.completedLessons[lessonId] ?? 0;
  }, [progress.completedLessons]);

  // ⭐ 3-star mastery getters
  const getLessonStars = useCallback(
    (lessonId: string): number => {
      return progress.lessonStars?.[lessonId] ?? 0;
    },
    [progress.lessonStars]
  );

  const isLessonGoldMastered = useCallback(
    (lessonId: string): boolean => {
      return getLessonStars(lessonId) >= 3;
    },
    [getLessonStars]
  );

  const isChapterGoldMastered = useCallback(
    (chapterId: string): boolean => {
      if (!chapterId || chapterId === 'mod-11') return false;
      const ch = chapters.find((c) => c.id === chapterId);
      if (!ch) return false;
      return ch.parts.every((p) => (progress.lessonStars?.[p.id] ?? 0) >= 3);
    },
    [progress.lessonStars]
  );

  const getChapterProgress = useCallback((chapterId: string): number => {
    return progress.chapterProgress[chapterId] ?? 0;
  }, [progress.chapterProgress]);

  const isLessonUnlocked = useCallback(
    (chapterId: string, partIndex: number): boolean => {
      // ✅ Special case: End Game (Module 11) unlocks ONLY after the entire course is mastered.
      // Definition: all lessons (parts) AND all module Mastering quizzes are passed (≥70%).
      if (chapterId === 'mod-11') {
        const coreChapters = chapters.filter((c) => c.id !== 'mod-11');
        const allPartsPassed = coreChapters.every((c) =>
          c.parts.every((p) => (progress.completedLessons[p.id] ?? 0) >= 70)
        );
        const allMasteryPassed = coreChapters.every(
          (c) => (progress.completedLessons[`mastery-${c.id}`] ?? 0) >= 70
        );
        return allPartsPassed && allMasteryPassed;
      }

      if (partIndex === 0) {
        const chapterIndex = chapters.findIndex((c) => c.id === chapterId);
        if (chapterIndex === 0) return true;
        const prevChapter = chapters[chapterIndex - 1];
        if (!prevChapter) return false;
        const prevCompleted = prevChapter.parts.filter((p) => (progress.completedLessons[p.id] ?? 0) >= 70).length;
        return prevCompleted >= Math.ceil(prevChapter.parts.length / 2);
      }
      const chapter = chapters.find((c) => c.id === chapterId);
      if (!chapter) return false;
      const prevPart = chapter.parts[partIndex - 1];
      if (!prevPart) return false;
      return (progress.completedLessons[prevPart.id] ?? 0) >= 70;
    },
    [progress.completedLessons]
  );

  /**
   * Aggregated pool of drug IDs that belong to lessons the user can currently access ("unlocked").
   *
   * This is intentionally different from `getUnlockedDrugIds()` (which reflects *seen* drugs)
   * because practice modes like Brand Blitz should only pull from content the user has unlocked
   * in the Learn path.
   */
  const getUnlockedLessonDrugIds = useCallback((): string[] => {
    const ids: string[] = [];
    for (const ch of chapters) {
      if (ch.id === 'mod-11') continue; // exclude End Game / special module
      ch.parts.forEach((p, idx) => {
        if (isLessonUnlocked(ch.id, idx)) {
          ids.push(...(p.drugIds ?? []));
        }
      });
    }
    return Array.from(new Set(ids));
  }, [isLessonUnlocked]);

  const accuracy = useMemo(() => {
    if (progress.stats.accuracyTotal === 0) return 0;
    return Math.round((progress.stats.accuracyCorrect / progress.stats.accuracyTotal) * 100);
  }, [progress.stats.accuracyCorrect, progress.stats.accuracyTotal]);

  const totalLessonsCompleted = useMemo(() => {
    return Object.values(progress.completedLessons).filter((s) => s >= 70).length;
  }, [progress.completedLessons]);

  const leagueRank = useMemo(() => {
    return getLeagueRank(progress.stats.xpThisWeek, progress.stats.leagueTier || 'Bronze');
  }, [progress.stats.xpThisWeek, progress.stats.leagueTier]);

  const getDailyQuests = useCallback((): DailyQuest[] => {
    const todayISO = new Date().toISOString().slice(0, 10);
    const questDateMatch = (progress.stats.dailyQuestsDateISO || '').slice(0, 10) === todayISO;

    const lessonsDone = questDateMatch ? (progress.stats.dailyQuestLessonsDone ?? 0) : 0;
    const highCombo = questDateMatch ? (progress.stats.dailyQuestHighestCombo ?? 0) : 0;
    const practiceDone = questDateMatch ? (progress.stats.dailyQuestPracticeDone ?? 0) : 0;

    const c1 = questDateMatch ? (progress.stats.dailyQuestClaimed1 ?? false) : false;
    const c2 = questDateMatch ? (progress.stats.dailyQuestClaimed2 ?? false) : false;
    const c3 = questDateMatch ? (progress.stats.dailyQuestClaimed3 ?? false) : false;

    return [
      {
        id: 1,
        title: 'Complete 1 Lesson',
        description: 'Finish any lesson or practice',
        reward: 20,
        current: Math.min(lessonsDone, 1),
        target: 1,
        claimed: c1,
        completed: lessonsDone >= 1,
      },
      {
        id: 2,
        title: '5 Combo Streak',
        description: 'Get 5 correct in a row',
        reward: 10,
        current: Math.min(highCombo, 5),
        target: 5,
        claimed: c2,
        completed: highCombo >= 5,
      },
      {
        id: 3,
        title: 'Practice Session',
        description: 'Complete a practice or review',
        reward: 15,
        current: Math.min(practiceDone, 1),
        target: 1,
        claimed: c3,
        completed: practiceDone >= 1,
      },
    ];
  }, [progress.stats]);

  const claimDailyQuest = useCallback(
    (questId: number): boolean => {
      const quests = getDailyQuests();
      const quest = quests.find((q) => q.id === questId);
      if (!quest || quest.claimed || !quest.completed) {
        console.log(`[Quests] Cannot claim quest ${questId}`);
        return false;
      }
      console.log(`[Quests] Claiming quest ${questId}: +${quest.reward} coins`);
      updateProgress((prev) => {
        const claimKey =
          questId === 1 ? 'dailyQuestClaimed1' : questId === 2 ? 'dailyQuestClaimed2' : 'dailyQuestClaimed3';
        return {
          ...prev,
          stats: {
            ...prev.stats,
            coins: prev.stats.coins + quest.reward,
            [claimKey]: true,
          },
        };
      });
      return true;
    },
    [getDailyQuests, updateProgress]
  );

  const trackPracticeQuest = useCallback(() => {
    console.log('[Quests] Tracking practice session');
    updateProgress((prev) => {
      const today = new Date().toISOString();
      const todayISO = today.slice(0, 10);
      const questDateMatch = (prev.stats.dailyQuestsDateISO || '').slice(0, 10) === todayISO;

      const baseLessonsDone = questDateMatch ? (prev.stats.dailyQuestLessonsDone ?? 0) : 0;
      const basePracticeDone = questDateMatch ? (prev.stats.dailyQuestPracticeDone ?? 0) : 0;
      const baseHighCombo = questDateMatch ? (prev.stats.dailyQuestHighestCombo ?? 0) : 0;

      return {
        ...prev,
        stats: {
          ...prev.stats,
          dailyQuestsDateISO: today,
          dailyQuestLessonsDone: baseLessonsDone + 1,
          dailyQuestPracticeDone: basePracticeDone + 1,
          dailyQuestHighestCombo: baseHighCombo,

          // reset claim flags on a new day
          dailyQuestClaimed1: questDateMatch ? (prev.stats.dailyQuestClaimed1 ?? false) : false,
          dailyQuestClaimed2: questDateMatch ? (prev.stats.dailyQuestClaimed2 ?? false) : false,
          dailyQuestClaimed3: questDateMatch ? (prev.stats.dailyQuestClaimed3 ?? false) : false,
        },
      };
    });
  }, [updateProgress]);

  const trackComboQuest = useCallback(
    (combo: number) => {
      updateProgress((prev) => {
        const today = new Date().toISOString();
        const todayISO = today.slice(0, 10);
        const questDateMatch = (prev.stats.dailyQuestsDateISO || '').slice(0, 10) === todayISO;

        const baseLessonsDone = questDateMatch ? (prev.stats.dailyQuestLessonsDone ?? 0) : 0;
        const basePracticeDone = questDateMatch ? (prev.stats.dailyQuestPracticeDone ?? 0) : 0;
        const baseHighCombo = questDateMatch ? (prev.stats.dailyQuestHighestCombo ?? 0) : 0;

        if (combo <= baseHighCombo) return prev;

        console.log(`[Quests] New highest combo today: ${combo}`);

        return {
          ...prev,
          stats: {
            ...prev.stats,
            dailyQuestsDateISO: today,
            dailyQuestLessonsDone: baseLessonsDone,
            dailyQuestPracticeDone: basePracticeDone,
            dailyQuestHighestCombo: combo,

            // reset claim flags on a new day
            dailyQuestClaimed1: questDateMatch ? (prev.stats.dailyQuestClaimed1 ?? false) : false,
            dailyQuestClaimed2: questDateMatch ? (prev.stats.dailyQuestClaimed2 ?? false) : false,
            dailyQuestClaimed3: questDateMatch ? (prev.stats.dailyQuestClaimed3 ?? false) : false,
          },
        };
      });
    },
    [updateProgress]
  );

  const generateLootReward = useCallback((): LootReward => {
    const rand = Math.random();
    const maxSaves = getMaxStreakSaves(progress.stats.streakCurrent);
    const currentSaves = progress.stats.streakSaves ?? 0;
    const canGetStreakSave = currentSaves < maxSaves;

    if (rand < 0.1 && canGetStreakSave) {
      console.log('[Loot] Reward: streak save');
      updateProgress((prev) => ({
        ...prev,
        stats: { ...prev.stats, streakSaves: (prev.stats.streakSaves ?? 0) + 1 },
      }));
      return { type: 'streak_save', amount: 1, label: 'Streak Save', emoji: '🛡️' };
    } else if (rand < 0.3) {
      console.log('[Loot] Reward: double XP');
      updateProgress((prev) => ({
        ...prev,
        stats: { ...prev.stats, doubleXpNextLesson: true },
      }));
      return { type: 'double_xp', amount: 1, label: '2× XP Next Lesson', emoji: '⚡' };
    } else if (rand < 0.45) {
      const amount = Math.floor(Math.random() * 51) + 50;
      console.log(`[Loot] Reward: big coins (${amount})`);
      updateProgress((prev) => ({
        ...prev,
        stats: { ...prev.stats, coins: prev.stats.coins + amount },
      }));
      return { type: 'big_coins', amount, label: `${amount} Coins`, emoji: '💰' };
    } else {
      const amount = Math.floor(Math.random() * 21) + 10;
      console.log(`[Loot] Reward: coins (${amount})`);
      updateProgress((prev) => ({
        ...prev,
        stats: { ...prev.stats, coins: prev.stats.coins + amount },
      }));
      return { type: 'coins', amount, label: `${amount} Coins`, emoji: '🪙' };
    }
  }, [updateProgress, getMaxStreakSaves, progress.stats.streakCurrent, progress.stats.streakSaves]);

  const endWeekNow = useCallback(() => {
    console.log('[Dev] Ending league week now');
    const currentTier = progress.stats.leagueTier || 'Bronze';
    const result = computeWeekEndResult(progress.stats.xpThisWeek, currentTier);
    console.log(`[League] Dev end week: rank=${result.rank}, tier ${result.previousTier} -> ${result.newTier}`);
    setLeagueWeekResult(result);
    const newWeekStart = getWeekStart(new Date());
    updateProgress((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        xpThisWeek: 0,
        leagueTier: result.newTier,
        leagueWeekStartISO: newWeekStart,
      },
    }));
  }, [progress.stats.xpThisWeek, progress.stats.leagueTier, updateProgress]);

  const dismissLeagueResult = useCallback(() => {
    setLeagueWeekResult(null);
  }, []);

  return {
    progress,
    isLoading: progressQuery.isLoading,

    completeLesson,

    loseHeart,
    refillHeartsFull,
    addHeart,

    addXP,
    addCoins,
    spendCoins,

    buyHeartWithCoins,
    buyFullRefillWithCoins,

    watchAdForHeart,

    getLessonScore,
    getLessonStars,
    isLessonGoldMastered,
    isChapterGoldMastered,
    getChapterProgress,
    isLessonUnlocked,

    accuracy,
    totalLessonsCompleted,

    resetProgress,

    buyStreakSave,
    useStreakSave,
    acceptStreakBreak,
    recordStreakActivity,
    dismissStreakBreak,
    streakBreakPending,

    selectSchool,

    updateDrugMastery,
    updateConceptMastery,
    isConceptMastered,
    hasSeenTeachingSlides,
    markTeachingSlidesSeen,
    getDueForReviewCount,
    getDueForReviewDrugIds,
    getLowMasteryDrugIds,
    getUnlockedDrugIds,
    getUnlockedLessonDrugIds,

    addMistakes,
    removeMistakesByDrug,
    getRecentMistakes,
    getRecentMistakeDrugIds,

    heartCountdownSeconds,
    heartRegenMinutes: HEART_REGEN_MINUTES,

    toggleReminders,

    leagueRank,
    leagueWeekResult,
    endWeekNow,
    dismissLeagueResult,

    getMaxStreakSaves,

    // ✅ Only daily system now
    getDailyQuests,
    claimDailyQuest,
    trackPracticeQuest,
    trackComboQuest,

    generateLootReward,
  };
});
