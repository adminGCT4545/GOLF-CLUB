import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Conversation,
  Message,
  ConversationFilter,
  MessageFilter,
  ConversationsResponse,
  MessagesResponse,
  CreateConversationRequest,
  SendMessageRequest,
  UpdateGroupSettingsRequest,
  AddParticipantsRequest,
  RemoveParticipantRequest,
  UpdateParticipantRoleRequest,
  TypingIndicator,
  OnlinePresence,
  MessageQueue,
  MessageStatus,
  WSEvent,
} from '../../types/message';
import { api } from '../../services/api';

interface MessageState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  messages: Record<string, Message[]>; // conversationId -> messages
  typingIndicators: Record<string, TypingIndicator[]>; // conversationId -> typing users
  onlinePresence: Record<string, OnlinePresence>; // userId -> presence
  messageQueue: MessageQueue[]; // Offline message queue
  isLoading: boolean;
  isLoadingMessages: boolean;
  isLoadingConversations: boolean;
  isSending: boolean;
  error: string | null;
  searchQuery: string;
  filters: ConversationFilter;
  hasMoreConversations: boolean;
  hasMoreMessages: Record<string, boolean>; // conversationId -> hasMore
  lastMessageTimestamp: Record<string, Date>; // conversationId -> timestamp
  unreadCount: number;
  encryptionKey: string | null;
}

const initialState: MessageState = {
  conversations: [],
  currentConversation: null,
  messages: {},
  typingIndicators: {},
  onlinePresence: {},
  messageQueue: [],
  isLoading: false,
  isLoadingMessages: false,
  isLoadingConversations: false,
  isSending: false,
  error: null,
  searchQuery: '',
  filters: {},
  hasMoreConversations: false,
  hasMoreMessages: {},
  lastMessageTimestamp: {},
  unreadCount: 0,
  encryptionKey: null,
};

// Async Thunks
export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (filters: ConversationFilter & { offset?: number; limit?: number }) => {
    const response = await api.get<ConversationsResponse>('/conversations', {
      params: filters,
    });
    return response.data;
  }
);

export const fetchMessages = createAsyncThunk(
  'message/fetchMessages',
  async (filter: MessageFilter) => {
    const response = await api.get<MessagesResponse>(
      `/conversations/${filter.conversationId}/messages`,
      {
        params: filter,
      }
    );
    return { conversationId: filter.conversationId, ...response.data };
  }
);

export const createConversation = createAsyncThunk(
  'message/createConversation',
  async (request: CreateConversationRequest) => {
    const response = await api.post<Conversation>('/conversations', request);
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async (request: SendMessageRequest & { tempId: string }) => {
    const response = await api.post<Message>(
      `/conversations/${request.conversationId}/messages`,
      request
    );
    return { tempId: request.tempId, message: response.data };
  }
);

export const editMessage = createAsyncThunk(
  'message/editMessage',
  async ({ messageId, content }: { messageId: string; content: string }) => {
    const response = await api.put<Message>(`/messages/${messageId}`, { content });
    return response.data;
  }
);

export const deleteMessage = createAsyncThunk(
  'message/deleteMessage',
  async (messageId: string) => {
    await api.delete(`/messages/${messageId}`);
    return messageId;
  }
);

export const reactToMessage = createAsyncThunk(
  'message/reactToMessage',
  async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
    const response = await api.post<Message>(`/messages/${messageId}/reactions`, { emoji });
    return response.data;
  }
);

export const markConversationAsRead = createAsyncThunk(
  'message/markConversationAsRead',
  async (conversationId: string) => {
    await api.put(`/conversations/${conversationId}/read`);
    return conversationId;
  }
);

export const archiveConversation = createAsyncThunk(
  'message/archiveConversation',
  async ({ conversationId, isArchived }: { conversationId: string; isArchived: boolean }) => {
    await api.put(`/conversations/${conversationId}/archive`, { isArchived });
    return { conversationId, isArchived };
  }
);

