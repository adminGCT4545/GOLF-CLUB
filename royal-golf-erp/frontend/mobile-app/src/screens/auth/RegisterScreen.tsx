import React, { useState } from 'react';
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

import { AppDispatch, RootState } from '../../store';
import { register, clearError } from '../../store/slices/authSlice';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { RegisterFormData } from '../../types/auth';
import { registerSchema } from '../../utils/validationSchemas';

import FormInput from '../../components/common/FormInput';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import ErrorMessage from '../../components/common/ErrorMessage';
import PasswordStrengthIndicator from '../../components/common/PasswordStrengthIndicator';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      memberNumber: '',
      agreeToTerms: false,
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const { confirmPassword, agreeToTerms, memberNumber, ...registerData } = data;

      // Add default membership type for new registrations
      const registrationData = {
        ...registerData,
        membershipType: 'ASSOCIATE', // Default membership type
        memberNumber: memberNumber || undefined,
      };

      await dispatch(register(registrationData)).unwrap();

      Alert.alert(
        'Registration Successful',
        'Welcome to Royal Golf Club! You can now sign in with your credentials.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      console.error('Registration error:', error);
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
            Create Account
          </Text>
          <Text style={styles.subtitle}>Join the Royal Golf Club community</Text>
        </View>

        <View style={styles.formContainer}>
          {error && <ErrorMessage message={error} onDismiss={() => dispatch(clearError())} />}

          <View style={styles.nameContainer}>
            <View style={styles.nameField}>
              <FormInput
                control={control}
                name="firstName"
                label="First Name"
                placeholder="John"
                autoCapitalize="words"
                leftIcon={<Icon name="person" size={20} color="#86939E" />}
              />
            </View>
            <View style={styles.nameField}>
              <FormInput
                control={control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                autoCapitalize="words"
              />
            </View>
          </View>

          <FormInput
            control={control}
            name="email"
            label="Email"
            placeholder="john.doe@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Icon name="email" size={20} color="#86939E" />}
          />

          <FormInput
            control={control}
            name="phoneNumber"
            label="Phone Number"
            placeholder="+1 (555) 123-4567"
            keyboardType="phone-pad"
            leftIcon={<Icon name="phone" size={20} color="#86939E" />}
          />

          <FormInput
            control={control}
            name="password"
            label="Password"
            placeholder="Create a strong password"
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
            control={control}
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter your password"
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

          <FormInput
            control={control}
            name="memberNumber"
            label="Member Number (Optional)"
            placeholder="Enter if you have an existing member number"
            keyboardType="numeric"
            leftIcon={<Icon name="badge" size={20} color="#86939E" />}
          />

          <Controller
            control={control}
            name="agreeToTerms"
            render={({ field: { value, onChange }, fieldState: { error } }) => (
              <View>
                <CheckBox
                  title={
                    <View style={styles.termsContainer}>
                      <Text style={styles.termsText}>I agree to the </Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Terms & Conditions', 'Terms and conditions content here.')
                        }>
                        <Text style={styles.termsLink}>Terms & Conditions</Text>
                      </TouchableOpacity>
                      <Text style={styles.termsText}> and </Text>
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert('Privacy Policy', 'Privacy policy content here.')
                        }>
                        <Text style={styles.termsLink}>Privacy Policy</Text>
                      </TouchableOpacity>
                    </View>
                  }
                  checked={value || false}
                  onPress={() => onChange(!value)}
                  containerStyle={styles.checkboxContainer}
                  checkedColor="#2E7D32"
                />
                {error && <Text style={styles.checkboxError}>{error.message}</Text>}
              </View>
            )}
          />

          <Button
            title="Sign Up"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
            buttonStyle={styles.signUpButton}
            titleStyle={styles.buttonTitle}
          />

          <View style={styles.signInContainer}>
            <Text style={styles.signInText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signInLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <LoadingOverlay visible={isLoading} message="Creating your account..." />
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
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    marginHorizontal: -5,
  },
  nameField: {
    flex: 1,
    marginHorizontal: 5,
  },
  termsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: '#666666',
  },
  termsLink: {
    fontSize: 14,
    color: '#2E7D32',
    textDecorationLine: 'underline',
  },
  checkboxContainer: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginLeft: 0,
    marginRight: 0,
    paddingHorizontal: 0,
    marginBottom: 20,
  },
  checkboxError: {
    color: '#F44336',
    fontSize: 12,
    marginLeft: 10,
    marginTop: -15,
    marginBottom: 10,
  },
  signUpButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 14,
    marginBottom: 24,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signInText: {
    fontSize: 14,
    color: '#666666',
  },
  signInLink: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
  },
});

export default RegisterScreen;
