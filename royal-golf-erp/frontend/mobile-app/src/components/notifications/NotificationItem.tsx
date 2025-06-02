import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { PushNotification, NotificationType, NotificationPriority } from '../../types/notification';
import { formatNotificationTime } from '../../utils/dateHelpers';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface NotificationItemProps {
  notification: PushNotification;
  onPress?: (notification: PushNotification) => void;
  onLongPress?: (notification: PushNotification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  showActions?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onLongPress,
  onMarkAsRead,
  onDelete,
  showActions = true,
}) => {
  const handlePress = () => {
    if (!notification.isRead) {
      onMarkAsRead?.(notification.id);
    }
    onPress?.(notification);
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(notification);
    } else {
      showContextMenu();
    }
  };

  const showContextMenu = () => {
    const options = [notification.isRead ? 'Mark as Unread' : 'Mark as Read', 'Delete', 'Cancel'];

    Alert.alert(
      'Notification Options',
      '',
      options.map((option) => ({
        text: option,
        onPress: () => handleContextMenuAction(option),
        style: option === 'Delete' ? 'destructive' : 'default',
      }))
    );
  };

  const handleContextMenuAction = (action: string) => {
    switch (action) {
      case 'Mark as Read':
        onMarkAsRead?.(notification.id);
        break;
      case 'Mark as Unread':
        // This would require a mark as unread function
        break;
      case 'Delete':
        confirmDelete();
        break;
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(notification.id),
      },
    ]);
  };

  const getNotificationIcon = (): string => {
    switch (notification.type) {
      case NotificationType.MESSAGE:
        return 'message';
      case NotificationType.TOURNAMENT:
        return 'emoji-events';
      case NotificationType.BOOKING:
        return 'event';
      case NotificationType.SOCIAL:
        return 'people';
      case NotificationType.SYSTEM:
        return 'info';
      case NotificationType.PROMOTION:
        return 'local-offer';
      case NotificationType.REMINDER:
        return 'alarm';
      case NotificationType.URGENT:
        return 'priority-high';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (): string => {
    switch (notification.type) {
      case NotificationType.MESSAGE:
        return '#007AFF';
      case NotificationType.TOURNAMENT:
        return '#FF9500';
      case NotificationType.BOOKING:
        return '#34C759';
      case NotificationType.SOCIAL:
        return '#AF52DE';
      case NotificationType.SYSTEM:
        return '#8E8E93';
      case NotificationType.PROMOTION:
        return '#FF3B30';
      case NotificationType.REMINDER:
        return '#FF9500';
      case NotificationType.URGENT:
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityIndicator = () => {
    if (
      notification.priority === NotificationPriority.HIGH ||
      notification.priority === NotificationPriority.CRITICAL
    ) {
      return <View style={[styles.priorityIndicator, { backgroundColor: '#FF3B30' }]} />;
    }
    return null;
  };

  const renderNotificationImage = () => {
    if (!notification.imageUrl) {
      return null;
    }

    return (
      <Image
        source={{ uri: notification.imageUrl }}
        style={styles.notificationImage}
        resizeMode="cover"
      />
    );
  };

  const renderActions = () => {
    if (!showActions || !notification.actions || notification.actions.length === 0) {
      return null;
    }

    return (
      <View style={styles.actionsContainer}>
        {notification.actions.slice(0, 2).map((action, index) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionButton, action.destructive && styles.destructiveAction]}
            onPress={() => handleActionPress(action.id)}>
            <Text style={[styles.actionText, action.destructive && styles.destructiveActionText]}>
              {action.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleActionPress = (actionId: string) => {
    // Handle notification action
    console.log('Notification action pressed:', actionId);
    // This would be handled by the parent component or a notification service
  };

  const formatRelativeTime = (timestamp: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    }
    if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m ago`;
    }
    if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    }
    if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    return formatNotificationTime(timestamp);
  };

  const isExpired = (): boolean => {
    if (!notification.expiresAt) {
      return false;
    }
    return new Date() > new Date(notification.expiresAt);
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.isRead && styles.unreadContainer,
        isExpired() && styles.expiredContainer,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <View style={styles.iconContainer}>
            <View style={[styles.iconBackground, { backgroundColor: getNotificationColor() }]}>
              <Icon name={getNotificationIcon()} size={20} color="#fff" />
            </View>
            {getPriorityIndicator()}
          </View>

          <View style={styles.headerContent}>
            <Text
              style={[styles.title, !notification.isRead && styles.unreadTitle]}
              numberOfLines={1}>
              {notification.title}
            </Text>

            <Text style={styles.timestamp}>{formatRelativeTime(notification.timestamp)}</Text>
          </View>

          {!notification.isRead && <View style={styles.unreadIndicator} />}
        </View>

        <Text style={[styles.body, !notification.isRead && styles.unreadBody]} numberOfLines={3}>
          {notification.body}
        </Text>

        {renderNotificationImage()}
        {renderActions()}

        {isExpired() && (
          <View style={styles.expiredBanner}>
            <Icon name="schedule" size={16} color="#FF9500" />
            <Text style={styles.expiredText}>Expired</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unreadContainer: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  expiredContainer: {
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  headerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    marginTop: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 8,
  },
  unreadBody: {
    color: '#333',
  },
  notificationImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginVertical: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  destructiveAction: {
    backgroundColor: '#FF3B30',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  destructiveActionText: {
    color: '#fff',
  },
  expiredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  expiredText: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default NotificationItem;
