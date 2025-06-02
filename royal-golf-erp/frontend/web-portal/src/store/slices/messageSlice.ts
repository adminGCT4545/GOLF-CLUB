import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageAPI } from '../../services/api';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

interface MessageState {
  conversations: any[];
  messages: Message[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: MessageState = {
  conversations: [],
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async () => {
    const response = await messageAPI.getConversations();
    return response.data;
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async (data: any) => {
    const response = await messageAPI.sendMessage(data);
    return response.data;
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      });
  },
});

export const { clearError } = messageSlice.actions;
export default messageSlice.reducer;
