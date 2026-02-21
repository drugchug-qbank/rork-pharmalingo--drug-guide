import { QuizQuestion, Drug, MatchPair, MistakeBankEntry, QuizQuestionPhase } from '@/constants/types';
import { drugs, getDrugsByIds } from '@/constants/drugData';

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

function withPhase(q: QuizQuestion, phase: QuizQuestionPhase): QuizQuestion {
  return { ...q, phase };
}

function brandToGeneric(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const distractors = getDistractorsSmart(
    drug.genericName,
    similar.map((d) => d.genericName),
    drugs.map((d) => d.genericName),
    3
  );
  return withPhase(
    {
      id: uid('q-btg', drug.id),
      type: 'brand_to_generic',
      question: `What is the generic name for ${drug.brandName}?`,
      correctAnswer: drug.genericName,
      options: shuffleArray([drug.genericName, ...distractors]),
      drugId: drug.id,
      explanation: `${drug.brandName} is the brand name for ${drug.genericName}.`,
    },
    phase
  );
}

function genericToBrand(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const distractors = getDistractorsSmart(
    drug.brandName,
    similar.map((d) => d.brandName),
    drugs.map((d) => d.brandName),
    3
  );
  return withPhase(
    {
      id: uid('q-gtb', drug.id),
      type: 'generic_to_brand',
      question: `What is the brand name for ${drug.genericName}?`,
      correctAnswer: drug.brandName,
      options: shuffleArray([drug.brandName, ...distractors]),
      drugId: drug.id,
      explanation: `${drug.genericName} is commonly known by the brand ${drug.brandName}.`,
    },
    phase
  );
}

