import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Button, Icon, CheckBox } from 'react-native-elements';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppDispatch, RootState } from '../../store';
import { login, enableBiometric, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { LoginFormData } from '../../types/auth';
import { loginSchema } from '../../utils/validationSchemas';
import { emailRegex } from '../../utils/validation';
import {
  checkBiometricSupport,
  authenticateWithBiometric,
  saveBiometricCredentials,
  getBiometricCredentials,
  getBiometryTypeText,
  getBiometryIcon,
} from '../../utils/biometric';

import FormInput from '../../components/common/FormInput';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorMessage from '../../components/common/ErrorMessage';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error, biometricEnabled } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [biometryType, setBiometryType] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false,
    },
  });

  useEffect(() => {
    initializeBiometrics();
    loadRememberedCredentials();
  }, []);

  const initializeBiometrics = async () => {
    const { available, biometryType } = await checkBiometricSupport();
    if (available && biometryType) {
      setBiometryType(biometryType);
    }
  };

  const loadRememberedCredentials = async () => {
    try {
      const rememberedEmail = await AsyncStorage.getItem('rememberedEmail');
      if (rememberedEmail) {
        setValue('emailOrPhone', rememberedEmail);
        setValue('rememberMe', true);
      }
    } catch (error) {
      console.log('Error loading remembered credentials:', error);
    }
  };

  const handleBiometricLogin = async () => {
    try {
      const success = await authenticateWithBiometric('Authenticate to login');

      if (success) {
        const credentials = await getBiometricCredentials();
        if (credentials) {
          await dispatch(login(credentials)).unwrap();
        } else {
          Alert.alert(
            'Biometric Login Not Set Up',
            'Please login with your credentials first and enable biometric authentication.'
          );
        }
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert('Authentication Failed', 'Please try again or use your credentials.');
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Determine if input is email or phone
      const isEmail = emailRegex.test(data.emailOrPhone);
      const credentials = {
        email: isEmail ? data.emailOrPhone : '',
        password: data.password,
        phoneNumber: !isEmail ? data.emailOrPhone : undefined,
      };

      await dispatch(login(credentials as any)).unwrap();

      // Handle remember me
      if (data.rememberMe) {
        await AsyncStorage.setItem('rememberedEmail', data.emailOrPhone);
      } else {
        await AsyncStorage.removeItem('rememberedEmail');
      }

      // If biometric is available and not yet enabled, ask user
      if (biometryType && !biometricEnabled) {
        Alert.alert(
          'Enable Biometric Authentication',
          `Would you like to enable ${getBiometryTypeText(biometryType)} for faster login?`,
          [
            { text: 'Not Now', style: 'cancel' },
            {
              text: 'Enable',
              onPress: async () => {
                await saveBiometricCredentials(
                  credentials.email || data.emailOrPhone,
                  credentials.password
                );
                dispatch(enableBiometric(true));
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
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
          <Icon name="golf-course" size={60} color="#2E7D32" />
          <Text h2 style={styles.title}>
            Royal Golf Club
          </Text>
          <Text style={styles.subtitle}>Welcome back!</Text>
        </View>

        <View style={styles.formContainer}>
          {error && <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />}

          <FormInput
            control={control}
            name="emailOrPhone"
            label="Email or Phone Number"
            placeholder="Enter your email or phone"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Icon name="person" size={20} color="#86939E" />}
            rules={{
              required: 'Email or phone number is required',
            }}
          />

          <FormInput
            control={control}
            name="password"
            label="Password"
            placeholder="Enter your password"
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
            rules={{
              required: 'Password is required',
            }}
          />

          <View style={styles.optionsContainer}>
            <Controller
              control={control}
              name="rememberMe"
              render={({
                field: { value, onChange },
              }: {
                field: { value: boolean; onChange: (value: boolean) => void };
              }) => (
                <CheckBox
                  title="Remember me"
                  checked={value || false}
                  onPress={() => onChange(!value)}
                  containerStyle={styles.checkboxContainer}
                  textStyle={styles.checkboxText}
                  checkedColor="#2E7D32"
                />
              )}
            />
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            buttonStyle={styles.signInButton}
            titleStyle={styles.buttonTitle}
          />

          {biometryType && biometricEnabled && (
            <Button
              title={`Login with ${getBiometryTypeText(biometryType)}`}
              onPress={handleBiometricLogin}
              type="outline"
              icon={
                <Icon
                  name={getBiometryIcon(biometryType)}
                  size={20}
                  color="#2E7D32"
                  style={{ marginRight: 8 }}
                />
              }
              buttonStyle={styles.biometricButton}
              titleStyle={styles.biometricButtonTitle}
            />
          )}

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Signing in..." />
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
    paddingVertical: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
  },
  title: {
    color: '#2E7D32',
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  formContainer: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    flex: 1,
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  checkboxText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: 'normal',
  },
  forgotPassword: {
    paddingVertical: 8,
  },
  forgotPasswordText: {
    color: '#2E7D32',
    fontSize: 14,
  },
  signInButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 16,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  biometricButton: {
    borderColor: '#2E7D32',
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 24,
  },
  biometricButtonTitle: {
    color: '#2E7D32',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666666',
    fontSize: 14,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signUpText: {
    fontSize: 14,
    color: '#666666',
  },
  signUpLink: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default LoginScreen;
