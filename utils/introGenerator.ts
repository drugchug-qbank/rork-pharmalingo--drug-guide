import { QuizQuestion } from '@/constants/types';

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Intro questions are lightweight, high-yield teaching prompts that appear:
 * - the first time a student enters a lesson, OR
 * - when they repeatedly miss a "core concept" (tracked via conceptId mastery)
 */
export function getIntroQuestionsForPart(partId: string, drugIds: string[] = []): QuizQuestion[] {
  const fallbackDrugId = drugIds[0];

  if (partId === 'm1-p2') {
    // ACE inhibitors & ARBs
    return [
      {
        id: uid('intro-m1-p2-ace-suffix'),
        type: 'cloze',
        phase: 'intro',
        conceptId: 'm1-p2-ace-suffix',
        drugId: fallbackDrugId,
        question: 'Fill in the blank',
        correctAnswer: '-pril',
        options: ['-pril', '-sartan', '-olol', '-statin'],
        cloze: {
          parts: ['ACE inhibitors usually end in ', '.'],
          wordBank: ['-pril', '-sartan', '-olol', '-statin'],
          correctWords: ['-pril'],
        },
        explanation: 'High-yield pattern: ACE inhibitors end in -pril (e.g., lisinopril, enalapril).',
      },
      {
        id: uid('intro-m1-p2-arb-suffix'),
        type: 'cloze',
        phase: 'intro',
        conceptId: 'm1-p2-arb-suffix',
        drugId: fallbackDrugId,
        question: 'Fill in the blank',
        correctAnswer: '-sartan',
        options: ['-sartan', '-pril', '-dipine', '-azole'],
        cloze: {
          parts: ['ARBs (angiotensin II receptor blockers) usually end in ', '.'],
          wordBank: ['-sartan', '-pril', '-dipine', '-azole'],
          correctWords: ['-sartan'],
        },
        explanation: 'High-yield pattern: ARBs end in -sartan (e.g., losartan, valsartan).',
      },
      {
        id: uid('intro-m1-p2-indication'),
        type: 'indication',
        phase: 'intro',
        conceptId: 'm1-p2-indication',
        drugId: fallbackDrugId,
        question: 'ACE inhibitors and ARBs are most commonly used for which indication?',
        correctAnswer: 'Hypertension',
        options: ['Hypertension', 'Hypothyroidism', 'Acute gout flare', 'GERD'],
        explanation:
          'Core use: hypertension (also commonly heart failure, post‑MI, diabetic kidney disease depending on the drug/patient).',
      },
      {
        id: uid('intro-m1-p2-ace-cough'),
        type: 'side_effect',
        phase: 'intro',
        conceptId: 'm1-p2-ace-cough',
        drugId: fallbackDrugId,
        question: 'Which adverse effect is classic for ACE inhibitors (and is much less common with ARBs)?',
        correctAnswer: 'Dry cough',
        options: ['Dry cough', 'Ototoxicity', 'Myopathy', 'Constipation'],
        explanation:
          'High-yield: ACE inhibitors → dry cough (bradykinin). ARBs are often used if cough occurs.',
      },
      {
        id: uid('intro-m1-p2-monitoring'),
        type: 'multi_select',
        phase: 'intro',
        conceptId: 'm1-p2-monitoring',
        drugId: fallbackDrugId,
        question: 'Select the labs you should monitor after starting or increasing an ACE inhibitor or ARB:',
        options: ['Potassium (K⁺)', 'Serum creatinine (SCr)', 'INR', 'TSH'],
        correctAnswers: ['Potassium (K⁺)', 'Serum creatinine (SCr)'],
        explanation: 'Monitor K⁺ and SCr (risk: hyperkalemia + bump in creatinine).',
      },
    ];
  }

  // Default: no intro defined
  return [];
}
