import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Heart, Zap, ArrowRight, Coins } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getChapterById } from '@/constants/chapters';
import { getDrugById } from '@/constants/drugData';
import { useProgress } from '@/contexts/ProgressContext';
import { useXpSync } from '@/contexts/XpSyncContext';
import {
  generateQuestionsForLesson,
  generateQuestionsFromDrugIds,
  generatePracticeQuestions,
  generateSpacedRepetitionQuestions,
  generateMistakeQuestions,
  generateMistakeReviewQuestions,
  generateMasteringQuestions,
} from '@/utils/quizGenerator';
import { QuizQuestion, MistakeBankEntry } from '@/constants/types';
import QuizOption from '@/components/QuizOption';
import MatchingQuestion from '@/components/MatchingQuestion';
import ClozeQuestion from '@/components/ClozeQuestion';
import MultiSelectQuestion from '@/components/MultiSelectQuestion';
import ProgressBar from '@/components/ProgressBar';
import MascotAnimated, { MascotMood } from '@/components/MascotAnimated';
import OutOfHeartsModal from '@/components/OutOfHeartsModal';
import { getIntroQuestionsForPart } from '@/utils/introGenerator';

type OptionState = 'default' | 'correct' | 'incorrect' | 'disabled';

const MASCOT_MESSAGES_CORRECT = [
  "Nailed it! 🎯",
  "You're on fire! 🔥",
  "Brilliant! Keep going!",
  "That's the way! 💪",
  "Pharmacist in the making!",
  "Crushed it! 💊",
  "Wow, impressive!",
  "You really know your stuff!",
];

const MASCOT_MESSAGES_INCORRECT = [
  "Don't give up! 💪",
  "You'll get the next one!",
  "Keep studying! 📖",
  "Almost there!",
  "Learn from this one!",
  "Stay strong! 🦁",
  "Try to remember this!",
  "Review and conquer!",
];

const MASCOT_MESSAGES_THINKING = [
  "Hmm, think carefully... 🤔",
  "Take your time!",
  "Read all the options!",
  "You've got this! 🦁",
  "Trust your knowledge!",
  "Focus! 👀",
];

