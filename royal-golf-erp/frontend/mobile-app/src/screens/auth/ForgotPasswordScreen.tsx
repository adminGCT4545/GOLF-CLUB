import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { Text, Button, Icon } from 'react-native-elements';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, RootState } from '../../store';
import {
  sendOTP,
  verifyOTP,
  resetPassword,
  clearError,
  clearOTPState,
} from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { ForgotPasswordData, OTPVerificationData, ResetPasswordData } from '../../types/auth';
import {
  forgotPasswordSchema,
  otpSchema,
  resetPasswordSchema,
} from '../../utils/validationSchemas';

import FormInput from '../../components/common/FormInput';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorMessage from '../../components/common/ErrorMessage';
import SuccessMessage from '../../components/common/SuccessMessage';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';

type ForgotPasswordScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

type Step = 'email' | 'otp' | 'reset';

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, otpSent, otpVerified, resetToken } = useSelector(
    (state: RootState) => state.auth
  );

  const [step, setStep] = useState<Step>('email');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const otpInputRefs = useRef<TextInput[]>([]);

  // Email/Phone form
  const emailForm = useForm<ForgotPasswordData>({
    resolver: yupResolver(forgotPasswordSchema),
    defaultValues: {
      emailOrPhone: '',
    },
  });

  // OTP form
  const otpForm = useForm<{ otp: string }>({
    resolver: yupResolver(otpSchema),
    defaultValues: {
      otp: '',
    },
  });

  // Reset password form
  const resetForm = useForm<ResetPasswordData>({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  });

  const password = resetForm.watch('newPassword');

  useEffect(() => {
    if (otpSent) {
      setStep('otp');
      setCountdown(120); // 2 minutes countdown
    }
  }, [otpSent]);

  useEffect(() => {
    if (otpVerified && resetToken) {
      setStep('reset');
    }
  }, [otpVerified, resetToken]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    return () => {
      dispatch(clearOTPState());
    };
  }, []);

  const handleSendOTP = async (data: ForgotPasswordData) => {
    try {
      setEmailOrPhone(data.emailOrPhone);
      await dispatch(sendOTP(data)).unwrap();
      setSuccessMessage('OTP sent successfully! Please check your email or SMS.');
    } catch (error) {
      console.error('Send OTP error:', error);
    }
  };

  const handleVerifyOTP = async (data: { otp: string }) => {
    try {
      await dispatch(
        verifyOTP({
          emailOrPhone,
          otp: data.otp,
        })
      ).unwrap();
      setSuccessMessage('OTP verified successfully!');
    } catch (error) {
      console.error('Verify OTP error:', error);
    }
  };

  const handleResetPassword = async (data: ResetPasswordData) => {
    try {
      await dispatch(
        resetPassword({
          ...data,
          token: resetToken!,
        })
      ).unwrap();

      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully. Please login with your new password.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };

  const handleResendOTP = () => {
    if (countdown === 0) {
      handleSendOTP({ emailOrPhone });
    }
  };

  const formatCountdown = () => {
    const minutes = Math.floor(countdown / 60);
    const seconds = countdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const renderStep = () => {
    switch (step) {
      case 'email':
        return (
          <>
            <Text style={styles.description}>
              Enter your email address or phone number and we'll send you an OTP to reset your
              password.
            </Text>

            <FormInput
              control={emailForm.control}
              name="emailOrPhone"
              label="Email or Phone Number"
              placeholder="Enter your email or phone"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Icon name="person" size={20} color="#86939E" />}
            />

            <Button
              title="Send OTP"
              onPress={emailForm.handleSubmit(handleSendOTP)}
              disabled={isLoading}
              buttonStyle={styles.primaryButton}
              titleStyle={styles.buttonTitle}
            />
          </>
        );

      case 'otp':
        return (
          <>
            <Text style={styles.description}>
              We've sent a 6-digit OTP to {emailOrPhone}. Please enter it below.
            </Text>

            <View style={styles.otpContainer}>
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <TextInput
                  key={index}
                  ref={(ref) => ref && (otpInputRefs.current[index] = ref)}
                  style={styles.otpInput}
                  maxLength={1}
                  keyboardType="numeric"
                  onChangeText={(text) => {
                    const otp = otpForm.getValues('otp').split('');
                    otp[index] = text;
                    otpForm.setValue('otp', otp.join(''));

                    if (text && index < 5) {
                      otpInputRefs.current[index + 1]?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && index > 0) {
                      otpInputRefs.current[index - 1]?.focus();
                    }
                  }}
                />
              ))}
            </View>

            {otpForm.formState.errors.otp && (
              <Text style={styles.errorText}>{otpForm.formState.errors.otp.message}</Text>
            )}

            <TouchableOpacity
              onPress={handleResendOTP}
              disabled={countdown > 0}
              style={styles.resendContainer}>
              <Text style={[styles.resendText, countdown > 0 && styles.resendTextDisabled]}>
                {countdown > 0 ? `Resend OTP in ${formatCountdown()}` : 'Resend OTP'}
              </Text>
            </TouchableOpacity>

            <Button
              title="Verify OTP"
              onPress={otpForm.handleSubmit(handleVerifyOTP)}
              disabled={isLoading}
              buttonStyle={styles.primaryButton}
              titleStyle={styles.buttonTitle}
            />
          </>
        );

      case 'reset':
        return (
          <>
            <Text style={styles.description}>
              Create a new password for your account. Make sure it's strong and unique.
            </Text>

            <FormInput
              control={resetForm.control}
              name="newPassword"
              label="New Password"
              placeholder="Enter new password"
              secureTextEntry={!showPassword}
              leftIcon={<Icon name="lock" size={20} color="#86939E" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="#86939E"
                  />
                </TouchableOpacity>
              }
            />

            <PasswordStrengthIndicator password={password || ''} />

            <FormInput
              control={resetForm.control}
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Re-enter new password"
              secureTextEntry={!showConfirmPassword}
              leftIcon={<Icon name="lock-outline" size={20} color="#86939E" />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon
                    name={showConfirmPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color="#86939E"
                  />
                </TouchableOpacity>
              }
            />

            <Button
              title="Reset Password"
              onPress={resetForm.handleSubmit(handleResetPassword)}
              disabled={isLoading}
              buttonStyle={styles.primaryButton}
              titleStyle={styles.buttonTitle}
            />
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          <Text h3 style={styles.title}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'reset' && 'Reset Password'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {error && <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />}

          {successMessage && (
            <SuccessMessage message={successMessage} onDismiss={() => setSuccessMessage('')} />
          )}

          {renderStep()}

          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            style={styles.backToLoginContainer}>
            <Text style={styles.backToLoginText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Please wait..." />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContainer: {
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
    zIndex: 1,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  formContainer: {
    flex: 1,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 45,
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: -15,
    marginBottom: 10,
    textAlign: 'center',
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#999999',
  },
  primaryButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 24,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default ForgotPasswordScreen;
