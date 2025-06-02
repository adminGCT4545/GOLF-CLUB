export interface PushNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  data?: NotificationData;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  badge?: number;
  sound?: string;
  imageUrl?: string;
  actions?: NotificationAction[];
  timestamp: Date;
  expiresAt?: Date;
  isRead: boolean;
  isDelivered: boolean;
  deepLink?: string;
  groupId?: string; // For grouping similar notifications
}

export interface NotificationData {
  conversationId?: string;
  messageId?: string;
  tournamentId?: string;
  bookingId?: string;
  memberId?: string;
  eventId?: string;
  customData?: Record<string, any>;
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  type: NotificationActionType;
  destructive?: boolean;
  input?: boolean;
  inputPlaceholder?: string;
}

export interface NotificationSettings {
  userId: string;
  globalEnabled: boolean;
  messageNotifications: MessageNotificationSettings;
  tournamentNotifications: TournamentNotificationSettings;
  bookingNotifications: BookingNotificationSettings;
  socialNotifications: SocialNotificationSettings;
  systemNotifications: SystemNotificationSettings;
  quietHours: QuietHoursSettings;
  soundSettings: SoundSettings;
  badgeSettings: BadgeSettings;
  lastUpdated: Date;
}

export interface MessageNotificationSettings {
  enabled: boolean;
  directMessages: boolean;
  groupMessages: boolean;
  mentions: boolean;
  reactions: boolean;
  newConversations: boolean;
  sound: string;
  vibration: boolean;
  showPreview: boolean;
  muteConversations: string[]; // Conversation IDs
}

export interface TournamentNotificationSettings {
  enabled: boolean;
  registrationOpen: boolean;
  registrationDeadline: boolean;
  tournamentStart: boolean;
  leaderboardUpdates: boolean;
  results: boolean;
  reminders: boolean;
  sound: string;
  vibration: boolean;
}

export interface BookingNotificationSettings {
  enabled: boolean;
  confirmations: boolean;
  reminders: boolean;
  cancellations: boolean;
  modifications: boolean;
  waitlistUpdates: boolean;
  paymentDue: boolean;
  sound: string;
  vibration: boolean;
  reminderTiming: ReminderTiming[];
}

export interface SocialNotificationSettings {
  enabled: boolean;
  newFollowers: boolean;
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  friendRequests: boolean;
  eventInvitations: boolean;
  sound: string;
  vibration: boolean;
}

export interface SystemNotificationSettings {
  enabled: boolean;
  securityAlerts: boolean;
  maintenanceNotices: boolean;
  appUpdates: boolean;
  promotions: boolean;
  newsletters: boolean;
  sound: string;
  vibration: boolean;
}

export interface QuietHoursSettings {
  enabled: boolean;
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  days: DayOfWeek[];
  allowUrgent: boolean;
  urgentContacts: string[]; // User IDs
  urgentKeywords: string[];
}

export interface SoundSettings {
  enabled: boolean;
  defaultSound: string;
  messageSounds: Record<string, string>; // Type -> Sound mapping
  volume: number; // 0-1
  respectDeviceSettings: boolean;
}

export interface BadgeSettings {
  enabled: boolean;
  showUnreadMessages: boolean;
  showUnreadNotifications: boolean;
  maxBadgeCount: number;
}

export interface ReminderTiming {
  id: string;
  enabled: boolean;
  minutes: number; // Minutes before event
  label: string;
}

export interface NotificationPermission {
  granted: boolean;
  provisional?: boolean;
  alert: boolean;
  badge: boolean;
  sound: boolean;
  criticalAlert: boolean;
  announcement: boolean;
  carPlay: boolean;
  lockScreen: boolean;
  notificationCenter: boolean;
}

export interface DeviceToken {
  token: string;
  platform: Platform;
  appVersion: string;
  deviceModel: string;
  osVersion: string;
  timestamp: Date;
  isActive: boolean;
}

export interface NotificationAnalytics {
  notificationId: string;
  userId: string;
  event: NotificationEvent;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface NotificationFilter {
  types?: NotificationType[];
  categories?: NotificationCategory[];
  isRead?: boolean;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationBatch {
  notifications: PushNotification[];
  totalCount: number;
  unreadCount: number;
  hasMore: boolean;
}

export enum NotificationType {
  MESSAGE = 'message',
  TOURNAMENT = 'tournament',
  BOOKING = 'booking',
  SOCIAL = 'social',
  SYSTEM = 'system',
  PROMOTION = 'promotion',
  REMINDER = 'reminder',
  URGENT = 'urgent',
}

export enum NotificationCategory {
  COMMUNICATION = 'communication',
  SPORTS = 'sports',
  BUSINESS = 'business',
  SOCIAL = 'social',
  SYSTEM = 'system',
  MARKETING = 'marketing',
}

export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum NotificationActionType {
  REPLY = 'reply',
  MARK_READ = 'mark_read',
  ARCHIVE = 'archive',
  DELETE = 'delete',
  OPEN = 'open',
  SNOOZE = 'snooze',
  CUSTOM = 'custom',
}

export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
}

export enum Platform {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

export enum NotificationEvent {
  SENT = 'sent',
  DELIVERED = 'delivered',
  OPENED = 'opened',
  DISMISSED = 'dismissed',
  ACTION_TAKEN = 'action_taken',
  FAILED = 'failed',
}

// API Request/Response Types
export interface RegisterDeviceRequest {
  token: string;
  platform: Platform;
  appVersion: string;
  deviceModel: string;
  osVersion: string;
}

export interface UpdateNotificationSettingsRequest {
  settings: Partial<NotificationSettings>;
}

export interface SendNotificationRequest {
  userIds: string[];
  title: string;
  body: string;
  data?: NotificationData;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  sound?: string;
  imageUrl?: string;
  actions?: NotificationAction[];
  expiresAt?: Date;
  deepLink?: string;
  scheduleFor?: Date;
}

export interface MarkNotificationRequest {
  notificationIds: string[];
  isRead?: boolean;
  isDelivered?: boolean;
}

export interface NotificationStatsResponse {
  totalNotifications: number;
  unreadNotifications: number;
  notificationsByType: Record<NotificationType, number>;
  notificationsByCategory: Record<NotificationCategory, number>;
  deliveryRate: number;
  openRate: number;
}

// Local Notification Types (for offline/scheduled notifications)
export interface LocalNotification {
  id: string;
  title: string;
  body: string;
  data?: NotificationData;
  scheduledFor?: Date;
  repeat?: RepeatInterval;
  sound?: string;
  badge?: number;
  category?: string;
  actions?: NotificationAction[];
}

export enum RepeatInterval {
  NONE = 'none',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

// Deep Link Types
export interface DeepLinkData {
  screen: string;
  params?: Record<string, any>;
  conversationId?: string;
  messageId?: string;
  tournamentId?: string;
  bookingId?: string;
  memberId?: string;
}

// Notification Template Types
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  body: string;
  variables: string[]; // Template variables like {{userName}}, {{tournamentName}}
  defaultData?: NotificationData;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