export default function LessonScreen() {
  const { chapterId, partId, mode } = useLocalSearchParams<{
    chapterId?: string;
    partId?: string;
    mode?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation<any>();
  const allowExitRef = useRef(false);
  const exitPromptOpenRef = useRef(false);
  const insets = useSafeAreaInsets();
  const {
    progress,
    completeLesson,
    loseHeart,
    addCoins,
    updateDrugMastery,
    updateConceptMastery,
    isConceptMastered,
    getUnlockedDrugIds,
    getDueForReviewDrugIds,
    getLowMasteryDrugIds,
    addMistakes,
    removeMistakesByDrug,
    trackPracticeQuest,
    trackComboQuest,
  } = useProgress();
  const { logXpEvent } = useXpSync();

  const isPractice = mode === 'practice' || mode === 'spaced' || mode === 'mistakes' || mode === 'mistakes-review';
  const isSpaced = mode === 'spaced';

  const chapter = chapterId ? getChapterById(chapterId) : undefined;
  const part = chapter?.parts.find(p => p.id === partId);

  const mistakesParam = useLocalSearchParams<{ mistakesJson?: string }>().mistakesJson;
  const mistakesDrugIdsParam = useLocalSearchParams<{ mistakeDrugIds?: string }>().mistakeDrugIds;

  const [questions] = useState<QuizQuestion[]>(() => {
    if (mode === 'mistakes' && mistakesParam) {
      try {
        const parsed = JSON.parse(mistakesParam) as MistakeBankEntry[];
        console.log(`[Lesson] Generating ${parsed.length} mistake questions`);
        return generateMistakeQuestions(parsed, 10);
      } catch (e) {
        console.log('[Lesson] Failed to parse mistakes JSON', e);
        return generatePracticeQuestions(10);
      }
    }
    if (mode === 'mistakes-review' && mistakesDrugIdsParam) {
      try {
        const drugIds = JSON.parse(mistakesDrugIdsParam) as string[];
        console.log(`[Lesson] Generating review for ${drugIds.length} mistake drugs`);
        return generateMistakeReviewQuestions(drugIds, 10);
      } catch (e) {
        console.log('[Lesson] Failed to parse mistake drug IDs', e);
        return generatePracticeQuestions(10);
      }
    }
    if (isSpaced) {
      const due = getDueForReviewDrugIds();
      const low = getLowMasteryDrugIds();
      return generateSpacedRepetitionQuestions(due, low, 10);
    }
    if (mode === 'practice') {
      return generatePracticeQuestions(10);
    }
    if (mode === 'mastery' && chapter) {
      const chapterDrugIds = Array.from(new Set(chapter.parts.flatMap(p => p.drugIds)));
      return generateMasteringQuestions(chapterDrugIds, 30);
    }    if (part) {
      const introAll = getIntroQuestionsForPart(part.id, part.drugIds);
      const introPending = introAll.filter((q) => {
        if (!q.conceptId) return true;
        return !isConceptMastered(q.conceptId);
      });

      // We aim for 10–12 *part-specific* questions (intro + quiz), plus 2–4 review questions from previous sections.
      const targetPartQuestions = Math.min(12, Math.max(10, part.questionCount ?? 12));
      const maxIntro = 4;
      const introQuestions = introPending.slice(0, Math.min(maxIntro, targetPartQuestions));
      const introCount = introQuestions.length;

      // Review pool from previous unlocked drugs (spaced repetition + weakest ones)
      const unlocked = getUnlockedDrugIds().filter((id) => !part.drugIds.includes(id));
      const due = getDueForReviewDrugIds().filter((id) => !part.drugIds.includes(id));
      const low = getLowMasteryDrugIds().filter((id) => !part.drugIds.includes(id));
      const reviewPool = Array.from(new Set([ ...due, ...low, ...unlocked ]));

      let reviewCount = Math.floor(Math.random() * 3) + 2; // 2–4
      reviewCount = Math.min(reviewCount, reviewPool.length);

      const quizCount = Math.max(0, targetPartQuestions - introCount);
      const quizQuestions = generateQuestionsForLesson(part.drugIds, quizCount, 'quiz');
      const reviewDrugIds = reviewCount > 0 ? reviewPool.sort(() => Math.random() - 0.5).slice(0, reviewCount) : [];
      const reviewQuestions =
        reviewCount > 0 ? generateQuestionsFromDrugIds(reviewDrugIds, reviewCount, 'review') : [];

      const mixed = [...quizQuestions, ...reviewQuestions].sort(() => Math.random() - 0.5);
      return [...introQuestions, ...mixed];
    }
    return [];
  });

  const [sessionMistakes, setSessionMistakes] = useState<MistakeBankEntry[]>([]);
  const isMistakesMode = mode === 'mistakes' || mode === 'mistakes-review';
  const activeLessonIdForMistakes = mode === 'mastery' && chapterId ? `mastery-${chapterId}` : (partId ?? 'practice');

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerCorrect, setAnswerCorrect] = useState<boolean | null>(null);
  const [optionStates, setOptionStates] = useState<Record<string, OptionState>>({});
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [showFact, setShowFact] = useState<boolean>(false);
  const [mascotMood, setMascotMood] = useState<MascotMood>('thinking');
  const [mascotMessage, setMascotMessage] = useState<string>('');
  const [consecutiveCorrect, setConsecutiveCorrect] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [highestCombo, setHighestCombo] = useState<number>(0);
  const [comboBonusCoins, setComboBonusCoins] = useState<number>(0);

  const [showOutOfHearts, setShowOutOfHearts] = useState<boolean>(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const resultSlide = useRef(new Animated.Value(100)).current;
  const mascotMessageFade = useRef(new Animated.Value(0)).current;
  const heartShakeAnim = useRef(new Animated.Value(0)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const comboScaleAnim = useRef(new Animated.Value(1)).current;
  const comboOpacityAnim = useRef(new Animated.Value(0)).current;

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;

  // Guard against accidentally leaving mid-quiz (back gesture, header back, etc.).
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Allow internal navigations (e.g., completing a quiz) to proceed without a penalty.
      if (allowExitRef.current) return;

      const inProgress = questions.length > 0 && currentIndex < questions.length;
      if (!inProgress) return;

      // Prevent default behavior of leaving the screen
      e.preventDefault();

      // Avoid stacking alerts if multiple navigation events fire
      if (exitPromptOpenRef.current) return;
      exitPromptOpenRef.current = true;

      Alert.alert(
        'Are you sure?',
        'You will lose a heart if you leave now.',
        [
          {
            text: 'Stay',
            style: 'cancel',
            onPress: () => {
              exitPromptOpenRef.current = false;
            },
          },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: () => {
              exitPromptOpenRef.current = false;
              allowExitRef.current = true;
              loseHeart();
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [navigation, questions.length, currentIndex, loseHeart]);

  const getRandomMessage = useCallback((messages: string[]) => {
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  const handleComboMilestone = useCallback((newCombo: number) => {
    if (newCombo === 5) {
      addCoins(5, 'Combo 5 bonus');
      setComboBonusCoins(prev => prev + 5);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(comboScaleAnim, { toValue: 1.6, duration: 150, useNativeDriver: true }),
        Animated.spring(comboScaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    } else if (newCombo === 10) {
      addCoins(10, 'Combo 10 bonus');
      setComboBonusCoins(prev => prev + 10);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(comboScaleAnim, { toValue: 1.8, duration: 150, useNativeDriver: true }),
        Animated.spring(comboScaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    } else if (newCombo >= 2) {
      Animated.sequence([
        Animated.timing(comboScaleAnim, { toValue: 1.25, duration: 100, useNativeDriver: true }),
        Animated.spring(comboScaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }),
      ]).start();
    }
    if (newCombo >= 1) {
      comboOpacityAnim.setValue(1);
    }
  }, [addCoins, comboScaleAnim, comboOpacityAnim]);



  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    setMascotMood('thinking');
    setMascotMessage(getRandomMessage(MASCOT_MESSAGES_THINKING));
    mascotMessageFade.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(mascotMessageFade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex, fadeAnim, slideAnim, mascotMessageFade, getRandomMessage]);

  const handleMatchingComplete = useCallback((allCorrectFirstTry: boolean, correct: number, total: number) => {
    if (!currentQuestion || currentQuestion.type !== 'matching') return;
    const matchPairs = currentQuestion.matchPairs ?? [];
    matchPairs.forEach(p => {
      updateDrugMastery(p.drugId, allCorrectFirstTry);
    });

    if (currentQuestion.conceptId) {
      updateConceptMastery(currentQuestion.conceptId, allCorrectFirstTry);
    }

    setAnswerCorrect(allCorrectFirstTry);

    if (allCorrectFirstTry) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectCount(prev => prev + 1);
      setConsecutiveCorrect(prev => prev + 1);
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > highestCombo) setHighestCombo(newCombo);
      handleComboMilestone(newCombo);
      setMascotMood('celebrating');
      setMascotMessage(getRandomMessage(MASCOT_MESSAGES_CORRECT));
      if (isMistakesMode) {
        matchPairs.forEach(p => {
          removeMistakesByDrug(p.drugId, 'matching');
        });
      }
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setConsecutiveCorrect(0);
      setCombo(0);
      setMascotMood('sad');
      setMascotMessage(getRandomMessage(MASCOT_MESSAGES_INCORRECT));
      if (!isMistakesMode && currentQuestion.phase !== 'intro') {
        matchPairs.forEach(p => {
          setSessionMistakes(prev => [...prev, {
            drugId: p.drugId,
            questionType: 'matching',
            dateISO: new Date().toISOString(),
            lessonId: activeLessonIdForMistakes,
          }]);
        });
      }
      if (!isPractice && currentQuestion.phase !== 'intro') {
        loseHeart();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        if (progress.stats.hearts <= 1) {
          setTimeout(() => setShowOutOfHearts(true), 800);
        }
      }
    }

    mascotMessageFade.setValue(0);
    Animated.parallel([
      Animated.spring(resultSlide, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(mascotMessageFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedOption('answered');
    setShowFact(true);
  }, [
    currentQuestion,
    isPractice,
    loseHeart,
    resultSlide,
    mascotMessageFade,
    getRandomMessage,
    progress.stats.hearts,
    updateDrugMastery,
    updateConceptMastery,
    combo,
    highestCombo,
    handleComboMilestone,
    isMistakesMode,
    activeLessonIdForMistakes,
    removeMistakesByDrug,
  ]);

  const handleSelectOption = useCallback((option: string) => {
    if (selectedOption !== null || !currentQuestion || !currentQuestion.correctAnswer) return;

    setSelectedOption(option);
    const isCorrect = option === currentQuestion.correctAnswer;

    setAnswerCorrect(isCorrect);

    if (currentQuestion.drugId) {
      updateDrugMastery(currentQuestion.drugId, isCorrect);
    }

    if (currentQuestion.conceptId) {
      updateConceptMastery(currentQuestion.conceptId, isCorrect);
    }

    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCorrectCount(prev => prev + 1);
      const newConsecutive = consecutiveCorrect + 1;
      setConsecutiveCorrect(newConsecutive);
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo > highestCombo) setHighestCombo(newCombo);
      handleComboMilestone(newCombo);

      if (newConsecutive >= 3) {
        setMascotMood('celebrating');
      } else {
        setMascotMood('happy');
      }
      setMascotMessage(getRandomMessage(MASCOT_MESSAGES_CORRECT));

      if (isMistakesMode && currentQuestion.drugId) {
        removeMistakesByDrug(currentQuestion.drugId, currentQuestion.type);
      }

      setOptionStates(
        currentQuestion.options.reduce((acc, o) => {
          acc[o] = o === option ? 'correct' : 'disabled';
          return acc;
        }, {} as Record<string, OptionState>)
      );
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setConsecutiveCorrect(0);
      setCombo(0);

      if (progress.stats.hearts <= 1) {
        setMascotMood('shocked');
      } else {
        setMascotMood('sad');
      }
      setMascotMessage(getRandomMessage(MASCOT_MESSAGES_INCORRECT));

      if (!isMistakesMode && currentQuestion.drugId && currentQuestion.phase !== 'intro') {
        setSessionMistakes(prev => [...prev, {
          drugId: currentQuestion.drugId,
          questionType: currentQuestion.type,
          dateISO: new Date().toISOString(),
          lessonId: activeLessonIdForMistakes,
        }]);
      }

      if (!isPractice && currentQuestion.phase !== 'intro') {
        loseHeart();

        Animated.sequence([
          Animated.timing(heartScaleAnim, {
            toValue: 1.5,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(heartScaleAnim, {
            toValue: 0.7,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.spring(heartScaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            friction: 4,
          }),
        ]).start();

        Animated.sequence([
          Animated.timing(heartShakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
          Animated.timing(heartShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
          Animated.timing(heartShakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
          Animated.timing(heartShakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
          Animated.timing(heartShakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        if (progress.stats.hearts <= 1) {
          setTimeout(() => setShowOutOfHearts(true), 800);
        }
      }
      setOptionStates(
        currentQuestion.options.reduce((acc, o) => {
          if (o === option) acc[o] = 'incorrect';
          else if (o === currentQuestion.correctAnswer) acc[o] = 'correct';
          else acc[o] = 'disabled';
          return acc;
        }, {} as Record<string, OptionState>)
      );
    }

    mascotMessageFade.setValue(0);
    Animated.parallel([
      Animated.spring(resultSlide, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(mascotMessageFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    setShowFact(true);
  }, [
    selectedOption,
    currentQuestion,
    isPractice,
    loseHeart,
    resultSlide,
    consecutiveCorrect,
    combo,
    highestCombo,
    progress.stats.hearts,
    mascotMessageFade,
    getRandomMessage,
    heartScaleAnim,
    heartShakeAnim,
    updateDrugMastery,
    updateConceptMastery,
    isMistakesMode,
    activeLessonIdForMistakes,
    removeMistakesByDrug,
  ]);

  const handleStructuredAnswer = useCallback(
    (isCorrect: boolean) => {
      if (selectedOption !== null || !currentQuestion) return;

      setSelectedOption('answered');
      setAnswerCorrect(isCorrect);

      if (currentQuestion.drugId) {
        updateDrugMastery(currentQuestion.drugId, isCorrect);
      }
      if (currentQuestion.conceptId) {
        updateConceptMastery(currentQuestion.conceptId, isCorrect);
      }

      if (isCorrect) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCorrectCount(prev => prev + 1);
        const newConsecutive = consecutiveCorrect + 1;
        setConsecutiveCorrect(newConsecutive);
        const newCombo = combo + 1;
        setCombo(newCombo);
        if (newCombo > highestCombo) setHighestCombo(newCombo);
        handleComboMilestone(newCombo);

        if (newConsecutive >= 3) {
          setMascotMood('celebrating');
        } else {
          setMascotMood('happy');
        }
        setMascotMessage(getRandomMessage(MASCOT_MESSAGES_CORRECT));

        if (isMistakesMode && currentQuestion.drugId) {
          removeMistakesByDrug(currentQuestion.drugId, currentQuestion.type);
        }
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setConsecutiveCorrect(0);
        setCombo(0);

        if (progress.stats.hearts <= 1) {
          setMascotMood('shocked');
        } else {
          setMascotMood('sad');
        }
        setMascotMessage(getRandomMessage(MASCOT_MESSAGES_INCORRECT));

        if (!isMistakesMode && currentQuestion.drugId && currentQuestion.phase !== 'intro') {
          setSessionMistakes(prev => [
            ...prev,
            {
              drugId: currentQuestion.drugId,
              questionType: currentQuestion.type,
              dateISO: new Date().toISOString(),
              lessonId: activeLessonIdForMistakes,
            },
          ]);
        }

        if (!isPractice && currentQuestion.phase !== 'intro') {
          loseHeart();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          if (progress.stats.hearts <= 1) {
            setTimeout(() => setShowOutOfHearts(true), 800);
          }
        }
      }

      mascotMessageFade.setValue(0);
      Animated.parallel([
        Animated.spring(resultSlide, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
        }),
        Animated.timing(mascotMessageFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      setShowFact(true);
    },
    [
      selectedOption,
      currentQuestion,
      updateDrugMastery,
      updateConceptMastery,
      consecutiveCorrect,
      combo,
      highestCombo,
      handleComboMilestone,
      getRandomMessage,
      isMistakesMode,
      isPractice,
      loseHeart,
      mascotMessageFade,
      activeLessonIdForMistakes,
      progress.stats.hearts,
      removeMistakesByDrug,
      resultSlide,
    ]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= totalQuestions) {
      const perfect = correctCount === totalQuestions;
      const earnedXp = Math.min(99, Math.round((correctCount * 6 + (perfect ? 20 : 0))));
      const coinsEarned = Math.floor(earnedXp / 3);
      const perfectBonusCoins = perfect ? Math.floor(50 / 3) : 0;

      const prevStreak = progress.stats.streakCurrent;
      const lastActive = progress.stats.lastActiveDateISO;
      const todayISO = new Date().toISOString().slice(0, 10);
      const lastActiveDay = lastActive ? lastActive.slice(0, 10) : '';

      let streakStatus = 'new';
      if (lastActiveDay === todayISO) {
        streakStatus = 'kept';
      } else {
        const lastDate = new Date(lastActive);
        const today = new Date();
        const diff = today.getTime() - lastDate.getTime();
        if (diff > 0 && diff < 172800000 && lastDate.getDate() !== today.getDate()) {
          streakStatus = 'incremented';
        } else {
          streakStatus = 'new';
        }
      }

      const newStreakCount = streakStatus === 'incremented'
        ? prevStreak + 1
        : streakStatus === 'kept'
          ? prevStreak
          : 1;

      const completionLessonId = mode === 'mastery' && chapterId ? `mastery-${chapterId}` : partId;

      if (!isPractice && completionLessonId) {
        completeLesson(completionLessonId, earnedXp, correctCount, totalQuestions, highestCombo);
        const xpToSync = Math.max(0, Math.round(earnedXp));
        console.log('[XpSync] sending xpToSync=', xpToSync, 'earnedXp=', earnedXp);
        logXpEvent(xpToSync, 'lesson_complete');
      } else if (isPractice && earnedXp > 0) {
        trackPracticeQuest();
        const xpToSync = Math.max(0, Math.round(earnedXp));
        console.log('[XpSync] sending xpToSync=', xpToSync, 'earnedXp=', earnedXp);
        logXpEvent(xpToSync, 'practice_complete');
      }

      if (highestCombo >= 5) {
        trackComboQuest(highestCombo);
      }

      if (!isMistakesMode && sessionMistakes.length > 0) {
        addMistakes(sessionMistakes);
        console.log(`[MistakeBank] Saved ${sessionMistakes.length} mistakes from this session`);
      }

      allowExitRef.current = true;

      router.replace({
        pathname: '/lesson-complete',
        params: {
          correctCount: String(correctCount),
          totalQuestions: String(totalQuestions),
          xpEarned: String(earnedXp),
          coinsEarned: String(coinsEarned),
          isPerfect: String(perfect),
          streakStatus,
          streakCount: String(newStreakCount),
          chapterId: chapterId ?? '',
          partId: partId ?? '',
          isPractice: String(isPractice),
          perfectBonus: String(perfectBonusCoins),
          highestCombo: String(highestCombo),
          comboBonusCoins: String(comboBonusCoins),
          mistakesJson: sessionMistakes.length > 0 ? JSON.stringify(sessionMistakes) : '',
          isMistakesMode: String(isMistakesMode),
        },
      });
      return;
    }

    resultSlide.setValue(100);
    setCurrentIndex(prev => prev + 1);
    setSelectedOption(null);
    setAnswerCorrect(null);
    setOptionStates({});
    setShowFact(false);

  }, [
    currentIndex,
    totalQuestions,
    isPractice,
    partId,
    chapterId,
    mode,
    correctCount,
    completeLesson,
    resultSlide,
    router,
    progress.stats,
    highestCombo,
    comboBonusCoins,
    logXpEvent,
    trackPracticeQuest,
    trackComboQuest,
    isMistakesMode,
    addMistakes,
    sessionMistakes,
  ]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  if (!currentQuestion) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text style={styles.errorText}>No questions available</Text>
      </View>
    );
  }

  const drug = currentQuestion.drugId ? getDrugById(currentQuestion.drugId) : undefined;

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'brand_to_generic': return 'Brand → Generic';
      case 'generic_to_brand': return 'Generic → Brand';
      case 'indication': return 'Indications';
      case 'not_indication': return 'Indications';
      case 'side_effect': return 'Side Effects';
      case 'not_side_effect': return 'Side Effects';
      case 'drug_class': return 'Drug Class';
      case 'class_comparison': return 'Drug Class';
      case 'suffix': return 'Naming Pattern';
      case 'dosing': return 'Dosing';
      case 'clinical_pearl': return 'Clinical Pearl';
      case 'key_fact': return 'Clinical Pearl';
      case 'true_false': return 'Quick Check';
      case 'cloze': return 'Fill in the Blank';
      case 'multi_select': return 'Select All';
      case 'matching': return 'Brand ↔ Generic';
      default: return 'Question';
    }
  };

  const getQuestionEmoji = (type: string) => {
    switch (type) {
      case 'brand_to_generic': return '💊';
      case 'generic_to_brand': return '🏷️';
      case 'indication': return '🩺';
      case 'not_indication': return '🩺';
      case 'side_effect': return '⚠️';
      case 'not_side_effect': return '⚠️';
      case 'drug_class': return '📋';
      case 'class_comparison': return '📋';
      case 'dosing': return '💉';
      case 'suffix': return '🔤';
      case 'clinical_pearl': return '💡';
      case 'key_fact': return '💡';
      case 'true_false': return '✅';
      case 'cloze': return '🧩';
      case 'multi_select': return '🧠';
      case 'matching': return '🔗';
      default: return '❓';
    }
  };

  const isCorrectAnswer = answerCorrect === true;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.topBar}>
        <Pressable onPress={handleClose} style={styles.closeButton} testID="close-lesson">
          <X size={22} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.progressContainer}>
          <ProgressBar progress={progressPercent} height={12} color={Colors.primary} />
        </View>
        {combo >= 2 && (
          <Animated.View style={[
            styles.comboBadge,
            { transform: [{ scale: comboScaleAnim }] },
          ]}>
            <Text style={styles.comboText}>🔥 {combo}</Text>
            {(combo === 5 || combo === 10) && (
              <Text style={styles.comboBonusText}>+{combo === 5 ? 5 : 10}🪙</Text>
            )}
          </Animated.View>
        )}
        <Animated.View style={[
          styles.heartBadge,
          {
            transform: [
              { translateX: heartShakeAnim },
              { scale: heartScaleAnim },
            ],
          },
        ]}>
          <Heart size={16} color={Colors.accent} fill={Colors.accent} />
          <Text style={styles.heartText}>{progress.stats.hearts}</Text>
        </Animated.View>
      </View>

      <ScrollView
        style={styles.questionScroll}
        contentContainerStyle={styles.questionContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.mascotRow}>
            <MascotAnimated mood={mascotMood} size={72} />
            <Animated.View style={[styles.speechBubble, { opacity: mascotMessageFade }]}>
              <Text style={styles.speechText}>{mascotMessage}</Text>
              <View style={styles.speechTriangle} />
            </Animated.View>
          </View>

          <View style={styles.questionTypeRow}>
            <View style={styles.questionTypeBadge}>
              <Text style={styles.questionEmoji}>{getQuestionEmoji(currentQuestion.type)}</Text>
              <Text style={styles.questionTypeText}>
                {getQuestionTypeLabel(currentQuestion.type)}
              </Text>

              {currentQuestion.phase === 'intro' ? (
                <View style={[styles.phasePill, styles.phasePillIntro]}>
                  <Text style={[styles.phaseText, styles.phaseTextIntro]}>LEARN</Text>
                </View>
              ) : currentQuestion.phase === 'review' ? (
                <View style={[styles.phasePill, styles.phasePillReview]}>
                  <Text style={[styles.phaseText, styles.phaseTextReview]}>REVIEW</Text>
                </View>
              ) : currentQuestion.phase === 'mastery' ? (
                <View style={[styles.phasePill, styles.phasePillMastery]}>
                  <Text style={[styles.phaseText, styles.phaseTextMastery]}>MASTER</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.questionCounter}>
              {currentIndex + 1} / {totalQuestions}
            </Text>
          </View>

          <Text style={styles.questionText}>{currentQuestion.question}</Text>

          {consecutiveCorrect >= 3 && !selectedOption && (
            <View style={styles.streakBanner}>
              <Text style={styles.streakBannerText}>
                🔥 {consecutiveCorrect} in a row! Keep it up!
              </Text>
            </View>
          )}

          <View style={styles.optionsContainer}>
            {currentQuestion.type === 'matching' && currentQuestion.matchPairs && currentQuestion.shuffledGenerics ? (
              <MatchingQuestion
                pairs={currentQuestion.matchPairs}
                shuffledGenerics={currentQuestion.shuffledGenerics}
                onComplete={handleMatchingComplete}
              />
            ) : currentQuestion.type === 'cloze' && currentQuestion.cloze ? (
              <ClozeQuestion
                cloze={currentQuestion.cloze}
                onComplete={handleStructuredAnswer}
                disabled={showFact}
              />
            ) : currentQuestion.type === 'multi_select' && currentQuestion.correctAnswers ? (
              <MultiSelectQuestion
                options={currentQuestion.options}
                correctAnswers={currentQuestion.correctAnswers}
                onComplete={handleStructuredAnswer}
                disabled={showFact}
              />
            ) : (
              currentQuestion.options.map((option, index) => (
                <QuizOption
                  key={`${currentQuestion.id}-${index}`}
                  text={option}
                  onPress={() => handleSelectOption(option)}
                  state={optionStates[option] || 'default'}
                  index={index}
                />
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <OutOfHeartsModal
        visible={showOutOfHearts}
        onClose={() => setShowOutOfHearts(false)}
        onGoToShop={() => {
          allowExitRef.current = true;
          router.back();
          setTimeout(() => router.push('/(tabs)/shop'), 100);
        }}
      />

      {(() => {
        const factText = currentQuestion.explanation ?? drug?.keyFact;
        const correctAnswerText =
          currentQuestion.type === 'multi_select'
            ? currentQuestion.correctAnswers?.join(', ')
            : currentQuestion.correctAnswer;

        if (!showFact || !factText) return null;

        return (
        <Animated.View
          style={[
            styles.factBar,
            {
              transform: [{ translateY: resultSlide }],
              paddingBottom: insets.bottom + 12,
              backgroundColor: isCorrectAnswer
                ? Colors.successLight
                : Colors.errorLight,
            },
          ]}
        >
          <View style={styles.factContent}>
            <View style={styles.factTitleRow}>
              <MascotAnimated
                mood={isCorrectAnswer ? (consecutiveCorrect >= 3 ? 'dancing' : 'happy') : 'sad'}
                size={44}
              />
              <View style={styles.factTitleContent}>
                <Text style={[styles.factTitle, {
                  color: isCorrectAnswer ? '#166534' : Colors.error,
                }]}>
                  {isCorrectAnswer ? 'Correct!' : 'Incorrect'}
                </Text>
                <Text style={styles.factMascotMsg}>{mascotMessage}</Text>
              </View>
            </View>
            <Text style={styles.factText}>
              💡 {factText}
            </Text>

            {!isCorrectAnswer && correctAnswerText ? (
              <Text style={styles.correctAnswerText}>✅ Correct answer: {correctAnswerText}</Text>
            ) : null}
          </View>
          <Pressable
            onPress={handleNext}
            style={[styles.nextButton, {
              backgroundColor: isCorrectAnswer
                ? Colors.primary
                : Colors.accent,
            }]}
            testID="next-question"
          >
            <Text style={styles.nextButtonText}>
              {currentIndex + 1 >= totalQuestions ? 'See Results' : 'Next'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  heartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  heartText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: '800' as const,
  },
  comboBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#FDBA74',
  },
  comboText: {
    fontSize: 14,
    fontWeight: '900' as const,
    color: '#9A3412',
  },
  comboBonusText: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#D97706',
  },
  questionScroll: {
    flex: 1,
  },
  questionContent: {
    padding: 20,
    paddingBottom: 220,
  },
  mascotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
  },
  speechText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 20,
  },
  speechTriangle: {
    position: 'absolute',
    left: -8,
    top: 14,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderRightWidth: 8,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderRightColor: Colors.surface,
  },
  questionTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  questionTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  questionEmoji: {
    fontSize: 14,
  },
  questionTypeText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  phasePill: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  phaseText: {
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
  phasePillIntro: {
    backgroundColor: Colors.primary,
  },
  phaseTextIntro: {
    color: '#FFFFFF',
  },
  phasePillReview: {
    backgroundColor: Colors.surfaceAlt,
  },
  phaseTextReview: {
    color: Colors.textSecondary,
  },
  phasePillMastery: {
    backgroundColor: Colors.accentLight,
  },
  phaseTextMastery: {
    color: Colors.accent,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  questionText: {
    fontSize: 23,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 32,
    marginBottom: 20,
  },
  streakBanner: {
    backgroundColor: Colors.goldLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.gold,
  },
  streakBannerText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#92400E',
  },
  optionsContainer: {
    gap: 2,
  },
  factBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 10,
  },
  factContent: {
    marginBottom: 16,
  },
  factTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  factTitleContent: {
    flex: 1,
  },
  factTitle: {
    fontSize: 19,
    fontWeight: '900' as const,
  },
  factMascotMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    marginTop: 2,
  },
  factText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 21,
    fontWeight: '500' as const,
    marginLeft: 54,
  },
  correctAnswerText: {
    marginTop: 8,
    marginLeft: 54,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 18,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800' as const,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 100,
  },

});
