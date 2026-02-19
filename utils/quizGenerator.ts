import { QuizQuestion, Drug, MatchPair, MistakeBankEntry } from '@/constants/types';
import { drugs, getDrugsByIds } from '@/constants/drugData';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getDistractors(correct: string, allOptions: string[], count: number): string[] {
  const filtered = allOptions.filter(o => o !== correct);
  return shuffleArray(filtered).slice(0, count);
}

function generateBrandToGeneric(drug: Drug): QuizQuestion {
  const distractors = getDistractors(
    drug.genericName,
    drugs.map(d => d.genericName),
    3
  );
  return {
    id: `q-${drug.id}-btg-${Date.now()}-${Math.random()}`,
    type: 'brand_to_generic',
    question: `What is the generic name for ${drug.brandName}?`,
    correctAnswer: drug.genericName,
    options: shuffleArray([drug.genericName, ...distractors]),
    drugId: drug.id,
  };
}

function generateGenericToBrand(drug: Drug): QuizQuestion {
  const distractors = getDistractors(
    drug.brandName,
    drugs.map(d => d.brandName),
    3
  );
  return {
    id: `q-${drug.id}-gtb-${Date.now()}-${Math.random()}`,
    type: 'generic_to_brand',
    question: `What is the brand name for ${drug.genericName}?`,
    correctAnswer: drug.brandName,
    options: shuffleArray([drug.brandName, ...distractors]),
    drugId: drug.id,
  };
}

function generateIndicationQuestion(drug: Drug): QuizQuestion {
  const correctIndication = drug.indications[0];
  const allIndications = [...new Set(drugs.flatMap(d => d.indications))];
  const distractors = getDistractors(correctIndication, allIndications, 3);
  return {
    id: `q-${drug.id}-ind-${Date.now()}-${Math.random()}`,
    type: 'indication',
    question: `${drug.brandName} (${drug.genericName}) is primarily indicated for:`,
    correctAnswer: correctIndication,
    options: shuffleArray([correctIndication, ...distractors]),
    drugId: drug.id,
  };
}

function generateSideEffectQuestion(drug: Drug): QuizQuestion {
  const correctSE = drug.sideEffects[0];
  const allSideEffects = [...new Set(drugs.flatMap(d => d.sideEffects))];
  const distractors = getDistractors(correctSE, allSideEffects, 3);
  return {
    id: `q-${drug.id}-se-${Date.now()}-${Math.random()}`,
    type: 'side_effect',
    question: `Which is a common side effect of ${drug.brandName} (${drug.genericName})?`,
    correctAnswer: correctSE,
    options: shuffleArray([correctSE, ...distractors]),
    drugId: drug.id,
  };
}

function generateDrugClassQuestion(drug: Drug): QuizQuestion {
  const allClasses = [...new Set(drugs.map(d => d.drugClass))];
  const distractors = getDistractors(drug.drugClass, allClasses, 3);
  return {
    id: `q-${drug.id}-dc-${Date.now()}-${Math.random()}`,
    type: 'drug_class',
    question: `${drug.brandName} (${drug.genericName}) belongs to which drug class?`,
    correctAnswer: drug.drugClass,
    options: shuffleArray([drug.drugClass, ...distractors]),
    drugId: drug.id,
  };
}

function generateDosingQuestion(drug: Drug): QuizQuestion {
  const allDosing = [...new Set(drugs.map(d => d.commonDosing))];
  const distractors = getDistractors(drug.commonDosing, allDosing, 3);
  return {
    id: `q-${drug.id}-dos-${Date.now()}-${Math.random()}`,
    type: 'dosing',
    question: `What is the common dosing for ${drug.brandName} (${drug.genericName})?`,
    correctAnswer: drug.commonDosing,
    options: shuffleArray([drug.commonDosing, ...distractors]),
    drugId: drug.id,
  };
}

function generateMatchingQuestion(drugPool: Drug[]): QuizQuestion | null {
  if (drugPool.length < 4) return null;
  const selected = shuffleArray(drugPool).slice(0, 4);
  const pairs: MatchPair[] = selected.map(d => ({
    brand: d.brandName,
    generic: d.genericName,
    drugId: d.id,
  }));
  const shuffledGenerics = shuffleArray(pairs.map(p => p.generic));
  return {
    id: `q-match-${Date.now()}-${Math.random()}`,
    type: 'matching',
    question: 'Match each brand name to its generic name',
    correctAnswer: '',
    options: [],
    drugId: selected[0].id,
    matchPairs: pairs,
    shuffledGenerics,
  };
}

