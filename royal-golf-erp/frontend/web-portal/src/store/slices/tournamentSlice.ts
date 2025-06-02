import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tournamentAPI } from '../../services/api';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  status: string;
  format: string;
  entryFee: number;
}

interface TournamentState {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  leaderboard: any[];
  loading: boolean;
  error: string | null;
}

const initialState: TournamentState = {
  tournaments: [],
  currentTournament: null,
  leaderboard: [],
  loading: false,
  error: null,
};

export const fetchTournaments = createAsyncThunk(
  'tournament/fetchTournaments',
  async (params: any = {}) => {
    const response = await tournamentAPI.getTournaments(params);
    return response.data;
  }
);

export const registerForTournament = createAsyncThunk(
  'tournament/register',
  async ({ id, data }: { id: string; data?: any }) => {
    const response = await tournamentAPI.registerForTournament(id, data);
    return response.data;
  }
);

const tournamentSlice = createSlice({
  name: 'tournament',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTournaments.fulfilled, (state, action) => {
        state.tournaments = action.payload;
      })
      .addCase(registerForTournament.fulfilled, (state, action) => {
        const tournamentId = action.meta.arg.id;
        const tournament = state.tournaments.find(t => t.id === tournamentId);
        if (tournament) {
          tournament.currentParticipants += 1;
        }
      });
  },
});

export const { clearError } = tournamentSlice.actions;
export default tournamentSlice.reducer;
