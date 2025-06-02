import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import memberReducer from './slices/memberSlice';
import bookingReducer from './slices/bookingSlice';
import messageReducer from './slices/messageSlice';
import tournamentReducer from './slices/tournamentSlice';
import chatbotReducer from './slices/chatbotSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    member: memberReducer,
    booking: bookingReducer,
    message: messageReducer,
    tournament: tournamentReducer,
    chatbot: chatbotReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
