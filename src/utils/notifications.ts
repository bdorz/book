import notifee, {
  TriggerType,
  RepeatFrequency,
  AndroidImportance,
  AuthorizationStatus,
  TimestampTrigger,
} from '@notifee/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHANNEL_ID = 'book_reminder';
const NOTIF_ID_PREFIX = 'reminder_';
const SETTINGS_KEY = '@book_notification_settings';

export interface NotificationSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  intervalDays: number;
}

export const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  hour: 21,
  minute: 0,
  intervalDays: 1,
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    return data ? {...defaultNotificationSettings, ...JSON.parse(data)} : defaultNotificationSettings;
  } catch {
    return defaultNotificationSettings;
  }
}

export async function saveNotificationSettings(s: NotificationSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

async function ensureChannel(): Promise<void> {
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: '記帳提醒',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
}

export async function cancelAllReminders(): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  const reminderIds = ids.filter(id => id.startsWith(NOTIF_ID_PREFIX));
  await Promise.all(reminderIds.map(id => notifee.cancelTriggerNotification(id)));
}

function nextTriggerTime(hour: number, minute: number, daysFromNow: number = 0): number {
  const now = new Date();
  const t = new Date();
  t.setHours(hour, minute, 0, 0);

  // 若今天的時間已過或是第0天，先跳到明天再加 days
  if (daysFromNow === 0 && t <= now) {
    t.setDate(t.getDate() + 1);
  } else {
    t.setDate(t.getDate() + daysFromNow);
  }
  return t.getTime();
}

export async function scheduleReminders(s: NotificationSettings): Promise<void> {
  await cancelAllReminders();
  if (!s.enabled) {return;}

  await ensureChannel();

  if (s.intervalDays === 1) {
    // 每天重複，只需一個通知
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextTriggerTime(s.hour, s.minute, 0),
      repeatFrequency: RepeatFrequency.DAILY,
    };
    await notifee.createTriggerNotification(
      {
        id: `${NOTIF_ID_PREFIX}0`,
        title: '📒 記帳提醒',
        body: '今天的支出記錄了嗎？快來記一筆吧！',
        android: {channelId: CHANNEL_ID, pressAction: {id: 'default'}},
      },
      trigger,
    );
  } else if (s.intervalDays === 7) {
    // 每週重複
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: nextTriggerTime(s.hour, s.minute, 0),
      repeatFrequency: RepeatFrequency.WEEKLY,
    };
    await notifee.createTriggerNotification(
      {
        id: `${NOTIF_ID_PREFIX}0`,
        title: '📒 記帳提醒',
        body: '本週的支出記錄了嗎？快來記一筆吧！',
        android: {channelId: CHANNEL_ID, pressAction: {id: 'default'}},
      },
      trigger,
    );
  } else {
    // 每 N 天：預排 50 筆（最多覆蓋 50*N 天）
    const COUNT = 50;
    for (let i = 0; i < COUNT; i++) {
      const daysOffset = i * s.intervalDays;
      const timestamp = nextTriggerTime(s.hour, s.minute, daysOffset);
      if (timestamp <= Date.now()) {continue;}
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp,
      };
      await notifee.createTriggerNotification(
        {
          id: `${NOTIF_ID_PREFIX}${i}`,
          title: '📒 記帳提醒',
          body: '記得記帳喔！',
          android: {channelId: CHANNEL_ID, pressAction: {id: 'default'}},
        },
        trigger,
      );
    }
  }
}

// App 開啟時補充快用完的通知
export async function replenishRemindersIfNeeded(): Promise<void> {
  const s = await getNotificationSettings();
  if (!s.enabled || s.intervalDays <= 1 || s.intervalDays === 7) {return;}

  const ids = await notifee.getTriggerNotificationIds();
  const remaining = ids.filter(id => id.startsWith(NOTIF_ID_PREFIX)).length;
  if (remaining < 10) {
    await scheduleReminders(s);
  }
}
