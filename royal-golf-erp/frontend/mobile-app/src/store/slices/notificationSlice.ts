import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  PushNotification,
  NotificationSettings,
  NotificationFilter,
  NotificationBatch,
  RegisterDeviceRequest,
  UpdateNotificationSettingsRequest,
  SendNotificationRequest,
  MarkNotificationRequest,
  DeviceToken,
  NotificationType,
  NotificationCategory,
  LocalNotification,
  DeepLinkData,
  NotificationStatsResponse,
} from '../../types/notification';
import { api } from '../../services/api';

interface NotificationState {
  notifications: PushNotification[];
  settings: NotificationSettings | null;
  deviceToken: DeviceToken | null;
  localNotifications: LocalNotification[];
  isLoading: boolean;
  isLoadingSettings: boolean;
  isSyncing: boolean;
  error: string | null;
  unreadCount: number;
  totalCount: number;
  hasMore: boolean;
  filters: NotificationFilter;
  lastSyncTimestamp: Date | null;
  pendingDeepLink: DeepLinkData | null;
  notificationStats: NotificationStatsResponse | null;
  badgeCount: number;
  isPermissionGranted: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  settings: null,
  deviceToken: null,
  localNotifications: [],
  isLoading: false,
  isLoadingSettings: false,
  isSyncing: false,
  error: null,
  unreadCount: 0,
  totalCount: 0,
  hasMore: false,
  filters: {},
  lastSyncTimestamp: null,
  pendingDeepLink: null,
  notificationStats: null,
  badgeCount: 0,
  isPermissionGranted: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

// Async Thunks
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (filter: NotificationFilter & { offset?: number; limit?: number }) => {
    const response = await api.get<NotificationBatch>('/notifications', {
      params: filter,
    });
    return response.data;
  }
);

