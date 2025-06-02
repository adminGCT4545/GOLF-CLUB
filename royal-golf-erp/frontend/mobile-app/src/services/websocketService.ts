import io, { Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';
import {
  WSEvent,
  Message,
  TypingIndicator,
  OnlinePresence,
  MessageStatus,
  ConversationType,
} from '../types/message';
import { PushNotification } from '../types/notification';
import { WS_BASE_URL } from '../constants/config';

interface WebSocketCallbacks {
  onMessage?: (message: Message) => void;
  onTyping?: (typing: TypingIndicator) => void;
  onPresence?: (presence: OnlinePresence) => void;
  onMessageStatus?: (status: { messageId: string; status: MessageStatus; timestamp: Date }) => void;
  onConversationUpdate?: (conversation: any) => void;
  onNotification?: (notification: PushNotification) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: any) => void;
  onReconnect?: () => void;
}

class EnhancedWebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private encryptionKey: string | null = null;
  private messageQueue: Array<{ event: string; data: any }> = [];
  private isConnecting = false;
  private currentUserId: string | null = null;
  private joinedRooms: Set<string> = new Set();

  // Connection Management
  async connect(callbacks?: WebSocketCallbacks): Promise<void> {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    this.isConnecting = true;
    this.callbacks = { ...this.callbacks, ...callbacks };

    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      const encryptionKey = await AsyncStorage.getItem('encryptionKey');

      if (!token) {
        throw new Error('No auth token available for WebSocket connection');
      }

      this.currentUserId = userId;
      this.encryptionKey = encryptionKey;

      this.socket = io(WS_BASE_URL, {
        auth: {
          token,
          userId,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: this.maxReconnectAttempts,
        timeout: 20000,
        forceNew: true,
        transports: ['websocket', 'polling'],
      });

      this.setupListeners();
      this.isConnecting = false;
    } catch (error) {
      this.isConnecting = false;
      console.error('Failed to connect to WebSocket:', error);
      this.callbacks.onError?.(error);
      throw error;
    }
  }

  private setupListeners(): void {
    if (!this.socket) {
      return;
    }

    // Connection events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('reconnect', this.handleReconnect.bind(this));
    this.socket.on('error', this.handleError.bind(this));

    // Message events
    this.socket.on('message', this.handleMessage.bind(this));
    this.socket.on('message_status', this.handleMessageStatus.bind(this));
    this.socket.on('typing', this.handleTyping.bind(this));
    this.socket.on('stop_typing', this.handleStopTyping.bind(this));
    this.socket.on('presence', this.handlePresence.bind(this));
    this.socket.on('conversation_updated', this.handleConversationUpdate.bind(this));

    // Notification events
    this.socket.on('notification', this.handleNotification.bind(this));

    // Tournament events (existing)
    this.socket.on('tournament-update', this.handleTournamentUpdate.bind(this));
    this.socket.on('leaderboard-update', this.handleLeaderboardUpdate.bind(this));
    this.socket.on('score-update', this.handleScoreUpdate.bind(this));
    this.socket.on('tournament-status-change', this.handleTournamentStatusChange.bind(this));

    // Booking events (existing)
    this.socket.on('booking-update', this.handleBookingUpdate.bind(this));

    // System events
    this.socket.on('heartbeat', this.handleHeartbeat.bind(this));
    this.socket.on('user_joined', this.handleUserJoined.bind(this));
    this.socket.on('user_left', this.handleUserLeft.bind(this));
  }

  // Event Handlers
  private handleConnect(): void {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    this.callbacks.onConnect?.();

    // Start heartbeat
    this.startHeartbeat();

    // Process queued messages
    this.processMessageQueue();

    // Rejoin rooms
    this.rejoinRooms();

    // Update presence
    this.updatePresence('online');
  }

  private handleDisconnect(reason: string): void {
    console.log('WebSocket disconnected:', reason);
    this.callbacks.onDisconnect?.(reason);
    this.stopHeartbeat();

    // Update presence to offline
    this.updatePresence('offline');
  }

  private handleReconnect(): void {
    console.log('WebSocket reconnected');
    this.callbacks.onReconnect?.();
    this.rejoinRooms();
  }

  private handleError(error: any): void {
    console.error('WebSocket error:', error);
    this.callbacks.onError?.(error);
  }

  private handleMessage(data: any): void {
    try {
      const message: Message = this.decryptMessage(data);
      this.callbacks.onMessage?.(message);
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  private handleMessageStatus(data: {
    messageId: string;
    status: MessageStatus;
    timestamp: string;
  }): void {
    this.callbacks.onMessageStatus?.({
      messageId: data.messageId,
      status: data.status,
      timestamp: new Date(data.timestamp),
    });
  }

  private handleTyping(data: TypingIndicator): void {
    // Only handle typing from other users
    if (data.userId !== this.currentUserId) {
      this.callbacks.onTyping?.(data);

      // Auto-stop typing after 3 seconds
      const key = `${data.conversationId}-${data.userId}`;
      if (this.typingTimers.has(key)) {
        clearTimeout(this.typingTimers.get(key)!);
      }

      const timer = setTimeout(() => {
        this.handleStopTyping({
          conversationId: data.conversationId,
          userId: data.userId,
        });
        this.typingTimers.delete(key);
      }, 3000);

      this.typingTimers.set(key, timer);
    }
  }

  private handleStopTyping(data: { conversationId: string; userId: string }): void {
    // Clear typing timer
    const key = `${data.conversationId}-${data.userId}`;
    if (this.typingTimers.has(key)) {
      clearTimeout(this.typingTimers.get(key)!);
      this.typingTimers.delete(key);
    }
  }

  private handlePresence(data: OnlinePresence): void {
    this.callbacks.onPresence?.(data);
  }

  private handleConversationUpdate(data: any): void {
    this.callbacks.onConversationUpdate?.(data);
  }

  private handleNotification(data: PushNotification): void {
    this.callbacks.onNotification?.(data);
  }

  private handleHeartbeat(): void {
    this.emit('heartbeat', { timestamp: Date.now() });
  }

  private handleUserJoined(data: { userId: string; conversationId: string }): void {
    console.log('User joined conversation:', data);
  }

  private handleUserLeft(data: { userId: string; conversationId: string }): void {
    console.log('User left conversation:', data);
  }

  // Tournament event handlers (existing functionality)
  private handleTournamentUpdate(data: any): void {
    console.log('Tournament update:', data);
    // Existing tournament logic
  }

  private handleLeaderboardUpdate(data: any): void {
    console.log('Leaderboard update:', data);
    // Existing leaderboard logic
  }

  private handleScoreUpdate(data: any): void {
    console.log('Score update:', data);
    // Existing score logic
  }

  private handleTournamentStatusChange(data: any): void {
    console.log('Tournament status change:', data);
    // Existing tournament status logic
  }

  private handleBookingUpdate(data: any): void {
    console.log('Booking update:', data);
    // Existing booking logic
  }

  // Message Operations
  sendMessage(
    conversationId: string,
    content: string,
    type: string = 'text',
    replyTo?: string
  ): void {
    const messageData = {
      conversationId,
      content: this.encryptContent(content),
      type,
      replyTo,
      timestamp: new Date().toISOString(),
    };

    this.emit('send_message', messageData);
  }

  editMessage(messageId: string, newContent: string): void {
    this.emit('edit_message', {
      messageId,
      content: this.encryptContent(newContent),
      timestamp: new Date().toISOString(),
    });
  }

  deleteMessage(messageId: string): void {
    this.emit('delete_message', { messageId });
  }

  reactToMessage(messageId: string, emoji: string): void {
    this.emit('message_reaction', { messageId, emoji });
  }

  markMessageAsRead(messageId: string): void {
    this.emit('mark_read', { messageId });
  }

  // Typing Indicators
  startTyping(conversationId: string): void {
    this.emit('typing', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.emit('stop_typing', { conversationId });
  }

  // Presence Management
  updatePresence(status: 'online' | 'away' | 'busy' | 'offline'): void {
    this.emit('presence', { status, timestamp: new Date().toISOString() });
  }

  // Conversation Management
  joinConversation(conversationId: string): void {
    this.emit('join_conversation', { conversationId });
    this.joinedRooms.add(conversationId);
  }

  leaveConversation(conversationId: string): void {
    this.emit('leave_conversation', { conversationId });
    this.joinedRooms.delete(conversationId);
  }

  createConversation(type: ConversationType, participantIds: string[], name?: string): void {
    this.emit('create_conversation', {
      type,
      participantIds,
      name,
    });
  }

  addParticipants(conversationId: string, participantIds: string[]): void {
    this.emit('add_participants', { conversationId, participantIds });
  }

  removeParticipant(conversationId: string, participantId: string): void {
    this.emit('remove_participant', { conversationId, participantId });
  }

  updateGroupSettings(conversationId: string, settings: any): void {
    this.emit('update_group_settings', { conversationId, settings });
  }

  // File Upload Events
  uploadFile(conversationId: string, fileData: any): void {
    this.emit('upload_file', { conversationId, fileData });
  }

  // Voice Message Events
  sendVoiceMessage(conversationId: string, audioData: any, duration: number): void {
    this.emit('voice_message', {
      conversationId,
      audioData,
      duration,
      timestamp: new Date().toISOString(),
    });
  }

  // Utility Methods
  private emit(event: string, data: any): void {
    if (this.isConnected()) {
      this.socket!.emit(event, data);
    } else {
      // Queue message for later
      this.messageQueue.push({ event, data });
      console.warn(`WebSocket not connected. Queued event: ${event}`);
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const { event, data } = this.messageQueue.shift()!;
      this.socket!.emit(event, data);
    }
  }

  private rejoinRooms(): void {
    this.joinedRooms.forEach((conversationId) => {
      this.joinConversation(conversationId);
    });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.emit('heartbeat', { timestamp: Date.now() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Encryption/Decryption
  private encryptContent(content: string): string {
    if (!this.encryptionKey) {
      return content;
    }
    try {
      return CryptoJS.AES.encrypt(content, this.encryptionKey).toString();
    } catch (error) {
      console.error('Failed to encrypt content:', error);
      return content;
    }
  }

  private decryptMessage(data: any): Message {
    if (data.encryptedContent && this.encryptionKey) {
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(data.encryptedContent, this.encryptionKey);
        data.content = decryptedBytes.toString(CryptoJS.enc.Utf8);
      } catch (error) {
        console.error('Failed to decrypt message:', error);
      }
    }
    return data;
  }

  // Connection Status
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getConnectionState(): string {
    if (!this.socket) {
      return 'disconnected';
    }
    return this.socket.connected ? 'connected' : 'disconnected';
  }

  // Cleanup
  disconnect(): void {
    this.updatePresence('offline');
    this.stopHeartbeat();

    // Clear all timers
    this.typingTimers.forEach((timer) => clearTimeout(timer));
    this.typingTimers.clear();

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.joinedRooms.clear();
    this.messageQueue = [];
    this.callbacks = {};
    this.isConnecting = false;
  }

  // Event Listener Management
  on(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  once(event: string, callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }

  // Tournament Methods (existing functionality)
  joinTournamentRoom(tournamentId: string): void {
    this.emit('join-tournament', { tournamentId });
  }

  leaveTournamentRoom(tournamentId: string): void {
    this.emit('leave-tournament', { tournamentId });
  }

  subscribeToLeaderboard(tournamentId: string, callback: (data: any) => void): void {
    this.on(`leaderboard-${tournamentId}`, callback);
    this.joinTournamentRoom(tournamentId);
  }

  unsubscribeFromLeaderboard(tournamentId: string, callback?: (data: any) => void): void {
    this.off(`leaderboard-${tournamentId}`, callback);
    this.leaveTournamentRoom(tournamentId);
  }

  submitScore(tournamentId: string, playerId: string, scoreData: any): void {
    this.emit('submit-score', {
      tournamentId,
      playerId,
      scoreData,
    });
  }

  // Statistics
  getConnectionStats(): {
    isConnected: boolean;
    reconnectAttempts: number;
    queuedMessages: number;
    joinedRooms: number;
  } {
    return {
      isConnected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      joinedRooms: this.joinedRooms.size,
    };
  }
}

export default new EnhancedWebSocketService();
