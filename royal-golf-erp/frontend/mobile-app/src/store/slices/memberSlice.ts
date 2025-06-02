import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Member,
  MemberProfile,
  MemberDirectory,
  MemberSearchFilter,
  PlayingPartnerRequest,
  MemberConnection,
  MembershipType,
  MembershipTier,
} from '../../types/member';
import api from '../../services/api';

interface MemberState {
  // Current user profile
  profile: MemberProfile | null;

  // Member directory
  directory: MemberDirectory | null;
  members: Member[];
  selectedMember: MemberProfile | null;

  // Filters and search
  searchFilters: MemberSearchFilter;
  searchResults: Member[];

  // Playing partners and connections
  playingPartners: Member[];
  partnerRequests: PlayingPartnerRequest[];
  connections: MemberConnection[];

  // UI state
  isLoading: boolean;
  isDirectoryLoading: boolean;
  isProfileLoading: boolean;
  isSearching: boolean;
  error: string | null;

  // Cache
  lastFetchedAt: string | null;
  cacheExpiryTime: number;
}

const initialSearchFilters: MemberSearchFilter = {
  searchTerm: '',
  membershipTypes: [],
  membershipTiers: [],
  handicapRange: {},
  joinDateRange: {},
  isOnlineOnly: false,
  hasHandicap: false,
  sortBy: 'name',
  sortOrder: 'asc',
};

const initialState: MemberState = {
  profile: null,
  directory: null,
  members: [],
  selectedMember: null,
  searchFilters: initialSearchFilters,
  searchResults: [],
  playingPartners: [],
  partnerRequests: [],
  connections: [],
  isLoading: false,
  isDirectoryLoading: false,
  isProfileLoading: false,
  isSearching: false,
  error: null,
  lastFetchedAt: null,
  cacheExpiryTime: 5 * 60 * 1000, // 5 minutes
};

// Async thunks
export const fetchMembers = createAsyncThunk(
  'member/fetchMembers',
  async (params: { page?: number; limit?: number; filters?: Partial<MemberSearchFilter> }) => {
    const response = await api.get('/members', { params });
    return response.data;
  }
);

export const searchMembers = createAsyncThunk(
  'member/searchMembers',
  async (filters: MemberSearchFilter) => {
    const response = await api.post('/members/search', filters);
    return response.data;
  }
);

export const fetchMemberProfile = createAsyncThunk(
  'member/fetchMemberProfile',
  async (memberId: string) => {
    const response = await api.get(`/members/${memberId}`);
    return response.data;
  }
);

export const updateProfile = createAsyncThunk(
  'member/updateProfile',
  async (profileData: Partial<MemberProfile>) => {
    const response = await api.put('/members/profile', profileData);
    return response.data;
  }
);

