export interface User {
  id: string;
  memberId: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Full name for display
  phoneNumber: string;
  membershipType: 'FULL' | 'ASSOCIATE' | 'JUNIOR' | 'SENIOR' | 'CORPORATE';
  membershipStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  profileImage?: string;
  handicap?: number;
  joinDate: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginFormData {
  emailOrPhone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  membershipType: string;
}

export interface RegisterFormData extends RegisterData {
  confirmPassword: string;
  memberNumber?: string;
  agreeToTerms: boolean;
}

export interface ForgotPasswordData {
  emailOrPhone: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface OTPVerificationData {
  emailOrPhone: string;
  otp: string;
}