export const muteConversation = createAsyncThunk(
  'message/muteConversation',
  async ({
    conversationId,
    isMuted,
    muteUntil,
  }: {
    conversationId: string;
    isMuted: boolean;
    muteUntil?: Date;
  }) => {
    await api.put(`/conversations/${conversationId}/mute`, { isMuted, muteUntil });
    return { conversationId, isMuted, muteUntil };
  }
);

export const updateGroupSettings = createAsyncThunk(
  'message/updateGroupSettings',
  async (request: UpdateGroupSettingsRequest) => {
    const response = await api.put<Conversation>(
      `/conversations/${request.conversationId}/settings`,
      request
    );
    return response.data;
  }
);

export const addParticipants = createAsyncThunk(
  'message/addParticipants',
  async (request: AddParticipantsRequest) => {
    const response = await api.post<Conversation>(
      `/conversations/${request.conversationId}/participants`,
      request
    );
    return response.data;
  }
);

export const removeParticipant = createAsyncThunk(
  'message/removeParticipant',
  async (request: RemoveParticipantRequest) => {
    const response = await api.delete<Conversation>(
      `/conversations/${request.conversationId}/participants/${request.participantId}`
    );
    return response.data;
  }
);

export const updateParticipantRole = createAsyncThunk(
  'message/updateParticipantRole',
  async (request: UpdateParticipantRoleRequest) => {
    const response = await api.put<Conversation>(
      `/conversations/${request.conversationId}/participants/${request.participantId}/role`,
      request
    );
    return response.data;
  }
);

export const leaveConversation = createAsyncThunk(
  'message/leaveConversation',
  async (conversationId: string) => {
    await api.delete(`/conversations/${conversationId}/leave`);
    return conversationId;
  }
);

