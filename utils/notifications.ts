import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const STREAK_NOTIFICATION_ID = 'streak-reminder';
const HEART_NOTIFICATION_ID = 'heart-reminder';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform — skipping permission request');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    console.log(`[Notifications] Current permission status: ${existingStatus}`);

    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    console.log(`[Notifications] Requested permission, got: ${status}`);
    return status === 'granted';
  } catch (error) {
    console.log('[Notifications] Error requesting permission:', error);
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function scheduleStreakReminder(hasCompletedLessonToday: boolean): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID).catch(() => {});
    console.log('[Notifications] Cancelled existing streak reminder');

    if (hasCompletedLessonToday) {
      console.log('[Notifications] Lesson completed today — no streak reminder needed');
      return;
    }

    const now = new Date();
    const trigger = new Date();
    trigger.setHours(19, 0, 0, 0);

    if (now >= trigger) {
      trigger.setDate(trigger.getDate() + 1);
    }

    const secondsUntil = Math.max(1, Math.floor((trigger.getTime() - now.getTime()) / 1000));
    console.log(`[Notifications] Scheduling streak reminder in ${secondsUntil}s (at ${trigger.toISOString()})`);

    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_NOTIFICATION_ID,
      content: {
        title: 'Keep your streak alive! 🔥',
        body: 'Keep your streak alive — 1 quick lesson!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
        repeats: false,
      },
    });

    console.log('[Notifications] Streak reminder scheduled');
  } catch (error) {
    console.log('[Notifications] Error scheduling streak reminder:', error);
  }
}

export async function cancelStreakReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID);
    console.log('[Notifications] Streak reminder cancelled');
  } catch (error) {
    console.log('[Notifications] Error cancelling streak reminder:', error);
  }
}

export async function scheduleHeartReminder(nextHeartAtISO: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(HEART_NOTIFICATION_ID).catch(() => {});

    if (!nextHeartAtISO) {
      console.log('[Notifications] No nextHeartAtISO — no heart reminder needed');
      return;
    }

    const nextAt = new Date(nextHeartAtISO).getTime();
    const now = Date.now();
    const secondsUntil = Math.max(1, Math.floor((nextAt - now) / 1000));

    if (secondsUntil <= 0) {
      console.log('[Notifications] Heart already available — no reminder needed');
      return;
    }

    console.log(`[Notifications] Scheduling heart reminder in ${secondsUntil}s`);

    await Notifications.scheduleNotificationAsync({
      identifier: HEART_NOTIFICATION_ID,
      content: {
        title: 'A heart is back! ❤️',
        body: 'A heart is back — ready to practice?',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsUntil,
        repeats: false,
      },
    });

    console.log('[Notifications] Heart reminder scheduled');
  } catch (error) {
    console.log('[Notifications] Error scheduling heart reminder:', error);
  }
}

export async function cancelHeartReminder(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(HEART_NOTIFICATION_ID);
    console.log('[Notifications] Heart reminder cancelled');
  } catch (error) {
    console.log('[Notifications] Error cancelling heart reminder:', error);
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(STREAK_NOTIFICATION_ID).catch(() => {});
    await Notifications.cancelScheduledNotificationAsync(HEART_NOTIFICATION_ID).catch(() => {});
    console.log('[Notifications] All reminders cancelled');
  } catch (error) {
    console.log('[Notifications] Error cancelling all reminders:', error);
  }
}