export const uploadProfilePhoto = createAsyncThunk(
  'member/uploadProfilePhoto',
  async (photoData: FormData) => {
    const response = await api.post('/members/profile/photo', photoData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
);

export const followMember = createAsyncThunk('member/followMember', async (memberId: string) => {
  const response = await api.post(`/members/${memberId}/follow`);
  return response.data;
});

export const unfollowMember = createAsyncThunk(
  'member/unfollowMember',
  async (memberId: string) => {
    const response = await api.delete(`/members/${memberId}/follow`);
    return response.data;
  }
);

export const sendPlayingPartnerRequest = createAsyncThunk(
  'member/sendPlayingPartnerRequest',
  async ({ memberId, message }: { memberId: string; message?: string }) => {
    const response = await api.post(`/members/${memberId}/partner-request`, { message });
    return response.data;
  }
);

export const respondToPartnerRequest = createAsyncThunk(
  'member/respondToPartnerRequest',
  async ({ requestId, response }: { requestId: string; response: 'accepted' | 'declined' }) => {
    const result = await api.put(`/members/partner-requests/${requestId}`, { response });
    return result.data;
  }
);

export const fetchPlayingPartners = createAsyncThunk('member/fetchPlayingPartners', async () => {
  const response = await api.get('/members/playing-partners');
  return response.data;
});

export const fetchPartnerRequests = createAsyncThunk('member/fetchPartnerRequests', async () => {
  const response = await api.get('/members/partner-requests');
  return response.data;
});

export const blockMember = createAsyncThunk('member/blockMember', async (memberId: string) => {
  const response = await api.post(`/members/${memberId}/block`);
  return response.data;
});

export const unblockMember = createAsyncThunk('member/unblockMember', async (memberId: string) => {
  const response = await api.delete(`/members/${memberId}/block`);
  return response.data;
});

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    setSearchFilters: (state, action: PayloadAction<Partial<MemberSearchFilter>>) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload };
    },
    clearSearchFilters: (state) => {
      state.searchFilters = initialSearchFilters;
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedMember: (state) => {
      state.selectedMember = null;
    },
    updateMemberOnlineStatus: (
      state,
      action: PayloadAction<{ memberId: string; isOnline: boolean; lastSeen?: string }>
    ) => {
      const { memberId, isOnline, lastSeen } = action.payload;

      // Update in members array
      const memberIndex = state.members.findIndex((m) => m.id === memberId);
      if (memberIndex !== -1) {
        state.members[memberIndex].isOnline = isOnline;
        if (lastSeen) {
          state.members[memberIndex].lastSeen = lastSeen;
        }
      }

      // Update in search results
      const searchIndex = state.searchResults.findIndex((m) => m.id === memberId);
      if (searchIndex !== -1) {
        state.searchResults[searchIndex].isOnline = isOnline;
        if (lastSeen) {
          state.searchResults[searchIndex].lastSeen = lastSeen;
        }
      }

      // Update selected member
      if (state.selectedMember?.id === memberId) {
        state.selectedMember.isOnline = isOnline;
        if (lastSeen) {
          state.selectedMember.lastSeen = lastSeen;
        }
      }
    },
    invalidateCache: (state) => {
      state.lastFetchedAt = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch members
    builder
      .addCase(fetchMembers.pending, (state) => {
        state.isDirectoryLoading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.isDirectoryLoading = false;
        state.directory = action.payload;
        state.members = action.payload.members;
        state.lastFetchedAt = new Date().toISOString();
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.isDirectoryLoading = false;
        state.error = action.error.message || 'Failed to fetch members';
      })

      // Search members
      .addCase(searchMembers.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchMembers.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.members;
      })
      .addCase(searchMembers.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.error.message || 'Failed to search members';
      })

      // Fetch member profile
      .addCase(fetchMemberProfile.pending, (state) => {
        state.isProfileLoading = true;
        state.error = null;
      })
      .addCase(fetchMemberProfile.fulfilled, (state, action) => {
        state.isProfileLoading = false;
        state.selectedMember = action.payload;
      })
      .addCase(fetchMemberProfile.rejected, (state, action) => {
        state.isProfileLoading = false;
        state.error = action.error.message || 'Failed to fetch member profile';
      })

      // Update profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update profile';
      })

      // Upload profile photo
      .addCase(uploadProfilePhoto.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(uploadProfilePhoto.fulfilled, (state, action) => {
        state.isLoading = false;
        if (state.profile) {
          state.profile.avatar = action.payload.avatarUrl;
        }
      })
      .addCase(uploadProfilePhoto.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to upload profile photo';
      })

      // Playing partners
      .addCase(fetchPlayingPartners.fulfilled, (state, action) => {
        state.playingPartners = action.payload;
      })
      .addCase(fetchPartnerRequests.fulfilled, (state, action) => {
        state.partnerRequests = action.payload;
      })

      // Partner request responses
      .addCase(sendPlayingPartnerRequest.fulfilled, (state, action) => {
        state.partnerRequests.push(action.payload);
      })
      .addCase(respondToPartnerRequest.fulfilled, (state, action) => {
        const requestIndex = state.partnerRequests.findIndex((r) => r.id === action.payload.id);
        if (requestIndex !== -1) {
          state.partnerRequests[requestIndex] = action.payload;
        }
      });
  },
});

export const {
  setSearchFilters,
  clearSearchFilters,
  clearError,
  clearSelectedMember,
  updateMemberOnlineStatus,
  invalidateCache,
} = memberSlice.actions;

export default memberSlice.reducer;