function clozeBrandToGeneric(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const similar = getSimilarDrugs(drug, pool);
  const distractors = getDistractorsSmart(
    drug.genericName,
    similar.map((d) => d.genericName),
    drugs.map((d) => d.genericName),
    3
  );

  const wordBank = shuffleArray([drug.genericName, ...distractors]);

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
  const distractors = getDistractorsSmart(
    drug.brandName,
    similar.map((d) => d.brandName),
    drugs.map((d) => d.brandName),
    3
  );

  const wordBank = shuffleArray([drug.brandName, ...distractors]);

  return withPhase(
    {
      id: uid('q-cloze-gtb', drug.id),
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: drug.brandName,
      options: wordBank,
      drugId: drug.id,
      cloze: {
        parts: [`The brand for ${drug.genericName} is `, '.'],
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
  const allIndications = unique(drugs.flatMap((d) => d.indications ?? []));
  const similar = getSimilarDrugs(drug, pool);
  const similarIndications = unique(similar.flatMap((d) => d.indications ?? []));
  const distractors = getDistractorsSmart(correct, similarIndications, allIndications, 3);
  const wordBank = shuffleArray([correct, ...distractors]);

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
  const allSE = unique(drugs.flatMap((d) => d.sideEffects ?? []));
  const similar = getSimilarDrugs(drug, pool);
  const similarSE = unique(similar.flatMap((d) => d.sideEffects ?? []));
  const distractors = getDistractorsSmart(correct, similarSE, allSE, 3);
  const wordBank = shuffleArray([correct, ...distractors]);

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
  const allIndications = unique(drugs.flatMap((d) => d.indications ?? []));
  const similar = getSimilarDrugs(drug, pool);
  const similarIndications = unique(similar.flatMap((d) => d.indications ?? []));
  const distractors = getDistractorsSmart(correct, similarIndications, allIndications, 3);
  return withPhase(
    {
      id: uid('q-ind', drug.id),
      type: 'indication',
      question: `${drug.brandName} (${drug.genericName}) is primarily indicated for:`,
      correctAnswer: correct,
      options: shuffleArray([correct, ...distractors]),
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
  const allSE = unique(drugs.flatMap((d) => d.sideEffects ?? []));
  const similar = getSimilarDrugs(drug, pool);
  const similarSE = unique(similar.flatMap((d) => d.sideEffects ?? []));
  const distractors = getDistractorsSmart(correct, similarSE, allSE, 3);
  return withPhase(
    {
      id: uid('q-se', drug.id),
      type: 'side_effect',
      question: `Which is a common side effect of ${drug.brandName} (${drug.genericName})?`,
      correctAnswer: correct,
      options: shuffleArray([correct, ...distractors]),
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
  return withPhase(
    {
      id: uid('q-class', drug.id),
      type: 'drug_class',
      question: `${drug.brandName} (${drug.genericName}) belongs to which drug class?`,
      correctAnswer: drug.drugClass,
      options: shuffleArray([drug.drugClass, ...distractors]),
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
  return withPhase(
    {
      id: uid('q-dose', drug.id),
      type: 'dosing',
      question: `What is a common dosing for ${drug.brandName} (${drug.genericName})?`,
      correctAnswer: drug.commonDosing,
      options: shuffleArray([drug.commonDosing, ...distractors]),
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
    .slice(0, 3)
    .map((d) => d.genericName);

  return withPhase(
    {
      id: uid('q-fact', drug.id),
      type: 'key_fact',
      question: `Which drug matches this clinical pearl?\n“${drug.keyFact}”`,
      correctAnswer: drug.genericName,
      options: shuffleArray([drug.genericName, ...distractors]),
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
  const distractorDrugs = shuffleArray(drugs.filter((d) => classKey(d.drugClass) !== key)).slice(0, 3);
  const options = shuffleArray([correctDrug.genericName, ...distractorDrugs.map((d) => d.genericName)]);
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
  const distractors = shuffleArray(
    unique(Object.values(SUFFIX_TO_CLASS)).filter((x) => x !== correct)
  ).slice(0, 3);

  return withPhase(
    {
      id: uid('q-suffix', drug.id),
      type: 'suffix',
      question: `${drug.genericName} ends in “-${suf}”. That suffix is most associated with:`,
      correctAnswer: correct,
      options: shuffleArray([correct, ...distractors]),
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
  // Keep it simple: randomize whether statement is true or false.
  const isTrue = Math.random() < 0.5;
  const other = drugs.find((d) => d.id !== drug.id) ?? drug;
  const statement = isTrue
    ? `${drug.brandName} is the brand name for ${drug.genericName}.`
    : `${drug.brandName} is the brand name for ${other.genericName}.`;

  return withPhase(
    {
      id: uid('q-tf', drug.id),
      type: 'true_false',
      question: `True or False: ${statement}`,
      correctAnswer: isTrue ? 'True' : 'False',
      options: ['True', 'False'],
      drugId: drug.id,
      explanation: `${drug.brandName} ↔ ${drug.genericName}.`,
    },
    phase
  );
}

function multiSelectIndications(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const inds = unique(drug.indications ?? []).slice(0, 2);
  if (inds.length === 0) {
    return indicationPrimary(drug, pool, phase);
  }
  const all = unique(drugs.flatMap((d) => d.indications ?? []));
  const distractors = shuffleArray(all.filter((x) => !inds.includes(x))).slice(0, 2);
  const options = shuffleArray(unique([...inds, ...distractors]));
  return withPhase(
    {
      id: uid('q-ms-ind', drug.id),
      type: 'multi_select',
      question: `Select ALL typical indications for ${drug.genericName}:`,
      correctAnswers: inds,
      options,
      drugId: drug.id,
      explanation: `Indications: ${unique(drug.indications ?? []).join(', ') || '—'}.`,
    },
    phase
  );
}

function multiSelectSideEffects(drug: Drug, pool: Drug[], phase: QuizQuestionPhase): QuizQuestion {
  const ses = unique(drug.sideEffects ?? []).slice(0, 2);
  if (ses.length === 0) {
    return sideEffectCommon(drug, pool, phase);
  }
  const all = unique(drugs.flatMap((d) => d.sideEffects ?? []));
  const distractors = shuffleArray(all.filter((x) => !ses.includes(x))).slice(0, 2);
  const options = shuffleArray(unique([...ses, ...distractors]));
  return withPhase(
    {
      id: uid('q-ms-se', drug.id),
      type: 'multi_select',
      question: `Select ALL common side effects of ${drug.genericName}:`,
      correctAnswers: ses,
      options,
      drugId: drug.id,
      explanation: `Side effects: ${unique(drug.sideEffects ?? []).join(', ') || '—'}.`,
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

function generateQuestion(drug: Drug, pool: Drug[], phase: QuizQuestionPhase, i: number): QuizQuestion {
  // Bias towards variety: mostly cycle through generators, but occasionally random.
  const useRandom = Math.random() < 0.3;
  const gen = useRandom ? sampleOne(GENERATORS) : GENERATORS[i % GENERATORS.length];
  return gen(drug, pool, phase);
}

export function generateQuestionsForLesson(drugIds: string[], count: number, phase: QuizQuestionPhase = 'quiz'): QuizQuestion[] {
  const lessonDrugs = getDrugsByIds(drugIds);
  if (lessonDrugs.length === 0 || count <= 0) return [];

  const questions: QuizQuestion[] = [];
  const shuffledDrugs = shuffleArray(lessonDrugs);

  // Add one matching question in the middle when possible.
  const addMatchingAt = lessonDrugs.length >= 4 && count >= 8 ? Math.floor(count / 2) : -1;
  let matchingAdded = false;

  for (let i = 0; i < count; i++) {
    if (!matchingAdded && addMatchingAt === i) {
      const matchQ = generateMatchingQuestion(lessonDrugs, phase);
      if (matchQ) {
        questions.push(matchQ);
        matchingAdded = true;
        continue;
      }
    }
    const drug = shuffledDrugs[i % shuffledDrugs.length];
    questions.push(generateQuestion(drug, lessonDrugs, phase, i));
  }

  // Keep intro questions in order (caller can prepend). For quiz/review/mastery, shuffle is good.
  return phase === 'intro' ? questions : shuffleArray(questions);
}

export function generateQuestionsFromDrugIds(drugIds: string[], count: number, phase: QuizQuestionPhase = 'review'): QuizQuestion[] {
  const pool = drugs.filter((d) => drugIds.includes(d.id));
  if (pool.length === 0 || count <= 0) return [];
  const shuffled = shuffleArray(pool);

  const questions: QuizQuestion[] = [];
  const addMatchingAt = pool.length >= 4 && count >= 10 ? Math.floor(count / 3) : -1;
  let matchingAdded = false;

  for (let i = 0; i < count; i++) {
    if (!matchingAdded && addMatchingAt === i) {
      const matchQ = generateMatchingQuestion(pool, phase);
      if (matchQ) {
        questions.push(matchQ);
        matchingAdded = true;
        continue;
      }
    }
    const drug = shuffled[i % shuffled.length];
    questions.push(generateQuestion(drug, pool, phase, i));
  }

  return shuffleArray(questions);
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
