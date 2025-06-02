import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import memberReducer from './slices/memberSlice';
import bookingReducer from './slices/bookingSlice';
import tournamentReducer from './slices/tournamentSlice';
import notificationReducer from './slices/notificationSlice';
import messageReducer from './slices/messageSlice';
import handicapReducer from './slices/handicapSlice';
import commerceReducer from './slices/commerceSlice';
import fnbReducer from './slices/fnbSlice';
import engagementReducer from './slices/engagementSlice';
import courseConditionsReducer from './slices/courseConditionsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    member: memberReducer,
    booking: bookingReducer,
    tournament: tournamentReducer,
    notification: notificationReducer,
    message: messageReducer,
    handicap: handicapReducer,
    commerce: commerceReducer,
    fnb: fnbReducer,
    engagement: engagementReducer,
    courseConditions: courseConditionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
