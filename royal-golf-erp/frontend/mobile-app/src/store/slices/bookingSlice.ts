import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  TeeTimeBooking,
  FacilityBooking,
  TeeTimeSlot,
  BookingRequest,
  BookingDetails,
  Course,
  BookingFilter,
} from '../../types/booking';
import api from '../../services/api';

interface BookingState {
  teeTimeBookings: TeeTimeBooking[];
  facilityBookings: FacilityBooking[];
  availableSlots: TeeTimeSlot[];
  currentBookingDetails: BookingDetails | null;
  courses: Course[];
  selectedDate: string | null;
  selectedCourse: string | null;
  isLoading: boolean;
  isCreatingBooking: boolean;
  isCancellingBooking: boolean;
  error: string | null;
}

const initialState: BookingState = {
  teeTimeBookings: [],
  facilityBookings: [],
  availableSlots: [],
  currentBookingDetails: null,
  courses: [],
  selectedDate: null,
  selectedCourse: null,
  isLoading: false,
  isCreatingBooking: false,
  isCancellingBooking: false,
  error: null,
};

// Async thunks
export const fetchCourses = createAsyncThunk('booking/fetchCourses', async () => {
  const response = await api.get('/bookings/courses');
  return response.data;
});

export const fetchAvailableSlots = createAsyncThunk(
  'booking/fetchAvailableSlots',
  async ({ date, courseId, holes }: { date: string; courseId?: string; holes?: number }) => {
    const params = new URLSearchParams({ date });
    if (courseId) {
      params.append('courseId', courseId);
    }
    if (holes) {
      params.append('holes', holes.toString());
    }

    const response = await api.get(`/bookings/tee-times/available?${params}`);
    return response.data;
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingRequest: BookingRequest) => {
    const response = await api.post('/bookings/tee-times', bookingRequest);
    return response.data;
  }
);

export const fetchBookingHistory = createAsyncThunk(
  'booking/fetchBookingHistory',
  async (filter?: BookingFilter) => {
    const params = new URLSearchParams();
    if (filter?.status) {
      params.append('status', filter.status.join(','));
    }
    if (filter?.dateFrom) {
      params.append('dateFrom', filter.dateFrom);
    }
    if (filter?.dateTo) {
      params.append('dateTo', filter.dateTo);
    }
    if (filter?.courseId) {
      params.append('courseId', filter.courseId);
    }

    const response = await api.get(`/bookings/tee-times?${params}`);
    return response.data;
  }
);

export const fetchBookingDetails = createAsyncThunk(
  'booking/fetchBookingDetails',
  async (bookingId: string) => {
    const response = await api.get(`/bookings/tee-times/${bookingId}`);
    return response.data;
  }
);

export const cancelBooking = createAsyncThunk(
  'booking/cancelBooking',
  async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
    const response = await api.post(`/bookings/tee-times/${bookingId}/cancel`, { reason });
    return response.data;
  }
);

export const modifyBooking = createAsyncThunk(
  'booking/modifyBooking',
  async ({ bookingId, updates }: { bookingId: string; updates: Partial<BookingRequest> }) => {
    const response = await api.put(`/bookings/tee-times/${bookingId}`, updates);
    return response.data;
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.selectedDate = action.payload;
    },
    setSelectedCourse: (state, action: PayloadAction<string>) => {
      state.selectedCourse = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearAvailableSlots: (state) => {
      state.availableSlots = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch courses
    builder
      .addCase(fetchCourses.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch courses';
      });

    // Fetch available slots
    builder
      .addCase(fetchAvailableSlots.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAvailableSlots.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availableSlots = action.payload;
      })
      .addCase(fetchAvailableSlots.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch available slots';
      });

    // Create booking
    builder
      .addCase(createBooking.pending, (state) => {
        state.isCreatingBooking = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isCreatingBooking = false;
        state.teeTimeBookings.unshift(action.payload);
        state.availableSlots = [];
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isCreatingBooking = false;
        state.error = action.error.message || 'Failed to create booking';
      });

    // Fetch booking history
    builder
      .addCase(fetchBookingHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.teeTimeBookings = action.payload;
      })
      .addCase(fetchBookingHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch booking history';
      });

    // Fetch booking details
    builder
      .addCase(fetchBookingDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBookingDetails = action.payload;
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch booking details';
      });

    // Cancel booking
    builder
      .addCase(cancelBooking.pending, (state) => {
        state.isCancellingBooking = true;
        state.error = null;
      })
      .addCase(cancelBooking.fulfilled, (state, action) => {
        state.isCancellingBooking = false;
        const index = state.teeTimeBookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.teeTimeBookings[index] = action.payload;
        }
        if (state.currentBookingDetails?.id === action.payload.id) {
          state.currentBookingDetails = { ...state.currentBookingDetails, ...action.payload };
        }
      })
      .addCase(cancelBooking.rejected, (state, action) => {
        state.isCancellingBooking = false;
        state.error = action.error.message || 'Failed to cancel booking';
      });

    // Modify booking
    builder
      .addCase(modifyBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(modifyBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.teeTimeBookings.findIndex((b) => b.id === action.payload.id);
        if (index !== -1) {
          state.teeTimeBookings[index] = action.payload;
        }
        if (state.currentBookingDetails?.id === action.payload.id) {
          state.currentBookingDetails = { ...state.currentBookingDetails, ...action.payload };
        }
      })
      .addCase(modifyBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to modify booking';
      });
  },
});

export const { setSelectedDate, setSelectedCourse, clearError, clearAvailableSlots } =
  bookingSlice.actions;
export default bookingSlice.reducer;
