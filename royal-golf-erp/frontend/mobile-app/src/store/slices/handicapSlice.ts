import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HandicapRecord,
  ScoreEntry,
  Course,
  HandicapCalculation,
  HandicapStatistics,
  HandicapDashboard,
  HandicapTrend,
  PeerComparison,
  ScoreAnalysis,
  OfflineScoreEntry,
  HandicapExport,
  PlayingConditions,
} from '../../types/handicap';
import api from '../../services/api';

interface HandicapState {
  // Current handicap data
  currentHandicap: HandicapRecord | null;
  handicapHistory: HandicapRecord[];

  // Scores
  scores: ScoreEntry[];
  recentScores: ScoreEntry[];
  pendingScores: OfflineScoreEntry[];

  // Dashboard data
  dashboard: HandicapDashboard | null;
  statistics: HandicapStatistics | null;
  trendData: HandicapTrend[];
  peerComparisons: PeerComparison[];

  // Courses and course data
  courses: Course[];
  selectedCourse: Course | null;

  // Score entry
  currentScoreEntry: Partial<ScoreEntry> | null;
  scoreAnalysis: ScoreAnalysis | null;

  // UI state
  isLoading: boolean;
  isCalculating: boolean;
  isSyncing: boolean;
  isLoadingCourses: boolean;
  isSubmittingScore: boolean;
  error: string | null;

  // Cache and sync
  lastSyncAt: string | null;
  offlineMode: boolean;
  syncRetryCount: number;
}

const initialState: HandicapState = {
  currentHandicap: null,
  handicapHistory: [],
  scores: [],
  recentScores: [],
  pendingScores: [],
  dashboard: null,
  statistics: null,
  trendData: [],
  peerComparisons: [],
  courses: [],
  selectedCourse: null,
  currentScoreEntry: null,
  scoreAnalysis: null,
  isLoading: false,
  isCalculating: false,
  isSyncing: false,
  isLoadingCourses: false,
  isSubmittingScore: false,
  error: null,
  lastSyncAt: null,
  offlineMode: false,
  syncRetryCount: 0,
};

// Async thunks
export const fetchHandicapData = createAsyncThunk(
  'handicap/fetchHandicapData',
  async (memberId?: string) => {
    const endpoint = memberId ? `/handicap/${memberId}` : '/handicap/me';
    const response = await api.get(endpoint);
    return response.data;
  }
);

export const fetchHandicapDashboard = createAsyncThunk(
  'handicap/fetchHandicapDashboard',
  async () => {
    const response = await api.get('/handicap/dashboard');
    return response.data;
  }
);

export const fetchScoreHistory = createAsyncThunk(
  'handicap/fetchScoreHistory',
  async (params: { page?: number; limit?: number; dateRange?: { start: string; end: string } }) => {
    const response = await api.get('/handicap/scores', { params });
    return response.data;
  }
);

export const addScore = createAsyncThunk(
  'handicap/addScore',
  async (scoreData: Omit<ScoreEntry, 'id' | 'submittedAt'>) => {
    try {
      const response = await api.post('/handicap/scores', scoreData);
      return response.data;
    } catch (error) {
      // If offline, store locally
      const offlineScore: OfflineScoreEntry = {
        id: `offline_${Date.now()}`,
        data: scoreData,
        createdAt: new Date().toISOString(),
        syncStatus: 'pending',
        retryCount: 0,
      };

      await AsyncStorage.setItem(`offline_score_${offlineScore.id}`, JSON.stringify(offlineScore));

      throw error;
    }
  }
);

export const calculateHandicap = createAsyncThunk('handicap/calculateHandicap', async () => {
  const response = await api.post('/handicap/calculate');
  return response.data;
});

export const fetchCourses = createAsyncThunk(
  'handicap/fetchCourses',
  async (searchTerm?: string) => {
    const params = searchTerm ? { search: searchTerm } : {};
    const response = await api.get('/courses', { params });
    return response.data;
  }
);

export const fetchCourseDetails = createAsyncThunk(
  'handicap/fetchCourseDetails',
  async (courseId: string) => {
    const response = await api.get(`/courses/${courseId}`);
    return response.data;
  }
);

export const fetchPeerComparisons = createAsyncThunk('handicap/fetchPeerComparisons', async () => {
  const response = await api.get('/handicap/peer-comparisons');
  return response.data;
});

