import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Tournament,
  TournamentRegistration,
  TournamentResult,
  Leaderboard,
  TournamentFilter,
  MyTournamentStats,
  PaymentInfo,
} from '../../types/tournament';
import api from '../../services/api';

interface TournamentState {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  myTournaments: TournamentRegistration[];
  leaderboard: Leaderboard | null;
  results: TournamentResult[];
  myStats: MyTournamentStats | null;
  paymentInfo: PaymentInfo | null;
  filters: TournamentFilter;
  isLoading: boolean;
  isRegistering: boolean;
  isLoadingLeaderboard: boolean;
  isLoadingResults: boolean;
  error: string | null;
  registrationError: string | null;
  searchQuery: string;
}

const initialState: TournamentState = {
  tournaments: [],
  selectedTournament: null,
  myTournaments: [],
  leaderboard: null,
  results: [],
  myStats: null,
  paymentInfo: null,
  filters: {},
  isLoading: false,
  isRegistering: false,
  isLoadingLeaderboard: false,
  isLoadingResults: false,
  error: null,
  registrationError: null,
  searchQuery: '',
};

// Async thunks
export const fetchTournaments = createAsyncThunk(
  'tournaments/fetchTournaments',
  async (filters?: TournamentFilter, { rejectWithValue }) => {
    try {
      const response = await api.get('/tournaments', { params: filters });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tournaments');
    }
  }
);

export const fetchTournamentDetails = createAsyncThunk(
  'tournaments/fetchTournamentDetails',
  async (tournamentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tournament details');
    }
  }
);

export const registerForTournament = createAsyncThunk(
  'tournaments/registerForTournament',
  async (
    registrationData: Omit<TournamentRegistration, 'id' | 'registrationDate' | 'status'>,
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('/tournaments/register', registrationData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to register for tournament');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'tournaments/fetchLeaderboard',
  async (tournamentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/leaderboard`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaderboard');
    }
  }
);

export const fetchTournamentResults = createAsyncThunk(
  'tournaments/fetchTournamentResults',
  async (tournamentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/results`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tournament results');
    }
  }
);

export const fetchMyTournaments = createAsyncThunk(
  'tournaments/fetchMyTournaments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tournaments/my-tournaments');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my tournaments');
    }
  }
);

export const fetchMyTournamentStats = createAsyncThunk(
  'tournaments/fetchMyTournamentStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tournaments/my-stats');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch tournament stats');
    }
  }
);

export const fetchPaymentInfo = createAsyncThunk(
  'tournaments/fetchPaymentInfo',
  async (tournamentId: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/tournaments/${tournamentId}/payment-info`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment info');
    }
  }
);

export const updateScore = createAsyncThunk(
  'tournaments/updateScore',
  async (
    {
      tournamentId,
      playerId,
      scoreData,
    }: {
      tournamentId: string;
      playerId: string;
      scoreData: any;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.put(`/tournaments/${tournamentId}/scores/${playerId}`, scoreData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update score');
    }
  }
);

export const cancelRegistration = createAsyncThunk(
  'tournaments/cancelRegistration',
  async (
    { tournamentId, registrationId }: { tournamentId: string; registrationId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.delete(
        `/tournaments/${tournamentId}/registrations/${registrationId}`
      );
      return { tournamentId, registrationId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel registration');
    }
  }
);

const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<TournamentFilter>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSelectedTournament: (state) => {
      state.selectedTournament = null;
    },
    clearLeaderboard: (state) => {
      state.leaderboard = null;
    },
    clearResults: (state) => {
      state.results = [];
    },
    clearRegistrationError: (state) => {
      state.registrationError = null;
    },
    updateLeaderboardLive: (state, action: PayloadAction<Leaderboard>) => {
      state.leaderboard = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch tournaments
      .addCase(fetchTournaments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tournaments = action.payload;
      })
      .addCase(fetchTournaments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Fetch tournament details
      .addCase(fetchTournamentDetails.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTournamentDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedTournament = action.payload;
      })
      .addCase(fetchTournamentDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Register for tournament
      .addCase(registerForTournament.pending, (state) => {
        state.isRegistering = true;
        state.registrationError = null;
      })
      .addCase(registerForTournament.fulfilled, (state, action) => {
        state.isRegistering = false;
        state.myTournaments.push(action.payload);
        // Update tournament participant count
        if (
          state.selectedTournament &&
          state.selectedTournament.id === action.payload.tournamentId
        ) {
          state.selectedTournament.currentParticipants += 1;
        }
      })
      .addCase(registerForTournament.rejected, (state, action) => {
        state.isRegistering = false;
        state.registrationError = action.payload as string;
      })

      // Fetch leaderboard
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoadingLeaderboard = true;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoadingLeaderboard = false;
        state.error = action.payload as string;
      })

      // Fetch tournament results
      .addCase(fetchTournamentResults.pending, (state) => {
        state.isLoadingResults = true;
      })
      .addCase(fetchTournamentResults.fulfilled, (state, action) => {
        state.isLoadingResults = false;
        state.results = action.payload;
      })
      .addCase(fetchTournamentResults.rejected, (state, action) => {
        state.isLoadingResults = false;
        state.error = action.payload as string;
      })

      // Fetch my tournaments
      .addCase(fetchMyTournaments.fulfilled, (state, action) => {
        state.myTournaments = action.payload;
      })

      // Fetch my tournament stats
      .addCase(fetchMyTournamentStats.fulfilled, (state, action) => {
        state.myStats = action.payload;
      })

      // Fetch payment info
      .addCase(fetchPaymentInfo.fulfilled, (state, action) => {
        state.paymentInfo = action.payload;
      })

      // Cancel registration
      .addCase(cancelRegistration.fulfilled, (state, action) => {
        const { registrationId } = action.payload;
        state.myTournaments = state.myTournaments.filter((reg) => reg.id !== registrationId);
      });
  },
});

export const {
  setFilters,
  clearFilters,
  setSearchQuery,
  clearSelectedTournament,
  clearLeaderboard,
  clearResults,
  clearRegistrationError,
  updateLeaderboardLive,
} = tournamentSlice.actions;

export default tournamentSlice.reducer;
