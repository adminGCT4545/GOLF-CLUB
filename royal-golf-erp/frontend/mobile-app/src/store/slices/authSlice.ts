import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/api/auth';
import {
  User,
  LoginCredentials,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  OTPVerificationData,
} from '../../types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  otpSent: boolean;
  otpVerified: boolean;
  resetToken: string | null;
  biometricEnabled: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
  otpSent: false,
  otpVerified: false,
  resetToken: null,
  biometricEnabled: false,
};

export const login = createAsyncThunk('auth/login', async (credentials: LoginCredentials) => {
  const response = await authAPI.login(credentials);
  await AsyncStorage.setItem('token', response.token);
  await AsyncStorage.setItem('user', JSON.stringify(response.user));
  return response;
});

export const register = createAsyncThunk('auth/register', async (data: RegisterData) => {
  const response = await authAPI.register(data);
  await AsyncStorage.setItem('token', response.token);
  await AsyncStorage.setItem('user', JSON.stringify(response.user));
  return response;
});

export const sendOTP = createAsyncThunk('auth/sendOTP', async (data: ForgotPasswordData) => {
  const response = await authAPI.sendOTP(data);
  return response;
});

export const verifyOTP = createAsyncThunk('auth/verifyOTP', async (data: OTPVerificationData) => {
  const response = await authAPI.verifyOTP(data);
  return response;
});

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (data: ResetPasswordData) => {
    const response = await authAPI.resetPassword(data);
    return response;
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('biometricEnabled');
});

export const loadStoredAuth = createAsyncThunk('auth/loadStored', async () => {
  const token = await AsyncStorage.getItem('token');
  const userStr = await AsyncStorage.getItem('user');
  const biometricEnabled = await AsyncStorage.getItem('biometricEnabled');

  if (token && userStr) {
    return {
      token,
      user: JSON.parse(userStr),
      biometricEnabled: biometricEnabled === 'true',
    };
  }
  return null;
});

export const enableBiometric = createAsyncThunk(
  'auth/enableBiometric',
  async (enabled: boolean) => {
    await AsyncStorage.setItem('biometricEnabled', enabled.toString());
    return enabled;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearOTPState: (state) => {
      state.otpSent = false;
      state.otpVerified = false;
      state.resetToken = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Registration failed';
      })
      // Send OTP
      .addCase(sendOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(sendOTP.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = true;
      })
      .addCase(sendOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to send OTP';
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.otpVerified = true;
        state.resetToken = action.payload.resetToken;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Invalid OTP';
      })
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.otpSent = false;
        state.otpVerified = false;
        state.resetToken = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to reset password';
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.biometricEnabled = false;
      })
      // Load stored auth
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
          state.isAuthenticated = true;
          state.biometricEnabled = action.payload.biometricEnabled;
        }
      })
      // Enable Biometric
      .addCase(enableBiometric.fulfilled, (state, action) => {
        state.biometricEnabled = action.payload;
      });
  },
});

export const { clearError, clearOTPState } = authSlice.actions;
export default authSlice.reducer;
