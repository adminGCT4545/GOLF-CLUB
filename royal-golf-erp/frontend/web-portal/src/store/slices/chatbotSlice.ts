import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  confidence?: number;
  sources?: string[];
  processing_time?: number;
}

export interface ChatbotState {
  isOpen: boolean;
  isMinimized: boolean;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

const initialState: ChatbotState = {
  isOpen: false,
  isMinimized: false,
  messages: [
    {
      id: 'welcome',
      content: 'Hello! I\'m KYNSEY AI, your Royal Golf Club assistant. I can help you with member services, operations, booking questions, and more. How can I assist you today?',
      role: 'assistant',
      timestamp: new Date(),
    }
  ],
  isLoading: false,
  error: null,
  connectionStatus: 'disconnected',
};

// Async thunk for sending messages to the AI
export const sendMessage = createAsyncThunk(
  'chatbot/sendMessage',
  async (message: string, { getState }) => {
    const state = getState() as { auth: { user: any } };
    const user = state.auth.user;

    const response = await fetch('/api/v1/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        message,
        user_info: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          memberNumber: user?.memberNumber,
          membershipTier: user?.membershipTier,
          role: user?.role,
        },
        conversation_history: [],
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data;
  }
);

// Async thunk for checking AI service health
export const checkAIHealth = createAsyncThunk(
  'chatbot/checkHealth',
  async () => {
    const response = await fetch('/api/v1/ai/health', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('AI service is not available');
    }

    const data = await response.json();
    return data;
  }
);

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    toggleChatbot: (state) => {
      state.isOpen = !state.isOpen;
      if (state.isOpen) {
        state.isMinimized = false;
      }
    },
    closeChatbot: (state) => {
      state.isOpen = false;
    },
    minimizeChatbot: (state) => {
      state.isMinimized = !state.isMinimized;
    },
    addUserMessage: (state, action: PayloadAction<string>) => {
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        content: action.payload,
        role: 'user',
        timestamp: new Date(),
      };
      state.messages.push(newMessage);
    },
    clearMessages: (state) => {
      state.messages = [initialState.messages[0]]; // Keep welcome message
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Send message cases
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        const responseData = action.payload.data || action.payload;
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          content: responseData.text,
          role: 'assistant',
          timestamp: new Date(),
          confidence: responseData.confidence,
          sources: responseData.sources,
          processing_time: responseData.processing_time,
        };
        state.messages.push(aiMessage);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to send message';
      })
      // Health check cases
      .addCase(checkAIHealth.pending, (state) => {
        state.connectionStatus = 'connecting';
      })
      .addCase(checkAIHealth.fulfilled, (state, action) => {
        const status = action.payload.data?.status || action.payload.status;
        state.connectionStatus = status === 'healthy' ? 'connected' : 'disconnected';
      })
      .addCase(checkAIHealth.rejected, (state) => {
        state.connectionStatus = 'disconnected';
      });
  },
});

export const {
  toggleChatbot,
  closeChatbot,
  minimizeChatbot,
  addUserMessage,
  clearMessages,
  clearError,
} = chatbotSlice.actions;

export default chatbotSlice.reducer;
