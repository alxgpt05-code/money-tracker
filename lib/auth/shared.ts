export const SESSION_COOKIE = "capital_session";
export const CLIENT_USER_ID_COOKIE = "capital_user_id";

export interface NotificationSettings {
  dailyReminderEnabled: boolean;
  dailyReminderTime: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  dailyReminderEnabled: false,
  dailyReminderTime: "20:00",
};
