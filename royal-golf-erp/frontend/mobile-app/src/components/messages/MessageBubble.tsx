import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import { Message, MessageType, MessageStatus, MessageReaction } from '../../types/message';
import { formatTime, formatMessageDate } from '../../utils/dateHelpers';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTimestamp?: boolean;
  showSenderName?: boolean;
  onLongPress?: (message: Message) => void;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onImagePress?: (imageUrl: string) => void;
  onFilePress?: (fileUrl: string, fileName: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showTimestamp = true,
  showSenderName = false,
  onLongPress,
  onReaction,
  onReply,
  onImagePress,
  onFilePress,
}) => {
  const handleLongPress = () => {
    if (onLongPress) {
      onLongPress(message);
    } else {
      // Show default context menu
      showContextMenu();
    }
  };

  const showContextMenu = () => {
    const options = ['Copy', 'Reply'];
    if (isOwn) {
      options.push('Edit', 'Delete');
    }
    options.push('React', 'Cancel');

    Alert.alert(
      'Message Options',
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
      case 'Copy':
        // Copy to clipboard
        break;
      case 'Reply':
        onReply?.(message);
        break;
      case 'React':
        showReactionOptions();
        break;
      // Add more actions as needed
    }
  };

  const showReactionOptions = () => {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    Alert.alert(
      'React to Message',
      '',
      emojis
        .map((emoji) => ({
          text: emoji,
          onPress: () => onReaction?.(message.id, emoji),
        }))
        .concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case MessageType.TEXT:
        return renderTextContent();
      case MessageType.IMAGE:
        return renderImageContent();
      case MessageType.VIDEO:
        return renderVideoContent();
      case MessageType.AUDIO:
      case MessageType.VOICE_NOTE:
        return renderAudioContent();
      case MessageType.FILE:
        return renderFileContent();
      case MessageType.LOCATION:
        return renderLocationContent();
      case MessageType.SYSTEM:
        return renderSystemMessage();
      default:
        return renderTextContent();
    }
  };

  const renderTextContent = () => (
    <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
      {message.content}
    </Text>
  );

  const renderImageContent = () => {
    const imageAttachment = message.attachments?.[0];
    if (!imageAttachment) {
      return renderTextContent();
    }

    return (
      <TouchableOpacity onPress={() => onImagePress?.(imageAttachment.url)}>
        <Image
          source={{ uri: imageAttachment.url }}
          style={styles.imageMessage}
          resizeMode="cover"
        />
        {message.content && (
          <Text
            style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {message.content}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderVideoContent = () => {
    const videoAttachment = message.attachments?.[0];
    if (!videoAttachment) {
      return renderTextContent();
    }

    return (
      <TouchableOpacity
        style={styles.videoContainer}
        onPress={() => onFilePress?.(videoAttachment.url, videoAttachment.fileName)}>
        {videoAttachment.thumbnail ? (
          <Image
            source={{ uri: videoAttachment.thumbnail }}
            style={styles.imageMessage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.videoPlaceholder}>
            <Icon name="play-circle-outline" size={48} color="#fff" />
          </View>
        )}
        <View style={styles.videoOverlay}>
          <Icon name="play-circle-outline" size={24} color="#fff" />
          {videoAttachment.duration && (
            <Text style={styles.videoDuration}>{formatDuration(videoAttachment.duration)}</Text>
          )}
        </View>
        {message.content && (
          <Text
            style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {message.content}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderAudioContent = () => {
    const audioAttachment = message.attachments?.[0];
    if (!audioAttachment) {
      return renderTextContent();
    }

    return (
      <TouchableOpacity
        style={styles.audioContainer}
        onPress={() => onFilePress?.(audioAttachment.url, audioAttachment.fileName)}>
        <Icon
          name={message.type === MessageType.VOICE_NOTE ? 'mic' : 'audiotrack'}
          size={24}
          color={isOwn ? '#fff' : '#007AFF'}
        />
        <Text style={[styles.audioText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
          {message.type === MessageType.VOICE_NOTE ? 'Voice message' : audioAttachment.fileName}
        </Text>
        {audioAttachment.duration && (
          <Text
            style={[styles.audioDuration, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {formatDuration(audioAttachment.duration)}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderFileContent = () => {
    const fileAttachment = message.attachments?.[0];
    if (!fileAttachment) {
      return renderTextContent();
    }

    return (
      <TouchableOpacity
        style={styles.fileContainer}
        onPress={() => onFilePress?.(fileAttachment.url, fileAttachment.fileName)}>
        <Icon name="attach-file" size={24} color={isOwn ? '#fff' : '#007AFF'} />
        <View style={styles.fileInfo}>
          <Text
            style={[styles.fileName, isOwn ? styles.ownMessageText : styles.otherMessageText]}
            numberOfLines={1}>
            {fileAttachment.fileName}
          </Text>
          <Text style={[styles.fileSize, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {formatFileSize(fileAttachment.fileSize)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLocationContent = () => (
    <TouchableOpacity style={styles.locationContainer}>
      <Icon name="place" size={24} color={isOwn ? '#fff' : '#007AFF'} />
      <Text style={[styles.messageText, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
        Location shared
      </Text>
    </TouchableOpacity>
  );

  const renderSystemMessage = () => (
    <View style={styles.systemMessageContainer}>
      <Text style={styles.systemMessageText}>{message.content}</Text>
    </View>
  );

  const renderReplyTo = () => {
    if (!message.replyTo) {
      return null;
    }

    // In a real implementation, you'd fetch the replied message
    return (
      <View style={styles.replyContainer}>
        <View style={styles.replyLine} />
        <Text style={styles.replyText} numberOfLines={1}>
          Replying to a message
        </Text>
      </View>
    );
  };

  const renderReactions = () => {
    if (!message.reactions || message.reactions.length === 0) {
      return null;
    }

    // Group reactions by emoji
    const groupedReactions = message.reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = [];
      }
      acc[reaction.emoji].push(reaction);
      return acc;
    }, {} as Record<string, MessageReaction[]>);

    return (
      <View style={styles.reactionsContainer}>
        {Object.entries(groupedReactions).map(([emoji, reactions]) => (
          <TouchableOpacity
            key={emoji}
            style={styles.reactionBubble}
            onPress={() => onReaction?.(message.id, emoji)}>
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            <Text style={styles.reactionCount}>{reactions.length}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderMessageStatus = () => {
    if (!isOwn) {
      return null;
    }

    let iconName = '';
    let iconColor = '#999';

    switch (message.status) {
      case MessageStatus.SENDING:
        iconName = 'schedule';
        iconColor = '#999';
        break;
      case MessageStatus.SENT:
        iconName = 'done';
        iconColor = '#999';
        break;
      case MessageStatus.DELIVERED:
        iconName = 'done-all';
        iconColor = '#999';
        break;
      case MessageStatus.READ:
        iconName = 'done-all';
        iconColor = '#007AFF';
        break;
      case MessageStatus.FAILED:
        iconName = 'error';
        iconColor = '#FF3B30';
        break;
    }

    return <Icon name={iconName} size={16} color={iconColor} style={styles.statusIcon} />;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {
      return '0 Bytes';
    }
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (message.type === MessageType.SYSTEM) {
    return renderSystemMessage();
  }

  return (
    <View style={[styles.container, isOwn ? styles.ownMessage : styles.otherMessage]}>
      {showSenderName && !isOwn && <Text style={styles.senderName}>{message.senderName}</Text>}

      <TouchableOpacity
        style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}
        onLongPress={handleLongPress}
        delayLongPress={500}>
        {renderReplyTo()}
        {renderMessageContent()}

        <View style={styles.messageFooter}>
          {showTimestamp && (
            <Text style={[styles.timestamp, isOwn ? styles.ownTimestamp : styles.otherTimestamp]}>
              {formatTime(message.timestamp)}
              {message.edited && ' (edited)'}
            </Text>
          )}
          {renderMessageStatus()}
        </View>
      </TouchableOpacity>

      {renderReactions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 2,
    marginHorizontal: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    marginLeft: 8,
  },
  bubble: {
    maxWidth: width * 0.8,
    padding: 12,
    borderRadius: 18,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E5E5EA',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    marginRight: 4,
  },
  ownTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTimestamp: {
    color: '#666',
  },
  statusIcon: {
    marginLeft: 2,
  },
  replyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
  },
  replyLine: {
    width: 3,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginRight: 8,
  },
  replyText: {
    fontSize: 14,
    fontStyle: 'italic',
    opacity: 0.7,
  },
  imageMessage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  videoContainer: {
    position: 'relative',
  },
  videoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  videoOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  videoDuration: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
  },
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
  },
  audioText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  audioDuration: {
    fontSize: 12,
    marginLeft: 8,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 200,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 8,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  fileSize: {
    fontSize: 12,
    opacity: 0.7,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  systemMessageContainer: {
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    marginLeft: 8,
  },
  reactionBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  reactionEmoji: {
    fontSize: 14,
  },
  reactionCount: {
    fontSize: 12,
    marginLeft: 4,
    color: '#666',
  },
});

export default MessageBubble;
