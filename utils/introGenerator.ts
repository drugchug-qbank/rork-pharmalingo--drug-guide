import { QuizQuestion } from '@/constants/types';
import { Drug } from '@/constants/types';
import { drugs, getDrugsByIds } from '@/constants/drugData';
import { chapters } from '@/constants/chapters';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function normalize(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function getPartTitle(partId: string): string {
  for (const ch of chapters) {
    const part = ch.parts.find((p) => p.id === partId);
    if (part) return part.title;
  }
  return 'this lesson';
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
  pril: 'ACE inhibitors',
  sartan: 'ARBs',
  olol: 'beta-blockers',
  statin: 'statins',
  dipine: 'dihydropyridine CCBs',
  prazole: 'PPIs',
  tidine: 'H2 blockers',
  flozin: 'SGLT2 inhibitors',
  gliptin: 'DPP-4 inhibitors',
  tide: 'GLP-1 receptor agonists',
  mab: 'monoclonal antibodies',
  azole: 'azoles',
  cycline: 'tetracyclines',
  floxacin: 'fluoroquinolones',
  mycin: '“mycin” antibiotics',
  vir: 'antivirals',
  cillin: 'penicillins',
  xaban: 'factor Xa inhibitors (DOACs)',
  gatran: 'direct thrombin inhibitors (DOACs)',
  triptan: 'triptans',
  setron: '5-HT3 antagonists',
  lukast: 'leukotriene receptor antagonists',
  coxib: 'COX-2 selective NSAIDs',
  oxicam: 'NSAIDs (-oxicam)',
  profen: 'NSAIDs (-profen)',
  osin: 'alpha-1 blockers',
  asteride: '5α-reductase inhibitors',
  pam: 'benzodiazepines (-pam)',
  lam: 'benzodiazepines (-lam)',
  caine: 'local anesthetics (-caine)',
};

const LOW_YIELD_SIDE_EFFECTS = new Set(
  ['nausea', 'headache', 'dizziness', 'diarrhea', 'constipation', 'fatigue', 'insomnia', 'dry mouth', 'rash'].map(
    (s) => s.toLowerCase()
  )
);

function buildSuffixIntroQuestions(partId: string, pool: Drug[]): QuizQuestion[] {
  const suffixCounts = new Map<string, number>();

  for (const d of pool) {
    const suf = genericSuffix(d.genericName);
    if (!suf) continue;
    if (!SUFFIX_TO_CLASS[suf]) continue;
    suffixCounts.set(suf, (suffixCounts.get(suf) ?? 0) + 1);
  }

  const ranked = [...suffixCounts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.slice(0, 2);

  return top.map(([suf]) => {
    const classLabel = SUFFIX_TO_CLASS[suf];
    const correct = `-${suf}`;

    const allSuffixTokens = Object.keys(SUFFIX_TO_CLASS).map((k) => `-${k}`);
    const distractors = shuffleArray(allSuffixTokens.filter((x) => x !== correct)).slice(0, 3);
    const wordBank = shuffleArray([correct, ...distractors]);

    return {
      id: uid('intro-suffix'),
      conceptId: `${partId}-suffix-${suf}`,
      phase: 'intro',
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: correct,
      options: wordBank,
      drugId: pool[0]?.id,
      cloze: {
        parts: [`Naming pattern: ${classLabel} often end in `, '.'],
        wordBank,
        correctWords: [correct],
      },
      explanation: `High-yield suffix: ${classLabel} → ${correct}.`,
    };
  });
}

function buildCommonIndicationsQuestion(partId: string, pool: Drug[]): QuizQuestion | null {
  const partTitle = getPartTitle(partId);

  const counts = new Map<string, number>();
  for (const d of pool) {
    for (const ind of d.indications ?? []) {
      counts.set(ind, (counts.get(ind) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = ranked.map(([i]) => i).slice(0, 2);
  if (top.length === 0) return null;

  const all = unique(drugs.flatMap((d) => d.indications ?? []));
  const distractors = shuffleArray(all.filter((x) => !top.includes(x))).slice(0, 3);
  const options = shuffleArray(unique([...top, ...distractors])).slice(0, 5);

  // If we only have 1 top indication, a cloze feels less "trick" than multi-select.
  if (top.length === 1) {
    const correct = top[0];
    return {
      id: uid('intro-use'),
      conceptId: `${partId}-uses`,
      phase: 'intro',
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: correct,
      options,
      drugId: pool[0]?.id,
      cloze: {
        parts: [`Key indication in ${partTitle}: `, '.'],
        wordBank: options,
        correctWords: [correct],
      },
      explanation: `High-yield indication in ${partTitle}: ${correct}.`,
    };
  }

  return {
    id: uid('intro-use'),
    conceptId: `${partId}-uses`,
    phase: 'intro',
    type: 'multi_select',
    question: `Select ALL common indications covered in ${partTitle}:`,
    correctAnswers: top,
    options,
    drugId: pool[0]?.id,
    explanation: `High-yield indications in ${partTitle}: ${top.join(' • ')}.`,
  };
}

function buildCommonSideEffectsQuestion(partId: string, pool: Drug[]): QuizQuestion | null {
  const partTitle = getPartTitle(partId);

  const counts = new Map<string, number>();
  for (const d of pool) {
    for (const se of d.sideEffects ?? []) {
      counts.set(se, (counts.get(se) ?? 0) + 1);
    }
  }

  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  // Prefer non-generic side effects if possible
  const nonGeneric = ranked.filter(([se]) => !LOW_YIELD_SIDE_EFFECTS.has(se.toLowerCase()));
  const pickFrom = nonGeneric.length >= 2 ? nonGeneric : ranked;

  const top = pickFrom.map(([s]) => s).slice(0, 2);
  if (top.length === 0) return null;

  const all = unique(drugs.flatMap((d) => d.sideEffects ?? []));
  const distractors = shuffleArray(all.filter((x) => !top.includes(x))).slice(0, 3);
  const options = shuffleArray(unique([...top, ...distractors])).slice(0, 5);

  if (top.length === 1) {
    const correct = top[0];
    return {
      id: uid('intro-ae'),
      conceptId: `${partId}-aes`,
      phase: 'intro',
      type: 'cloze',
      question: 'Fill in the blank',
      correctAnswer: correct,
      options,
      drugId: pool[0]?.id,
      cloze: {
        parts: [`High-yield side effect in ${partTitle}: `, '.'],
        wordBank: options,
        correctWords: [correct],
      },
      explanation: `High-yield AE in ${partTitle}: ${correct}.`,
    };
  }

  return {
    id: uid('intro-ae'),
    conceptId: `${partId}-aes`,
    phase: 'intro',
    type: 'multi_select',
    question: `Select ALL high-yield side effects covered in ${partTitle}:`,
    correctAnswers: top,
    options,
    drugId: pool[0]?.id,
    explanation: `High-yield AEs in ${partTitle}: ${top.join(' • ')}.`,
  };
}

export function getIntroQuestionsForPart(partId: string, drugIds: string[] = []): QuizQuestion[] {
  if (!drugIds?.length) return [];

  // Keep the hand-crafted ACE/ARB intro because it teaches a *classic* distinction.
  if (partId === 'm1-p2') {
    return [
      {
        id: uid('intro'),
        conceptId: 'm1-p2-ace-suffix',
        phase: 'intro',
        type: 'cloze',
        question: 'Fill in the blank',
        correctAnswer: '-pril',
        options: ['-pril', '-sartan', '-olol', '-statin'],
        drugId: drugIds[0],
        cloze: {
          parts: ['ACE inhibitors usually end in ', '.'],
          wordBank: ['-pril', '-sartan', '-olol', '-statin'],
          correctWords: ['-pril'],
        },
        explanation: 'ACE inhibitors → “-pril” (e.g., lisinopril).',
      },
      {
        id: uid('intro'),
        conceptId: 'm1-p2-arb-suffix',
        phase: 'intro',
        type: 'cloze',
        question: 'Fill in the blank',
        correctAnswer: '-sartan',
        options: ['-sartan', '-pril', '-dipine', '-azole'],
        drugId: drugIds[0],
        cloze: {
          parts: ['ARBs (angiotensin II receptor blockers) usually end in ', '.'],
          wordBank: ['-sartan', '-pril', '-dipine', '-azole'],
          correctWords: ['-sartan'],
        },
        explanation: 'ARBs → “-sartan” (e.g., losartan).',
      },
      {
        id: uid('intro'),
        conceptId: 'm1-p2-indications',
        phase: 'intro',
        type: 'multi_select',
        question: 'Select ALL common indications for ACEs/ARBs:',
        correctAnswers: ['Hypertension', 'Heart failure'],
        options: shuffleArray(['Hypertension', 'Heart failure', 'Hyperlipidemia', 'Asthma', 'Acid reflux']),
        drugId: drugIds[0],
        explanation: 'ACEs/ARBs: HTN, HFrEF, post‑MI, kidney protection in diabetes/CKD.',
      },
      {
        id: uid('intro'),
        conceptId: 'm1-p2-side-effects',
        phase: 'intro',
        type: 'multi_select',
        question: 'Select ALL high-yield ACE inhibitor adverse effects:',
        correctAnswers: ['Dry cough', 'Hyperkalemia'],
        options: shuffleArray(['Dry cough', 'Hyperkalemia', 'Hypoglycemia', 'Hair loss', 'Photosensitivity']),
        drugId: drugIds[0],
        explanation: 'ACE: dry cough (bradykinin), hyperK+, ↑Cr, and rare angioedema.',
      },
      {
        id: uid('intro'),
        conceptId: 'm1-p2-arb-cough',
        phase: 'intro',
        type: 'true_false',
        question: 'True or False: ARBs commonly cause a dry cough.',
        correctAnswer: 'False',
        options: ['True', 'False'],
        drugId: drugIds[0],
        explanation: 'Dry cough is classic for ACE inhibitors.\nARBs usually do NOT cause it.',
      },
    ];
  }

  const pool = getDrugsByIds(drugIds);
  if (!pool.length) return [];

  const questions: QuizQuestion[] = [];

  // 1) Naming patterns (0–2)
  questions.push(...buildSuffixIntroQuestions(partId, pool));

  // 2) High-yield uses (1)
  const usesQ = buildCommonIndicationsQuestion(partId, pool);
  if (usesQ) questions.push(usesQ);

  // 3) High-yield adverse effects (1)
  const aesQ = buildCommonSideEffectsQuestion(partId, pool);
  if (aesQ) questions.push(aesQ);

  return questions;
}
