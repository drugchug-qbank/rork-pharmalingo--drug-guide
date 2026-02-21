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
            subtitle: 'All ACE inhibitors end in -PRIL',
            facts: [
              '🎯 Use: HTN • HFrEF • post‑MI • CKD/DM (↓ proteinuria)',
              '🧬 MOA: ACE↓ → Ang II↓ + Aldo↓ → vasodilate + ↓Na/H₂O',
              '⚠️ AEs: dry cough • hyperK • ↑Cr • angioedema',
              '🚫 Avoid: pregnancy • hx angioedema • bilateral RAS',
              '🔍 Monitor: K⁺ + SCr 1–2 wks after start/↑dose',
            ],
          },
          {
            id: 'arb',
            emoji: '🫀',
            title: 'ARBs',
            subtitle: 'All ARBs end in -SARTAN',
            facts: [
              '🎯 Use: HTN • HFrEF • CKD/DM (ACE‑cough alternative)',
              '🧬 MOA: AT₁ block → similar benefits; no bradykinin cough',
              '⚠️ AEs: hyperK • ↑Cr • (rare) angioedema',
              '✨ Pearl: usually NO dry cough',
              '🚫 Avoid: pregnancy; don’t routine ACE+ARB (↑ AKI/hyperK)',
            ],
          },
        ],
      };

    default:
      return null;
  }
}