export const analyzeScore = createAsyncThunk('handicap/analyzeScore', async (scoreId: string) => {
  const response = await api.get(`/handicap/scores/${scoreId}/analysis`);
  return response.data;
});

export const exportHandicapData = createAsyncThunk(
  'handicap/exportHandicapData',
  async (exportOptions: HandicapExport) => {
    const response = await api.post('/handicap/export', exportOptions, {
      responseType: 'blob',
    });
    return response.data;
  }
);

export const syncOfflineScores = createAsyncThunk(
  'handicap/syncOfflineScores',
  async (_, { getState, dispatch }) => {
    const state = getState() as { handicap: HandicapState };
    const pendingScores = state.handicap.pendingScores;

    const syncResults = [];

    for (const offlineScore of pendingScores) {
      try {
        const response = await api.post('/handicap/scores', offlineScore.data);

        // Remove from AsyncStorage
        await AsyncStorage.removeItem(`offline_score_${offlineScore.id}`);

        syncResults.push({
          offlineId: offlineScore.id,
          success: true,
          data: response.data,
        });
      } catch (error) {
        // Update retry count
        const updatedScore: OfflineScoreEntry = {
          ...offlineScore,
          syncStatus: 'failed',
          retryCount: offlineScore.retryCount + 1,
          lastSyncAttempt: new Date().toISOString(),
          errorMessage: (error as Error).message,
        };

        await AsyncStorage.setItem(
          `offline_score_${offlineScore.id}`,
          JSON.stringify(updatedScore)
        );

        syncResults.push({
          offlineId: offlineScore.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    return syncResults;
  }
);

export const loadOfflineScores = createAsyncThunk('handicap/loadOfflineScores', async () => {
  const keys = await AsyncStorage.getAllKeys();
  const offlineScoreKeys = keys.filter((key) => key.startsWith('offline_score_'));

  const offlineScores: OfflineScoreEntry[] = [];

  for (const key of offlineScoreKeys) {
    const scoreData = await AsyncStorage.getItem(key);
    if (scoreData) {
      offlineScores.push(JSON.parse(scoreData));
    }
  }

  return offlineScores;
});

const handicapSlice = createSlice({
  name: 'handicap',
  initialState,
  reducers: {
    setCurrentScoreEntry: (state, action: PayloadAction<Partial<ScoreEntry>>) => {
      state.currentScoreEntry = { ...state.currentScoreEntry, ...action.payload };
    },
    clearCurrentScoreEntry: (state) => {
      state.currentScoreEntry = null;
    },
    setSelectedCourse: (state, action: PayloadAction<Course>) => {
      state.selectedCourse = action.payload;
    },
    clearSelectedCourse: (state) => {
      state.selectedCourse = null;
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateHoleScore: (state, action: PayloadAction<{ holeNumber: number; score: number }>) => {
      if (state.currentScoreEntry && state.currentScoreEntry.holes) {
        const holeIndex = state.currentScoreEntry.holes.findIndex(
          (h) => h.holeNumber === action.payload.holeNumber
        );
        if (holeIndex !== -1) {
          state.currentScoreEntry.holes[holeIndex].score = action.payload.score;
        }
      }
    },
    setPlayingConditions: (state, action: PayloadAction<PlayingConditions>) => {
      if (state.currentScoreEntry) {
        state.currentScoreEntry.playingConditions = action.payload;
      }
    },
    removePendingScore: (state, action: PayloadAction<string>) => {
      state.pendingScores = state.pendingScores.filter((score) => score.id !== action.payload);
    },
    updateScoreSyncStatus: (
      state,
      action: PayloadAction<{ scoreId: string; status: 'pending' | 'syncing' | 'failed' }>
    ) => {
      const scoreIndex = state.pendingScores.findIndex(
        (score) => score.id === action.payload.scoreId
      );
      if (scoreIndex !== -1) {
        state.pendingScores[scoreIndex].syncStatus = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch handicap data
    builder
      .addCase(fetchHandicapData.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHandicapData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentHandicap = action.payload.currentHandicap;
        state.handicapHistory = action.payload.history;
        state.statistics = action.payload.statistics;
      })
      .addCase(fetchHandicapData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch handicap data';
      })

      // Fetch dashboard
      .addCase(fetchHandicapDashboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHandicapDashboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboard = action.payload;
        state.trendData = action.payload.trendData;
        state.peerComparisons = action.payload.peerComparisons;
        state.recentScores = action.payload.recentScores;
      })
      .addCase(fetchHandicapDashboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch dashboard data';
      })

      // Fetch score history
      .addCase(fetchScoreHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchScoreHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scores = action.payload.scores;
      })
      .addCase(fetchScoreHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch score history';
      })

      // Add score
      .addCase(addScore.pending, (state) => {
        state.isSubmittingScore = true;
        state.error = null;
      })
      .addCase(addScore.fulfilled, (state, action) => {
        state.isSubmittingScore = false;
        state.scores.unshift(action.payload);
        state.recentScores.unshift(action.payload);
        state.currentScoreEntry = null;
      })
      .addCase(addScore.rejected, (state, action) => {
        state.isSubmittingScore = false;

        // Check if this was due to offline mode
        if (
          action.error.message?.includes('Network') ||
          action.error.message?.includes('offline')
        ) {
          state.offlineMode = true;
          // The score will be added to pendingScores by the thunk
        } else {
          state.error = action.error.message || 'Failed to add score';
        }
      })

      // Calculate handicap
      .addCase(calculateHandicap.pending, (state) => {
        state.isCalculating = true;
        state.error = null;
      })
      .addCase(calculateHandicap.fulfilled, (state, action) => {
        state.isCalculating = false;
        state.currentHandicap = action.payload.newHandicap;
        state.handicapHistory.unshift(action.payload.newHandicap);
      })
      .addCase(calculateHandicap.rejected, (state, action) => {
        state.isCalculating = false;
        state.error = action.error.message || 'Failed to calculate handicap';
      })

      // Fetch courses
      .addCase(fetchCourses.pending, (state) => {
        state.isLoadingCourses = true;
        state.error = null;
      })
      .addCase(fetchCourses.fulfilled, (state, action) => {
        state.isLoadingCourses = false;
        state.courses = action.payload;
      })
      .addCase(fetchCourses.rejected, (state, action) => {
        state.isLoadingCourses = false;
        state.error = action.error.message || 'Failed to fetch courses';
      })

      // Fetch course details
      .addCase(fetchCourseDetails.fulfilled, (state, action) => {
        state.selectedCourse = action.payload;
      })

      // Peer comparisons
      .addCase(fetchPeerComparisons.fulfilled, (state, action) => {
        state.peerComparisons = action.payload;
      })

      // Score analysis
      .addCase(analyzeScore.fulfilled, (state, action) => {
        state.scoreAnalysis = action.payload;
      })

      // Sync offline scores
      .addCase(syncOfflineScores.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(syncOfflineScores.fulfilled, (state, action) => {
        state.isSyncing = false;
        state.lastSyncAt = new Date().toISOString();

        // Remove successfully synced scores
        const successfulSyncs = action.payload.filter((result) => result.success);
        const failedSyncs = action.payload.filter((result) => !result.success);

        successfulSyncs.forEach((sync) => {
          state.pendingScores = state.pendingScores.filter((score) => score.id !== sync.offlineId);
          if (sync.data) {
            state.scores.unshift(sync.data);
            state.recentScores.unshift(sync.data);
          }
        });

        // Update failed sync statuses
        failedSyncs.forEach((sync) => {
          const scoreIndex = state.pendingScores.findIndex((score) => score.id === sync.offlineId);
          if (scoreIndex !== -1) {
            state.pendingScores[scoreIndex].syncStatus = 'failed';
            state.pendingScores[scoreIndex].retryCount += 1;
          }
        });

        if (failedSyncs.length === 0) {
          state.offlineMode = false;
        }
      })
      .addCase(syncOfflineScores.rejected, (state, action) => {
        state.isSyncing = false;
        state.error = action.error.message || 'Failed to sync offline scores';
      })

      // Load offline scores
      .addCase(loadOfflineScores.fulfilled, (state, action) => {
        state.pendingScores = action.payload;
        state.offlineMode = action.payload.length > 0;
      });
  },
});

export const {
  setCurrentScoreEntry,
  clearCurrentScoreEntry,
  setSelectedCourse,
  clearSelectedCourse,
  setOfflineMode,
  clearError,
  updateHoleScore,
  setPlayingConditions,
  removePendingScore,
  updateScoreSyncStatus,
} = handicapSlice.actions;

export default handicapSlice.reducer;
