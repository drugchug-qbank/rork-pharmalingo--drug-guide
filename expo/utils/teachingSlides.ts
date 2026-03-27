import { TeachingSlideDeck } from '@/constants/types';

/**
 * Pre-quiz "Quick Teach" decks.
 *
 * Shown ONLY on a student's first attempt for a subsection (partId),
 * and automatically skipped for mastery quizzes.
 *
 * Authoring style (keep it short + scannable):
 * - Each fact should start with an emoji icon (🎯 🧬 ⚠️ 🚫 🔍 ✨)
 * - Use the pattern "Label: info" to auto-bold the label.
 */
export const TEACHING_DECKS: Record<string, TeachingSlideDeck> = {
  // =========================
  // Module 1 — Cardiovascular I
  // =========================
  'm1-p2': {
    title: 'ACE Inhibitors & ARBs',
    slides: [
      {
        id: 'ace',
        emoji: '💖',
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
        emoji: '💖',
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
  },

  'm1-p3': {
    title: 'Thiazide & Loop Diuretics',
    slides: [
      {
        id: 'thiazide',
        emoji: '💧',
        title: 'Thiazides',
        subtitle: 'HTN diuretic workhorse',
        facts: [
          '🎯 Use: HTN (first‑line) • mild edema',
          '🧬 MOA: ↑ Na/Cl excretion in DCT → ↓ volume',
          '⚠️ AEs: hypoK • hypoNa • ↑ uric acid • ↑ glucose',
          '✨ Pearl: chlorthalidone = longer acting than HCTZ',
          '🚫 Caution: gout; less effective when GFR is very low',
        ],
      },
      {
        id: 'loop',
        emoji: '🌊',
        title: 'Loop Diuretics',
        subtitle: 'Big fluid offload (HF/edema)',
        facts: [
          '🎯 Use: edema/HF • pulmonary edema',
          '🧬 MOA: blocks Na‑K‑2Cl in Loop of Henle',
          '⚠️ AEs: hypoK • dehydration • ototoxicity • ↑ uric acid',
          '✨ Pearl: “loops lose Ca²⁺” (↑ Ca excretion)',
          '🔍 Monitor: K⁺/Mg²⁺ + volume status; consider supplements',
        ],
      },
    ],
  },

  'm1-p4': {
    title: 'Beta‑Blockers (HTN, HF, CAD)',
    slides: [
      {
        id: 'bb-basics',
        emoji: '🛡️',
        title: 'Beta‑Blockers',
        subtitle: 'Most beta‑blockers end in -LOL',
        facts: [
          '🎯 Use: HTN • angina • post‑MI • rate control',
          '🧬 MOA: β block → ↓ HR/contractility + ↓ renin',
          '⚠️ AEs: bradycardia • fatigue • masks hypoglycemia',
          '🚫 Avoid: severe brady/heart block; caution asthma (non‑selective)',
          '✨ Pearl: don’t stop abruptly → rebound tachy/angina',
        ],
      },
      {
        id: 'bb-hf',
        emoji: '❤️‍🩹',
        title: 'HF/CAD Pearls',
        subtitle: 'HFrEF “BB 3”: carvedilol, metoprolol succinate, bisoprolol',
        facts: [
          '🎯 HFrEF: use “BB 3” + titrate slow (survival↑)',
          '✨ Selective: metoprolol/atenolol/bisoprolol = β1‑selective',
          '✨ Carvedilol: β + α1 block → more BP drop',
          '⚠️ Watch: fluid retention early; adjust diuretic if needed',
          '🔍 Monitor: HR/BP; hold if symptomatic brady or shock',
        ],
      },
    ],
  },

  'm1-p5': {
    title: 'MRAs & ARNI',
    slides: [
      {
        id: 'mra',
        emoji: '🧂',
        title: 'MRAs (K‑Sparing)',
        subtitle: 'Spironolactone / Eplerenone',
        facts: [
          '🎯 Use: HFrEF (mortality↓) • resistant HTN • ascites',
          '🧬 MOA: aldosterone block → Na/H₂O↓, K↑',
          '⚠️ AEs: hyperK • ↑Cr',
          '✨ Spiro pearl: gynecomastia; eplerenone less endocrine',
          '🔍 Monitor: K⁺ + SCr (esp with ACE/ARB)',
        ],
      },
      {
        id: 'arni',
        emoji: '💖',
        title: 'ARNI',
        subtitle: 'Sacubitril/valsartan = ARNI',
        facts: [
          '🎯 Use: HFrEF (replaces ACE/ARB in stable patients)',
          '🧬 MOA: neprilysin inhibit + ARB → ↑ natriuresis + ↓ Ang II',
          '⚠️ AEs: hypotension • hyperK • ↑Cr • angioedema',
          '🚫 Avoid: pregnancy; hx angioedema; do NOT combine w/ACE',
          '✨ Pearl: wait 36 hrs after stopping ACE before starting ARNI',
        ],
      },
    ],
  },

  'm1-p6': {
    title: 'Calcium Channel Blockers',
    slides: [
      {
        id: 'dhp',
        emoji: '🩸',
        title: 'DHP CCBs',
        subtitle: 'Most DHP CCBs end in -DIPINE',
        facts: [
          '🎯 Use: HTN • angina; good for Raynaud’s',
          '🧬 MOA: vasodilate (arterioles) → ↓ BP',
          '⚠️ AEs: edema • flushing • headache • gingival hyperplasia',
          '✨ Pearl: can cause reflex tachy (esp short‑acting)',
          '🚫 Caution: severe edema; avoid IR nifedipine',
        ],
      },
      {
        id: 'non-dhp',
        emoji: '💖',
        title: 'Non‑DHP CCBs',
        subtitle: 'Verapamil/Diltiazem = “rate‑slowing” CCBs',
        facts: [
          '🎯 Use: rate control (AF) • angina',
          '🧬 MOA: ↓ AV node conduction → ↓ HR',
          '⚠️ AEs: brady/heart block • constipation (verapamil)',
          '🚫 Avoid: HFrEF + with β‑blocker (heart block risk)',
          '✨ Pearl: drug interactions (CYP3A4); monitor HR',
        ],
      },
    ],
  },

  // =========================
  // Module 2 — Cardiovascular II
  // =========================
  'm2-p1': {
    title: 'Statins (HMG‑CoA Reductase Inhibitors)',
    slides: [
      {
        id: 'statins',
        emoji: '🧈',
        title: 'Statins',
        subtitle: 'All statins end in -STATIN',
        facts: [
          '🎯 Use: LDL↓ + ASCVD risk↓ (primary/secondary prevention)',
          '🧬 MOA: HMG‑CoA reductase inhibit → ↑ LDL receptors',
          '⚠️ AEs: myalgia/myopathy • rare rhabdo • ↑ LFTs',
          '🚫 Avoid: pregnancy; caution active liver disease',
          '✨ Pearl: CYP3A4 interactions (simva/atorva); take simva at night',
        ],
      },
    ],
  },

  'm2-p2': {
    title: 'Non‑Statin Lipid Agents',
    slides: [
      {
        id: 'ezetimibe',
        emoji: '🧽',
        title: 'Ezetimibe',
        subtitle: 'Zetia = cholesterol absorption blocker',
        facts: [
          '🎯 Use: add‑on to statin if LDL still high',
          '🧬 MOA: blocks intestinal cholesterol uptake (NPC1L1)',
          '⚠️ AEs: diarrhea • ↑ LFTs (with statin)',
          '✨ Pearl: minimal systemic effects',
          '🔍 Monitor: lipids; LFTs if combined w/statin',
        ],
      },
      {
        id: 'tg-agents',
        emoji: '🐟',
        title: 'Fibrates & Omega‑3s',
        subtitle: 'Fenofibrate / Icosapent ethyl (EPA)',
        facts: [
          '🎯 Use: high TGs (pancreatitis risk↓); EPA for CV risk in select',
          '🧬 MOA: fibrates ↑ LPL → TG↓; EPA affects TG/VLDL',
          '⚠️ AEs: fibrates = myopathy (↑ w/statin) • gallstones',
          '✨ Pearl: avoid gemfibrozil + statin; fenofibrate preferred',
          '🔍 Monitor: TG, LFTs; renal function for fenofibrate',
        ],
      },
      {
        id: 'pcsk9-niacin',
        emoji: '🏆',
        title: 'PCSK9 & Niacin',
        subtitle: 'PCSK9 inhibitors = big LDL drop',
        facts: [
          '🎯 Use: very high‑risk ASCVD or familial hypercholesterolemia',
          '🧬 MOA: PCSK9 inhibit → ↑ LDL receptors → LDL↓↓',
          '⚠️ AEs: injection‑site reactions; cost/adherence issues',
          '⚠️ Niacin AEs: flushing • hyperglycemia • hepatotoxicity',
          '✨ Pearl: flushing ↓ with aspirin pre‑dose',
        ],
      },
    ],
  },

  'm2-p3': {
    title: 'Antiplatelets',
    slides: [
      {
        id: 'aspirin',
        emoji: '🩸',
        title: 'Aspirin',
        subtitle: 'Antiplatelet by COX‑1 block',
        facts: [
          '🎯 Use: ACS/MI, stroke prevention (select patients)',
          '🧬 MOA: irreversible COX‑1 inhibit → ↓ TXA₂',
          '⚠️ AEs: GI bleed • ulcer • bronchospasm (aspirin asthma)',
          '🚫 Avoid: active bleeding; kids w/viral illness (Reye risk)',
          '✨ Pearl: 81 mg daily is standard antiplatelet dose',
        ],
      },
      {
        id: 'p2y12',
        emoji: '🛑',
        title: 'P2Y12 Inhibitors',
        subtitle: 'Clopidogrel/Prasugrel/Ticagrelor',
        facts: [
          '🎯 Use: DAPT after stent/ACS; clopidogrel alt for aspirin',
          '🧬 MOA: block ADP (P2Y12) → platelet activation↓',
          '⚠️ AEs: bleeding; ticagrelor = dyspnea/brady',
          '✨ Pearl: clopidogrel is prodrug (CYP2C19) — avoid omeprazole',
          '🚫 Prasugrel avoid: prior stroke/TIA; caution age>75/low weight',
        ],
      },
    ],
  },

  'm2-p4': {
    title: 'Anticoagulants',
    slides: [
      {
        id: 'warfarin',
        emoji: '🧬',
        title: 'Warfarin',
        subtitle: 'Warfarin = INR + vitamin K',
        facts: [
          '🎯 Use: Afib, DVT/PE, mechanical valves (preferred)',
          '🧬 MOA: inhibits vit K recycling → ↓ II, VII, IX, X',
          '🔍 Monitor: INR (goal often 2–3); many drug/food interactions',
          '⚠️ AEs: bleeding; skin necrosis (rare); teratogenic',
          '✨ Pearl: bridge w/heparin initially for acute clots',
        ],
      },
      {
        id: 'doacs',
        emoji: '⚡',
        title: 'DOACs',
        subtitle: '“XABAN” = Xa, “GATRAN” = thrombin',
        facts: [
          '🎯 Use: Afib, DVT/PE (less monitoring than warfarin)',
          '🧬 MOA: apix/riva = Xa inhibit; dabigatran = thrombin inhibit',
          '⚠️ AEs: bleeding; renal dose adjust',
          '✨ Pearl: rapid onset (no bridge usually); fewer interactions',
          '🚫 Avoid: mechanical valves; caution severe renal impairment',
        ],
      },
      {
        id: 'heparins',
        emoji: '🏥',
        title: 'Heparins',
        subtitle: 'Heparin/Enoxaparin = parenteral',
        facts: [
          '🎯 Use: acute DVT/PE, ACS, inpatient prophylaxis',
          '🧬 MOA: activates antithrombin → IIa/Xa↓ (LMWH mainly Xa)',
          '🔍 Monitor: aPTT for IV heparin; anti‑Xa in special cases',
          '⚠️ AEs: bleeding; HIT; osteoporosis (long-term)',
          '✨ Pearl: reversal = protamine (partial for LMWH)',
        ],
      },
    ],
  },

  'm2-p5': {
    title: 'Antianginals & Nitrates',
    slides: [
      {
        id: 'nitrates',
        emoji: '💥',
        title: 'Nitrates',
        subtitle: 'Nitroglycerin = fast angina relief',
        facts: [
          '🎯 Use: acute angina (SL nitro); chronic angina (isosorbide)',
          '🧬 MOA: NO donor → venodilation → ↓ preload/O₂ demand',
          '⚠️ AEs: headache • hypotension • flushing',
          '🚫 NEVER mix: PDE‑5 inhibitors (sildenafil) → severe hypotension',
          '✨ Pearl: nitrate‑free interval daily to prevent tolerance',
        ],
      },
      {
        id: 'other-antianginals',
        emoji: '🧩',
        title: 'Other Antianginals',
        subtitle: 'Ranolazine & rate/BP controllers',
        facts: [
          '🎯 CCBs/β‑blockers: chronic angina + BP/HR control',
          '🧬 Ranolazine: alters Na current → ↓ ischemia (HR/BP minimal)',
          '⚠️ Ranolazine AE: QT prolongation • CYP interactions',
          '✨ Pearl: use when BP/HR limit other agents',
          '🚫 Avoid: severe liver disease; caution QT-prolonging meds',
        ],
      },
    ],
  },

  // =========================
  // Module 3 — Endocrine & Diabetes
  // =========================
  'm3-p1': {
    title: 'Insulin Overview (Basal & Bolus)',
    slides: [
      {
        id: 'basal',
        emoji: '🩸',
        title: 'Basal Insulin',
        subtitle: 'Steady “background” control',
        facts: [
          '🎯 Use: fasting glucose control (T1 & T2)',
          '🧬 Types: glargine/detemir/degludec = long; NPH = intermediate',
          '⏱️ Timing: once daily (some detemir BID); NPH often BID',
          '⚠️ AEs: hypoglycemia • weight gain',
          '✨ Pearl: “Treat lows” rule — 15g carbs, recheck in 15 min',
        ],
      },
      {
        id: 'bolus',
        emoji: '🍽️',
        title: 'Bolus / Prandial',
        subtitle: 'Meal + correction insulin',
        facts: [
          '🎯 Use: post‑meal spikes + correction doses',
          '🧬 Types: lispro/aspart = rapid; regular = short',
          '⏱️ Timing: rapid 0–15 min pre‑meal; regular ~30 min pre‑meal',
          '⚠️ AEs: hypoglycemia (esp if meal skipped)',
          '✨ Pearl: sliding scale alone is weak — pair with basal',
        ],
      },
    ],
  },

  'm3-p2': {
    title: 'Metformin & Oral Agents Overview',
    slides: [
      {
        id: 'metformin',
        emoji: '🍬',
        title: 'Metformin',
        subtitle: 'First‑line T2DM (biguanide)',
        facts: [
          '🎯 Use: T2DM first‑line; weight neutral/↓',
          '🧬 MOA: ↓ hepatic gluconeogenesis + ↑ insulin sensitivity',
          '⚠️ AEs: GI upset • B12 deficiency; rare lactic acidosis',
          '🚫 Hold/avoid: eGFR <30; contrast studies; severe hypoxia/sepsis',
          '✨ Pearl: start low, titrate; take with meals',
        ],
      },
      {
        id: 'tzd',
        emoji: '🧈',
        title: 'TZDs (Pioglitazone)',
        subtitle: 'Insulin sensitivity boosters',
        facts: [
          '🎯 Use: T2DM; improves insulin resistance',
          '🧬 MOA: PPAR‑γ agonist → glucose uptake↑',
          '⚠️ AEs: weight gain • edema • HF exacerbation',
          '⚠️ Long‑term: fractures; possible bladder CA signal',
          '🚫 Avoid: NYHA III/IV HF; caution liver disease',
        ],
      },
    ],
  },

  'm3-p3': {
    title: 'SGLT2 Inhibitors',
    slides: [
      {
        id: 'sglt2',
        emoji: '🚽',
        title: 'SGLT2 Inhibitors',
        subtitle: 'All SGLT2 inhibitors end in -FLOZIN',
        facts: [
          '🎯 Use: T2DM + big benefits in HF/CKD',
          '🧬 MOA: blocks renal glucose reabsorption → glucose in urine',
          '⚠️ AEs: genital yeast/UTI • volume depletion • euglycemic DKA',
          '🚫 Hold: surgery/acute illness; caution low BP or frequent UTIs',
          '✨ Pearl: counsel hydration + sick‑day rules',
        ],
      },
    ],
  },

  'm3-p4': {
    title: 'GLP‑1, DPP‑4, Sulfonylureas',
    slides: [
      {
        id: 'glp1',
        emoji: '🥗',
        title: 'GLP‑1 Agonists',
        subtitle: 'Most GLP‑1 agonists end in -TIDE',
        facts: [
          '🎯 Use: T2DM + weight loss; CV benefit in many',
          '🧬 MOA: ↑ insulin (glucose‑dependent) + slows gastric emptying',
          '⚠️ AEs: nausea/vomiting • pancreatitis (rare)',
          '🚫 Avoid: medullary thyroid CA/MEN2 (for many agents)',
          '✨ Pearl: slow titration = less GI upset',
        ],
      },
      {
        id: 'dpp4',
        emoji: '🧩',
        title: 'DPP‑4 Inhibitors',
        subtitle: 'All DPP‑4 inhibitors end in -GLIPTIN',
        facts: [
          '🎯 Use: modest A1c drop; weight neutral',
          '🧬 MOA: ↑ endogenous incretins → insulin↑, glucagon↓',
          '⚠️ AEs: pancreatitis (rare) • severe joint pain',
          '🔍 Dose: many require renal adjustment (except linagliptin)',
          '✨ Pearl: low hypoglycemia risk unless combined w/SU/insulin',
        ],
      },
      {
        id: 'sulfonylurea',
        emoji: '🍭',
        title: 'Sulfonylureas',
        subtitle: '“GLI‑” drugs = insulin secretagogues',
        facts: [
          '🎯 Use: T2DM; inexpensive and effective',
          '🧬 MOA: closes KATP in β cells → insulin release↑',
          '⚠️ AEs: hypoglycemia • weight gain',
          '🚫 Caution: elderly/renal disease (prolonged hypoglycemia)',
          '✨ Pearl: glipizide safer in CKD vs glyburide',
        ],
      },
    ],
  },

  'm3-p5': {
    title: 'Thyroid Agents',
    slides: [
      {
        id: 'levothyroxine',
        emoji: '🦋',
        title: 'Levothyroxine (T4)',
        subtitle: 'Take on empty stomach (consistent)',
        facts: [
          '🎯 Use: hypothyroidism',
          '🧬 MOA: synthetic T4 → converts to T3 in tissues',
          '⏰ How: take AM fasting; separate from Ca/Fe by 4 hrs',
          '🔍 Monitor: TSH every 6–8 wks after dose change',
          '⚠️ Too much: tremor • palpitations • weight loss',
        ],
      },
      {
        id: 'antithyroid',
        emoji: '🚫',
        title: 'Antithyroid Drugs',
        subtitle: 'Methimazole vs PTU',
        facts: [
          '🎯 Use: hyperthyroidism (Graves); PTU also thyroid storm',
          '🧬 MOA: blocks TPO; PTU also blocks T4→T3',
          '⚠️ AEs: agranulocytosis (fever/sore throat!) • rash',
          '⚠️ PTU: hepatotoxic; methimazole teratogenic 1st trimester',
          '✨ Pearl: PTU preferred in 1st trimester & thyroid storm',
        ],
      },
    ],
  },

  'm3-p6': {
    title: 'Adrenal Steroids (Systemic Corticosteroids)',
    slides: [
      {
        id: 'systemic-steroids',
        emoji: '🧯',
        title: 'Systemic Steroids',
        subtitle: '“‑SONE/‑SOLONE” = corticosteroids',
        facts: [
          '🎯 Use: asthma/COPD flares, autoimmune, inflammation, cerebral edema',
          '🧬 MOA: anti‑inflammatory + immunosuppressive gene effects',
          '⚠️ AEs: hyperglycemia • mood changes • infection risk',
          '⚠️ Long‑term: osteoporosis, cataracts, adrenal suppression',
          '✨ Pearl: taper if prolonged use; give AM dose when possible',
        ],
      },
    ],
  },

  // =========================
  // Module 4 — CNS & Psych
  // =========================
  'm4-p1': {
    title: 'Antidepressants I (SSRIs, SNRIs)',
    slides: [
      {
        id: 'ssri',
        emoji: '😊',
        title: 'SSRIs',
        subtitle: 'First‑line for depression/anxiety',
        facts: [
          '🎯 Use: MDD, GAD, OCD, PTSD',
          '🧬 MOA: serotonin reuptake inhibit',
          '⚠️ AEs: GI upset • sexual dysfunction • insomnia',
          '⚠️ Risks: serotonin syndrome; withdrawal if abrupt stop',
          '✨ Pearl: citalopram/escitalopram can prolong QT (dose‑related)',
        ],
      },
      {
        id: 'snri',
        emoji: '⚡',
        title: 'SNRIs',
        subtitle: 'Also help neuropathic pain',
        facts: [
          '🎯 Use: depression/anxiety; chronic pain (duloxetine)',
          '🧬 MOA: serotonin + norepi reuptake inhibit',
          '⚠️ AEs: ↑ BP/HR • sweating • nausea',
          '🚫 Caution: uncontrolled HTN; taper to avoid withdrawal',
          '✨ Pearl: watch serotonin syndrome with other serotonergics',
        ],
      },
    ],
  },

  'm4-p2': {
    title: 'Antidepressants II (TCAs, Atypicals)',
    slides: [
      {
        id: 'tca',
        emoji: '🧠',
        title: 'TCAs',
        subtitle: 'Strong but “side‑effect heavy”',
        facts: [
          '🎯 Use: depression; also neuropathic pain/migraine',
          '🧬 MOA: inhibit NE/5‑HT reuptake + anticholinergic',
          '⚠️ AEs: dry mouth • constipation • urinary retention • sedation',
          '⚠️ Danger: overdose → arrhythmias (wide QRS), seizures',
          '🚫 Avoid: high suicide risk; caution elderly',
        ],
      },
      {
        id: 'bupropion',
        emoji: '🚭',
        title: 'Bupropion',
        subtitle: 'Great when sexual SEs are an issue',
        facts: [
          '🎯 Use: depression; smoking cessation',
          '🧬 MOA: NE/DA reuptake inhibit',
          '✨ Pearl: minimal sexual dysfunction; weight neutral/↓',
          '⚠️ AEs: insomnia • anxiety • seizure risk (dose‑related)',
          '🚫 Avoid: seizure disorder; eating disorders',
        ],
      },
      {
        id: 'sleepy-atypicals',
        emoji: '🌙',
        title: 'Sleepy Atypicals',
        subtitle: 'Mirtazapine & trazodone (often nightly)',
        facts: [
          '🎯 Use: depression with insomnia; appetite issues (mirtazapine)',
          '⚠️ Mirtazapine: weight gain • sedation',
          '⚠️ Trazodone: sedation • orthostasis • priapism (rare)',
          '✨ Pearl: trazodone is common “sleep add‑on” at low dose',
          '🚫 Caution: serotonin syndrome when combined w/other serotonergics',
        ],
      },
    ],
  },

  'm4-p3': {
    title: 'Antipsychotics (Typical & Atypical)',
    slides: [
      {
        id: 'atypical-antipsych',
        emoji: '🧩',
        title: 'Atypical Antipsychotics',
        subtitle: 'Metabolic risk is the big tradeoff',
        facts: [
          '🎯 Use: schizophrenia, bipolar, adjunct depression',
          '🧬 MOA: dopamine D2 block + serotonin effects (varies)',
          '⚠️ AEs: weight gain/metabolic syndrome (esp olanzapine)',
          '⚠️ Prolactin: ↑ with risperidone; QT risk varies',
          '✨ Pearl: aripiprazole = partial agonist → less prolactin/weight',
        ],
      },
      {
        id: 'typical-eps',
        emoji: '⚠️',
        title: 'Typical + EPS',
        subtitle: 'Haloperidol = high EPS risk',
        facts: [
          '🎯 Strong D2 block → good for acute agitation/psychosis',
          '⚠️ EPS: dystonia, akathisia, parkinsonism, tardive dyskinesia',
          '⚠️ NMS: fever + rigidity + AMS + autonomic instability (emergency)',
          '🔍 Manage EPS: benztropine/diphenhydramine (acute dystonia)',
          '✨ Pearl: monitor QT (haloperidol), especially IV',
        ],
      },
    ],
  },

  'm4-p4': {
    title: 'Anxiolytics & Sedatives',
    slides: [
      {
        id: 'benzos',
        emoji: '🫧',
        title: 'Benzodiazepines',
        subtitle: 'Fast anxiety relief (short‑term)',
        facts: [
          '🎯 Use: acute anxiety, panic, seizures, alcohol withdrawal',
          '🧬 MOA: ↑ GABA‑A frequency → CNS depression',
          '⚠️ AEs: sedation • falls • dependence/tolerance',
          '🚫 Avoid: combine with opioids/alcohol (resp depression)',
          '✨ Pearl: taper slowly; lorazepam safer in liver disease',
        ],
      },
      {
        id: 'sleep-aids',
        emoji: '🌙',
        title: 'Sleep Aids',
        subtitle: 'Zolpidem + non‑benzo options',
        facts: [
          '🎯 Z‑drugs (zolpidem): insomnia (short‑term)',
          '⚠️ Z‑drug AEs: sleep behaviors, next‑day sedation',
          '🎯 Hydroxyzine: anxiety/itch (sedating antihistamine)',
          '⚠️ Hydroxyzine: anticholinergic effects; QT risk',
          '✨ Pearl: prioritize sleep hygiene; avoid chronic hypnotics',
        ],
      },
    ],
  },

  'm4-p5': {
    title: 'Stimulants & ADHD Meds',
    slides: [
      {
        id: 'stimulants',
        emoji: '🚀',
        title: 'Stimulants',
        subtitle: 'Amphetamines & methylphenidate',
        facts: [
          '🎯 Use: ADHD (first‑line); narcolepsy',
          '🧬 MOA: ↑ NE/DA in synapse (different mechanisms)',
          '⚠️ AEs: appetite↓ • insomnia • ↑ HR/BP • anxiety',
          '🚫 Caution: misuse risk, severe anxiety, uncontrolled HTN',
          '✨ Pearl: monitor growth (kids), BP/HR; take early day',
        ],
      },
      {
        id: 'nonstimulants',
        emoji: '🧩',
        title: 'Non‑Stimulants',
        subtitle: 'Atomoxetine + guanfacine',
        facts: [
          '🎯 Atomoxetine: ADHD when stimulants not ideal',
          '🧬 MOA: NE reuptake inhibit',
          '⚠️ Atomoxetine: suicidality warning; rare liver injury',
          '🎯 Guanfacine: helps hyperactivity/impulsivity; helps tics',
          '⚠️ Guanfacine: sedation • hypotension; taper to avoid rebound',
        ],
      },
    ],
  },

  // =========================
  // Module 5 — Pain & Inflammation
  // =========================
  'm5-p1': {
    title: 'NSAIDs & Acetaminophen',
    slides: [
      {
        id: 'nsaids',
        emoji: '🔥',
        title: 'NSAIDs',
        subtitle: 'Anti‑inflammatory pain relief',
        facts: [
          '🎯 Use: pain, fever, inflammation (arthritis)',
          '🧬 MOA: COX inhibit → prostaglandins↓',
          '⚠️ AEs: GI bleed/ulcer • kidney injury • ↑ BP',
          '⚠️ CV: higher risk with some (esp chronic/high dose)',
          '🚫 Avoid: active GI bleed; caution CKD & anticoagulants',
        ],
      },
      {
        id: 'acetaminophen',
        emoji: '🌡️',
        title: 'Acetaminophen',
        subtitle: 'Pain/fever (not strong inflammation)',
        facts: [
          '🎯 Use: pain + fever (weak anti‑inflammatory)',
          '⚠️ Max: keep daily total ≤3–4 g (lower with liver disease/alcohol)',
          '⚠️ Toxicity: liver injury; early symptoms can be mild',
          '🧪 Antidote: N‑acetylcysteine (NAC) ASAP',
          '✨ Pearl: combo products hide extra acetaminophen',
        ],
      },
    ],
  },

  'm5-p2': {
    title: 'Opioids & Pain Management',
    slides: [
      {
        id: 'opioid-basics',
        emoji: '💊',
        title: 'Opioids (Basics)',
        subtitle: 'Pain relief with risk',
        facts: [
          '🎯 Use: moderate‑severe acute pain; cancer pain',
          '🧬 MOA: μ‑receptor agonism → pain transmission↓',
          '⚠️ AEs: constipation • nausea • sedation • resp depression',
          '🚫 Danger: combine with benzos/alcohol',
          '✨ Pearl: start low, reassess; consider bowel regimen',
        ],
      },
      {
        id: 'tramadol',
        emoji: '🧩',
        title: 'Tramadol',
        subtitle: 'Extra mechanisms → extra interactions',
        facts: [
          '🧬 Tramadol: weak μ + SNRI effect',
          '⚠️ AEs: seizures (risk↑) • serotonin syndrome',
          '🚫 Avoid: MAOIs/strong serotonergics when possible',
          '✨ Pearl: not “safe” — still opioid + interaction heavy',
          '🔍 Watch: renal dose adjust; older adults = higher risk',
        ],
      },
      {
        id: 'naloxone',
        emoji: '🛟',
        title: 'Naloxone (Rescue)',
        subtitle: 'Opioid reversal',
        facts: [
          '🎯 Use: suspected opioid overdose (slow/no breathing)',
          '🧬 MOA: opioid receptor antagonist',
          '⚠️ Can precipitate: withdrawal (agitation, vomiting)',
          '✨ Pearl: may need repeat doses (short half‑life)',
          '🚫 Always: call emergency services after use',
        ],
      },
    ],
  },

  'm5-p3': {
    title: 'Gout Medications',
    slides: [
      {
        id: 'acute-flare',
        emoji: '🔥',
        title: 'Treat Acute Flare',
        subtitle: 'Fast inflammation control',
        facts: [
          '🎯 Options: NSAIDs, colchicine, steroids',
          '🧬 Colchicine: blocks microtubules → neutrophils↓',
          '⚠️ Colchicine AEs: diarrhea, myopathy (risk↑ with statins)',
          '🚫 Caution: renal/hepatic impairment; CYP/P‑gp interactions',
          '✨ Pearl: start early for best effect',
        ],
      },
      {
        id: 'urate-lowering',
        emoji: '⬇️',
        title: 'Urate‑Lowering Therapy',
        subtitle: 'Allopurinol / Febuxostat',
        facts: [
          '🎯 Use: recurrent flares, tophi, kidney stones',
          '🧬 MOA: xanthine oxidase inhibit → uric acid↓',
          '⚠️ Allopurinol: hypersensitivity (HLA‑B*58:01 risk)',
          '⚠️ Febuxostat: possible ↑ CV mortality warning',
          '✨ Pearl: start low + flare prophylaxis (colchicine/NSAID)',
        ],
      },
    ],
  },

  'm5-p4': {
    title: 'DMARDs & Biologics',
    slides: [
      {
        id: 'methotrexate',
        emoji: '🧬',
        title: 'Methotrexate',
        subtitle: 'Anchor DMARD for RA (weekly)',
        facts: [
          '🎯 Use: RA, psoriasis; weekly dosing',
          '🧬 MOA: folate antagonist → inflammation↓',
          '⚠️ AEs: mouth sores • GI • hepatotoxic • cytopenias',
          '🚫 Avoid: pregnancy; significant liver disease; alcohol excess',
          '✨ Pearl: give folic acid; monitor CBC + LFTs',
        ],
      },
      {
        id: 'hydroxychloroquine',
        emoji: '👁️',
        title: 'Hydroxychloroquine',
        subtitle: 'Gentler DMARD (eye monitoring)',
        facts: [
          '🎯 Use: RA, lupus; safe‑ish in pregnancy',
          '🧬 MOA: immune modulation (slow onset)',
          '⚠️ AEs: retinal toxicity (rare) • GI upset',
          '🔍 Monitor: baseline + periodic eye exams',
          '✨ Pearl: onset takes weeks to months',
        ],
      },
      {
        id: 'tnf-inhibitors',
        emoji: '🛡️',
        title: 'TNF‑α Inhibitors',
        subtitle: 'Adalimumab / Etanercept',
        facts: [
          '🎯 Use: RA, IBD, psoriasis (biologic therapy)',
          '🧬 MOA: blocks TNF‑α → inflammation↓',
          '⚠️ AEs: serious infections; reactivation TB/hepatitis',
          '🔍 Screen: TB + hepatitis before starting',
          '🚫 Avoid: live vaccines; caution HF & malignancy history',
        ],
      },
    ],
  },

  'm5-p5': {
    title: 'Systemic Steroids in Rheum',
    slides: [
      {
        id: 'rheum-steroids',
        emoji: '🧯',
        title: 'Steroids in Rheum',
        subtitle: 'Bridge therapy, then taper',
        facts: [
          '🎯 Use: flares (RA, gout, vasculitis) — quick symptom control',
          '⚠️ AEs: hyperglycemia • mood • BP↑ • fluid retention',
          '⚠️ Long‑term: osteoporosis, infection risk, adrenal suppression',
          '✨ Pearl: lowest dose/shortest time; bone protection if long-term',
          '🔍 Taper: if prolonged course; don’t stop suddenly',
        ],
      },
    ],
  },

  // =========================
  // Module 6 — Infectious Disease
  // =========================
  'm6-p1': {
    title: 'Antibiotic Strategy & Big Buckets',
    slides: [
      {
        id: 'abx-strategy',
        emoji: '🧭',
        title: 'Antibiotic Strategy',
        subtitle: 'Start smart, then narrow',
        facts: [
          '🎯 Goal: treat infection + avoid resistance',
          '🧪 Culture: get cultures BEFORE antibiotics when possible',
          '🧭 Empiric: cover likely bugs/site; de‑escalate with results',
          '⚠️ Red flags: C. diff diarrhea; allergy history matters',
          '✨ Pearl: shortest effective duration wins',
        ],
      },
    ],
  },

  'm6-p2': {
    title: 'Beta‑Lactams (PCNs, Cephs)',
    slides: [
      {
        id: 'penicillins',
        emoji: '🧫',
        title: 'Penicillins + BL/BLI',
        subtitle: '“‑CILLIN” antibiotics',
        facts: [
          '🎯 Use: common infections (strep, otitis, sinusitis, skin)',
          '🧬 MOA: cell wall synthesis inhibit (bactericidal)',
          '⚠️ AEs: allergy rash → anaphylaxis; diarrhea',
          '✨ BL/BLI: Augmentin, Zosyn broaden β‑lactamase coverage',
          '🔍 Pearl: adjust dose for renal function',
        ],
      },
      {
        id: 'cephalosporins',
        emoji: '🧱',
        title: 'Cephalosporins',
        subtitle: '“CEF/CEPH‑” antibiotics',
        facts: [
          '🎯 Use: varies by generation (skin → pneumonia → meningitis)',
          '✨ Examples: cephalexin (skin/UTI), ceftriaxone (pneumonia/meningitis)',
          '⚠️ AEs: allergy (cross‑react low), diarrhea',
          '🧬 Coverage: later gens ↑ Gram‑; some cover Pseudomonas',
          '🔍 Pearl: ceftriaxone can cause biliary sludging (rare)',
        ],
      },
    ],
  },

  'm6-p3': {
    title: 'Macrolides, FQs, Tetracyclines',
    slides: [
      {
        id: 'macrolides',
        emoji: '🫁',
        title: 'Macrolides',
        subtitle: '“‑THROMYCIN” (azithro, clarithro)',
        facts: [
          '🎯 Use: atypical pneumonia, respiratory infections',
          '🧬 MOA: 50S protein synthesis inhibit',
          '⚠️ AEs: QT prolongation • GI upset',
          '⚠️ Interactions: clarithro/erythro = strong CYP3A4 inhibitors',
          '✨ Pearl: azithro has fewer interactions',
        ],
      },
      {
        id: 'fluoroquinolones',
        emoji: '⚠️',
        title: 'Fluoroquinolones',
        subtitle: '“‑FLOXACIN” (cipro, levo)',
        facts: [
          '🎯 Use: complicated UTI/pyelo, some pneumonia (levo)',
          '🧬 MOA: DNA gyrase/topoisomerase inhibit',
          '⚠️ Boxed: tendon rupture, neuropathy, CNS effects',
          '🚫 Avoid: pregnancy/kids; caution QT issues',
          '✨ Pearl: chelates — separate from Ca/Fe/antacids',
        ],
      },
      {
        id: 'tetracyclines',
        emoji: '☀️',
        title: 'Tetracyclines',
        subtitle: '“‑CYCLINE” (doxycycline)',
        facts: [
          '🎯 Use: acne, Lyme, atypical pneumonia, MRSA skin',
          '🧬 MOA: 30S protein synthesis inhibit',
          '⚠️ AEs: photosensitivity • GI • esophagitis',
          '🚫 Avoid: pregnancy & kids (teeth/bone discoloration)',
          '✨ Pearl: take with water; stay upright; avoid dairy/antacids',
        ],
      },
    ],
  },

  'm6-p4': {
    title: 'Sulfonamides & Others',
    slides: [
      {
        id: 'uti-workhorses',
        emoji: '🚽',
        title: 'UTI Workhorses',
        subtitle: 'TMP/SMX & nitrofurantoin',
        facts: [
          '🎯 TMP/SMX use: UTI, MRSA skin, Pneumocystis',
          '⚠️ TMP/SMX AEs: rash/SJS, hyperK, kidney effects; sulfa allergy',
          '🎯 Nitrofurantoin: uncomplicated cystitis only',
          '⚠️ Nitrofurantoin: lung/hepatic toxicity (rare); avoid if low CrCl',
          '✨ Pearl: nitrofurantoin doesn’t treat pyelonephritis',
        ],
      },
      {
        id: 'metronidazole',
        emoji: '🚫',
        title: 'Metronidazole',
        subtitle: 'FLAGYL for anaerobes',
        facts: [
          '🎯 Use: anaerobes (intra‑abdominal), BV, giardia',
          '🧬 MOA: DNA damage in anaerobes',
          '⚠️ AEs: metallic taste • GI upset • neuropathy (long-term)',
          '🚫 No alcohol: disulfiram‑like reaction',
          '✨ Pearl: “below diaphragm” anaerobe coverage',
        ],
      },
      {
        id: 'vanc-linezolid',
        emoji: '🛡️',
        title: 'Serious Gram+ Agents',
        subtitle: 'Vancomycin & linezolid',
        facts: [
          '🎯 Use: MRSA, severe Gram+ infections',
          '🧬 Vanc: binds D‑Ala‑D‑Ala (cell wall)',
          '⚠️ Vanc AEs: nephrotoxicity; “red man” infusion reaction',
          '🧬 Linezolid: 50S inhibit; great oral bioavailability',
          '⚠️ Linezolid: thrombocytopenia; serotonin syndrome with SSRIs',
        ],
      },
    ],
  },

  'm6-p5': {
    title: 'Antifungals & Antivirals',
    slides: [
      {
        id: 'azoles',
        emoji: '🍄',
        title: 'Azoles',
        subtitle: 'All azoles end in -AZOLE',
        facts: [
          '🎯 Use: candida (thrush, vaginitis); crypto (fluconazole)',
          '🧬 MOA: blocks ergosterol synthesis',
          '⚠️ AEs: hepatotoxicity; QT prolongation',
          '⚠️ Interactions: CYP inhibition (varies)',
          '✨ Pearl: check LFTs with prolonged therapy',
        ],
      },
      {
        id: 'nystatin',
        emoji: '👅',
        title: 'Nystatin',
        subtitle: 'Topical for thrush',
        facts: [
          '🎯 Use: oral candidiasis (swish & swallow/spit)',
          '🧬 MOA: binds ergosterol → membrane leak',
          '✨ Pearl: minimal systemic absorption (safe)',
          '⚠️ AEs: mild GI upset; bad taste',
          '🚫 Not for: systemic fungal infections',
        ],
      },
      {
        id: 'antivirals',
        emoji: '🧊',
        title: 'Acyclovir / Oseltamivir',
        subtitle: 'HSV/VZV vs influenza',
        facts: [
          '🎯 Acyclovir/valacyclovir: HSV, shingles',
          '🧬 MOA: inhibits viral DNA polymerase (after activation)',
          '⚠️ AEs: kidney crystals → hydrate; neurotoxicity (rare)',
          '🎯 Oseltamivir: influenza (best within 48 hrs)',
          '⚠️ Oseltamivir: nausea/vomiting; neuropsychiatric (rare)',
        ],
      },
    ],
  },

  // =========================
  // Module 7 — Respiratory & Allergy
  // =========================
  'm7-p1': {
    title: 'Asthma/COPD Overview (Stepwise Logic)',
    slides: [
      {
        id: 'asthma-overview',
        emoji: '🌬️',
        title: 'Asthma/COPD Quick Logic',
        subtitle: 'Rescue vs controller',
        facts: [
          '🎯 Rescue: SABA for quick relief (albuterol)',
          '🛡️ Controller: ICS is foundation for persistent asthma',
          '🧭 Step up: add LABA/LAMA/other controllers as needed',
          '⚠️ Red flag: frequent SABA use = poor control',
          '✨ Pearl: COPD = bronchodilators first; ICS for frequent exacerbations',
        ],
      },
    ],
  },

  'm7-p2': {
    title: 'Inhaled Bronchodilators (SABA, LABA, LAMA)',
    slides: [
      {
        id: 'beta-agonists',
        emoji: '💨',
        title: 'Beta‑Agonists',
        subtitle: 'LABAs often end in -TEROL',
        facts: [
          '🎯 SABA (albuterol): rescue bronchodilator',
          '🎯 LABA (salmeterol/formoterol): maintenance (with controller)',
          '🧬 MOA: β2 agonist → bronchodilation',
          '⚠️ AEs: tremor • tachycardia • hypokalemia (rare)',
          '🚫 Asthma: LABA should NOT be used without ICS',
        ],
      },
      {
        id: 'antimuscarinics',
        emoji: '🚪',
        title: 'Antimuscarinics',
        subtitle: '“‑TROPIUM” (ipratropium/tiotropium)',
        facts: [
          '🎯 Use: COPD maintenance (LAMA); add‑on in asthma (some)',
          '🧬 MOA: blocks muscarinic receptors → bronchodilation',
          '⚠️ AEs: dry mouth • urinary retention • glaucoma caution',
          '✨ Pearl: tiotropium = once daily',
          '🚫 Avoid: spray in eyes; caution severe BPH',
        ],
      },
    ],
  },

  'm7-p3': {
    title: 'Inhaled Corticosteroids & Combos',
    slides: [
      {
        id: 'ics',
        emoji: '🛡️',
        title: 'ICS',
        subtitle: 'Controller therapy',
        facts: [
          '🎯 Use: persistent asthma (reduces exacerbations)',
          '🧬 MOA: airway inflammation↓',
          '⚠️ AEs: thrush • hoarseness',
          '✨ Pearl: rinse mouth after use; spacer helps',
          '🚫 Not rescue: doesn’t work immediately for acute symptoms',
        ],
      },
      {
        id: 'combo-inhalers',
        emoji: '🧩',
        title: 'Combo Inhalers',
        subtitle: 'ICS/LABA (Advair, Symbicort)',
        facts: [
          '🎯 Use: moderate‑severe asthma; COPD with exacerbations',
          '🧬 Combos: ICS + LABA (sometimes + LAMA in COPD)',
          '✨ SMART: budesonide/formoterol can be maintenance + rescue (select)',
          '⚠️ Watch: ICS thrush + LABA tremor/tachy',
          '🔍 Pearl: teach inhaler technique (biggest “dose” factor)',
        ],
      },
    ],
  },

  'm7-p4': {
    title: 'Leukotriene Modifiers & Controllers',
    slides: [
      {
        id: 'montelukast',
        emoji: '🌿',
        title: 'Montelukast',
        subtitle: 'Oral controller (modest benefit)',
        facts: [
          '🎯 Use: allergic rhinitis + asthma add‑on; exercise asthma',
          '🧬 MOA: leukotriene receptor antagonist',
          '⚠️ Warning: neuropsychiatric effects (mood, dreams)',
          '✨ Pearl: convenient oral option; best for allergy overlap',
          '🚫 Caution: depression/anxiety history',
        ],
      },
      {
        id: 'theophylline',
        emoji: '☕',
        title: 'Theophylline',
        subtitle: 'Narrow therapeutic index',
        facts: [
          '🎯 Use: rare now; COPD/asthma add‑on',
          '🧬 MOA: PDE inhibition → bronchodilation',
          '⚠️ Toxicity: nausea, arrhythmias, seizures',
          '⚠️ Interactions: CYP metabolism (many drug interactions)',
          '🔍 Monitor: serum levels if used',
        ],
      },
    ],
  },

  'm7-p5': {
    title: 'Antihistamines & Nasal Steroids',
    slides: [
      {
        id: 'antihistamines',
        emoji: '🌸',
        title: 'Antihistamines',
        subtitle: 'Allergy symptom relief',
        facts: [
          '🎯 2nd gen: cetirizine/loratadine/fexofenadine (less sedation)',
          '🎯 1st gen: diphenhydramine (very sedating)',
          '⚠️ 1st gen AEs: anticholinergic (dry mouth, urinary retention)',
          '✨ Pearl: avoid diphenhydramine in older adults (falls/delirium)',
          '🔍 Use: itching/sneezing; not great for congestion alone',
        ],
      },
      {
        id: 'nasal-steroids',
        emoji: '🌬️',
        title: 'Intranasal Steroids',
        subtitle: 'Best for congestion control',
        facts: [
          '🎯 Use: allergic rhinitis (daily = best effect)',
          '🧬 MOA: local inflammation↓',
          '⚠️ AEs: nose irritation/epistaxis',
          '✨ Pearl: aim spray away from septum to reduce bleeding',
          '🚫 Not instant: takes days for full effect',
        ],
      },
    ],
  },

  // =========================
  // Module 8 — GI & Hepatic
  // =========================
  'm8-p1': {
    title: 'Acid Suppression (PPIs, H2 Blockers)',
    slides: [
      {
        id: 'ppis',
        emoji: '🔥',
        title: 'PPIs',
        subtitle: 'All PPIs end in -PRAZOLE',
        facts: [
          '🎯 Use: GERD, ulcers, GI bleed prophylaxis (high risk)',
          '🧬 MOA: irreversibly blocks proton pump',
          '⚠️ Long‑term: C. diff, low Mg, fractures, B12 low (association)',
          '✨ Pearl: take before meals; strongest acid control',
          '🚫 Interaction: omeprazole can reduce clopidogrel activation',
        ],
      },
      {
        id: 'h2-blockers',
        emoji: '🧊',
        title: 'H2 Blockers',
        subtitle: 'Most end in -TIDINE',
        facts: [
          '🎯 Use: mild GERD, nocturnal symptoms',
          '🧬 MOA: blocks histamine H2 receptors on parietal cells',
          '⚠️ AEs: confusion (elderly), B12 low (long-term)',
          '✨ Pearl: tolerance can develop with continuous use',
          '🔍 Dose: renal adjust (famotidine)',
        ],
      },
    ],
  },

  'm8-p2': {
    title: 'Antiemetics',
    slides: [
      {
        id: 'ondansetron',
        emoji: '🤢',
        title: 'Ondansetron',
        subtitle: '“‑SETRON” = 5‑HT3 blocker',
        facts: [
          '🎯 Use: chemo/post‑op nausea, gastroenteritis',
          '🧬 MOA: blocks serotonin 5‑HT3 receptors',
          '⚠️ AEs: constipation • headache',
          '⚠️ QT: risk ↑ with high dose/other QT meds',
          '✨ Pearl: great “go‑to” for many patients',
        ],
      },
      {
        id: 'other-antiemetics',
        emoji: '🌀',
        title: 'Other Antiemetics',
        subtitle: 'Metoclopramide / Promethazine / Scopolamine',
        facts: [
          '🎯 Metoclopramide: gastroparesis + nausea',
          '⚠️ Metoclopramide: EPS/tardive dyskinesia risk',
          '🎯 Promethazine: very sedating (antihistamine)',
          '🎯 Scopolamine patch: motion sickness',
          '🚫 Caution: sedation + anticholinergic effects (older adults)',
        ],
      },
    ],
  },

  'm8-p3': {
    title: 'Laxatives & Antidiarrheals',
    slides: [
      {
        id: 'constipation',
        emoji: '🚽',
        title: 'Constipation Toolbox',
        subtitle: 'Pick by speed + cause',
        facts: [
          '🎯 Osmotic: PEG (Miralax), lactulose → water in stool',
          '🎯 Stimulant: senna, bisacodyl → motility↑',
          '🎯 Softener: docusate (weak evidence)',
          '⚠️ AEs: diarrhea/cramps; lactulose = gas',
          '✨ Pearl: opioids → stimulant + osmotic often needed',
        ],
      },
      {
        id: 'antidiarrheal',
        emoji: '🧻',
        title: 'Antidiarrheals',
        subtitle: 'Loperamide = “gut opioid”',
        facts: [
          '🎯 Use: symptomatic diarrhea (non‑infectious)',
          '🧬 MOA: μ‑receptor in gut → motility↓',
          '⚠️ Danger: high doses → serious arrhythmias',
          '🚫 Avoid: bloody diarrhea, high fever, suspected C. diff',
          '✨ Pearl: oral rehydration is mainstay',
        ],
      },
    ],
  },

  'm8-p4': {
    title: 'Antispasmodics',
    slides: [
      {
        id: 'antispasmodics',
        emoji: '🫧',
        title: 'Antispasmodics (IBS)',
        subtitle: 'Dicyclomine / Hyoscyamine',
        facts: [
          '🎯 Use: IBS cramps/spasm relief',
          '🧬 MOA: anticholinergic → smooth muscle relaxation',
          '⚠️ AEs: dry mouth • constipation • blurry vision • urinary retention',
          '🚫 Avoid: glaucoma, severe BPH, myasthenia gravis',
          '✨ Pearl: “as needed” before meals works well',
        ],
      },
    ],
  },

  'm8-p5': {
    title: 'IBD & Liver‑Related Drugs',
    slides: [
      {
        id: 'mesalamine',
        emoji: '🧻',
        title: 'Mesalamine (5‑ASA)',
        subtitle: 'Ulcerative colitis workhorse',
        facts: [
          '🎯 Use: mild‑moderate ulcerative colitis',
          '🧬 MOA: local anti‑inflammatory in colon',
          '⚠️ AEs: headache, nausea; rare kidney injury',
          '✨ Pearl: different formulations target different GI sites',
          '🔍 Monitor: renal function (periodic)',
        ],
      },
      {
        id: 'infliximab',
        emoji: '🛡️',
        title: 'Infliximab (Biologic)',
        subtitle: 'TNF‑α inhibitor for moderate‑severe IBD',
        facts: [
          '🎯 Use: Crohn’s/UC refractory; also RA',
          '🧬 MOA: blocks TNF‑α',
          '⚠️ AEs: serious infections; infusion reactions',
          '🔍 Screen: TB + hepatitis before starting',
          '🚫 Avoid: live vaccines; caution HF',
        ],
      },
      {
        id: 'rifaximin-ursodiol',
        emoji: '🧩',
        title: 'Liver/Gut Pearls',
        subtitle: 'Rifaximin & ursodiol',
        facts: [
          '🎯 Rifaximin: traveler’s diarrhea; hepatic encephalopathy prevention',
          '✨ Pearl: minimal absorption → fewer systemic effects',
          '🎯 Ursodiol: dissolves cholesterol stones; treats PBC',
          '⚠️ AEs: GI upset; slow effect',
          '🔍 Pearl: these are “niche but high‑yield” meds',
        ],
      },
    ],
  },

  // =========================
  // Module 9 — Neuro & Seizures
  // =========================
  'm9-p1': {
    title: 'Seizure Meds Overview',
    slides: [
      {
        id: 'aed-overview',
        emoji: '⚡',
        title: 'AED Big Picture',
        subtitle: 'Control vs toxicity balance',
        facts: [
          '🎯 Goal: seizure freedom with minimal side effects',
          '🔍 Monitor: mood, cognition, rash, liver/blood counts (drug‑dependent)',
          '⚠️ Pregnancy: some AEDs teratogenic (valproate high risk)',
          '✨ Pearl: adherence is key; missed doses = breakthrough seizures',
          '🚫 Don’t: stop AEDs abruptly (rebound seizures)',
        ],
      },
    ],
  },

  'm9-p2': {
    title: 'Classic Antiepileptics',
    slides: [
      {
        id: 'phenytoin',
        emoji: '⚡',
        title: 'Phenytoin',
        subtitle: '“PHYNY” = gums + nystagmus',
        facts: [
          '🎯 Use: focal seizures; status epilepticus (after benzo)',
          '⚠️ AEs: nystagmus, ataxia, sedation',
          '⚠️ Chronic: gingival hyperplasia, hirsutism, osteopenia',
          '🧬 CYP inducer: many drug interactions',
          '✨ Pearl: narrow TI; levels help in toxicity/nonadherence',
        ],
      },
      {
        id: 'valproate',
        emoji: '🧯',
        title: 'Valproate',
        subtitle: 'Broad spectrum but teratogenic',
        facts: [
          '🎯 Use: generalized seizures; bipolar; migraine prevention',
          '⚠️ AEs: weight gain, tremor, hair loss',
          '⚠️ Serious: hepatotoxicity, pancreatitis, thrombocytopenia',
          '🚫 Avoid: pregnancy (neural tube defects)',
          '🔍 Monitor: LFTs, platelets; ammonia if encephalopathy',
        ],
      },
      {
        id: 'carbamazepine',
        emoji: '🧩',
        title: 'Carbamazepine',
        subtitle: 'Hyponatremia + rash watch',
        facts: [
          '🎯 Use: focal seizures; trigeminal neuralgia',
          '⚠️ AEs: diplopia/ataxia; hyponatremia (SIADH)',
          '⚠️ Serious: agranulocytosis/aplastic anemia (rare)',
          '🚫 Rash: SJS/TEN risk (HLA‑B*1502 in some Asian ancestry)',
          '🧬 CYP inducer: many drug interactions',
        ],
      },
    ],
  },

  'm9-p3': {
    title: 'Newer Antiepileptics',
    slides: [
      {
        id: 'levetiracetam',
        emoji: '🙂',
        title: 'Levetiracetam',
        subtitle: 'Few interactions (common first choice)',
        facts: [
          '🎯 Use: focal/generalized seizures; IV option inpatient',
          '✨ Pearl: minimal drug interactions',
          '⚠️ AEs: mood/behavior changes (irritability, depression)',
          '🔍 Dose: renal adjustment',
          '🚫 Counsel: report mood worsening',
        ],
      },
      {
        id: 'lamotrigine',
        emoji: '🌋',
        title: 'Lamotrigine',
        subtitle: 'Slow titration to avoid rash',
        facts: [
          '🎯 Use: seizures + bipolar maintenance',
          '⚠️ Rash: SJS/TEN risk (fast titration ↑ risk)',
          '✨ Pearl: “start low, go slow”',
          '🧬 Interaction: valproate ↑ lamotrigine levels',
          '🚫 Stop: any serious rash needs urgent evaluation',
        ],
      },
      {
        id: 'other-aeds',
        emoji: '🧠',
        title: 'Other High‑Yield AEDs',
        subtitle: 'Topiramate + gabapentinoids',
        facts: [
          '🎯 Topiramate: seizures + migraine prevention',
          '⚠️ Topiramate: cognitive slowing, paresthesias, kidney stones',
          '🎯 Gabapentin/pregabalin: neuropathic pain + adjunct seizures',
          '⚠️ Gabapentinoids: sedation, dizziness, edema',
          '🔍 Pearl: renal dose adjust; avoid excess CNS depressants',
        ],
      },
    ],
  },

  'm9-p4': {
    title: 'Migraine Acute & Preventive',
    slides: [
      {
        id: 'triptans',
        emoji: '🌩️',
        title: 'Triptans (Acute)',
        subtitle: 'Most end in -TRIPTAN',
        facts: [
          '🎯 Use: acute migraine (best early)',
          '🧬 MOA: 5‑HT1 agonist → vasoconstriction + neuropeptides↓',
          '🚫 Avoid: CAD, stroke/TIA, uncontrolled HTN',
          '⚠️ AEs: chest tightness, flushing; serotonin syndrome (rare)',
          '✨ Pearl: limit use to avoid medication overuse headache',
        ],
      },
      {
        id: 'prevention',
        emoji: '🛡️',
        title: 'Prevention',
        subtitle: 'CGRP mAbs + classic options',
        facts: [
          '🎯 CGRP mAbs (erenumab): monthly prevention',
          '⚠️ CGRP AEs: constipation, injection reactions',
          '🎯 Others: propranolol, topiramate, valproate',
          '✨ Pearl: choose based on comorbidities (HTN, obesity, depression)',
          '🔍 Goal: fewer attacks + less disability',
        ],
      },
    ],
  },

  'm9-p5': {
    title: 'Parkinson’s Disease Medications',
    slides: [
      {
        id: 'levodopa',
        emoji: '🧠',
        title: 'Levodopa/Carbidopa',
        subtitle: 'Best symptom control',
        facts: [
          '🎯 Use: improves bradykinesia/rigidity',
          '🧬 MOA: levodopa → dopamine; carbidopa ↓ peripheral conversion',
          '⚠️ AEs: nausea, orthostasis, hallucinations',
          '⚠️ Long‑term: dyskinesias, “on/off” fluctuations',
          '✨ Pearl: high‑protein meals can reduce absorption',
        ],
      },
      {
        id: 'adjuncts',
        emoji: '⚙️',
        title: 'Adjunct Options',
        subtitle: 'DA agonists & MAO‑B inhibitors',
        facts: [
          '🎯 DA agonists: pramipexole/ropinirole (younger pts)',
          '⚠️ DA agonists: impulse control, sleep attacks, edema',
          '🎯 MAO‑B inhibitors: rasagiline (modest add‑on benefit)',
          '⚠️ AEs: insomnia; interactions (serotonin syndrome risk with some)',
          '✨ Pearl: hallucinations more common in older adults',
        ],
      },
    ],
  },

  // =========================
  // Module 10 — GU & Miscellaneous
  // =========================
  'm10-p1': {
    title: 'BPH & Overactive Bladder',
    slides: [
      {
        id: 'bph',
        emoji: '🚽',
        title: 'BPH Meds',
        subtitle: 'Alpha‑1 blockers vs 5‑ARI',
        facts: [
          '🎯 Alpha‑1 blockers: tamsulosin (fast symptom relief)',
          '🧬 MOA: relax prostate/bladder neck → flow↑',
          '⚠️ AEs: dizziness/orthostasis; ejaculatory issues',
          '🎯 Finasteride: shrinks prostate (slow onset months)',
          '✨ Pearl: finasteride lowers PSA (~50%); sexual SEs',
        ],
      },
      {
        id: 'oab',
        emoji: '💧',
        title: 'Overactive Bladder',
        subtitle: 'Anticholinergic vs β3 agonist',
        facts: [
          '🎯 Oxybutynin: urgency/frequency control',
          '⚠️ Oxybutynin AEs: dry mouth, constipation, confusion (elderly)',
          '🎯 Mirabegron: β3 agonist (less anticholinergic)',
          '⚠️ Mirabegron: can raise BP',
          '✨ Pearl: avoid anticholinergics in older adults when possible',
        ],
      },
    ],
  },

  'm10-p2': {
    title: 'Osteoporosis & Bone Health',
    slides: [
      {
        id: 'bisphosphonates',
        emoji: '🦴',
        title: 'Bisphosphonates',
        subtitle: 'Most end in -DRONATE',
        facts: [
          '🎯 Use: osteoporosis first‑line (alendronate, zoledronic acid)',
          '🧬 MOA: osteoclast activity↓ → bone resorption↓',
          '⚠️ AEs: esophagitis (oral); flu‑like (IV); hypocalcemia',
          '✨ Pearl: take oral AM with water; stay upright 30 min',
          '⚠️ Rare: osteonecrosis jaw, atypical femur fracture',
        ],
      },
      {
        id: 'other-bone',
        emoji: '🛡️',
        title: 'Other Options',
        subtitle: 'Denosumab & SERMs',
        facts: [
          '🎯 Denosumab: RANKL inhibitor; SC q6 months',
          '⚠️ Denosumab: hypocalcemia/infections; rebound if stopped',
          '🎯 Raloxifene: spine fracture↓; breast CA risk↓',
          '⚠️ Raloxifene: VTE risk; hot flashes',
          '✨ Pearl: ensure Ca/Vit D + weight‑bearing exercise',
        ],
      },
    ],
  },

  'm10-p3': {
    title: 'Contraceptives & Hormonal Therapy',
    slides: [
      {
        id: 'combined-contraception',
        emoji: '🧬',
        title: 'Combined Contraceptives',
        subtitle: 'Estrogen + progestin',
        facts: [
          '🎯 Use: pregnancy prevention; acne; cycle control',
          '🧬 MOA: suppress ovulation + thicken cervical mucus',
          '⚠️ AEs: nausea, breast tenderness; BP↑',
          '🚫 Contra: VTE hx, migraine w/aura, smokers >35',
          '✨ Pearl: missed pills = follow a plan; backup may be needed',
        ],
      },
      {
        id: 'progestin-hrt',
        emoji: '🌸',
        title: 'Progestin/Hormone Therapy',
        subtitle: 'Medroxyprogesterone + estrogens',
        facts: [
          '🎯 Progestin‑only: option when estrogen contraindicated',
          '⚠️ Depot medroxyprogesterone: weight gain; bone density↓',
          '🎯 HRT: menopausal symptoms (lowest dose, shortest time)',
          '⚠️ HRT risks: VTE, stroke; add progestin if uterus present',
          '✨ Pearl: personalize based on symptom severity + risk factors',
        ],
      },
    ],
  },

  'm10-p4': {
    title: 'Smoking Cessation & Dependence',
    slides: [
      {
        id: 'varenicline',
        emoji: '🚭',
        title: 'Varenicline',
        subtitle: 'Partial nicotine agonist',
        facts: [
          '🎯 Use: top single‑agent quit aid for many',
          '🧬 MOA: partial agonist at nicotinic receptor → cravings↓',
          '⚠️ AEs: nausea, vivid dreams, insomnia',
          '⚠️ Mood: monitor depression/suicidality in vulnerable patients',
          '✨ Pearl: set quit date; start ~1 week prior',
        ],
      },
      {
        id: 'nrt-bupropion',
        emoji: '🧩',
        title: 'Other Quit Aids',
        subtitle: 'NRT + bupropion',
        facts: [
          '🎯 NRT: patch (steady) + gum/lozenge (cravings)',
          '⚠️ NRT AEs: skin irritation (patch); mouth irritation (gum)',
          '🎯 Bupropion: helps cravings; great if depression present',
          '⚠️ Bupropion: seizure risk; insomnia',
          '✨ Pearl: meds + counseling = highest success',
        ],
      },
    ],
  },

  'm10-p5': {
    title: 'Eye/Ear & Misc Top 300 Drugs',
    slides: [
      {
        id: 'glaucoma',
        emoji: '👁️',
        title: 'Glaucoma Drops',
        subtitle: 'Latanoprost & timolol',
        facts: [
          '🎯 Latanoprost: first‑line open‑angle glaucoma',
          '🧬 MOA: ↑ uveoscleral outflow (prostaglandin analog)',
          '⚠️ AEs: iris darkening, eyelash growth, eye redness',
          '🎯 Timolol: β‑blocker drop → aqueous humor↓',
          '🚫 Caution: asthma/COPD or bradycardia (systemic absorption)',
        ],
      },
      {
        id: 'ciprodex',
        emoji: '👂',
        title: 'Ear Drops',
        subtitle: 'Ciprodex = antibiotic + steroid',
        facts: [
          '🎯 Use: otitis externa; otitis media w/tubes',
          '🧬 Ciprofloxacin kills bacteria; dexamethasone inflammation↓',
          '✨ Pearl: warm bottle in hands before instillation (comfort)',
          '✨ Technique: tragus pump; stay side‑lying a few minutes',
          '🚫 Avoid: unknown perforation unless approved formulation',
        ],
      },
      {
        id: 'renal-misc',
        emoji: '🩸',
        title: 'Renal/Anemia Pearls',
        subtitle: 'Sevelamer & epoetin alfa',
        facts: [
          '🎯 Sevelamer: phosphate binder in CKD (take with meals)',
          '⚠️ Sevelamer: GI upset; can bind other meds',
          '🎯 Epoetin alfa: CKD anemia (stimulates RBC production)',
          '⚠️ Risks: HTN, thrombosis if Hb pushed too high',
          '🔍 Monitor: Hb/iron; ensure iron stores adequate',
        ],
      },
    ],
  },
};

export function getTeachingDeckForPart(partId: string): TeachingSlideDeck | null {
  return TEACHING_DECKS[partId] ?? null;
}
