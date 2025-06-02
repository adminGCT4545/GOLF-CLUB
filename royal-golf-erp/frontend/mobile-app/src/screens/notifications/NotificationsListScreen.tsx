import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { NotificationItem } from '../../components/notifications';
import { LoadingOverlay } from '../../components/common';
import {
  fetchNotifications,
  markNotificationsAsRead,
  deleteNotifications,
  setFilters,
  clearFilters,
  markAllAsRead,
  archiveOldNotifications,
} from '../../store/slices/notificationSlice';
import {
  PushNotification,
  NotificationFilter,
  NotificationType,
  NotificationCategory,
} from '../../types/notification';

interface RootState {
  notification: {
    notifications: PushNotification[];
    isLoading: boolean;
    error: string | null;
    unreadCount: number;
    totalCount: number;
    hasMore: boolean;
    filters: NotificationFilter;
  };
}

const NotificationsListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { notifications, isLoading, error, unreadCount, totalCount, hasMore, filters } =
    useSelector((state: RootState) => state.notification);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'unread' | 'messages' | 'tournaments' | 'bookings'
  >('all');

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter((notification) => {
    switch (activeFilter) {
      case 'unread':
        return !notification.isRead;
      case 'messages':
        return notification.type === NotificationType.MESSAGE;
      case 'tournaments':
        return notification.type === NotificationType.TOURNAMENT;
      case 'bookings':
        return notification.type === NotificationType.BOOKING;
      default:
        return true;
    }
  });

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  useEffect(() => {
    // Set navigation header with action buttons
    navigation.setOptions({
      title: 'Notifications',
      headerRight: () => (
        <View style={styles.headerActions}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity onPress={handleSelectAll} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelSelection} style={styles.headerButton}>
                <Text style={styles.headerButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.headerButton}>
                <Icon name="done-all" size={24} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSettings} style={styles.headerButton}>
                <Icon name="settings" size={24} color="#007AFF" />
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [isSelectionMode, selectedNotifications, navigation]);

  const loadNotifications = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }

      await dispatch(
        fetchNotifications({
          ...filters,
          offset: refresh ? 0 : notifications.length,
          limit: 20,
        })
      );
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreNotifications = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    try {
      await dispatch(
        fetchNotifications({
          ...filters,
          offset: notifications.length,
          limit: 20,
        })
      );
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleNotificationPress = async (notification: PushNotification) => {
    if (isSelectionMode) {
      handleNotificationSelection(notification.id);
      return;
    }

    // Mark as read if unread
    if (!notification.isRead) {
      dispatch(markNotificationsAsRead({ notificationIds: [notification.id] }));
    }

    // Handle deep link navigation
    if (notification.deepLink) {
      try {
        const deepLinkData = JSON.parse(notification.deepLink);
        navigation.navigate(deepLinkData.screen, deepLinkData.params);
      } catch (error) {
        console.error('Failed to parse deep link:', error);
      }
    }
  };

  const handleNotificationLongPress = (notification: PushNotification) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedNotifications([notification.id]);
    }
  };

  const handleNotificationSelection = (notificationId: string) => {
    if (selectedNotifications.includes(notificationId)) {
      setSelectedNotifications((prev) => prev.filter((id) => id !== notificationId));
    } else {
      setSelectedNotifications((prev) => [...prev, notificationId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map((n) => n.id));
    }
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedNotifications([]);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await dispatch(markNotificationsAsRead({ notificationIds: [notificationId] }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      Alert.alert('Error', 'Failed to mark notification as read.');
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert('Delete Notification', 'Are you sure you want to delete this notification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => performDelete([notificationId]),
      },
    ]);
  };

  const performDelete = async (notificationIds: string[]) => {
    try {
      await dispatch(deleteNotifications(notificationIds));
    } catch (error) {
      console.error('Failed to delete notifications:', error);
      Alert.alert('Error', 'Failed to delete notifications.');
    }
  };

  const handleMarkAllAsRead = () => {
    Alert.alert('Mark All as Read', 'Are you sure you want to mark all notifications as read?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark All',
        onPress: () => dispatch(markAllAsRead()),
      },
    ]);
  };

  const handleSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter);

    const filterOptions: NotificationFilter = {};

    switch (filter) {
      case 'unread':
        filterOptions.isRead = false;
        break;
      case 'messages':
        filterOptions.types = [NotificationType.MESSAGE];
        break;
      case 'tournaments':
        filterOptions.types = [NotificationType.TOURNAMENT];
        break;
      case 'bookings':
        filterOptions.types = [NotificationType.BOOKING];
        break;
      default:
        break;
    }

    dispatch(setFilters(filterOptions));
  };

  const handleBulkActions = () => {
    if (selectedNotifications.length === 0) {
      return;
    }

    const options = ['Mark as Read', 'Delete', 'Cancel'];

    Alert.alert(
      `${selectedNotifications.length} notifications selected`,
      '',
      options.map((option) => ({
        text: option,
        onPress: () => handleBulkAction(option),
        style: option === 'Delete' ? 'destructive' : 'default',
      }))
    );
  };

  const handleBulkAction = async (action: string) => {
    switch (action) {
      case 'Mark as Read':
        await dispatch(markNotificationsAsRead({ notificationIds: selectedNotifications }));
        break;
      case 'Delete':
        Alert.alert(
          'Delete Notifications',
          `Are you sure you want to delete ${selectedNotifications.length} notifications?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => performDelete(selectedNotifications),
            },
          ]
        );
        return;
    }

    setIsSelectionMode(false);
    setSelectedNotifications([]);
  };

  const renderNotificationItem = ({ item }: { item: PushNotification }) => (
    <View
      style={[
        styles.notificationWrapper,
        selectedNotifications.includes(item.id) && styles.selectedNotification,
      ]}>
      {isSelectionMode && (
        <TouchableOpacity
          style={styles.selectionButton}
          onPress={() => handleNotificationSelection(item.id)}>
          <Icon
            name={
              selectedNotifications.includes(item.id) ? 'check-circle' : 'radio-button-unchecked'
            }
            size={24}
            color={selectedNotifications.includes(item.id) ? '#007AFF' : '#999'}
          />
        </TouchableOpacity>
      )}

      <NotificationItem
        notification={item}
        onPress={handleNotificationPress}
        onLongPress={handleNotificationLongPress}
        onMarkAsRead={handleMarkAsRead}
        onDelete={handleDelete}
        showActions={!isSelectionMode}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {totalCount} notifications
          {unreadCount > 0 && ` • ${unreadCount} unread`}
        </Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'all' && styles.activeFilter]}
          onPress={() => handleFilterChange('all')}>
          <Text style={[styles.filterText, activeFilter === 'all' && styles.activeFilterText]}>
            All
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'unread' && styles.activeFilter]}
          onPress={() => handleFilterChange('unread')}>
          <Text style={[styles.filterText, activeFilter === 'unread' && styles.activeFilterText]}>
            Unread
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'messages' && styles.activeFilter]}
          onPress={() => handleFilterChange('messages')}>
          <Text style={[styles.filterText, activeFilter === 'messages' && styles.activeFilterText]}>
            Messages
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'tournaments' && styles.activeFilter]}
          onPress={() => handleFilterChange('tournaments')}>
          <Text
            style={[styles.filterText, activeFilter === 'tournaments' && styles.activeFilterText]}>
            Tournaments
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'bookings' && styles.activeFilter]}
          onPress={() => handleFilterChange('bookings')}>
          <Text style={[styles.filterText, activeFilter === 'bookings' && styles.activeFilterText]}>
            Bookings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="notifications-none" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No notifications</Text>
      <Text style={styles.emptyMessage}>
        {activeFilter === 'unread'
          ? "You're all caught up! No unread notifications."
          : "You don't have any notifications yet."}
      </Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) {
      return null;
    }
    return (
      <View style={styles.loadingMore}>
        <Text style={styles.loadingText}>Loading more...</Text>
      </View>
    );
  };

  if (isLoading && notifications.length === 0) {
    return <LoadingOverlay message="Loading notifications..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        data={filteredNotifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreNotifications}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadNotifications(true)}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      {isSelectionMode && selectedNotifications.length > 0 && (
        <View style={styles.bottomActionBar}>
          <Text style={styles.selectedCount}>{selectedNotifications.length} selected</Text>
          <TouchableOpacity style={styles.actionButton} onPress={handleBulkActions}>
            <Text style={styles.actionButtonText}>Actions</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
  },
  activeFilter: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#fff',
  },
  notificationWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedNotification: {
    backgroundColor: '#E3F2FD',
  },
  selectionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  bottomActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  selectedCount: {
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default NotificationsListScreen;
