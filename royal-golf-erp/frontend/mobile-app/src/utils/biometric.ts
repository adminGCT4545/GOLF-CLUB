import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const rnBiometrics = new ReactNativeBiometrics();

export interface BiometricInfo {
  available: boolean;
  biometryType?: string;
}

export const checkBiometricSupport = async (): Promise<BiometricInfo> => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return { available, biometryType };
  } catch (error) {
    console.error('Error checking biometric support:', error);
    return { available: false };
  }
};

export const authenticateWithBiometric = async (promptMessage?: string): Promise<boolean> => {
  try {
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: promptMessage || 'Authenticate to continue',
    });
    return success;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return false;
  }
};

export const saveBiometricCredentials = async (email: string, password: string): Promise<void> => {
  try {
    const credentials = { email, password };
    await AsyncStorage.setItem('biometricCredentials', JSON.stringify(credentials));
  } catch (error) {
    console.error('Error saving biometric credentials:', error);
    throw error;
  }
};

export const getBiometricCredentials = async (): Promise<{
  email: string;
  password: string;
} | null> => {
  try {
    const stored = await AsyncStorage.getItem('biometricCredentials');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return null;
  }
};

export const removeBiometricCredentials = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('biometricCredentials');
  } catch (error) {
    console.error('Error removing biometric credentials:', error);
  }
};

export const getBiometryTypeText = (biometryType?: string): string => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'Face ID';
    case BiometryTypes.TouchID:
      return 'Touch ID';
    case BiometryTypes.Biometrics:
      return 'Biometrics';
    default:
      return 'Biometric Authentication';
  }
};

export const getBiometryIcon = (biometryType?: string): string => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'face-recognition';
    case BiometryTypes.TouchID:
    case BiometryTypes.Biometrics:
      return 'fingerprint';
    default:
      return 'fingerprint';
  }
};
