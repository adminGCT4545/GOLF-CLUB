import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { Conversation, ConversationType, MessageType } from '../../types/message';
import { formatMessageDate, formatTime } from '../../utils/dateHelpers';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface ConversationItemProps {
  conversation: Conversation;
  onPress: (conversation: Conversation) => void;
  onLongPress?: (conversation: Conversation) => void;
  onArchive?: (conversationId: string, isArchived: boolean) => void;
  onMute?: (conversationId: string, isMuted: boolean) => void;
  onDelete?: (conversationId: string) => void;
  showOnlineStatus?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  onPress,
  onLongPress,
  onArchive,
  onMute,
  onDelete,
  showOnlineStatus = true,
}) => {
  const handlePress = () => {
    onPress(conversation);
  };

  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(conversation);
    } else {
      showContextMenu();
    }
  };

  const showContextMenu = () => {
    const options = [];

    options.push(conversation.isMuted ? 'Unmute' : 'Mute');
    options.push(conversation.isArchived ? 'Unarchive' : 'Archive');

    if (conversation.type === ConversationType.GROUP) {
      options.push('Group Info');
    }

    options.push('Delete', 'Cancel');

    Alert.alert(
      conversation.name || getConversationTitle(),
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
      case 'Mute':
        onMute?.(conversation.id, true);
        break;
      case 'Unmute':
        onMute?.(conversation.id, false);
        break;
      case 'Archive':
        onArchive?.(conversation.id, true);
        break;
      case 'Unarchive':
        onArchive?.(conversation.id, false);
        break;
      case 'Delete':
        confirmDelete();
        break;
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(conversation.id),
        },
      ]
    );
  };

  const getConversationTitle = (): string => {
    if (conversation.name) {
      return conversation.name;
    }

    if (conversation.type === ConversationType.DIRECT) {
      // For direct messages, show the other participant's name
      const otherParticipant = conversation.participants.find((p) => p.userId !== 'currentUserId'); // Replace with actual current user ID
      return otherParticipant?.userName || 'Unknown User';
    }

    if (conversation.type === ConversationType.GROUP) {
      // For group chats without a name, show participant names
      const participantNames = conversation.participants
        .slice(0, 3)
        .map((p) => p.userName.split(' ')[0]) // Get first name only
        .join(', ');

      if (conversation.participants.length > 3) {
        return `${participantNames} and ${conversation.participants.length - 3} others`;
      }

      return participantNames;
    }

    return 'Conversation';
  };

  const getLastMessagePreview = (): string => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }

    const { lastMessage } = conversation;

    switch (lastMessage.type) {
      case MessageType.TEXT:
        return lastMessage.content;
      case MessageType.IMAGE:
        return '📷 Photo';
      case MessageType.VIDEO:
        return '🎥 Video';
      case MessageType.AUDIO:
      case MessageType.VOICE_NOTE:
        return '🎵 Audio message';
      case MessageType.FILE:
        return '📎 File';
      case MessageType.LOCATION:
        return '📍 Location';
      case MessageType.SYSTEM:
        return lastMessage.content;
      default:
        return 'Message';
    }
  };

  const getConversationAvatar = () => {
    if (conversation.avatar) {
      return <Image source={{ uri: conversation.avatar }} style={styles.avatar} />;
    }

    if (conversation.type === ConversationType.DIRECT) {
      const otherParticipant = conversation.participants.find((p) => p.userId !== 'currentUserId');
      if (otherParticipant?.userAvatar) {
        return <Image source={{ uri: otherParticipant.userAvatar }} style={styles.avatar} />;
      }
    }

    // Default avatar
    return (
      <View style={[styles.avatar, styles.defaultAvatar]}>
        <Icon
          name={conversation.type === ConversationType.GROUP ? 'group' : 'person'}
          size={24}
          color="#fff"
        />
      </View>
    );
  };

  const getOnlineStatus = () => {
    if (!showOnlineStatus || conversation.type !== ConversationType.DIRECT) {
      return null;
    }

    const otherParticipant = conversation.participants.find((p) => p.userId !== 'currentUserId');
    if (!otherParticipant?.isOnline) {
      return null;
    }

    return <View style={styles.onlineIndicator} />;
  };

  const getTypingIndicator = () => {
    if (!conversation.isTyping || conversation.isTyping.length === 0) {
      return null;
    }

    const typingUsers = conversation.isTyping.length;
    const typingText = typingUsers === 1 ? 'typing...' : `${typingUsers} people typing...`;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, styles.typingDot1]} />
          <View style={[styles.typingDot, styles.typingDot2]} />
          <View style={[styles.typingDot, styles.typingDot3]} />
        </View>
        <Text style={styles.typingText}>{typingText}</Text>
      </View>
    );
  };

  const formatLastMessageTime = () => {
    if (!conversation.lastMessage) {
      return '';
    }

    const messageDate = new Date(conversation.lastMessage.timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatTime(conversation.lastMessage.timestamp);
    } else {
      return formatMessageDate(conversation.lastMessage.timestamp);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        conversation.unreadCount > 0 && styles.unreadContainer,
        conversation.isArchived && styles.archivedContainer,
      ]}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={500}>
      <View style={styles.avatarContainer}>
        {getConversationAvatar()}
        {getOnlineStatus()}
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text
            style={[styles.title, conversation.unreadCount > 0 && styles.unreadTitle]}
            numberOfLines={1}>
            {getConversationTitle()}
          </Text>

          <View style={styles.rightHeader}>
            {conversation.isMuted && (
              <Icon name="volume-off" size={16} color="#999" style={styles.muteIcon} />
            )}

            <Text style={styles.timestamp}>{formatLastMessageTime()}</Text>
          </View>
        </View>

        <View style={styles.messageRow}>
          <View style={styles.messagePreview}>
            {getTypingIndicator() || (
              <Text
                style={[styles.lastMessage, conversation.unreadCount > 0 && styles.unreadMessage]}
                numberOfLines={1}>
                {conversation.lastMessage?.senderId !== 'currentUserId' &&
                  conversation.type === ConversationType.GROUP && (
                    <Text style={styles.senderName}>
                      {conversation.lastMessage?.senderName.split(' ')[0]}:
                    </Text>
                  )}
                {getLastMessagePreview()}
              </Text>
            )}
          </View>

          {conversation.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>
                {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  unreadContainer: {
    backgroundColor: '#FAFAFA',
  },
  archivedContainer: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  unreadTitle: {
    fontWeight: '600',
  },
  rightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  muteIcon: {
    marginRight: 4,
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagePreview: {
    flex: 1,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    color: '#000',
    fontWeight: '500',
  },
  senderName: {
    fontWeight: '500',
    color: '#007AFF',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 6,
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#007AFF',
    marginHorizontal: 1,
  },
  typingDot1: {
    // Animation would be added here
  },
  typingDot2: {
    // Animation would be added here
  },
  typingDot3: {
    // Animation would be added here
  },
  typingText: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
});

export default ConversationItem;