const generators = [
  generateBrandToGeneric,
  generateGenericToBrand,
  generateIndicationQuestion,
  generateSideEffectQuestion,
  generateDrugClassQuestion,
  generateDosingQuestion,
];

export function generateQuestionsForLesson(drugIds: string[], count: number): QuizQuestion[] {
  const lessonDrugs = getDrugsByIds(drugIds);
  if (lessonDrugs.length === 0) return [];

  const questions: QuizQuestion[] = [];
  let matchingAdded = false;

  for (let i = 0; i < count; i++) {
    if (!matchingAdded && i === Math.floor(count / 2) && lessonDrugs.length >= 4) {
      const matchQ = generateMatchingQuestion(lessonDrugs);
      if (matchQ) {
        questions.push(matchQ);
        matchingAdded = true;
        continue;
      }
    }
    const drug = lessonDrugs[i % lessonDrugs.length];
    const generator = generators[i % generators.length];
    questions.push(generator(drug));
  }

  return shuffleArray(questions);
}

export function generatePracticeQuestions(count: number = 10): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const shuffledDrugs = shuffleArray(drugs);
  let matchingAdded = false;

  for (let i = 0; i < count; i++) {
    if (!matchingAdded && i === Math.floor(count / 3)) {
      const matchQ = generateMatchingQuestion(shuffledDrugs);
      if (matchQ) {
        questions.push(matchQ);
        matchingAdded = true;
        continue;
      }
    }
    const drug = shuffledDrugs[i % shuffledDrugs.length];
    const generator = generators[Math.floor(Math.random() * generators.length)];
    questions.push(generator(drug));
  }

  return shuffleArray(questions);
}

export function generateMistakeQuestions(
  mistakes: MistakeBankEntry[],
  maxCount: number = 10,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const capped = mistakes.slice(0, maxCount);

  const generatorMap: Record<string, (drug: Drug) => QuizQuestion> = {
    brand_to_generic: generateBrandToGeneric,
    generic_to_brand: generateGenericToBrand,
    indication: generateIndicationQuestion,
    side_effect: generateSideEffectQuestion,
    drug_class: generateDrugClassQuestion,
    dosing: generateDosingQuestion,
  };

  for (const entry of capped) {
    const drug = drugs.find(d => d.id === entry.drugId);
    if (!drug) continue;
    const gen = generatorMap[entry.questionType];
    if (gen) {
      questions.push(gen(drug));
    } else {
      const fallback = generators[Math.floor(Math.random() * generators.length)];
      questions.push(fallback(drug));
    }
  }

  return shuffleArray(questions);
}

export function generateMistakeReviewQuestions(
  drugIds: string[],
  count: number = 10,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const targetDrugs = drugs.filter(d => drugIds.includes(d.id));
  if (targetDrugs.length === 0) return generatePracticeQuestions(count);

  for (let i = 0; i < count; i++) {
    const drug = targetDrugs[i % targetDrugs.length];
    const generator = generators[Math.floor(Math.random() * generators.length)];
    questions.push(generator(drug));
  }

  return shuffleArray(questions);
}

export function generateSpacedRepetitionQuestions(
  dueDrugIds: string[],
  lowMasteryDrugIds: string[],
  count: number = 10,
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const usedDrugIds = new Set<string>();

  const addQuestion = (drugId: string) => {
    if (questions.length >= count) return;
    const drug = drugs.find(d => d.id === drugId);
    if (!drug) return;
    usedDrugIds.add(drugId);
    const generator = generators[Math.floor(Math.random() * generators.length)];
    questions.push(generator(drug));
  };

  for (const id of dueDrugIds) {
    if (questions.length >= count) break;
    addQuestion(id);
  }

  for (const id of lowMasteryDrugIds) {
    if (questions.length >= count) break;
    if (usedDrugIds.has(id)) continue;
    addQuestion(id);
  }

  if (questions.length < count) {
    const remaining = shuffleArray(drugs.filter(d => !usedDrugIds.has(d.id)));
    for (const drug of remaining) {
      if (questions.length >= count) break;
      const generator = generators[Math.floor(Math.random() * generators.length)];
      questions.push(generator(drug));
    }
  }

  return shuffleArray(questions);
}
