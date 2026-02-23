import { QuizQuestion, Drug, MatchPair, MistakeBankEntry, QuizQuestionPhase } from '@/constants/types';
import { drugs, getDrugsByIds } from '@/constants/drugData';

// End Game: external question bank (bundled copy from drugchug-qbank/Quiz)
type ExternalBankQuestion = {
  id: string;
  category?: string;
  difficulty?: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
  reference?: string;
};

// NOTE: require() avoids TypeScript JSON module config requirements.
const ENDGAME_BANK: ExternalBankQuestion[] = require('../constants/endgameQuestionBank.json');

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function sampleOne<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function unique<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

/**
 * De-dupe options in a case/whitespace-insensitive way (prevents identical-looking duplicates like "Edema" twice).
 */
function optionKey(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function dedupeOptions(options: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const opt of options) {
    const trimmed = (opt ?? '').trim();
    if (!trimmed) continue;
    const key = optionKey(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

/**
 * Ensures options are unique and (when possible) padded to the desired count.
 * Returns a shuffled array for nice randomness in the UI.
 */
function finalizeOptions(options: string[], desiredCount: number, fallbackPool: string[] = []): string[] {
  let result = dedupeOptions(options);

  if (result.length < desiredCount && fallbackPool.length) {
    const fallback = shuffleArray(dedupeOptions(fallbackPool));
    for (const cand of fallback) {
      if (result.length >= desiredCount) break;
      const key = optionKey(cand);
      if (result.some((x) => optionKey(x) === key)) continue;
      result.push(cand.trim());
    }
  }

  if (result.length > desiredCount) {
    result = result.slice(0, desiredCount);
  }

  return shuffleArray(result);
}

function uid(prefix: string, drugId?: string): string {
  return `${prefix}-${drugId ?? 'x'}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalize(s: string): string {
  return (s || '').toLowerCase();
}

/**
 * A lightweight normalizer so we can pick "trickier" distractors from similar classes.
 * This does NOT need to be perfect — it just needs to group obvious families.
 */
function classKey(drugClass: string): string {
  const c = normalize(drugClass);
  if (c.includes('ace')) return 'ace';
  if (c.includes('arb') || c.includes('angiotensin ii')) return 'arb';
  if (c.includes('beta')) return 'beta_blocker';
  if (c.includes('calcium channel') || c.includes('ccb') || c.includes('dihydropyridine')) return 'ccb';
  if (c.includes('statin') || c.includes('hmg-coa')) return 'statin';
  if (c.includes('thiazide')) return 'thiazide';
  if (c.includes('loop')) return 'loop';
  if (c.includes('ppi') || c.includes('proton pump')) return 'ppi';
  if (c.includes('h2') || c.includes('histamine-2')) return 'h2';
  if (c.includes('ssri')) return 'ssri';
  if (c.includes('snri')) return 'snri';
  if (c.includes('benzodiazep')) return 'benzo';
  if (c.includes('opioid')) return 'opioid';
  return c.split('(')[0].trim() || 'other';
}

function genericSuffix(genericName: string): string {
  const g = normalize(genericName);
    const suffixes = [
    'asteride',
    'triptan',
    'floxacin',
    'cycline',
    'statin',
    'sartan',
    'pril',
    'xaban',
    'gatran',
    'cillin',
    'dipine',
    'prazole',
    'tidine',
    'flozin',
    'gliptin',
    'lukast',
    'setron',
    'coxib',
    'oxicam',
    'profen',
    'olol',
    'osin',
    'pam',
    'lam',
    'caine',
    'mab',
    'azole',
    'mycin',
    'tide',
    'vir',
  ];
  for (const suf of suffixes) {
    if (g.endsWith(suf)) return suf;
  }
  return '';
}

const SUFFIX_TO_CLASS: Record<string, string> = {
  pril: 'ACE inhibitor',
  sartan: 'ARB',
  olol: 'Beta-blocker',
  statin: 'Statin',
  dipine: 'Calcium channel blocker',
  prazole: 'Proton pump inhibitor',
  tidine: 'H2 blocker',
  flozin: 'SGLT2 inhibitor',
  gliptin: 'DPP-4 inhibitor',
  tide: 'Peptide (often GLP-1)',
  mab: 'Monoclonal antibody',
  azole: 'Azole (often antifungal)',
  cycline: 'Tetracycline antibiotic',
  floxacin: 'Fluoroquinolone antibiotic',
  mycin: '“Mycin” antibiotic',
  vir: 'Antiviral',
  cillin: 'Penicillin antibiotic',
  xaban: 'Factor Xa inhibitor (DOAC)',
  gatran: 'Direct thrombin inhibitor (DOAC)',
  triptan: 'Triptan (acute migraine)',
  setron: '5-HT3 antagonist antiemetic',
  lukast: 'Leukotriene receptor antagonist',
  coxib: 'COX-2 selective NSAID',
  oxicam: 'NSAID',
  profen: 'NSAID',
  osin: 'Alpha-1 blocker (BPH/HTN)',
  asteride: '5α-reductase inhibitor',
  pam: 'Benzodiazepine (often)',
  lam: 'Benzodiazepine (often)',
  caine: 'Local anesthetic (often)',
};

function getSimilarDrugs(drug: Drug, pool: Drug[] = drugs): Drug[] {
  const key = classKey(drug.drugClass);
  const sameClass = pool.filter((d) => d.id !== drug.id && classKey(d.drugClass) === key);
  if (sameClass.length >= 4) return sameClass;

  const suf = genericSuffix(drug.genericName);
  const sameSuffix = suf ? pool.filter((d) => d.id !== drug.id && genericSuffix(d.genericName) === suf) : [];
  return unique([...sameClass, ...sameSuffix]);
}

function getDistractors(correct: string, allOptions: string[], count: number): string[] {
  const filtered = allOptions.filter((o) => o !== correct);
  return shuffleArray(filtered).slice(0, count);
}

function getDistractorsSmart(
  correct: string,
  primaryPool: string[],
  fallbackPool: string[],
  count: number
): string[] {
  const fromPrimary = getDistractors(correct, unique(primaryPool), count);
  if (fromPrimary.length >= count) return fromPrimary;
  const needed = count - fromPrimary.length;
  const fromFallback = getDistractors(correct, unique(fallbackPool), needed);
  return unique([...fromPrimary, ...fromFallback]).slice(0, count);
}


/**
 * Like getDistractorsSmart, but excludes ANY values in the `forbidden` list as distractors.
 * This prevents confusing situations where multiple answers are "technically correct"
 * (e.g., HCTZ: HTN AND edema) when the question expects only one correct option.
 */
function getDistractorsSmartExcluding(
  correct: string,
  primaryPool: string[],
  fallbackPool: string[],
  count: number,
  forbidden: string[]
): string[] {
  const banned = new Set<string>([correct, ...forbidden].map(optionKey));

  const primary = dedupeOptions(primaryPool).filter((o) => !banned.has(optionKey(o)));
  const fromPrimary = shuffleArray(primary).slice(0, count);
  if (fromPrimary.length >= count) return fromPrimary;

  const needed = count - fromPrimary.length;
  const usedKeys = new Set(fromPrimary.map(optionKey));

  const fallback = dedupeOptions(fallbackPool).filter((o) => {
    const k = optionKey(o);
    return !banned.has(k) && !usedKeys.has(k);
  });

  const fromFallback = shuffleArray(fallback).slice(0, needed);
  return [...fromPrimary, ...fromFallback];
}

function withPhase(q: QuizQuestion, phase: QuizQuestionPhase): QuizQuestion {
  return { ...q, phase };
}

function brandToGeneric(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const allGenerics = drugs.map((d) => d.genericName);
  const distractors = getDistractorsSmart(
    drug.genericName,
    similar.map((d) => d.genericName),
    allGenerics,
    3
  );

  const options = finalizeOptions([drug.genericName, ...distractors], 4, allGenerics);

  return withPhase(
    {
      id: uid('q-btg', drug.id),
      type: 'brand_to_generic',
      question: `What is the generic name for ${drug.brandName}?`,
      correctAnswer: drug.genericName,
      options,
      drugId: drug.id,
      explanation: `${drug.brandName} is the brand name for ${drug.genericName}.`,
    },
    phase
  );
}

function genericToBrand(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const allBrands = drugs.map((d) => d.brandName);
  const distractors = getDistractorsSmart(
    drug.brandName,
    similar.map((d) => d.brandName),
    allBrands,
    3
  );

  const options = finalizeOptions([drug.brandName, ...distractors], 4, allBrands);

  return withPhase(
    {
      id: uid('q-gtb', drug.id),
      type: 'generic_to_brand',
      question: `What is the brand name for ${drug.genericName}?`,
      correctAnswer: drug.brandName,
      options,
      drugId: drug.id,
      explanation: `${drug.genericName} is commonly known by the brand ${drug.brandName}.`,
    },
    phase
  );
}

function clozeBrandToGeneric(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const allGenerics = drugs.map((d) => d.genericName);
  const distractors = getDistractorsSmart(
    drug.genericName,
    similar.map((d) => d.genericName),
    allGenerics,
    3
  );

  const wordBank = finalizeOptions([drug.genericName, ...distractors], 4, allGenerics);

  return withPhase(
    {
      id: uid('q-cloze-btg', drug.id),
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: drug.genericName,
      options: wordBank,
      drugId: drug.id,
      cloze: {
        parts: [`The generic for ${drug.brandName} is `, '.'],
        wordBank,
        correctWords: [drug.genericName],
      },
      explanation: `${drug.brandName} is the brand name for ${drug.genericName}.`,
    },
    phase
  );
}

function clozeGenericToBrand(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const allBrands = drugs.map((d) => d.brandName);
  const distractors = getDistractorsSmart(
    drug.brandName,
    similar.map((d) => d.brandName),
    allBrands,
    3
  );

  const wordBank = finalizeOptions([drug.brandName, ...distractors], 4, allBrands);

  return withPhase(
    {
      id: uid('q-cloze-gtb', drug.id),
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: drug.brandName,
      options: wordBank,
      drugId: drug.id,
      cloze: {
        parts: [`A common brand for ${drug.genericName} is `, '.'],
        wordBank,
        correctWords: [drug.brandName],
      },
      explanation: `${drug.genericName} is commonly known by the brand ${drug.brandName}.`,
    },
    phase
  );
}

function clozeIndication(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const correct = drug.indications?.[0] ?? 'Hypertension';
  const myIndications = unique(drug.indications ?? []);
  const allIndications = unique(drugs.flatMap((d) => d.indications ?? []));

  const similar = getSimilarDrugs(drug, pool);
  const similarIndications = unique(similar.flatMap((d) => d.indications ?? []));

  // Exclude any other true indications for THIS drug so we don't accidentally show multiple "correct" options.
  const distractors = getDistractorsSmartExcluding(correct, similarIndications, allIndications, 3, myIndications);

  const banned = new Set(myIndications.map(optionKey));
  const fillerPool = allIndications.filter((x) => !banned.has(optionKey(x)));
  const wordBank = finalizeOptions([correct, ...distractors], 4, fillerPool);

  return withPhase(
    {
      id: uid('q-cloze-ind', drug.id),
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: correct,
      options: wordBank,
      drugId: drug.id,
      cloze: {
        parts: [`A common use for ${drug.genericName} is `, '.'],
        wordBank,
        correctWords: [correct],
      },
      explanation: `Primary indication: ${correct}.`,
    },
    phase
  );
}

function clozeSideEffect(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const correct = drug.sideEffects?.[0] ?? 'Dizziness';
  const mySE = unique(drug.sideEffects ?? []);
  const allSE = unique(drugs.flatMap((d) => d.sideEffects ?? []));

  const similar = getSimilarDrugs(drug, pool);
  const similarSE = unique(similar.flatMap((d) => d.sideEffects ?? []));

  // Exclude any other true side effects for THIS drug so we don't show multiple "technically correct" options.
  const distractors = getDistractorsSmartExcluding(correct, similarSE, allSE, 3, mySE);

  const banned = new Set(mySE.map(optionKey));
  const fillerPool = allSE.filter((x) => !banned.has(optionKey(x)));
  const wordBank = finalizeOptions([correct, ...distractors], 4, fillerPool);

  return withPhase(
    {
      id: uid('q-cloze-se', drug.id),
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: correct,
      options: wordBank,
      drugId: drug.id,
      cloze: {
        parts: [`A common side effect of ${drug.genericName} is `, '.'],
        wordBank,
        correctWords: [correct],
      },
      explanation: `Common side effect: ${correct}.`,
    },
    phase
  );
}

function clozeSuffixToClass(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const suf = genericSuffix(drug.genericName);
  const correct = suf ? SUFFIX_TO_CLASS[suf] : undefined;
  if (!suf || !correct) {
    // Fallback to another cloze type
    return clozeBrandToGeneric(drug, pool, phase);
  }

  const distractors = shuffleArray(unique(Object.values(SUFFIX_TO_CLASS)).filter((x) => x !== correct)).slice(0, 3);
  const wordBank = shuffleArray([correct, ...distractors]);

  return withPhase(
    {
      id: uid('q-cloze-suffix', drug.id),
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: correct,
      options: wordBank,
      drugId: drug.id,
      cloze: {
        parts: [`The suffix "-${suf}" usually points to a(n) `, '.'],
        wordBank,
        correctWords: [correct],
      },
      explanation: `High-yield naming pattern: -${suf} → ${correct}.`,
    },
    phase
  );
}

function clozeQuestion(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const suf = genericSuffix(drug.genericName);
  const candidates: Array<(drug: Drug, pool: Drug[], phase: QuizQuestionPhase) => QuizQuestion> = [
    clozeBrandToGeneric,
    clozeGenericToBrand,
    clozeIndication,
    clozeSideEffect,
  ];
  if (suf && SUFFIX_TO_CLASS[suf]) {
    candidates.push(clozeSuffixToClass);
  }
  return sampleOne(candidates)(drug, pool, phase);
}

function indicationPrimary(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const correct = drug.indications?.[0] ?? 'Hypertension';
  const myIndications = unique(drug.indications ?? []);
  const allIndications = unique(drugs.flatMap((d) => d.indications ?? []));

  const similar = getSimilarDrugs(drug, pool);
  const similarIndications = unique(similar.flatMap((d) => d.indications ?? []));

  // Exclude other true indications for this drug from distractors (prevents multiple correct choices).
  const distractors = getDistractorsSmartExcluding(correct, similarIndications, allIndications, 3, myIndications);

  const banned = new Set(myIndications.map(optionKey));
  const fillerPool = allIndications.filter((x) => !banned.has(optionKey(x)));
  const options = finalizeOptions([correct, ...distractors], 4, fillerPool);

  return withPhase(
    {
      id: uid('q-ind', drug.id),
      type: 'indication',
      question: `${drug.brandName} (${drug.genericName}) is primarily indicated for:`,
      correctAnswer: correct,
      options,
      drugId: drug.id,
      explanation: `Primary indication: ${correct}.`,
    },
    phase
  );
}

function notIndication(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const indications = unique(drug.indications ?? []);
  const allIndications = unique(drugs.flatMap((d) => d.indications ?? []));
  const notMine = allIndications.filter((i) => !indications.includes(i));
  if (indications.length === 0 || notMine.length === 0) {
    return indicationPrimary(drug, pool, phase);
  }
  const correct = sampleOne(notMine);
  const distractors = shuffleArray(indications);
  while (distractors.length < 3) {
    const filler = allIndications.find((x) => x !== correct && !distractors.includes(x));
    if (!filler) break;
    distractors.push(filler);
  }
  const finalDistractors = distractors.slice(0, 3);
  return withPhase(
    {
      id: uid('q-not-ind', drug.id),
      type: 'not_indication',
      question: `Which of the following is NOT a typical indication for ${drug.genericName}?`,
      correctAnswer: correct,
      options: shuffleArray([correct, ...finalDistractors]),
      drugId: drug.id,
      explanation: `Common indications for ${drug.genericName} include: ${indications.slice(0, 3).join(', ')}.`,
    },
    phase
  );
}

function sideEffectCommon(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const correct = drug.sideEffects?.[0] ?? 'Dizziness';
  const mySE = unique(drug.sideEffects ?? []);
  const allSE = unique(drugs.flatMap((d) => d.sideEffects ?? []));

  const similar = getSimilarDrugs(drug, pool);
  const similarSE = unique(similar.flatMap((d) => d.sideEffects ?? []));

  // Exclude other true side effects for this drug from distractors (prevents multiple correct choices).
  const distractors = getDistractorsSmartExcluding(correct, similarSE, allSE, 3, mySE);

  const banned = new Set(mySE.map(optionKey));
  const fillerPool = allSE.filter((x) => !banned.has(optionKey(x)));
  const options = finalizeOptions([correct, ...distractors], 4, fillerPool);

  return withPhase(
    {
      id: uid('q-se', drug.id),
      type: 'side_effect',
      question: `Which is a common side effect of ${drug.brandName} (${drug.genericName})?`,
      correctAnswer: correct,
      options,
      drugId: drug.id,
      explanation: `Common side effect: ${correct}.`,
    },
    phase
  );
}

function notSideEffect(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const ses = unique(drug.sideEffects ?? []);
  const allSE = unique(drugs.flatMap((d) => d.sideEffects ?? []));
  const notMine = allSE.filter((s) => !ses.includes(s));
  if (ses.length === 0 || notMine.length === 0) {
    return sideEffectCommon(drug, pool, phase);
  }
  const correct = sampleOne(notMine);
  const distractors = shuffleArray(ses);
  while (distractors.length < 3) {
    const filler = allSE.find((x) => x !== correct && !distractors.includes(x));
    if (!filler) break;
    distractors.push(filler);
  }
  const finalDistractors = distractors.slice(0, 3);
  return withPhase(
    {
      id: uid('q-not-se', drug.id),
      type: 'not_side_effect',
      question: `Which of the following is NOT a typical side effect of ${drug.genericName}?`,
      correctAnswer: correct,
      options: shuffleArray([correct, ...finalDistractors]),
      drugId: drug.id,
      explanation: `Typical side effects for ${drug.genericName} include: ${ses.slice(0, 3).join(', ')}.`,
    },
    phase
  );
}

function drugClassQuestion(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const allClasses = unique(drugs.map((d) => d.drugClass));
  const key = classKey(drug.drugClass);
  const similarClasses = unique(drugs.filter((d) => classKey(d.drugClass) === key).map((d) => d.drugClass));
  const distractors = getDistractorsSmart(drug.drugClass, similarClasses, allClasses, 3);

  const options = finalizeOptions([drug.drugClass, ...distractors], 4, allClasses);

  return withPhase(
    {
      id: uid('q-class', drug.id),
      type: 'drug_class',
      question: `${drug.brandName} (${drug.genericName}) belongs to which drug class?`,
      correctAnswer: drug.drugClass,
      options,
      drugId: drug.id,
      explanation: `Drug class: ${drug.drugClass}.`,
    },
    phase
  );
}

function dosingQuestion(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const allDosing = unique(drugs.map((d) => d.commonDosing));
  const similar = getSimilarDrugs(drug, pool);
  const similarDosing = unique(similar.map((d) => d.commonDosing));
  const distractors = getDistractorsSmart(drug.commonDosing, similarDosing, allDosing, 3);

  const options = finalizeOptions([drug.commonDosing, ...distractors], 4, allDosing);

  return withPhase(
    {
      id: uid('q-dose', drug.id),
      type: 'dosing',
      question: `What is a common dosing for ${drug.brandName} (${drug.genericName})?`,
      correctAnswer: drug.commonDosing,
      options,
      drugId: drug.id,
      explanation: `Common dosing: ${drug.commonDosing}.`,
    },
    phase
  );
}

function keyFactToDrug(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const candidates = shuffleArray(unique([drug, ...similar, ...shuffleArray(drugs).slice(0, 10)]));

  const distractors = candidates
    .filter((d) => d.id !== drug.id)
    .slice(0, 8) // take extra, then dedupe/pick
    .map((d) => d.genericName);

  const allGenerics = drugs.map((d) => d.genericName);
  const options = finalizeOptions([drug.genericName, ...distractors], 4, allGenerics);

  return withPhase(
    {
      id: uid('q-fact', drug.id),
      type: 'key_fact',
      question: `Which drug best matches this clinical pearl?\n\n“${drug.keyFact}”`,
      correctAnswer: drug.genericName,
      options,
      drugId: drug.id,
      explanation: drug.keyFact,
    },
    phase
  );
}

function classComparison(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const key = classKey(drug.drugClass);
  const same = drugs.filter((d) => d.id !== drug.id && classKey(d.drugClass) === key);
  if (same.length === 0) {
    return drugClassQuestion(drug, pool, phase);
  }
  const correctDrug = sampleOne(same);
  const distractorDrugs = shuffleArray(drugs.filter((d) => classKey(d.drugClass) !== key)).slice(0, 6);

  const allGenerics = drugs.map((d) => d.genericName);
  const options = finalizeOptions(
    [correctDrug.genericName, ...distractorDrugs.map((d) => d.genericName)],
    4,
    allGenerics
  );

  return withPhase(
    {
      id: uid('q-class-compare', drug.id),
      type: 'class_comparison',
      question: `Which drug is in the SAME class as ${drug.genericName}?`,
      correctAnswer: correctDrug.genericName,
      options,
      drugId: drug.id,
      explanation: `${drug.genericName} and ${correctDrug.genericName} are both in: ${drug.drugClass}.`,
    },
    phase
  );
}

function suffixQuestion(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const suf = genericSuffix(drug.genericName);
  if (!suf) {
    return drugClassQuestion(drug, pool, phase);
  }

  const correct = SUFFIX_TO_CLASS[suf] ?? 'Drug class pattern';
  const poolClasses = unique(Object.values(SUFFIX_TO_CLASS));
  const distractors = shuffleArray(poolClasses.filter((x) => x !== correct)).slice(0, 6);

  const options = finalizeOptions([correct, ...distractors], 4, poolClasses);

  return withPhase(
    {
      id: uid('q-suffix', drug.id),
      type: 'suffix',
      question: `${drug.genericName} ends in “-${suf}”. That suffix is most associated with:`,
      correctAnswer: correct,
      options,
      drugId: drug.id,
      explanation: `Suffix pearl: -${suf} → ${correct} (high-yield naming pattern).`,
    },
    phase
  );
}

function clinicalPearl(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const key = classKey(drug.drugClass);

  // Only a few high-yield scenarios for now (expandable later)
  if (key === 'ace') {
    return withPhase(
      {
        id: uid('q-pearl-ace', drug.id),
        type: 'clinical_pearl',
        question:
          `A patient develops a persistent dry cough after starting ${drug.genericName}. Which is the best alternative that keeps RAAS benefit with less cough?`,
        correctAnswer: 'ARB (angiotensin II receptor blocker)',
        options: shuffleArray([
          'ARB (angiotensin II receptor blocker)',
          'Beta-blocker',
          'Thiazide diuretic',
          'Calcium channel blocker',
        ]),
        drugId: drug.id,
        explanation: 'ACE inhibitors can cause dry cough. Switching to an ARB often avoids cough while preserving similar benefits.',
      },
      phase
    );
  }

  if (key === 'statin') {
    return withPhase(
      {
        id: uid('q-pearl-statin', drug.id),
        type: 'clinical_pearl',
        question: `A patient on ${drug.genericName} reports new muscle pain and weakness. Which adverse effect is most concerning?`,
        correctAnswer: 'Myopathy / rhabdomyolysis',
        options: shuffleArray([
          'Myopathy / rhabdomyolysis',
          'Dry cough',
          'Hypoglycemia',
          'Constipation',
        ]),
        drugId: drug.id,
        explanation: 'Statins can cause myopathy (rarely rhabdomyolysis). Check CK and assess risk factors/drug interactions.',
      },
      phase
    );
  }

  // Fallback: use key fact as a pearl
  return keyFactToDrug(drug, pool, phase);
}

function trueFalse(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  // More variety than just brand↔generic while staying unambiguous.
  const isTrue = Math.random() < 0.5;

  const allIndications = unique(drugs.flatMap((d) => d.indications ?? []));
  const allSideEffects = unique(drugs.flatMap((d) => d.sideEffects ?? []));
  const allClasses = unique(drugs.map((d) => d.drugClass));

  const suf = genericSuffix(drug.genericName);
  const hasSuffixPearl = !!(suf && SUFFIX_TO_CLASS[suf]);

  const variants = hasSuffixPearl
    ? (['brand_generic', 'class', 'indication', 'side_effect', 'suffix'] as const)
    : (['brand_generic', 'class', 'indication', 'side_effect'] as const);

  const variant = sampleOne([...variants]);

  let statement = '';
  let explanation = '';

  if (variant === 'brand_generic') {
    const other = drugs.find((d) => d.id !== drug.id) ?? drug;
    statement = isTrue
      ? `${drug.brandName} is the brand name for ${drug.genericName}.`
      : `${drug.brandName} is the brand name for ${other.genericName}.`;
    explanation = `${drug.brandName} ↔ ${drug.genericName}.`;
  } else if (variant === 'class') {
    const otherClass =
      sampleOne(allClasses.filter((c) => optionKey(c) !== optionKey(drug.drugClass))) ?? drug.drugClass;
    statement = isTrue ? `${drug.genericName} is a ${drug.drugClass}.` : `${drug.genericName} is a ${otherClass}.`;
    explanation = `${drug.genericName} belongs to the class: ${drug.drugClass}.`;
  } else if (variant === 'indication') {
    const inds = unique(drug.indications ?? []);
    const trueInd = inds.length ? sampleOne(inds) : 'Hypertension';
    const falseInd =
      sampleOne(allIndications.filter((i) => !inds.some((x) => optionKey(x) === optionKey(i)))) ?? 'Hypertension';

    statement = isTrue
      ? `${drug.genericName} is commonly used for ${trueInd}.`
      : `${drug.genericName} is commonly used for ${falseInd}.`;
    explanation = `Common uses for ${drug.genericName}: ${inds.slice(0, 3).join(', ') || 'see lesson notes'}.`;
  } else if (variant === 'side_effect') {
    const ses = unique(drug.sideEffects ?? []);
    const trueSe = ses.length ? sampleOne(ses) : 'Dizziness';
    const falseSe =
      sampleOne(allSideEffects.filter((s) => !ses.some((x) => optionKey(x) === optionKey(s)))) ?? 'Dizziness';

    statement = isTrue
      ? `${trueSe} is a common side effect of ${drug.genericName}.`
      : `${falseSe} is a common side effect of ${drug.genericName}.`;
    explanation = `Typical side effects for ${drug.genericName}: ${ses.slice(0, 3).join(', ') || 'see lesson notes'}.`;
  } else if (variant === 'suffix') {
    const correctClass = suf && SUFFIX_TO_CLASS[suf] ? SUFFIX_TO_CLASS[suf] : 'Drug class pattern';
    const wrongClass =
      sampleOne(unique(Object.values(SUFFIX_TO_CLASS)).filter((c) => optionKey(c) !== optionKey(correctClass))) ??
      'Drug class pattern';

    statement = isTrue
      ? `${drug.genericName} ends in "-${suf}", which often indicates a ${correctClass}.`
      : `${drug.genericName} ends in "-${suf}", which often indicates a ${wrongClass}.`;
    explanation = `High-yield naming pattern: -${suf} → ${correctClass}.`;
  }

  return withPhase(
    {
      id: uid('q-tf', drug.id),
      type: 'true_false',
      question: `True or False: ${statement}`,
      correctAnswer: isTrue ? 'True' : 'False',
      options: ['True', 'False'],
      drugId: drug.id,
      explanation,
    },
    phase
  );
}

function multiSelectIndications(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const allTrue = unique(drug.indications ?? []);
  // If the drug only has 0–1 listed indication, a single-answer question is cleaner.
  if (allTrue.length < 2) {
    return indicationPrimary(drug, pool, phase);
  }

  // Pick 2–3 correct answers (never include other true indications as distractors).
  const correctCount = Math.min(allTrue.length, Math.random() < 0.5 ? 2 : 3);
  const correctAnswers = shuffleArray(allTrue).slice(0, correctCount);

  const all = unique(drugs.flatMap((d) => d.indications ?? []));
  const distractorPool = dedupeOptions(all).filter((x) => !allTrue.some((t) => optionKey(t) === optionKey(x)));
  const distractorCount = Math.max(2, 5 - correctCount); // aim for ~5 options total
  const distractors = shuffleArray(distractorPool).slice(0, distractorCount);

  const options = shuffleArray(dedupeOptions([...correctAnswers, ...distractors])).slice(0, 6);

  return withPhase(
    {
      id: uid('q-ms-ind', drug.id),
      type: 'multi_select',
      question: `Select ALL typical indications for ${drug.genericName}:`,
      correctAnswers,
      options,
      drugId: drug.id,
      explanation: `Indications: ${allTrue.join(', ') || '—'}.`,
    },
    phase
  );
}

function multiSelectSideEffects(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const allTrue = unique(drug.sideEffects ?? []);
  // If the drug only has 0–1 listed side effect, a single-answer question is cleaner.
  if (allTrue.length < 2) {
    return sideEffectCommon(drug, pool, phase);
  }

  // Pick 2–3 correct answers (never include other true side effects as distractors).
  const correctCount = Math.min(allTrue.length, Math.random() < 0.5 ? 2 : 3);
  const correctAnswers = shuffleArray(allTrue).slice(0, correctCount);

  const all = unique(drugs.flatMap((d) => d.sideEffects ?? []));
  const distractorPool = dedupeOptions(all).filter((x) => !allTrue.some((t) => optionKey(t) === optionKey(x)));
  const distractorCount = Math.max(2, 5 - correctCount); // aim for ~5 options total
  const distractors = shuffleArray(distractorPool).slice(0, distractorCount);

  const options = shuffleArray(dedupeOptions([...correctAnswers, ...distractors])).slice(0, 6);

  return withPhase(
    {
      id: uid('q-ms-se', drug.id),
      type: 'multi_select',
      question: `Select ALL common side effects of ${drug.genericName}:`,
      correctAnswers,
      options,
      drugId: drug.id,
      explanation: `Side effects: ${allTrue.join(', ') || '—'}.`,
    },
    phase
  );
}

function generateMatchingQuestion(drugPool: Drug[], phase: QuizQuestionPhase): QuizQuestion | null {
  if (drugPool.length < 4) return null;
  const selected = shuffleArray(drugPool).slice(0, 4);
  const pairs: MatchPair[] = selected.map((d) => ({
    brand: d.brandName,
    generic: d.genericName,
    drugId: d.id,
  }));
  const shuffledGenerics = shuffleArray(pairs.map((p) => p.generic));
  return withPhase(
    {
      id: uid('q-match'),
      type: 'matching',
      question: 'Match each brand name to its generic name',
      options: [],
      matchPairs: pairs,
      shuffledGenerics,
      drugId: selected[0].id,
      explanation: 'Brand ↔ generic matching is a core skill. Focus on patterns and look-alikes!',
    },
    phase
  );
}

const GENERATORS: Array<(drug: Drug, pool: Drug[], phase: QuizQuestionPhase) => QuizQuestion> = [
  brandToGeneric,
  genericToBrand,
  clozeQuestion,
  indicationPrimary,
  notIndication,
  sideEffectCommon,
  notSideEffect,
  multiSelectIndications,
  multiSelectSideEffects,
  suffixQuestion,
  dosingQuestion,
  drugClassQuestion,
  clinicalPearl,
  trueFalse,
  keyFactToDrug,
  classComparison,
];


type GeneratorFn = (drug: Drug, pool: Drug[], phase: QuizQuestionPhase) => QuizQuestion;

const BRAND_GENERIC_GENERATORS: GeneratorFn[] = [
  brandToGeneric,
  genericToBrand,
  clozeBrandToGeneric,
  clozeGenericToBrand,
];

const TRUE_FALSE_GENERATORS: GeneratorFn[] = [trueFalse];

const MULTI_SELECT_GENERATORS: GeneratorFn[] = [multiSelectIndications, multiSelectSideEffects];

const NOT_GENERATORS: GeneratorFn[] = [notIndication, notSideEffect];

const PEARL_GENERATORS: GeneratorFn[] = [clinicalPearl, keyFactToDrug, classComparison];

const CORE_FILL_GENERATORS: GeneratorFn[] = [suffixQuestion, dosingQuestion, clozeQuestion, keyFactToDrug, classComparison];

function clampStars(stars: number): 0 | 1 | 2 | 3 {
  if (stars <= 0) return 0;
  if (stars === 1) return 1;
  if (stars === 2) return 2;
  return 3;
}

function buildGeneratorQueue(count: number, stars: number): GeneratorFn[] {
  const s = clampStars(stars);
  const queue: GeneratorFn[] = [];
  if (count <= 0) return queue;

  // Baseline: always reinforce the essentials
  queue.push(sampleOne(BRAND_GENERIC_GENERATORS));
  if (count === 1) return queue;

  queue.push(indicationPrimary);
  if (count === 2) return queue;

  queue.push(sideEffectCommon);
  if (count === 3) return queue;

  queue.push(drugClassQuestion);
  if (count === 4) return queue;

  // Desired quotas (total counts, not "additional")
  let desiredBrand = s === 0 ? 4 : s === 1 ? 4 : s === 2 ? 3 : 2;
  let desiredTF = s <= 1 ? 2 : 1;
  let desiredMulti = s === 0 ? 0 : s === 1 ? 1 : s === 2 ? 2 : 3;
  let desiredNot = s <= 1 ? 0 : s === 2 ? 1 : 2;
  let desiredPearl = s <= 1 ? 0 : 1;

  // Baseline already includes 1 brand question
  let addBrand = Math.max(0, desiredBrand - 1);

  // Baseline already uses 4 slots
  let planned = 4 + addBrand + desiredTF + desiredMulti + desiredNot + desiredPearl;

  // If planned exceeds count, reduce harder buckets first (keeps essentials)
  while (planned > count) {
    if (desiredNot > 0) {
      desiredNot -= 1;
    } else if (desiredPearl > 0) {
      desiredPearl -= 1;
    } else if (desiredMulti > 0) {
      desiredMulti -= 1;
    } else if (desiredTF > 1) {
      desiredTF -= 1;
    } else if (addBrand > 0) {
      addBrand -= 1;
    } else {
      break;
    }
    planned = 4 + addBrand + desiredTF + desiredMulti + desiredNot + desiredPearl;
  }

  // Add quota-based items
  for (let i = 0; i < addBrand && queue.length < count; i++) queue.push(sampleOne(BRAND_GENERIC_GENERATORS));
  for (let i = 0; i < desiredTF && queue.length < count; i++) queue.push(sampleOne(TRUE_FALSE_GENERATORS));
  for (let i = 0; i < desiredMulti && queue.length < count; i++) queue.push(sampleOne(MULTI_SELECT_GENERATORS));
  for (let i = 0; i < desiredNot && queue.length < count; i++) queue.push(sampleOne(NOT_GENERATORS));
  for (let i = 0; i < desiredPearl && queue.length < count; i++) queue.push(sampleOne(PEARL_GENERATORS));

  // Fill remainder with a star-appropriate mix
  while (queue.length < count) {
    if (s <= 1) {
      // Early mastery: heavy on brand/generic + quick checks, with some variety
      const roll = Math.random();
      if (roll < 0.45) queue.push(sampleOne(BRAND_GENERIC_GENERATORS));
      else if (roll < 0.65) queue.push(sampleOne(TRUE_FALSE_GENERATORS));
      else queue.push(sampleOne(CORE_FILL_GENERATORS));
    } else {
      // Higher mastery: more complex decision-making, still keep a few core reps
      const roll = Math.random();
      if (roll < 0.4) queue.push(sampleOne(MULTI_SELECT_GENERATORS));
      else if (roll < 0.55) queue.push(sampleOne(NOT_GENERATORS));
      else if (roll < 0.7) queue.push(sampleOne(PEARL_GENERATORS));
      else if (roll < 0.85) queue.push(sampleOne(BRAND_GENERIC_GENERATORS));
      else queue.push(sampleOne(CORE_FILL_GENERATORS));
    }
  }

  return shuffleArray(queue).slice(0, count);
}

function starsForPhase(phase: QuizQuestionPhase, provided: number): number {
  if (phase === 'mastery') return 3;
  if (phase === 'review') return Math.min(2, Math.max(0, provided)); // keep review medium
  return Math.max(0, provided);
}

/**
 * Generates questions for a specific subsection lesson.
 * `masteryStars` controls the difficulty mix (0–3).
 */
export function generateQuestionsForLesson(
  drugIds: string[],
  count: number,
  phase: QuizQuestionPhase = 'quiz',
  masteryStars: number = 0
): QuizQuestion[] {
  const lessonDrugs = getDrugsByIds(drugIds);
  if (lessonDrugs.length === 0 || count <= 0) return [];

  const stars = starsForPhase(phase, masteryStars);

  const questions: QuizQuestion[] = [];
  const shuffledDrugs = shuffleArray(lessonDrugs);

  // Matching is best early (stars 0–1). It’s a great brand↔generic drill.
  const shouldAddMatching = lessonDrugs.length >= 4 && count >= 8 && stars <= 1;
  const effectiveCount = shouldAddMatching ? Math.max(1, count - 1) : count;

  const genQueue = buildGeneratorQueue(effectiveCount, stars);

  for (let i = 0; i < effectiveCount; i++) {
    const drug = shuffledDrugs[i % shuffledDrugs.length];
    const gen = genQueue[i] ?? sampleOne(GENERATORS);
    questions.push(gen(drug, lessonDrugs, phase));
  }

  if (shouldAddMatching) {
    const matchQ = generateMatchingQuestion(lessonDrugs, phase);
    if (matchQ) questions.push(matchQ);
    else {
      const drug = shuffledDrugs[effectiveCount % shuffledDrugs.length];
      questions.push(sampleOne(GENERATORS)(drug, lessonDrugs, phase));
    }
  }

  // Keep intro questions in order (caller can prepend). For quiz/review/mastery, shuffle is good.
  return phase === 'intro' ? questions.slice(0, count) : shuffleArray(questions).slice(0, count);
}

export function generateQuestionsFromDrugIds(
  drugIds: string[],
  count: number,
  phase: QuizQuestionPhase = 'review'
): QuizQuestion[] {
  const pool = drugs.filter((d) => drugIds.includes(d.id));
  if (pool.length === 0 || count <= 0) return [];
  const shuffled = shuffleArray(pool);

  // For non-subsection pools we don't know stars, so pick a sensible default:
  // - mastery quizzes = hard mix
  // - review pools = medium mix
  // - practice/quiz pools = easier mix
  const stars = phase === 'mastery' ? 3 : phase === 'review' ? 1 : 0;

  const shouldAddMatching = pool.length >= 4 && count >= 10 && stars <= 1;
  const effectiveCount = shouldAddMatching ? Math.max(1, count - 1) : count;

  const genQueue = buildGeneratorQueue(effectiveCount, stars);

  const questions: QuizQuestion[] = [];
  for (let i = 0; i < effectiveCount; i++) {
    const drug = shuffled[i % shuffled.length];
    const gen = genQueue[i] ?? sampleOne(GENERATORS);
    questions.push(gen(drug, pool, phase));
  }

  if (shouldAddMatching) {
    const matchQ = generateMatchingQuestion(pool, phase);
    if (matchQ) questions.push(matchQ);
    else {
      const drug = shuffled[effectiveCount % shuffled.length];
      questions.push(sampleOne(GENERATORS)(drug, pool, phase));
    }
  }

  return shuffleArray(questions).slice(0, count);
}


export function generatePracticeQuestions(count: number = 10): QuizQuestion[] {
  return generateQuestionsFromDrugIds(drugs.map((d) => d.id), count, 'quiz');
}

export function generateMistakeQuestions(mistakes: MistakeBankEntry[], maxCount: number = 10): QuizQuestion[] {
  const capped = mistakes.slice(0, maxCount);
  const questions: QuizQuestion[] = [];

  const generatorMap: Record<string, (drug: Drug, pool: Drug[], phase: QuizQuestionPhase) => QuizQuestion> = {
    brand_to_generic: brandToGeneric,
    generic_to_brand: genericToBrand,
    indication: indicationPrimary,
    not_indication: notIndication,
    side_effect: sideEffectCommon,
    not_side_effect: notSideEffect,
    dosing: dosingQuestion,
    drug_class: drugClassQuestion,
    key_fact: keyFactToDrug,
    class_comparison: classComparison,
    suffix: suffixQuestion,
    clinical_pearl: clinicalPearl,
    true_false: trueFalse,
    multi_select: (drug, pool, phase) =>
      (Math.random() < 0.5 ? multiSelectIndications : multiSelectSideEffects)(drug, pool, phase),
    matching: brandToGeneric,
    cloze: clozeQuestion,
  };

  for (const entry of capped) {
    const drug = drugs.find((d) => d.id === entry.drugId);
    if (!drug) continue;
    const gen = generatorMap[entry.questionType];
    const fallback = sampleOne(GENERATORS);
    questions.push((gen ?? fallback)(drug, drugs, 'review'));
  }

  return shuffleArray(questions);
}

export function generateMistakeReviewQuestions(drugIds: string[], count: number = 10): QuizQuestion[] {
  return generateQuestionsFromDrugIds(drugIds, count, 'review');
}

export function generateSpacedRepetitionQuestions(dueDrugIds: string[], lowMasteryDrugIds: string[], count: number = 10): QuizQuestion[] {
  const used = new Set<string>();
  const pickOrder = unique([...dueDrugIds, ...lowMasteryDrugIds]).filter((id) => id);

  const selected: string[] = [];
  for (const id of pickOrder) {
    if (selected.length >= count) break;
    used.add(id);
    selected.push(id);
  }

  if (selected.length < count) {
    const remaining = shuffleArray(drugs.map((d) => d.id).filter((id) => !used.has(id)));
    selected.push(...remaining.slice(0, count - selected.length));
  }

  return generateQuestionsFromDrugIds(selected, count, 'review');
}

export function generateMasteringQuestions(drugIds: string[], count: number = 30): QuizQuestion[] {
  // Mastery quiz: only within the provided pool
  return generateQuestionsFromDrugIds(drugIds, count, 'mastery');
}

/**
 * End Game Challenge (Module 11)
 * - Total: 15 questions
 * - 2–4 come from PharmaLingo drug bank (mixed review across all modules)
 * - 11–13 come from the external Q-bank (drugchug-qbank/Quiz)
 */
export function generateEndGameQuestions(totalCount: number = 15): QuizQuestion[] {
  const reviewCount = Math.min(4, Math.max(2, Math.floor(Math.random() * 3) + 2)); // 2–4
  const externalCount = Math.max(0, totalCount - reviewCount); // 11–13 if totalCount=15

  // 1) Review questions from our drug dataset (any module)
  const allDrugIds = drugs.map((d) => d.id);
  const reviewDrugIds = shuffleArray(allDrugIds).slice(0, Math.min(reviewCount, allDrugIds.length));
  const reviewQuestions = generateQuestionsFromDrugIds(reviewDrugIds, reviewCount, 'review');

  // 2) External bank questions
  const bank = (ENDGAME_BANK ?? []).filter((q) => {
    if (!q) return false;
    if (typeof q.stem !== 'string' || q.stem.trim().length === 0) return false;
    if (!Array.isArray(q.choices) || q.choices.length < 2) return false;
    if (typeof q.answerIndex !== 'number') return false;
    if (q.answerIndex < 0 || q.answerIndex >= q.choices.length) return false;
    return true;
  });

  const pickedExternal = shuffleArray(bank).slice(0, Math.min(externalCount, bank.length));
  const externalQuestions: QuizQuestion[] = pickedExternal.map((q) => {
    const correct = q.choices?.[q.answerIndex] ?? q.choices?.[0] ?? '';
    const options = shuffleArray(dedupeOptions(q.choices ?? []));

    // Ensure correct answer is present even after de-dupe.
    const finalOptions = correct && !options.some((o) => optionKey(o) === optionKey(correct))
      ? shuffleArray([correct, ...options]).slice(0, Math.max(4, options.length + 1))
      : options;

    return {
      id: uid('ext', q.id),
      type: 'external_mcq',
      question: q.stem,
      correctAnswer: correct,
      options: finalOptions,
      explanation: q.explanation,
      phase: 'mastery',
    };
  });

  // If the external bank ever has fewer items than expected, top up with additional review questions.
  let combined = [...externalQuestions, ...reviewQuestions];
  if (combined.length < totalCount) {
    const remaining = totalCount - combined.length;
    const extraReviewIds = shuffleArray(allDrugIds).slice(0, Math.min(remaining, allDrugIds.length));
    combined = [...combined, ...generateQuestionsFromDrugIds(extraReviewIds, remaining, 'review')];
  }

  return shuffleArray(combined).slice(0, totalCount);
}
