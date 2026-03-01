export async function requestNotificationPermission(): Promise<boolean> {
  console.log('[Notifications] Notifications not available in this build');
  return false;
}

export async function hasNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleStreakReminder(_hasCompletedLessonToday: boolean): Promise<void> {
  console.log('[Notifications] scheduleStreakReminder no-op');
}

export async function cancelStreakReminder(): Promise<void> {
  console.log('[Notifications] cancelStreakReminder no-op');
}

export async function scheduleHeartReminder(_nextHeartAtISO: string): Promise<void> {
  console.log('[Notifications] scheduleHeartReminder no-op');
}

export async function cancelHeartReminder(): Promise<void> {
  console.log('[Notifications] cancelHeartReminder no-op');
}

export async function cancelAllReminders(): Promise<void> {
  console.log('[Notifications] cancelAllReminders no-op');
}