export const fetchNotificationSettings = createAsyncThunk(
  'notification/fetchNotificationSettings',
  async () => {
    const response = await api.get<NotificationSettings>('/notifications/settings');
    return response.data;
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notification/updateNotificationSettings',
  async (request: UpdateNotificationSettingsRequest) => {
    const response = await api.put<NotificationSettings>('/notifications/settings', request);
    return response.data;
  }
);

export const registerDevice = createAsyncThunk(
  'notification/registerDevice',
  async (request: RegisterDeviceRequest) => {
    const response = await api.post<DeviceToken>('/notifications/devices', request);
    return response.data;
  }
);

export const unregisterDevice = createAsyncThunk(
  'notification/unregisterDevice',
  async (deviceId: string) => {
    await api.delete(`/notifications/devices/${deviceId}`);
    return deviceId;
  }
);

export const markNotificationsAsRead = createAsyncThunk(
  'notification/markNotificationsAsRead',
  async (request: MarkNotificationRequest) => {
    await api.put('/notifications/mark', request);
    return request;
  }
);

export const deleteNotifications = createAsyncThunk(
  'notification/deleteNotifications',
  async (notificationIds: string[]) => {
    await api.delete('/notifications', {
      data: { notificationIds },
    });
    return notificationIds;
  }
);

export const sendNotification = createAsyncThunk(
  'notification/sendNotification',
  async (request: SendNotificationRequest) => {
    const response = await api.post<PushNotification>('/notifications/send', request);
    return response.data;
  }
);

export const fetchNotificationStats = createAsyncThunk(
  'notification/fetchNotificationStats',
  async () => {
    const response = await api.get<NotificationStatsResponse>('/notifications/stats');
    return response.data;
  }
);

export const syncNotifications = createAsyncThunk(
  'notification/syncNotifications',
  async (lastSyncTimestamp?: Date) => {
    const response = await api.get<NotificationBatch>('/notifications/sync', {
      params: { since: lastSyncTimestamp?.toISOString() },
    });
    return response.data;
  }
);

export const testNotification = createAsyncThunk(
  'notification/testNotification',
  async (type: NotificationType) => {
    const response = await api.post<PushNotification>('/notifications/test', { type });
    return response.data;
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Local notification management
    addLocalNotification: (state, action: PayloadAction<LocalNotification>) => {
      state.localNotifications.push(action.payload);
    },

    removeLocalNotification: (state, action: PayloadAction<string>) => {
      state.localNotifications = state.localNotifications.filter((n) => n.id !== action.payload);
    },

    updateLocalNotification: (state, action: PayloadAction<LocalNotification>) => {
      const index = state.localNotifications.findIndex((n) => n.id === action.payload.id);
      if (index !== -1) {
        state.localNotifications[index] = action.payload;
      }
    },

    clearLocalNotifications: (state) => {
      state.localNotifications = [];
    },

    // Real-time notification handling
    addNotification: (state, action: PayloadAction<PushNotification>) => {
      const notification = action.payload;

      // Check if notification already exists (prevent duplicates)
      const existingIndex = state.notifications.findIndex((n) => n.id === notification.id);
      if (existingIndex === -1) {
        state.notifications.unshift(notification);
        state.totalCount += 1;

        if (!notification.isRead) {
          state.unreadCount += 1;
          state.badgeCount += 1;
        }
      }
    },

    markAsRead: (state, action: PayloadAction<string[]>) => {
      const notificationIds = action.payload;

      state.notifications.forEach((notification) => {
        if (notificationIds.includes(notification.id) && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount -= 1;
          state.badgeCount = Math.max(0, state.badgeCount - 1);
        }
      });
    },

    markAsUnread: (state, action: PayloadAction<string[]>) => {
      const notificationIds = action.payload;

      state.notifications.forEach((notification) => {
        if (notificationIds.includes(notification.id) && notification.isRead) {
          notification.isRead = false;
          state.unreadCount += 1;
          state.badgeCount += 1;
        }
      });
    },

    removeNotifications: (state, action: PayloadAction<string[]>) => {
      const notificationIds = action.payload;

      notificationIds.forEach((id) => {
        const index = state.notifications.findIndex((n) => n.id === id);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.isRead) {
            state.unreadCount -= 1;
            state.badgeCount = Math.max(0, state.badgeCount - 1);
          }
          state.notifications.splice(index, 1);
          state.totalCount -= 1;
        }
      });
    },

    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.totalCount = 0;
      state.badgeCount = 0;
    },

    // Filter management
    setFilters: (state, action: PayloadAction<NotificationFilter>) => {
      state.filters = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    // Deep link handling
    setPendingDeepLink: (state, action: PayloadAction<DeepLinkData | null>) => {
      state.pendingDeepLink = action.payload;
    },

    clearPendingDeepLink: (state) => {
      state.pendingDeepLink = null;
    },

    // Badge management
    setBadgeCount: (state, action: PayloadAction<number>) => {
      state.badgeCount = Math.max(0, action.payload);
    },

    incrementBadgeCount: (state, action: PayloadAction<number>) => {
      state.badgeCount += action.payload;
    },

    decrementBadgeCount: (state, action: PayloadAction<number>) => {
      state.badgeCount = Math.max(0, state.badgeCount - action.payload);
    },

    resetBadgeCount: (state) => {
      state.badgeCount = 0;
    },

    // Permission management
    setPermissionGranted: (state, action: PayloadAction<boolean>) => {
      state.isPermissionGranted = action.payload;
    },

    // Sound and vibration settings
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },

    setVibrationEnabled: (state, action: PayloadAction<boolean>) => {
      state.vibrationEnabled = action.payload;
    },

    // Error handling
    clearError: (state) => {
      state.error = null;
    },

    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },

    // Sync timestamp
    updateLastSyncTimestamp: (state) => {
      state.lastSyncTimestamp = new Date();
    },

    // Notification interaction tracking
    recordNotificationInteraction: (
      state,
      action: PayloadAction<{ notificationId: string; action: string }>
    ) => {
      // This could be used for analytics or user behavior tracking
      const notification = state.notifications.find((n) => n.id === action.payload.notificationId);
      if (notification) {
        // Could add interaction metadata to notification
        notification.isRead = true;
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
          state.badgeCount = Math.max(0, state.badgeCount - 1);
        }
      }
    },

    // Quick actions on notifications
    snoozeNotification: (
      state,
      action: PayloadAction<{ notificationId: string; snoozeUntil: Date }>
    ) => {
      const notification = state.notifications.find((n) => n.id === action.payload.notificationId);
      if (notification) {
        // Hide notification temporarily (could be implemented with a flag)
        notification.isRead = true;
        if (state.unreadCount > 0) {
          state.unreadCount -= 1;
          state.badgeCount = Math.max(0, state.badgeCount - 1);
        }
      }
    },

    // Bulk operations
    markAllAsRead: (state) => {
      state.notifications.forEach((notification) => {
        notification.isRead = true;
      });
      state.unreadCount = 0;
      state.badgeCount = 0;
    },

    archiveOldNotifications: (state, action: PayloadAction<Date>) => {
      const cutoffDate = action.payload;
      state.notifications = state.notifications.filter((notification) => {
        const notificationDate = new Date(notification.timestamp);
        return notificationDate > cutoffDate;
      });

      // Recalculate counts
      state.unreadCount = state.notifications.filter((n) => !n.isRead).length;
      state.totalCount = state.notifications.length;
      state.badgeCount = state.unreadCount;
    },

    // Settings shortcuts
    updateQuickSettings: (
      state,
      action: PayloadAction<{
        globalEnabled?: boolean;
        soundEnabled?: boolean;
        vibrationEnabled?: boolean;
      }>
    ) => {
      if (state.settings) {
        const { globalEnabled, soundEnabled, vibrationEnabled } = action.payload;

        if (globalEnabled !== undefined) {
          state.settings.globalEnabled = globalEnabled;
        }
        if (soundEnabled !== undefined) {
          state.settings.soundSettings.enabled = soundEnabled;
          state.soundEnabled = soundEnabled;
        }
        if (vibrationEnabled !== undefined) {
          state.vibrationEnabled = vibrationEnabled;
          // Update relevant notification settings
          if (state.settings.messageNotifications) {
            state.settings.messageNotifications.vibration = vibrationEnabled;
          }
          if (state.settings.tournamentNotifications) {
            state.settings.tournamentNotifications.vibration = vibrationEnabled;
          }
          if (state.settings.bookingNotifications) {
            state.settings.bookingNotifications.vibration = vibrationEnabled;
          }
        }
      }
    },
  },

  extraReducers: (builder) => {
    // Fetch Notifications
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        const { notifications, totalCount, unreadCount, hasMore } = action.payload;

        if (action.meta.arg.offset === 0) {
          state.notifications = notifications;
        } else {
          state.notifications.push(...notifications);
        }

        state.totalCount = totalCount;
        state.unreadCount = unreadCount;
        state.hasMore = hasMore;
        state.badgeCount = unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch notifications';
      });

    // Fetch Notification Settings
    builder
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.isLoadingSettings = true;
        state.error = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.isLoadingSettings = false;
        state.settings = action.payload;
        state.soundEnabled = action.payload.soundSettings.enabled;
        state.vibrationEnabled = action.payload.messageNotifications.vibration;
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.isLoadingSettings = false;
        state.error = action.error.message || 'Failed to fetch notification settings';
      });

    // Update Notification Settings
    builder.addCase(updateNotificationSettings.fulfilled, (state, action) => {
      state.settings = action.payload;
      state.soundEnabled = action.payload.soundSettings.enabled;
      // Update other relevant settings
    });

    // Register Device
    builder.addCase(registerDevice.fulfilled, (state, action) => {
      state.deviceToken = action.payload;
    });

    // Mark Notifications as Read
    builder.addCase(markNotificationsAsRead.fulfilled, (state, action) => {
      const { notificationIds } = action.payload;
      state.notifications.forEach((notification) => {
        if (notificationIds.includes(notification.id) && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount -= 1;
          state.badgeCount = Math.max(0, state.badgeCount - 1);
        }
      });
    });

    // Delete Notifications
    builder.addCase(deleteNotifications.fulfilled, (state, action) => {
      const notificationIds = action.payload;
      notificationIds.forEach((id) => {
        const index = state.notifications.findIndex((n) => n.id === id);
        if (index !== -1) {
          const notification = state.notifications[index];
          if (!notification.isRead) {
            state.unreadCount -= 1;
            state.badgeCount = Math.max(0, state.badgeCount - 1);
          }
          state.notifications.splice(index, 1);
          state.totalCount -= 1;
        }
      });
    });

    // Fetch Notification Stats
    builder.addCase(fetchNotificationStats.fulfilled, (state, action) => {
      state.notificationStats = action.payload;
    });

    // Sync Notifications
    builder
      .addCase(syncNotifications.pending, (state) => {
        state.isSyncing = true;
      })
      .addCase(syncNotifications.fulfilled, (state, action) => {
        state.isSyncing = false;
        const { notifications, unreadCount } = action.payload;

        // Merge new notifications
        notifications.forEach((notification) => {
          const existingIndex = state.notifications.findIndex((n) => n.id === notification.id);
          if (existingIndex === -1) {
            state.notifications.unshift(notification);
          } else {
            state.notifications[existingIndex] = notification;
          }
        });

        // Sort by timestamp
        state.notifications.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        state.unreadCount = unreadCount;
        state.badgeCount = unreadCount;
        state.lastSyncTimestamp = new Date();
      })
      .addCase(syncNotifications.rejected, (state) => {
        state.isSyncing = false;
      });

    // Test Notification
    builder.addCase(testNotification.fulfilled, (state, action) => {
      // Add test notification to the list
      state.notifications.unshift(action.payload);
      state.totalCount += 1;
      if (!action.payload.isRead) {
        state.unreadCount += 1;
        state.badgeCount += 1;
      }
    });
  },
});

export const {
  addLocalNotification,
  removeLocalNotification,
  updateLocalNotification,
  clearLocalNotifications,
  addNotification,
  markAsRead,
  markAsUnread,
  removeNotifications,
  clearAllNotifications,
  setFilters,
  clearFilters,
  setPendingDeepLink,
  clearPendingDeepLink,
  setBadgeCount,
  incrementBadgeCount,
  decrementBadgeCount,
  resetBadgeCount,
  setPermissionGranted,
  setSoundEnabled,
  setVibrationEnabled,
  clearError,
  setError,
  updateLastSyncTimestamp,
  recordNotificationInteraction,
  snoozeNotification,
  markAllAsRead,
  archiveOldNotifications,
  updateQuickSettings,
} = notificationSlice.actions;

export default notificationSlice.reducer;
