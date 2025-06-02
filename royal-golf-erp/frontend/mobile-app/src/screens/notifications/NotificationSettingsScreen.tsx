import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import { LoadingOverlay } from '../../components/common';
import {
  fetchNotificationSettings,
  updateNotificationSettings,
  updateQuickSettings,
} from '../../store/slices/notificationSlice';
import { NotificationSettings, DayOfWeek, ReminderTiming } from '../../types/notification';

interface RootState {
  notification: {
    settings: NotificationSettings | null;
    isLoadingSettings: boolean;
    error: string | null;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
}

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const {
    settings,
    isLoadingSettings,
    error,
    soundEnabled: globalSoundEnabled,
    vibrationEnabled: globalVibrationEnabled,
  } = useSelector((state: RootState) => state.notification);

  const [localSettings, setLocalSettings] = useState<NotificationSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (settings) {
      setLocalSettings({ ...settings });
    }
  }, [settings]);

  const loadSettings = async () => {
    try {
      await dispatch(fetchNotificationSettings());
    } catch (error) {
      console.error('Failed to load notification settings:', error);
      Alert.alert('Error', 'Failed to load notification settings.');
    }
  };

  const saveSettings = async () => {
    if (!localSettings) {
      return;
    }

    setSaving(true);
    try {
      await dispatch(updateNotificationSettings({ settings: localSettings }));
      Alert.alert('Success', 'Notification settings updated successfully');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      Alert.alert('Error', 'Failed to save notification settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateLocalSetting = (path: string[], value: any) => {
    if (!localSettings) {
      return;
    }

    const newSettings = { ...localSettings };
    let current: any = newSettings;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }

    current[path[path.length - 1]] = value;
    setLocalSettings(newSettings);
  };

  const handleGlobalToggle = (enabled: boolean) => {
    updateLocalSetting(['globalEnabled'], enabled);
    dispatch(updateQuickSettings({ globalEnabled: enabled }));
  };

  const handleSoundToggle = (enabled: boolean) => {
    updateLocalSetting(['soundSettings', 'enabled'], enabled);
    dispatch(updateQuickSettings({ soundEnabled: enabled }));
  };

  const handleVibrationToggle = (enabled: boolean) => {
    updateLocalSetting(['messageNotifications', 'vibration'], enabled);
    updateLocalSetting(['tournamentNotifications', 'vibration'], enabled);
    updateLocalSetting(['bookingNotifications', 'vibration'], enabled);
    dispatch(updateQuickSettings({ vibrationEnabled: enabled }));
  };

  const handleQuietHoursToggle = (enabled: boolean) => {
    updateLocalSetting(['quietHours', 'enabled'], enabled);
  };

  const handleQuietHoursDayToggle = (day: DayOfWeek) => {
    if (!localSettings?.quietHours) {
      return;
    }

    const currentDays = localSettings.quietHours.days;
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d) => d !== day)
      : [...currentDays, day];

    updateLocalSetting(['quietHours', 'days'], newDays);
  };

  const handleTimeSelection = (time: Date, isStartTime: boolean) => {
    const timeString = time.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });

    if (isStartTime) {
      updateLocalSetting(['quietHours', 'startTime'], timeString);
      setShowStartTimePicker(false);
    } else {
      updateLocalSetting(['quietHours', 'endTime'], timeString);
      setShowEndTimePicker(false);
    }
  };

  const getDayName = (day: DayOfWeek): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  };

  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderSettingItem = (
    title: string,
    subtitle?: string,
    value?: boolean,
    onToggle?: (value: boolean) => void,
    onPress?: () => void,
    rightComponent?: React.ReactNode
  ) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress} disabled={!onPress}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent ||
        (onToggle && (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
            thumbColor="#fff"
          />
        ))}
    </TouchableOpacity>
  );

  if (isLoadingSettings) {
    return <LoadingOverlay message="Loading notification settings..." />;
  }

  if (!localSettings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load notification settings</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadSettings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (saving) {
    return <LoadingOverlay message="Saving settings..." />;
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      {/* Global Settings */}
      {renderSection(
        'General',
        <>
          {renderSettingItem(
            'Allow Notifications',
            'Enable or disable all notifications',
            localSettings.globalEnabled,
            handleGlobalToggle
          )}

          {renderSettingItem(
            'Sound',
            'Play sound for notifications',
            globalSoundEnabled,
            handleSoundToggle
          )}

          {renderSettingItem(
            'Vibration',
            'Vibrate for notifications',
            globalVibrationEnabled,
            handleVibrationToggle
          )}
        </>
      )}

      {/* Message Notifications */}
      {renderSection(
        'Messages',
        <>
          {renderSettingItem(
            'Message Notifications',
            'Notifications for new messages',
            localSettings.messageNotifications.enabled,
            (value) => updateLocalSetting(['messageNotifications', 'enabled'], value)
          )}

          {localSettings.messageNotifications.enabled && (
            <>
              {renderSettingItem(
                'Direct Messages',
                'One-on-one conversations',
                localSettings.messageNotifications.directMessages,
                (value) => updateLocalSetting(['messageNotifications', 'directMessages'], value)
              )}

              {renderSettingItem(
                'Group Messages',
                'Group conversations',
                localSettings.messageNotifications.groupMessages,
                (value) => updateLocalSetting(['messageNotifications', 'groupMessages'], value)
              )}

              {renderSettingItem(
                'Mentions',
                'When you are mentioned in a message',
                localSettings.messageNotifications.mentions,
                (value) => updateLocalSetting(['messageNotifications', 'mentions'], value)
              )}

              {renderSettingItem(
                'Reactions',
                'When someone reacts to your message',
                localSettings.messageNotifications.reactions,
                (value) => updateLocalSetting(['messageNotifications', 'reactions'], value)
              )}

              {renderSettingItem(
                'Show Message Preview',
                'Display message content in notifications',
                localSettings.messageNotifications.showPreview,
                (value) => updateLocalSetting(['messageNotifications', 'showPreview'], value)
              )}
            </>
          )}
        </>
      )}

      {/* Tournament Notifications */}
      {renderSection(
        'Tournaments',
        <>
          {renderSettingItem(
            'Tournament Notifications',
            'Updates about tournaments',
            localSettings.tournamentNotifications.enabled,
            (value) => updateLocalSetting(['tournamentNotifications', 'enabled'], value)
          )}

          {localSettings.tournamentNotifications.enabled && (
            <>
              {renderSettingItem(
                'Registration Open',
                'When tournament registration opens',
                localSettings.tournamentNotifications.registrationOpen,
                (value) =>
                  updateLocalSetting(['tournamentNotifications', 'registrationOpen'], value)
              )}

              {renderSettingItem(
                'Registration Deadline',
                'Reminders about registration deadlines',
                localSettings.tournamentNotifications.registrationDeadline,
                (value) =>
                  updateLocalSetting(['tournamentNotifications', 'registrationDeadline'], value)
              )}

              {renderSettingItem(
                'Tournament Start',
                'When tournaments are starting',
                localSettings.tournamentNotifications.tournamentStart,
                (value) => updateLocalSetting(['tournamentNotifications', 'tournamentStart'], value)
              )}

              {renderSettingItem(
                'Leaderboard Updates',
                'Real-time leaderboard changes',
                localSettings.tournamentNotifications.leaderboardUpdates,
                (value) =>
                  updateLocalSetting(['tournamentNotifications', 'leaderboardUpdates'], value)
              )}

              {renderSettingItem(
                'Results',
                'Final tournament results',
                localSettings.tournamentNotifications.results,
                (value) => updateLocalSetting(['tournamentNotifications', 'results'], value)
              )}
            </>
          )}
        </>
      )}

      {/* Booking Notifications */}
      {renderSection(
        'Bookings',
        <>
          {renderSettingItem(
            'Booking Notifications',
            'Updates about your bookings',
            localSettings.bookingNotifications.enabled,
            (value) => updateLocalSetting(['bookingNotifications', 'enabled'], value)
          )}

          {localSettings.bookingNotifications.enabled && (
            <>
              {renderSettingItem(
                'Confirmations',
                'Booking confirmation notifications',
                localSettings.bookingNotifications.confirmations,
                (value) => updateLocalSetting(['bookingNotifications', 'confirmations'], value)
              )}

              {renderSettingItem(
                'Reminders',
                'Upcoming booking reminders',
                localSettings.bookingNotifications.reminders,
                (value) => updateLocalSetting(['bookingNotifications', 'reminders'], value)
              )}

              {renderSettingItem(
                'Cancellations',
                'Booking cancellation notifications',
                localSettings.bookingNotifications.cancellations,
                (value) => updateLocalSetting(['bookingNotifications', 'cancellations'], value)
              )}

              {renderSettingItem(
                'Modifications',
                'Booking change notifications',
                localSettings.bookingNotifications.modifications,
                (value) => updateLocalSetting(['bookingNotifications', 'modifications'], value)
              )}

              {renderSettingItem(
                'Waitlist Updates',
                'Updates about waitlist status',
                localSettings.bookingNotifications.waitlistUpdates,
                (value) => updateLocalSetting(['bookingNotifications', 'waitlistUpdates'], value)
              )}
            </>
          )}
        </>
      )}

      {/* Quiet Hours */}
      {renderSection(
        'Quiet Hours',
        <>
          {renderSettingItem(
            'Enable Quiet Hours',
            'Silence notifications during specified hours',
            localSettings.quietHours.enabled,
            handleQuietHoursToggle
          )}

          {localSettings.quietHours.enabled && (
            <>
              {renderSettingItem(
                'Start Time',
                formatTime(localSettings.quietHours.startTime),
                undefined,
                undefined,
                () => setShowStartTimePicker(true)
              )}

              {renderSettingItem(
                'End Time',
                formatTime(localSettings.quietHours.endTime),
                undefined,
                undefined,
                () => setShowEndTimePicker(true)
              )}

              <View style={styles.daysContainer}>
                <Text style={styles.daysTitle}>Active Days</Text>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayItem,
                      localSettings.quietHours.days.includes(day) && styles.dayItemSelected,
                    ]}
                    onPress={() => handleQuietHoursDayToggle(day)}>
                    <Text
                      style={[
                        styles.dayText,
                        localSettings.quietHours.days.includes(day) && styles.dayTextSelected,
                      ]}>
                      {getDayName(day)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {renderSettingItem(
                'Allow Urgent Notifications',
                'Allow critical notifications during quiet hours',
                localSettings.quietHours.allowUrgent,
                (value) => updateLocalSetting(['quietHours', 'allowUrgent'], value)
              )}
            </>
          )}
        </>
      )}

      {/* Save Button */}
      <View style={styles.saveContainer}>
        <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Time Pickers */}
      <DateTimePickerModal
        isVisible={showStartTimePicker}
        mode="time"
        onConfirm={(time) => handleTimeSelection(time, true)}
        onCancel={() => setShowStartTimePicker(false)}
      />

      <DateTimePickerModal
        isVisible={showEndTimePicker}
        mode="time"
        onConfirm={(time) => handleTimeSelection(time, false)}
        onCancel={() => setShowEndTimePicker(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  daysContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  daysTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginBottom: 12,
  },
  dayItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F2F2F7',
  },
  dayItemSelected: {
    backgroundColor: '#007AFF',
  },
  dayText: {
    fontSize: 14,
    color: '#000',
  },
  dayTextSelected: {
    color: '#fff',
    fontWeight: '500',
  },
  saveContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationSettingsScreen;
