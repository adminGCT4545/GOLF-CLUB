import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { Platform, Alert, Linking, AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import {
  PushNotification as AppNotification,
  NotificationSettings,
  LocalNotification,
  DeepLinkData,
  NotificationType,
  NotificationPriority,
  Platform as AppPlatform,
  DeviceToken,
  NotificationAction,
} from '../types/notification';
import { api } from './api';

interface NotificationHandler {
  onNotificationReceived?: (notification: AppNotification) => void;
  onNotificationOpened?: (notification: AppNotification, deepLink?: DeepLinkData) => void;
  onTokenRefresh?: (token: string) => void;
  onPermissionChanged?: (enabled: boolean) => void;
}

class PushNotificationService {
  private handler: NotificationHandler = {};
  private isInitialized = false;
  private currentToken: string | null = null;
  private settings: NotificationSettings | null = null;
  private appStateSubscription: any = null;
  private backgroundMessageUnsubscribe: (() => void) | null = null;
  private foregroundMessageUnsubscribe: (() => void) | null = null;
  private tokenRefreshUnsubscribe: (() => void) | null = null;

  // Initialization
  async initialize(handler: NotificationHandler): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.handler = handler;

    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Push notification permissions not granted');
        this.handler.onPermissionChanged?.(false);
        return;
      }

      // Initialize platform-specific services
      await this.initializePlatformServices();

      // Set up Firebase messaging
      await this.setupFirebaseMessaging();

      // Register device and get token
      await this.registerDevice();

      // Load notification settings
      await this.loadNotificationSettings();

      // Set up app state listener
      this.setupAppStateListener();

      this.isInitialized = true;
      console.log('Push notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize push notification service:', error);
      throw error;
    }
  }

  private async initializePlatformServices(): Promise<void> {
    if (Platform.OS === 'android') {
      // Configure Android push notifications
      PushNotification.configure({
        onNotification: this.handleLocalNotification.bind(this),
        onRegistrationError: (err) => {
          console.error('Push notification registration error:', err);
        },
        permissions: {
          alert: true,
          badge: true,
          sound: true,
        },
        popInitialNotification: true,
        requestPermissions: false, // We handle this separately
      });

      // Create notification channels
      await this.createNotificationChannels();
    } else if (Platform.OS === 'ios') {
      // Configure iOS push notifications
      PushNotificationIOS.addEventListener('notification', this.handleLocalNotification.bind(this));
      PushNotificationIOS.addEventListener(
        'localNotification',
        this.handleLocalNotification.bind(this)
      );
    }
  }

  private async setupFirebaseMessaging(): Promise<void> {
    // Handle background messages
    this.backgroundMessageUnsubscribe = messaging().setBackgroundMessageHandler(
      this.handleBackgroundMessage.bind(this)
    );

    // Handle foreground messages
    this.foregroundMessageUnsubscribe = messaging().onMessage(
      this.handleForegroundMessage.bind(this)
    );

    // Handle token refresh
    this.tokenRefreshUnsubscribe = messaging().onTokenRefresh(this.handleTokenRefresh.bind(this));

    // Handle notification opened app
    messaging().onNotificationOpenedApp(this.handleNotificationOpenedApp.bind(this));

    // Check if app was opened from a notification
    const initialNotification = await messaging().getInitialNotification();
    if (initialNotification) {
      setTimeout(() => {
        this.handleNotificationOpenedApp(initialNotification);
      }, 2000); // Delay to ensure app is fully loaded
    }
  }

  // Permission Management
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await messaging().requestPermission({
          alert: true,
          badge: true,
          sound: true,
          criticalAlert: true,
          provisional: false,
        });

        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        await this.savePermissionStatus(enabled);
        return enabled;
      } else {
        // Android permissions are handled during installation
        const enabled = await messaging().hasPermission();
        await this.savePermissionStatus(enabled === messaging.AuthorizationStatus.AUTHORIZED);
        return enabled === messaging.AuthorizationStatus.AUTHORIZED;
      }
    } catch (error) {
      console.error('Failed to request push notification permissions:', error);
      return false;
    }
  }

  async checkPermissions(): Promise<boolean> {
    try {
      const authStatus = await messaging().hasPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      await this.savePermissionStatus(enabled);
      return enabled;
    } catch (error) {
      console.error('Failed to check push notification permissions:', error);
      return false;
    }
  }

  async openAppSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  private async savePermissionStatus(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem('pushNotificationPermission', JSON.stringify(enabled));
    this.handler.onPermissionChanged?.(enabled);
  }

  // Device Registration
  async registerDevice(): Promise<void> {
    try {
      const token = await messaging().getToken();
      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      this.currentToken = token;

      const deviceInfo: Omit<DeviceToken, 'timestamp' | 'isActive'> = {
        token,
        platform: Platform.OS === 'ios' ? AppPlatform.IOS : AppPlatform.ANDROID,
        appVersion: '1.0.0', // Should be from app config
        deviceModel: '', // Should be from device info
        osVersion: Platform.Version.toString(),
      };

      await api.post('/notifications/devices', deviceInfo);
      await AsyncStorage.setItem('fcmToken', token);

      console.log('Device registered for push notifications:', token);
      this.handler.onTokenRefresh?.(token);
    } catch (error) {
      console.error('Failed to register device for push notifications:', error);
      throw error;
    }
  }

  async unregisterDevice(): Promise<void> {
    try {
      if (this.currentToken) {
        await api.delete('/notifications/devices', {
          data: { token: this.currentToken },
        });
        await AsyncStorage.removeItem('fcmToken');
        this.currentToken = null;
        console.log('Device unregistered from push notifications');
      }
    } catch (error) {
      console.error('Failed to unregister device:', error);
    }
  }

  // Message Handlers
  private async handleBackgroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    console.log('Background message received:', remoteMessage);

    try {
      const notification = this.convertFirebaseMessage(remoteMessage);

      // Check if notifications should be shown during quiet hours
      if (await this.isQuietTime()) {
        return;
      }

      // Show local notification for background messages
      await this.showLocalNotification(notification);
    } catch (error) {
      console.error('Failed to handle background message:', error);
    }
  }

  private async handleForegroundMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): Promise<void> {
    console.log('Foreground message received:', remoteMessage);

    try {
      const notification = this.convertFirebaseMessage(remoteMessage);

      // Check if notifications should be shown during quiet hours
      if (await this.isQuietTime()) {
        return;
      }

      // Let the app handle foreground messages
      this.handler.onNotificationReceived?.(notification);

      // Optionally show local notification for foreground messages
      if (this.shouldShowForegroundNotification(notification)) {
        await this.showLocalNotification(notification);
      }
    } catch (error) {
      console.error('Failed to handle foreground message:', error);
    }
  }

  private handleLocalNotification(notification: any): void {
    console.log('Local notification received:', notification);

    // Handle notification tap
    if (notification.userInteraction) {
      const deepLink = this.parseDeepLink(notification.data?.deepLink);
      const appNotification = this.convertLocalNotification(notification);
      this.handler.onNotificationOpened?.(appNotification, deepLink);
    }
  }

  private handleNotificationOpenedApp(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    console.log('Notification opened app:', remoteMessage);

    try {
      const notification = this.convertFirebaseMessage(remoteMessage);
      const deepLink = this.parseDeepLink(remoteMessage.data?.deepLink);
      this.handler.onNotificationOpened?.(notification, deepLink);
    } catch (error) {
      console.error('Failed to handle notification opened app:', error);
    }
  }

  private async handleTokenRefresh(token: string): Promise<void> {
    console.log('FCM token refreshed:', token);

    try {
      // Update token on server
      if (this.currentToken !== token) {
        await this.updateDeviceToken(token);
        this.currentToken = token;
        await AsyncStorage.setItem('fcmToken', token);
        this.handler.onTokenRefresh?.(token);
      }
    } catch (error) {
      console.error('Failed to handle token refresh:', error);
    }
  }

  // Local Notifications
  async showLocalNotification(notification: AppNotification | LocalNotification): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        PushNotification.localNotification({
          id: notification.id,
          title: notification.title,
          message: notification.body,
          data: notification.data,
          category: this.getNotificationCategory(notification),
          actions: this.convertNotificationActions(notification.actions),
          sound: this.getNotificationSound(notification),
          vibrate: await this.shouldVibrate(),
          priority: this.getAndroidPriority(notification.priority),
          importance: this.getAndroidImportance(notification.priority),
        });
      } else {
        PushNotificationIOS.presentLocalNotification({
          alertTitle: notification.title,
          alertBody: notification.body,
          userInfo: notification.data,
          category: this.getNotificationCategory(notification),
          soundName: this.getNotificationSound(notification),
          isSilent: !(await this.shouldPlaySound()),
        });
      }
    } catch (error) {
      console.error('Failed to show local notification:', error);
    }
  }

  async scheduleLocalNotification(notification: LocalNotification): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        PushNotification.localNotificationSchedule({
          id: notification.id,
          title: notification.title,
          message: notification.body,
          date: notification.scheduledFor || new Date(),
          data: notification.data,
          repeatType: this.getRepeatType(notification.repeat),
          category: notification.category,
          sound: notification.sound || 'default',
        });
      } else {
        PushNotificationIOS.scheduleLocalNotification({
          alertTitle: notification.title,
          alertBody: notification.body,
          fireDate: notification.scheduledFor || new Date(),
          userInfo: notification.data,
          category: notification.category,
          soundName: notification.sound || 'default',
          repeatInterval: this.getIOSRepeatInterval(notification.repeat),
        });
      }
    } catch (error) {
      console.error('Failed to schedule local notification:', error);
    }
  }

  async cancelLocalNotification(notificationId: string): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        PushNotification.cancelLocalNotifications({ id: notificationId });
      } else {
        PushNotificationIOS.cancelLocalNotifications({ id: notificationId });
      }
    } catch (error) {
      console.error('Failed to cancel local notification:', error);
    }
  }

  async cancelAllLocalNotifications(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        PushNotification.cancelAllLocalNotifications();
      } else {
        PushNotificationIOS.cancelAllLocalNotifications();
      }
    } catch (error) {
      console.error('Failed to cancel all local notifications:', error);
    }
  }

  // Badge Management
  async setBadgeCount(count: number): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        PushNotificationIOS.setApplicationIconBadgeNumber(count);
      } else {
        // Android badge count is handled by the launcher
        PushNotification.setApplicationIconBadgeNumber(count);
      }
      await AsyncStorage.setItem('badgeCount', count.toString());
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem('badgeCount');
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Failed to get badge count:', error);
      return 0;
    }
  }

  async clearBadgeCount(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // Settings Management
  async loadNotificationSettings(): Promise<NotificationSettings | null> {
    try {
      const response = await api.get<NotificationSettings>('/notifications/settings');
      this.settings = response.data;
      return this.settings;
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      return null;
    }
  }

  async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const response = await api.put<NotificationSettings>('/notifications/settings', settings);
      this.settings = response.data;
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      throw error;
    }
  }

  // Utility Methods
  private convertFirebaseMessage(
    remoteMessage: FirebaseMessagingTypes.RemoteMessage
  ): AppNotification {
    return {
      id: remoteMessage.messageId || Date.now().toString(),
      userId: '', // Will be filled by the server
      title: remoteMessage.notification?.title || '',
      body: remoteMessage.notification?.body || '',
      data: remoteMessage.data,
      type: (remoteMessage.data?.type as NotificationType) || NotificationType.SYSTEM,
      category: remoteMessage.data?.category as any,
      priority:
        (remoteMessage.data?.priority as NotificationPriority) || NotificationPriority.NORMAL,
      imageUrl: remoteMessage.notification?.imageUrl,
      timestamp: new Date(),
      isRead: false,
      isDelivered: true,
      deepLink: remoteMessage.data?.deepLink,
    };
  }

  private convertLocalNotification(notification: any): AppNotification {
    return {
      id: notification.id || Date.now().toString(),
      userId: '',
      title: notification.title || notification.alertTitle || '',
      body: notification.message || notification.alertBody || '',
      data: notification.data || notification.userInfo,
      type: notification.data?.type || NotificationType.SYSTEM,
      category: notification.category,
      priority: notification.data?.priority || NotificationPriority.NORMAL,
      timestamp: new Date(),
      isRead: false,
      isDelivered: true,
      deepLink: notification.data?.deepLink,
    };
  }

  private parseDeepLink(deepLinkString?: string): DeepLinkData | undefined {
    if (!deepLinkString) {
      return undefined;
    }

    try {
      return JSON.parse(deepLinkString) as DeepLinkData;
    } catch {
      // If not JSON, treat as simple screen navigation
      return { screen: deepLinkString, params: {} };
    }
  }

  private async createNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') {
      return;
    }

    const channels = [
      {
        channelId: 'messages',
        channelName: 'Messages',
        channelDescription: 'Direct and group messages',
        importance: 4,
        vibrate: true,
        sound: 'default',
      },
      {
        channelId: 'tournaments',
        channelName: 'Tournaments',
        channelDescription: 'Tournament updates and notifications',
        importance: 3,
        vibrate: true,
        sound: 'default',
      },
      {
        channelId: 'bookings',
        channelName: 'Bookings',
        channelDescription: 'Booking confirmations and reminders',
        importance: 3,
        vibrate: true,
        sound: 'default',
      },
      {
        channelId: 'system',
        channelName: 'System',
        channelDescription: 'System notifications and updates',
        importance: 2,
        vibrate: false,
        sound: 'default',
      },
    ];

    channels.forEach((channel) => {
      PushNotification.createChannel(channel, () => {});
    });
  }

  private getNotificationCategory(notification: any): string {
    if (notification.type === NotificationType.MESSAGE) {
      return 'messages';
    }
    if (notification.type === NotificationType.TOURNAMENT) {
      return 'tournaments';
    }
    if (notification.type === NotificationType.BOOKING) {
      return 'bookings';
    }
    return 'system';
  }

  private convertNotificationActions(actions?: NotificationAction[]): string[] {
    if (!actions) {
      return [];
    }
    return actions.map((action) => action.title);
  }

  private getNotificationSound(notification: any): string {
    if (!notification.sound) {
      return 'default';
    }
    return notification.sound;
  }

  private async shouldVibrate(): Promise<boolean> {
    if (!this.settings) {
      return true;
    }
    return this.settings.messageNotifications?.vibration || false;
  }

  private async shouldPlaySound(): Promise<boolean> {
    if (!this.settings) {
      return true;
    }
    return this.settings.soundSettings?.enabled || false;
  }

  private shouldShowForegroundNotification(notification: AppNotification): boolean {
    // Show foreground notifications for high priority messages
    return (
      notification.priority === NotificationPriority.HIGH ||
      notification.priority === NotificationPriority.CRITICAL
    );
  }

  private async isQuietTime(): Promise<boolean> {
    if (!this.settings?.quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(this.settings.quietHours.startTime);
    const endTime = this.parseTime(this.settings.quietHours.endTime);

    const currentDay = now.getDay();
    if (!this.settings.quietHours.days.includes(currentDay as any)) {
      return false;
    }

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private getAndroidPriority(priority?: NotificationPriority): 'high' | 'normal' | 'low' {
    switch (priority) {
      case NotificationPriority.CRITICAL:
      case NotificationPriority.HIGH:
        return 'high';
      case NotificationPriority.LOW:
        return 'low';
      default:
        return 'normal';
    }
  }

  private getAndroidImportance(priority?: NotificationPriority): 'high' | 'default' | 'low' {
    switch (priority) {
      case NotificationPriority.CRITICAL:
      case NotificationPriority.HIGH:
        return 'high';
      case NotificationPriority.LOW:
        return 'low';
      default:
        return 'default';
    }
  }

  private getRepeatType(repeat?: any): 'day' | 'week' | 'month' | 'year' | undefined {
    return repeat;
  }

  private getIOSRepeatInterval(
    repeat?: any
  ): 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | undefined {
    return repeat;
  }

  private async updateDeviceToken(newToken: string): Promise<void> {
    try {
      await api.put('/notifications/devices/token', { token: newToken });
    } catch (error) {
      console.error('Failed to update device token:', error);
    }
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'active') {
      // App came to foreground, clear badge count
      this.clearBadgeCount();
    }
  }

  // Public API
  getToken(): string | null {
    return this.currentToken;
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  getSettings(): NotificationSettings | null {
    return this.settings;
  }

  // Cleanup
  destroy(): void {
    this.backgroundMessageUnsubscribe?.();
    this.foregroundMessageUnsubscribe?.();
    this.tokenRefreshUnsubscribe?.();
    this.appStateSubscription?.remove?.();

    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeEventListener('notification');
      PushNotificationIOS.removeEventListener('localNotification');
    }

    this.isInitialized = false;
    this.handler = {};
    this.currentToken = null;
    this.settings = null;
  }
}

export default new PushNotificationService();
