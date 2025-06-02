import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingAPI } from '../../services/api';

export interface Booking {
  id: string;
  memberId: string;
  courseId: string;
  teeTimeId: string;
  date: string;
  time: string;
  players: number;
  status: string;
  notes?: string;
  createdAt: string;
}

interface BookingState {
  bookings: Booking[];
  upcomingBookings: Booking[];
  availability: any[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingState = {
  bookings: [],
  upcomingBookings: [],
  availability: [],
  loading: false,
  error: null,
};

export const fetchBookings = createAsyncThunk(
  'booking/fetchBookings',
  async (params: any = {}) => {
    const response = await bookingAPI.getBookings(params);
    return response.data;
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (data: any) => {
    const response = await bookingAPI.createBooking(data);
    return response.data;
  }
);

export const fetchAvailability = createAsyncThunk(
  'booking/fetchAvailability',
  async ({ date, courseId }: { date: string; courseId?: string }) => {
    const response = await bookingAPI.getTeeTimeAvailability(date, courseId);
    return response.data;
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.bookings.push(action.payload);
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.availability = action.payload;
      });
  },
});

export const { clearError } = bookingSlice.actions;
export default bookingSlice.reducer;
