import { Platform } from 'react-native';

/**
 * TEMP STUB: Notifications are disabled in this build.
 *
 * Why: The Rork build environment is currently failing because `expo-notifications`
 * is not installed/available. To unblock development (avatars, leaderboards, etc.),
 * we ship no-op notification helpers.
 *
 * Later, when dependencies are stable again, we can restore `expo-notifications`
 * and real scheduling.
 */

export async function requestNotificationPermission(): Promise<boolean> {
  // Web + native: disabled
  if (Platform.OS !== 'web') {
    console.log('[Notifications] Disabled (stub)');
  }
  return false;
}

export async function hasNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleStreakReminder(_hasCompletedLessonToday: boolean): Promise<void> {
  // no-op
}

export async function cancelStreakReminder(): Promise<void> {
  // no-op
}

export async function scheduleHeartReminder(_nextHeartAtISO: string): Promise<void> {
  // no-op
}

export async function cancelHeartReminder(): Promise<void> {
  // no-op
}

export async function cancelAllReminders(): Promise<void> {
  // no-op
}
