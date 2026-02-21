import { TeachingSlideDeck } from '@/constants/types';

/**
 * Returns the short, high-yield "teaching deck" shown BEFORE a subsection quiz,
 * but only on the student's first attempt for that subsection.
 *
 * Add decks here for each part (subsection). If a part isn't listed, it simply
 * won't show a deck.
 */
export function getTeachingDeckForPart(partId: string): TeachingSlideDeck | null {
  switch (partId) {
    case 'm1-p2':
      return {
        title: 'ACE Inhibitors & ARBs',
        slides: [
          {
            id: 'ace',
            emoji: '🫀',
            title: 'ACE Inhibitors',
            subtitle: 'Naming pattern: ends in “-pril”',
            facts: [
              'Used for: hypertension (HTN), heart failure (HFrEF), post‑MI, and kidney protection in diabetes/CKD (↓ proteinuria).',
              'Core mechanism: blocks ACE → ↓ angiotensin II + ↓ aldosterone → vasodilation + less Na⁺/water retention.',
              'High‑yield side effects: dry cough, hyperkalemia, ↑ creatinine (esp. renal artery stenosis), and angioedema (rare but dangerous).',
              'Avoid/Use caution: pregnancy (contraindicated), history of angioedema, bilateral renal artery stenosis.',
              'Monitoring pearl: check K⁺ + SCr after starting or dose changes; expect a small creatinine bump, but large jumps are a red flag.',
            ],
          },
          {
            id: 'arb',
            emoji: '🫀',
            title: 'ARBs',
            subtitle: 'Naming pattern: ends in “-sartan”',
            facts: [
              'Used for: hypertension, heart failure, CKD/diabetic nephropathy — often chosen if ACE‑cough happens.',
              'Core mechanism: blocks AT₁ receptors → similar BP/kidney benefits without ACE‑related bradykinin cough.',
              'High‑yield side effects: hyperkalemia and ↑ creatinine; angioedema can still happen (rare).',
              'Key pearl: ARBs usually do NOT cause a dry cough (that’s the classic ACE difference).',
              'Avoid/Use caution: pregnancy (contraindicated). In general, don’t combine ACE + ARB routinely (↑ hyperK/AKI risk).',
            ],
          },
        ],
      };

    default:
      return null;
  }
}
