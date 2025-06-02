import { apiClient } from './index';
import {
  LoginCredentials,
  RegisterData,
  User,
  ForgotPasswordData,
  ResetPasswordData,
  OTPVerificationData,
} from '../../types/auth';

interface LoginResponse {
  token: string;
  user: User;
}

interface OTPResponse {
  message: string;
  expiresIn?: number;
}

interface OTPVerificationResponse {
  message: string;
  resetToken: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterData): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/register', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  sendOTP: async (data: ForgotPasswordData): Promise<OTPResponse> => {
    const response = await apiClient.post<OTPResponse>('/auth/send-otp', data);
    return response.data;
  },

  verifyOTP: async (data: OTPVerificationData): Promise<OTPVerificationResponse> => {
    const response = await apiClient.post<OTPVerificationResponse>('/auth/verify-otp', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  verifyToken: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/verify');
    return response.data;
  },
};
