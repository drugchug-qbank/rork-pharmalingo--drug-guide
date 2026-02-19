export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  weeklyXp: number[];
}

export interface FriendData extends LeaderboardUser {
  friendStreak: number;
  lastActive: string;
  isFriend: boolean;
}

export const globalLeaderboard: LeaderboardUser[] = [
  { id: 'u1', name: 'PharmQueen', avatar: '👩‍⚕️', xp: 12450, level: 25, streak: 42, weeklyXp: [180, 220, 150, 310, 280, 190, 240] },
  { id: 'u2', name: 'RxMaster_99', avatar: '🧑‍🔬', xp: 11200, level: 23, streak: 38, weeklyXp: [200, 190, 260, 170, 300, 220, 180] },
  { id: 'u3', name: 'PillPusher', avatar: '💊', xp: 10800, level: 22, streak: 35, weeklyXp: [150, 280, 200, 240, 160, 310, 200] },
  { id: 'u4', name: 'DrugNerd42', avatar: '🤓', xp: 9650, level: 20, streak: 28, weeklyXp: [220, 160, 190, 280, 210, 170, 250] },
  { id: 'u5', name: 'MedStudent_A', avatar: '📖', xp: 8900, level: 18, streak: 22, weeklyXp: [140, 200, 250, 180, 220, 160, 190] },
  { id: 'u6', name: 'CapsuLena', avatar: '💉', xp: 8200, level: 17, streak: 19, weeklyXp: [180, 150, 200, 160, 240, 190, 170] },
  { id: 'u7', name: 'DoseKing', avatar: '👑', xp: 7600, level: 16, streak: 15, weeklyXp: [160, 190, 140, 220, 180, 200, 150] },
  { id: 'u8', name: 'SynapseRx', avatar: '🧠', xp: 7100, level: 15, streak: 12, weeklyXp: [130, 170, 200, 150, 190, 160, 140] },
  { id: 'u9', name: 'TabletTina', avatar: '💊', xp: 6500, level: 14, streak: 10, weeklyXp: [110, 150, 180, 130, 160, 140, 120] },
  { id: 'u10', name: 'ClinPharmJay', avatar: '🔬', xp: 6000, level: 13, streak: 8, weeklyXp: [100, 140, 160, 120, 150, 130, 110] },
  { id: 'u11', name: 'RxRookie', avatar: '🌱', xp: 5400, level: 11, streak: 7, weeklyXp: [90, 120, 140, 110, 130, 100, 80] },
  { id: 'u12', name: 'PharmPanda', avatar: '🐼', xp: 4800, level: 10, streak: 5, weeklyXp: [80, 110, 120, 90, 100, 80, 70] },
  { id: 'u13', name: 'MedWhiz', avatar: '⚡', xp: 4200, level: 9, streak: 4, weeklyXp: [70, 90, 100, 80, 110, 70, 60] },
  { id: 'u14', name: 'ScriptSam', avatar: '📝', xp: 3600, level: 8, streak: 3, weeklyXp: [60, 80, 70, 90, 60, 80, 50] },
  { id: 'u15', name: 'PharmaNewbie', avatar: '🐣', xp: 2800, level: 6, streak: 2, weeklyXp: [40, 50, 60, 40, 70, 50, 30] },
];

export const friendsData: FriendData[] = [
  { id: 'f1', name: 'Sarah_PharmD', avatar: '👩‍⚕️', xp: 9200, level: 19, streak: 24, weeklyXp: [200, 180, 250, 220, 190, 260, 210], friendStreak: 14, lastActive: '2h ago', isFriend: true },
  { id: 'f2', name: 'MikeRx', avatar: '🧑‍🔬', xp: 7800, level: 16, streak: 18, weeklyXp: [160, 200, 140, 180, 220, 170, 190], friendStreak: 8, lastActive: '30m ago', isFriend: true },
  { id: 'f3', name: 'JennyPills', avatar: '💊', xp: 6400, level: 13, streak: 11, weeklyXp: [120, 150, 180, 130, 160, 140, 110], friendStreak: 21, lastActive: '1h ago', isFriend: true },
  { id: 'f4', name: 'DrChris', avatar: '🩺', xp: 5100, level: 11, streak: 9, weeklyXp: [100, 130, 110, 140, 120, 100, 90], friendStreak: 5, lastActive: '4h ago', isFriend: true },
  { id: 'f5', name: 'AlexStudies', avatar: '📚', xp: 4300, level: 9, streak: 6, weeklyXp: [80, 100, 90, 120, 110, 80, 70], friendStreak: 3, lastActive: '1d ago', isFriend: true },
  { id: 'f6', name: 'RxBuddy', avatar: '🤝', xp: 3200, level: 7, streak: 4, weeklyXp: [60, 70, 80, 50, 90, 60, 40], friendStreak: 12, lastActive: '5h ago', isFriend: true },
];

export const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const YOUR_WEEKLY_XP = [150, 190, 170, 240, 200, 160, 220];
