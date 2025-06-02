import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { memberAPI } from '../../services/api';

export interface Member {
  id: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  membershipTier: string;
  handicapIndex?: number;
  joinDate: string;
  status: string;
  avatar?: string;
  preferences?: any;
}

interface MemberState {
  members: Member[];
  currentMember: Member | null;
  directory: Member[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: MemberState = {
  members: [],
  currentMember: null,
  directory: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
};

// Async thunks
export const fetchMembers = createAsyncThunk(
  'member/fetchMembers',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await memberAPI.getMembers(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch members');
    }
  }
);

export const fetchMember = createAsyncThunk(
  'member/fetchMember',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await memberAPI.getMember(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch member');
    }
  }
);

export const updateMember = createAsyncThunk(
  'member/updateMember',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      const response = await memberAPI.updateMember(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update member');
    }
  }
);

export const fetchMemberDirectory = createAsyncThunk(
  'member/fetchDirectory',
  async (params: any = {}, { rejectWithValue }) => {
    try {
      const response = await memberAPI.getMemberDirectory(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch directory');
    }
  }
);

const memberSlice = createSlice({
  name: 'member',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentMember: (state, action: PayloadAction<Member>) => {
      state.currentMember = action.payload;
    },
    clearCurrentMember: (state) => {
      state.currentMember = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch members
      .addCase(fetchMembers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMembers.fulfilled, (state, action) => {
        state.loading = false;
        state.members = action.payload.members;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchMembers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch member
      .addCase(fetchMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMember.fulfilled, (state, action) => {
        state.loading = false;
        state.currentMember = action.payload;
      })
      .addCase(fetchMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update member
      .addCase(updateMember.fulfilled, (state, action) => {
        const updatedMember = action.payload;
        const index = state.members.findIndex(m => m.id === updatedMember.id);
        if (index !== -1) {
          state.members[index] = updatedMember;
        }
        if (state.currentMember?.id === updatedMember.id) {
          state.currentMember = updatedMember;
        }
      })
      // Fetch directory
      .addCase(fetchMemberDirectory.fulfilled, (state, action) => {
        state.directory = action.payload;
      });
  },
});

export const { clearError, setCurrentMember, clearCurrentMember } = memberSlice.actions;
export default memberSlice.reducer;
