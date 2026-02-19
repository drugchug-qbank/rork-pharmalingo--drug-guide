export interface School {
  id: string;
  name: string;
}

export interface SchoolLeaderboardEntry {
  school: School;
  totalWeeklyXP: number;
  memberCount: number;
}

export interface MockSchoolUser {
  id: string;
  name: string;
  schoolId: string;
  weeklyXP: number;
}

export const schools: School[] = [
  { id: 'sch1', name: 'UNC Eshelman School of Pharmacy' },
  { id: 'sch2', name: 'UCSF School of Pharmacy' },
  { id: 'sch3', name: 'University of Michigan College of Pharmacy' },
  { id: 'sch4', name: 'University of Minnesota College of Pharmacy' },
  { id: 'sch5', name: 'UF College of Pharmacy' },
  { id: 'sch6', name: 'Ohio State University College of Pharmacy' },
  { id: 'sch7', name: 'Purdue University College of Pharmacy' },
  { id: 'sch8', name: 'University of Kentucky College of Pharmacy' },
  { id: 'sch9', name: 'UT Austin College of Pharmacy' },
  { id: 'sch10', name: 'USC School of Pharmacy' },
  { id: 'sch11', name: 'University of Pittsburgh School of Pharmacy' },
  { id: 'sch12', name: 'University of Wisconsin School of Pharmacy' },
  { id: 'sch13', name: 'Northeastern University School of Pharmacy' },
  { id: 'sch14', name: 'University of Maryland School of Pharmacy' },
  { id: 'sch15', name: 'University of Illinois Chicago College of Pharmacy' },
  { id: 'sch16', name: 'Virginia Commonwealth University School of Pharmacy' },
  { id: 'sch17', name: 'Temple University School of Pharmacy' },
  { id: 'sch18', name: 'Rutgers Ernest Mario School of Pharmacy' },
  { id: 'sch19', name: 'University of Georgia College of Pharmacy' },
  { id: 'sch20', name: 'Auburn University Harrison College of Pharmacy' },
];

const mockUserNames = [
  'PharmAce', 'RxWarrior', 'PillProf', 'MedGeek', 'DoseDoc',
  'ScriptKid', 'RxStar', 'PharmNinja', 'CapsuleKing', 'TabletQueen',
  'SynapseRx', 'DrugBuff', 'MedWiz', 'PharmFox', 'RxChamp',
  'PillWizard', 'MedHero', 'DoseQueen', 'RxLegend', 'PharmOwl',
  'ClinPharma', 'RxBrain', 'MedNerd', 'PharmEagle', 'DoseGuru',
  'RxPro', 'PillStar', 'MedChef', 'PharmBee', 'DrugWise',
  'RxKnight', 'MedSage', 'PharmLion', 'DoseWolf', 'RxHawk',
  'PillShark', 'MedPanda', 'PharmTiger', 'DoseBear', 'RxFalcon',
  'PillDragon', 'MedPhoenix', 'PharmViper', 'DoseRaven', 'RxCobra',
  'PillEagle', 'MedWolf', 'PharmFury', 'DoseBlitz', 'RxStorm',
  'PillThunder', 'MedFlash', 'PharmBolt', 'DoseSpark', 'RxBlaze',
  'PillFrost', 'MedIce', 'PharmSnow', 'DoseFlame', 'RxEmber',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateSchoolLeaderboard(
  userSchoolId: string | null,
  userWeeklyXP: number,
): SchoolLeaderboardEntry[] {
  const rand = seededRandom(42);

  const schoolXpMap: Record<string, { total: number; count: number }> = {};

  for (const school of schools) {
    schoolXpMap[school.id] = { total: 0, count: 0 };
  }

  for (let i = 0; i < mockUserNames.length; i++) {
    const schoolIndex = Math.floor(rand() * schools.length);
    const school = schools[schoolIndex];
    const xp = Math.floor(rand() * 800) + 100;
    schoolXpMap[school.id].total += xp;
    schoolXpMap[school.id].count += 1;
  }

  if (userSchoolId && schoolXpMap[userSchoolId]) {
    schoolXpMap[userSchoolId].total += userWeeklyXP;
    schoolXpMap[userSchoolId].count += 1;
  }

  const entries: SchoolLeaderboardEntry[] = schools.map(school => ({
    school,
    totalWeeklyXP: schoolXpMap[school.id].total,
    memberCount: schoolXpMap[school.id].count,
  }));

  entries.sort((a, b) => b.totalWeeklyXP - a.totalWeeklyXP);

  return entries;
}
