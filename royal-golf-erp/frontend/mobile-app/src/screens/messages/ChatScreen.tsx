import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActionSheetIOS,
  PermissionsAndroid,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import ImagePicker from 'react-native-image-picker';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';

import { MessageBubble, TypingIndicator } from '../../components/messages';
import { LoadingOverlay } from '../../components/common';
import {
  fetchMessages,
  sendMessage,
  addOptimisticMessage,
  setCurrentConversation,
  startTyping,
  stopTyping,
  markConversationAsRead,
} from '../../store/slices/messageSlice';
import {
  Message,
  MessageType,
  Conversation,
  TypingIndicator as TypingIndicatorType,
} from '../../types/message';
import websocketService from '../../services/websocketService';

interface RootState {
  message: {
    currentConversation: Conversation | null;
    messages: Record<string, Message[]>;
    isLoadingMessages: boolean;
    isSending: boolean;
    error: string | null;
    typingIndicators: Record<string, TypingIndicatorType[]>;
    hasMoreMessages: Record<string, boolean>;
  };
  auth: {
    user: {
      id: string;
      name: string;
    };
  };
}

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { conversationId, conversationTitle } = route.params as {
    conversationId: string;
    conversationTitle: string;
  };

  const {
    currentConversation,
    messages,
    isLoadingMessages,
    isSending,
    error,
    typingIndicators,
    hasMoreMessages,
  } = useSelector((state: RootState) => state.message);

  const currentUser = useSelector((state: RootState) => state.auth.user);

  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState('00:00');

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecorderPlayer = useRef(new AudioRecorderPlayer()).current;

  const conversationMessages = messages[conversationId] || [];
  const conversationTyping = typingIndicators[conversationId] || [];

  useFocusEffect(
    useCallback(() => {
      // Set current conversation and load messages
      loadConversation();
      loadMessages();

      // Join conversation room for real-time updates
      websocketService.joinConversation(conversationId);

      return () => {
        // Leave conversation room and stop typing
        websocketService.leaveConversation(conversationId);
        if (isTyping) {
          websocketService.stopTyping(conversationId);
          dispatch(stopTyping({ conversationId, userId: currentUser.id }));
        }
      };
    }, [conversationId])
  );

  useEffect(() => {
    // Set navigation title
    navigation.setOptions({
      title: conversationTitle,
      headerRight: () => (
        <TouchableOpacity onPress={handleHeaderAction} style={styles.headerButton}>
          <Icon name="more-vert" size={24} color="#007AFF" />
        </TouchableOpacity>
      ),
    });
  }, [conversationTitle, navigation]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (conversationMessages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversationMessages.length]);

  const loadConversation = async () => {
    // This would typically fetch conversation details if needed
    // For now, we'll set the current conversation if we have it
    if (currentConversation?.id !== conversationId) {
      // dispatch(setCurrentConversation(conversationId));
    }
  };

  const loadMessages = async (loadMore = false) => {
    try {
      if (loadMore) {setLoadingMore(true);}

      const offset = loadMore ? conversationMessages.length : 0;

      await dispatch(
        fetchMessages({
          conversationId,
          limit: 50,
          offset,
        })
      );

      // Mark conversation as read
      dispatch(markConversationAsRead(conversationId));

    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() && !replyingTo) {return;}

    const content = messageText.trim();
    const tempId = `temp_${Date.now()}`;

    // Add optimistic message
    dispatch(
      addOptimisticMessage({
        tempId,
        message: {
          conversationId,
          senderId: currentUser.id,
          senderName: currentUser.name,
          content,
          type: MessageType.TEXT,
          replyTo: replyingTo?.id,
          reactions: [],
          attachments: [],
          readBy: [],
        },
      })
    );

    // Clear input and reply
    setMessageText('');
    setReplyingTo(null);

    // Stop typing indicator
    if (isTyping) {
      handleStopTyping();
    }

    try {
      // Send message
      await dispatch(
        sendMessage({
          tempId,
          conversationId,
          content,
          type: MessageType.TEXT,
          replyTo: replyingTo?.id,
        })
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  const handleMessageTextChange = (text: string) => {
    setMessageText(text);

    // Handle typing indicator
    if (text.length > 0 && !isTyping) {
      handleStartTyping();
    } else if (text.length === 0 && isTyping) {
      handleStopTyping();
    }
  };

  const handleStartTyping = () => {
    setIsTyping(true);
    websocketService.startTyping(conversationId);
    dispatch(
      startTyping({
        conversationId,
        userId: currentUser.id,
        userName: currentUser.name,
      })
    );

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000); // Stop typing after 3 seconds of inactivity
  };

  const handleStopTyping = () => {
    setIsTyping(false);
    websocketService.stopTyping(conversationId);
    dispatch(stopTyping({ conversationId, userId: currentUser.id }));

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const handleMessageLongPress = (message: Message) => {
    const isOwnMessage = message.senderId === currentUser.id;
    const options = ['Copy', 'Reply'];

    if (isOwnMessage) {
      options.push('Edit', 'Delete');
    }

    options.push('React', 'Cancel');

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: isOwnMessage ? options.indexOf('Delete') : -1,
        },
        (buttonIndex) => {
          handleMessageAction(message, options[buttonIndex]);
        }
      );
    } else {
      Alert.alert(
        'Message Options',
        '',
        options.map((option) => ({
          text: option,
          onPress: () => handleMessageAction(message, option),
          style: option === 'Delete' ? 'destructive' : 'default',
        }))
      );
    }
  };

  const handleMessageAction = (message: Message, action: string) => {
    switch (action) {
      case 'Copy':
        // Copy to clipboard
        break;
      case 'Reply':
        setReplyingTo(message);
        break;
      case 'React':
        showReactionOptions(message);
        break;
      case 'Edit':
        // Implement message editing
        break;
      case 'Delete':
        confirmDeleteMessage(message);
        break;
    }
  };

  const showReactionOptions = (message: Message) => {
    const emojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];
    Alert.alert(
      'React to Message',
      '',
      emojis
        .map((emoji) => ({
          text: emoji,
          onPress: () => handleReaction(message.id, emoji),
        }))
        .concat([{ text: 'Cancel', style: 'cancel' }])
    );
  };

  const handleReaction = (messageId: string, emoji: string) => {
    // Implement message reaction
    websocketService.reactToMessage(messageId, emoji);
  };

  const confirmDeleteMessage = (message: Message) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => handleDeleteMessage(message.id),
      },
    ]);
  };

  const handleDeleteMessage = (messageId: string) => {
    websocketService.deleteMessage(messageId);
  };

  const handleAttachment = () => {
    const options = ['Camera', 'Photo Library', 'File', 'Voice Message', 'Cancel'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: options.length - 1,
        },
        (buttonIndex) => {
          handleAttachmentOption(options[buttonIndex]);
        }
      );
    } else {
      Alert.alert(
        'Send Attachment',
        '',
        options.map((option) => ({
          text: option,
          onPress: () => handleAttachmentOption(option),
          style: option === 'Cancel' ? 'cancel' : 'default',
        }))
      );
    }
  };

  const handleAttachmentOption = async (option: string) => {
    switch (option) {
      case 'Camera':
        await openCamera();
        break;
      case 'Photo Library':
        await openImagePicker();
        break;
      case 'File':
        await openFilePicker();
        break;
      case 'Voice Message':
        await toggleVoiceRecording();
        break;
    }
  };

  const openCamera = async () => {
    const options = {
      mediaType: 'mixed' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    ImagePicker.launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        handleMediaUpload(response.assets[0]);
      }
    });
  };

  const openImagePicker = async () => {
    const options = {
      mediaType: 'mixed' as const,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
    };

    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        handleMediaUpload(response.assets[0]);
      }
    });
  };

  const openFilePicker = async () => {
    // Implement file picker
    Alert.alert('File Upload', 'File upload functionality would be implemented here');
  };

  const handleMediaUpload = async (media: any) => {
    // Implement media upload
    console.log('Media to upload:', media);
    Alert.alert('Media Upload', 'Media upload functionality would be implemented here');
  };

  const toggleVoiceRecording = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Audio recording permission is required');
          return;
        }
      }

      const audioSet = {
        AudioEncoderAndroid: 'aac',
        AudioSourceAndroid: 1,
        AVEncoderAudioQualityKeyIOS: 'high',
        AVNumberOfChannelsKeyIOS: 2,
        AVFormatIDKeyIOS: 'aac',
      };

      const path = await audioRecorderPlayer.startRecorder(undefined, audioSet);
      setIsRecording(true);
      setRecordTime('00:00');

      audioRecorderPlayer.addRecordBackListener((e) => {
        const minutes = Math.floor(e.currentPosition / 60000);
        const seconds = Math.floor((e.currentPosition % 60000) / 1000);
        setRecordTime(
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      Alert.alert('Error', 'Failed to start voice recording');
    }
  };

  const stopRecording = async () => {
    try {
      const result = await audioRecorderPlayer.stopRecorder();
      audioRecorderPlayer.removeRecordBackListener();
      setIsRecording(false);
      setRecordTime('00:00');

      // Handle voice message upload
      console.log('Voice recording result:', result);
      Alert.alert('Voice Message', 'Voice message functionality would be implemented here');

    } catch (error) {
      console.error('Failed to stop recording:', error);
      Alert.alert('Error', 'Failed to stop voice recording');
    }
  };

  const handleHeaderAction = () => {
    if (currentConversation?.type === 'group') {
      navigation.navigate('GroupChatSettings', { conversationId });
    } else {
      // Show conversation options
      Alert.alert('Conversation Options', '', [
        { text: 'Contact Info', onPress: () => {} },
        { text: 'Mute Notifications', onPress: () => {} },
        { text: 'Clear History', onPress: () => {} },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwn = item.senderId === currentUser.id;
    const previousMessage = index > 0 ? conversationMessages[index - 1] : null;
    const showTimestamp =
      !previousMessage ||
      new Date(item.timestamp).getTime() - new Date(previousMessage.timestamp).getTime() > 300000; // 5 minutes

    return (
      <MessageBubble
        message={item}
        isOwn={isOwn}
        showTimestamp={showTimestamp}
        showSenderName={currentConversation?.type === 'group' && !isOwn}
        onLongPress={handleMessageLongPress}
        onReaction={handleReaction}
        onReply={(message) => setReplyingTo(message)}
      />
    );
  };

  const renderReplyingTo = () => {
    if (!replyingTo) {return null;}

    return (
      <View style={styles.replyingContainer}>
        <View style={styles.replyingContent}>
          <Text style={styles.replyingTitle}>Replying to {replyingTo.senderName}</Text>
          <Text style={styles.replyingText} numberOfLines={1}>
            {replyingTo.content}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReplyingTo(null)}>
          <Icon name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderInputSection = () => (
    <View style={styles.inputContainer}>
      {renderReplyingTo()}
      <View style={styles.inputRow}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachment}
        >
          <Icon name="attach-file" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View style={styles.textInputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            onChangeText={handleMessageTextChange}
            placeholder="Type a message..."
            multiline
            maxLength={4000}
          />
        </View>

        {isRecording ? (
          <TouchableOpacity
            style={[styles.sendButton, styles.recordingButton]}
            onPress={toggleVoiceRecording}>
            <Text style={styles.recordingText}>{recordTime}</Text>
            <Icon name="stop" size={20} color="#fff" />
          </TouchableOpacity>
        ) : messageText.trim() ? (
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
            disabled={isSending}>
            <Icon name="send" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.voiceButton}
            onPress={toggleVoiceRecording}
          >
            <Icon name="mic" size={24} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTypingIndicator = () => {
    if (conversationTyping.length === 0) {return null;}

    return <TypingIndicator typingUsers={conversationTyping} currentUserId={currentUser.id} />;
  };

  if (isLoadingMessages && conversationMessages.length === 0) {
    return <LoadingOverlay message="Loading messages..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMoreMessages[conversationId] && !loadingMore) {
            loadMessages(true);
          }
        }}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderTypingIndicator}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      />

      {renderInputSection()}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
  },
  replyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  replyingContent: {
    flex: 1,
  },
  replyingTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  replyingText: {
    fontSize: 14,
    color: '#666',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  textInput: {
    fontSize: 16,
    color: '#000',
    maxHeight: 80,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    flexDirection: 'row',
    width: 'auto',
    paddingHorizontal: 12,
    backgroundColor: '#FF3B30',
  },
  recordingText: {
    color: '#fff',
    fontSize: 12,
    marginRight: 8,
    fontWeight: '600',
  },
  voiceButton: {
    padding: 6,
  },
});

export default ChatScreen;