export const searchMessages = createAsyncThunk(
  'message/searchMessages',
  async ({ query, conversationId }: { query: string; conversationId?: string }) => {
    const response = await api.get<MessagesResponse>('/messages/search', {
      params: { query, conversationId },
    });
    return response.data;
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    setCurrentConversation: (state, action: PayloadAction<Conversation | null>) => {
      state.currentConversation = action.payload;
      if (action.payload) {
        // Mark conversation as read when opened
        const conversation = state.conversations.find((c) => c.id === action.payload?.id);
        if (conversation) {
          conversation.unreadCount = 0;
        }
      }
    },

    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setFilters: (state, action: PayloadAction<ConversationFilter>) => {
      state.filters = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Real-time message handling
    handleWebSocketEvent: (state, action: PayloadAction<WSEvent>) => {
      const event = action.payload;

      switch (event.type) {
        case 'message':
          const message = event.data;
          const conversationId = message.conversationId;

          if (!state.messages[conversationId]) {
            state.messages[conversationId] = [];
          }

          // Check if message already exists (prevent duplicates)
          const existingMessageIndex = state.messages[conversationId].findIndex(
            (m) => m.id === message.id
          );
          if (existingMessageIndex === -1) {
            state.messages[conversationId].push(message);
            state.messages[conversationId].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
          }

          // Update conversation last message and unread count
          const conversation = state.conversations.find((c) => c.id === conversationId);
          if (conversation) {
            conversation.lastMessage = message;
            conversation.updatedAt = message.timestamp;
            if (state.currentConversation?.id !== conversationId) {
              conversation.unreadCount += 1;
              state.unreadCount += 1;
            }
          }
          break;

        case 'typing':
          const typingData = event.data;
          if (!state.typingIndicators[typingData.conversationId]) {
            state.typingIndicators[typingData.conversationId] = [];
          }

          const existingTyping = state.typingIndicators[typingData.conversationId].find(
            (t) => t.userId === typingData.userId
          );
          if (!existingTyping) {
            state.typingIndicators[typingData.conversationId].push(typingData);
          }
          break;

        case 'presence':
          const presenceData = event.data;
          state.onlinePresence[presenceData.userId] = presenceData;

          // Update online status in conversations
          state.conversations.forEach((conversation) => {
            const participant = conversation.participants.find(
              (p) => p.userId === presenceData.userId
            );
            if (participant) {
              participant.isOnline = presenceData.isOnline;
              participant.lastSeenAt = presenceData.lastSeen;
            }
          });
          break;

        case 'message_status':
          const statusData = event.data;
          Object.values(state.messages).forEach((messages) => {
            const message = messages.find((m) => m.id === statusData.messageId);
            if (message) {
              message.status = statusData.status;
            }
          });
          break;

        case 'conversation_updated':
          const updatedConversation = event.data;
          const conversationIndex = state.conversations.findIndex(
            (c) => c.id === updatedConversation.id
          );
          if (conversationIndex !== -1) {
            state.conversations[conversationIndex] = updatedConversation;
          } else {
            state.conversations.unshift(updatedConversation);
          }

          if (state.currentConversation?.id === updatedConversation.id) {
            state.currentConversation = updatedConversation;
          }
          break;
      }
    },

    // Typing indicators
    startTyping: (
      state,
      action: PayloadAction<{ conversationId: string; userId: string; userName: string }>
    ) => {
      const { conversationId, userId, userName } = action.payload;
      if (!state.typingIndicators[conversationId]) {
        state.typingIndicators[conversationId] = [];
      }

      const existing = state.typingIndicators[conversationId].find((t) => t.userId === userId);
      if (!existing) {
        state.typingIndicators[conversationId].push({
          conversationId,
          userId,
          userName,
          timestamp: new Date(),
        });
      }
    },

    stopTyping: (state, action: PayloadAction<{ conversationId: string; userId: string }>) => {
      const { conversationId, userId } = action.payload;
      if (state.typingIndicators[conversationId]) {
        state.typingIndicators[conversationId] = state.typingIndicators[conversationId].filter(
          (t) => t.userId !== userId
        );
      }
    },

    clearTypingIndicators: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      if (state.typingIndicators[conversationId]) {
        state.typingIndicators[conversationId] = [];
      }
    },

    // Offline message queue
    addToMessageQueue: (
      state,
      action: PayloadAction<Omit<MessageQueue, 'id' | 'timestamp' | 'retryCount'>>
    ) => {
      const queueItem: MessageQueue = {
        id: Date.now().toString(),
        ...action.payload,
        retryCount: 0,
        timestamp: new Date(),
      };
      state.messageQueue.push(queueItem);
    },

    removeFromMessageQueue: (state, action: PayloadAction<string>) => {
      state.messageQueue = state.messageQueue.filter((item) => item.id !== action.payload);
    },

    incrementRetryCount: (state, action: PayloadAction<string>) => {
      const item = state.messageQueue.find((item) => item.id === action.payload);
      if (item) {
        item.retryCount += 1;
      }
    },

    clearMessageQueue: (state) => {
      state.messageQueue = [];
    },

    // Encryption
    setEncryptionKey: (state, action: PayloadAction<string>) => {
      state.encryptionKey = action.payload;
    },

    // Optimistic updates for sending messages
    addOptimisticMessage: (
      state,
      action: PayloadAction<{
        tempId: string;
        message: Omit<Message, 'id' | 'timestamp' | 'status'>;
      }>
    ) => {
      const { tempId, message } = action.payload;
      const conversationId = message.conversationId;

      if (!state.messages[conversationId]) {
        state.messages[conversationId] = [];
      }

      const optimisticMessage: Message = {
        id: tempId,
        ...message,
        timestamp: new Date(),
        status: MessageStatus.SENDING,
      };

      state.messages[conversationId].push(optimisticMessage);

      // Update conversation last message
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (conversation) {
        conversation.lastMessage = optimisticMessage;
        conversation.updatedAt = optimisticMessage.timestamp;
      }
    },

    updateMessageStatus: (
      state,
      action: PayloadAction<{ messageId: string; status: MessageStatus }>
    ) => {
      const { messageId, status } = action.payload;
      Object.values(state.messages).forEach((messages) => {
        const message = messages.find((m) => m.id === messageId);
        if (message) {
          message.status = status;
        }
      });
    },
  },

  extraReducers: (builder) => {
    // Fetch Conversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.isLoadingConversations = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoadingConversations = false;
        const { conversations, hasMore } = action.payload;

        if (action.meta.arg.offset === 0) {
          state.conversations = conversations;
        } else {
          state.conversations.push(...conversations);
        }

        state.hasMoreConversations = hasMore;
        state.unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoadingConversations = false;
        state.error = action.error.message || 'Failed to fetch conversations';
      });

    // Fetch Messages
    builder
      .addCase(fetchMessages.pending, (state) => {
        state.isLoadingMessages = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoadingMessages = false;
        const { conversationId, messages, hasMore } = action.payload;

        if (action.meta.arg.offset === 0) {
          state.messages[conversationId] = messages;
        } else {
          const existingMessages = state.messages[conversationId] || [];
          state.messages[conversationId] = [...messages, ...existingMessages];
        }

        state.hasMoreMessages[conversationId] = hasMore;

        if (messages.length > 0) {
          state.lastMessageTimestamp[conversationId] = messages[0].timestamp;
        }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoadingMessages = false;
        state.error = action.error.message || 'Failed to fetch messages';
      });

    // Send Message
    builder
      .addCase(sendMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isSending = false;
        const { tempId, message } = action.payload;
        const conversationId = message.conversationId;

        if (state.messages[conversationId]) {
          const tempMessageIndex = state.messages[conversationId].findIndex((m) => m.id === tempId);
          if (tempMessageIndex !== -1) {
            // Replace temporary message with actual message
            state.messages[conversationId][tempMessageIndex] = message;
          }
        }

        // Update conversation last message
        const conversation = state.conversations.find((c) => c.id === conversationId);
        if (conversation) {
          conversation.lastMessage = message;
          conversation.updatedAt = message.timestamp;
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.error.message || 'Failed to send message';

        // Update failed message status
        const tempId = action.meta.arg.tempId;
        Object.values(state.messages).forEach((messages) => {
          const message = messages.find((m) => m.id === tempId);
          if (message) {
            message.status = MessageStatus.FAILED;
          }
        });
      });

    // Create Conversation
    builder.addCase(createConversation.fulfilled, (state, action) => {
      state.conversations.unshift(action.payload);
      state.currentConversation = action.payload;
    });

    // Mark as Read
    builder.addCase(markConversationAsRead.fulfilled, (state, action) => {
      const conversationId = action.payload;
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (conversation) {
        state.unreadCount -= conversation.unreadCount;
        conversation.unreadCount = 0;
      }
    });

    // Archive Conversation
    builder.addCase(archiveConversation.fulfilled, (state, action) => {
      const { conversationId, isArchived } = action.payload;
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (conversation) {
        conversation.isArchived = isArchived;
      }
    });

    // Mute Conversation
    builder.addCase(muteConversation.fulfilled, (state, action) => {
      const { conversationId, isMuted, muteUntil } = action.payload;
      const conversation = state.conversations.find((c) => c.id === conversationId);
      if (conversation) {
        conversation.isMuted = isMuted;
        conversation.muteUntil = muteUntil;
      }
    });

    // Update Group Settings
    builder.addCase(updateGroupSettings.fulfilled, (state, action) => {
      const updatedConversation = action.payload;
      const index = state.conversations.findIndex((c) => c.id === updatedConversation.id);
      if (index !== -1) {
        state.conversations[index] = updatedConversation;
      }
      if (state.currentConversation?.id === updatedConversation.id) {
        state.currentConversation = updatedConversation;
      }
    });

    // Leave Conversation
    builder.addCase(leaveConversation.fulfilled, (state, action) => {
      const conversationId = action.payload;
      state.conversations = state.conversations.filter((c) => c.id !== conversationId);
      if (state.currentConversation?.id === conversationId) {
        state.currentConversation = null;
      }
      delete state.messages[conversationId];
      delete state.hasMoreMessages[conversationId];
      delete state.lastMessageTimestamp[conversationId];
    });
  },
});

export const {
  setCurrentConversation,
  setSearchQuery,
  setFilters,
  clearError,
  handleWebSocketEvent,
  startTyping,
  stopTyping,
  clearTypingIndicators,
  addToMessageQueue,
  removeFromMessageQueue,
  incrementRetryCount,
  clearMessageQueue,
  setEncryptionKey,
  addOptimisticMessage,
  updateMessageStatus,
} = messageSlice.actions;

export default messageSlice.reducer;
