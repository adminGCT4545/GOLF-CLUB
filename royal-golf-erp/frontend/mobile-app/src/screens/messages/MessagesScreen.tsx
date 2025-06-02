import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { ConversationItem } from '../../components/messages';
import { LoadingOverlay } from '../../components/common';
import {
  fetchConversations,
  setSearchQuery,
  setFilters,
  archiveConversation,
  muteConversation,
  markConversationAsRead,
  leaveConversation,
} from '../../store/slices/messageSlice';
import { Conversation, ConversationFilter, ConversationType } from '../../types/message';
import websocketService from '../../services/websocketService';

interface RootState {
  message: {
    conversations: Conversation[];
    isLoadingConversations: boolean;
    error: string | null;
    searchQuery: string;
    filters: ConversationFilter;
    hasMoreConversations: boolean;
    unreadCount: number;
  };
}

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const {
    conversations,
    isLoadingConversations,
    error,
    searchQuery,
    filters,
    hasMoreConversations,
    unreadCount,
  } = useSelector((state: RootState) => state.message);

  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'archived'>('all');

  // Filter conversations based on current filter and search
  const filteredConversations = conversations.filter((conversation) => {
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesTitle =
        conversation.name?.toLowerCase().includes(query) ||
        conversation.participants.some((p) => p.userName.toLowerCase().includes(query));
      const matchesLastMessage = conversation.lastMessage?.content.toLowerCase().includes(query);

      if (!matchesTitle && !matchesLastMessage) {
        return false;
      }
    }

    // Apply active filter
    switch (activeFilter) {
      case 'unread':
        return conversation.unreadCount > 0;
      case 'archived':
        return conversation.isArchived;
      default:
        return !conversation.isArchived;
    }
  });

  useFocusEffect(
    useCallback(() => {
      // Connect to websocket when screen is focused
      websocketService.connect();
      loadConversations();

      return () => {
        // Cleanup if needed
      };
    }, [])
  );

  useEffect(() => {
    // Set up websocket event handlers
    const handleMessage = (message: any) => {
      // Message will be handled by the store through websocket events
    };

    const handleConversationUpdate = (conversation: Conversation) => {
      // Conversation update will be handled by the store
    };

    return () => {
      // Cleanup websocket listeners if needed
    };
  }, []);

  const loadConversations = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }

      await dispatch(
        fetchConversations({
          ...filters,
          offset: refresh ? 0 : conversations.length,
          limit: 20,
        })
      );
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadMoreConversations = async () => {
    if (loadingMore || !hasMoreConversations) {
      return;
    }

    setLoadingMore(true);
    try {
      await dispatch(
        fetchConversations({
          ...filters,
          offset: conversations.length,
          limit: 20,
        })
      );
    } catch (error) {
      console.error('Failed to load more conversations:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleConversationPress = (conversation: Conversation) => {
    // Mark as read when entering conversation
    if (conversation.unreadCount > 0) {
      dispatch(markConversationAsRead(conversation.id));
    }

    navigation.navigate('Chat', {
      conversationId: conversation.id,
      conversationTitle: getConversationTitle(conversation),
    });
  };

  const handleConversationLongPress = (conversation: Conversation) => {
    showConversationOptions(conversation);
  };

  const showConversationOptions = (conversation: Conversation) => {
    const options = [
      conversation.unreadCount > 0 ? 'Mark as Read' : 'Mark as Unread',
      conversation.isMuted ? 'Unmute' : 'Mute',
      conversation.isArchived ? 'Unarchive' : 'Archive',
    ];

    if (conversation.type === ConversationType.GROUP) {
      options.push('Group Info');
    }

    options.push('Delete', 'Cancel');

    Alert.alert(
      getConversationTitle(conversation),
      '',
      options.map((option) => ({
        text: option,
        onPress: () => handleConversationAction(conversation, option),
        style: option === 'Delete' ? 'destructive' : 'default',
      }))
    );
  };

  const handleConversationAction = async (conversation: Conversation, action: string) => {
    try {
      switch (action) {
        case 'Mark as Read':
          if (conversation.unreadCount > 0) {
            await dispatch(markConversationAsRead(conversation.id));
          }
          break;
        case 'Mark as Unread':
          // Would need to implement mark as unread functionality
          break;
        case 'Mute':
          await dispatch(
            muteConversation({
              conversationId: conversation.id,
              isMuted: true,
            })
          );
          break;
        case 'Unmute':
          await dispatch(
            muteConversation({
              conversationId: conversation.id,
              isMuted: false,
            })
          );
          break;
        case 'Archive':
          await dispatch(
            archiveConversation({
              conversationId: conversation.id,
              isArchived: true,
            })
          );
          break;
        case 'Unarchive':
          await dispatch(
            archiveConversation({
              conversationId: conversation.id,
              isArchived: false,
            })
          );
          break;
        case 'Group Info':
          navigation.navigate('GroupChatSettings', {
            conversationId: conversation.id,
          });
          break;
        case 'Delete':
          confirmDeleteConversation(conversation);
          break;
      }
    } catch (error) {
      console.error('Failed to perform conversation action:', error);
      Alert.alert('Error', 'Failed to perform action. Please try again.');
    }
  };

  const confirmDeleteConversation = (conversation: Conversation) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${getConversationTitle(
        conversation
      )}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDeleteConversation(conversation.id),
        },
      ]
    );
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      await dispatch(leaveConversation(conversationId));
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    }
  };

  const getConversationTitle = (conversation: Conversation): string => {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.type === ConversationType.DIRECT) {
      const otherParticipant = conversation.participants.find((p) => p.userId !== 'currentUserId');
      return otherParticipant?.userName || 'Unknown User';
    }

    const participantNames = conversation.participants
      .slice(0, 3)
      .map((p) => p.userName.split(' ')[0])
      .join(', ');

    if (conversation.participants.length > 3) {
      return `${participantNames} and ${conversation.participants.length - 3} others`;
    }

    return participantNames;
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  const handleFilterChange = (filter: 'all' | 'unread' | 'archived') => {
    setActiveFilter(filter);

    const filterOptions: ConversationFilter = {};

    switch (filter) {
      case 'archived':
        filterOptions.showArchived = true;
        break;
      case 'unread':
        // This would be handled in the filtering logic above
        break;
    }

    dispatch(setFilters(filterOptions));
  };

  const handleNewMessage = () => {
    navigation.navigate('NewMessage');
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <ConversationItem
      conversation={item}
      onPress={handleConversationPress}
      onLongPress={handleConversationLongPress}
      showOnlineStatus={true}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={styles.headerButton}>
            <Icon name="search" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNewMessage} style={styles.headerButton}>
            <Icon name="add" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="clear" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      )}

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
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterButton, activeFilter === 'archived' && styles.activeFilter]}
          onPress={() => handleFilterChange('archived')}>
          <Text style={[styles.filterText, activeFilter === 'archived' && styles.activeFilterText]}>
            Archived
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="message" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyMessage}>Start a conversation by tapping the + button above</Text>
      <TouchableOpacity style={styles.startButton} onPress={handleNewMessage}>
        <Text style={styles.startButtonText}>Start Messaging</Text>
      </TouchableOpacity>
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

  if (isLoadingConversations && conversations.length === 0) {
    return <LoadingOverlay message="Loading conversations..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        data={filteredConversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={renderFooter}
        onEndReached={loadMoreConversations}
        onEndReachedThreshold={0.1}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadConversations(true)}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <TouchableOpacity style={styles.fab} onPress={handleNewMessage}>
        <Icon name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  list: {
    flex: 1,
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    marginLeft: 16,
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
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
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingMore: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default MessagesScreen;
