import * as yup from 'yup';
import { emailRegex, phoneRegex } from './validation';

export const loginSchema = yup.object().shape({
  emailOrPhone: yup
    .string()
    .required('Email or phone number is required')
    .test('email-or-phone', 'Invalid email or phone number', (value) => {
      if (!value) {
        return false;
      }
      return emailRegex.test(value) || phoneRegex.test(value);
    }),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
  rememberMe: yup.boolean(),
});

export const registerSchema = yup.object().shape({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .matches(/^[a-zA-Z\s]+$/, 'First name must contain only letters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .matches(/^[a-zA-Z\s]+$/, 'Last name must contain only letters'),
  email: yup.string().required('Email is required').matches(emailRegex, 'Invalid email address'),
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(phoneRegex, 'Invalid phone number'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  memberNumber: yup.string().optional(),
  agreeToTerms: yup.boolean().oneOf([true], 'You must agree to the terms and conditions'),
});

export const forgotPasswordSchema = yup.object().shape({
  emailOrPhone: yup
    .string()
    .required('Email or phone number is required')
    .test('email-or-phone', 'Invalid email or phone number', (value) => {
      if (!value) {
        return false;
      }
      return emailRegex.test(value) || phoneRegex.test(value);
    }),
});

export const otpSchema = yup.object().shape({
  otp: yup
    .string()
    .required('OTP is required')
    .matches(/^[0-9]{6}$/, 'OTP must be 6 digits'),
});

export const resetPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('newPassword')], 'Passwords must match'),
});
