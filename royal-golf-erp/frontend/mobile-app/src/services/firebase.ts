import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export const initializeFirebase = async () => {
  try {
    // Request permission for iOS
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Push notification permission denied');
        return;
      }
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      await AsyncStorage.setItem('fcmToken', fcmToken);
      // TODO: Send token to backend
      console.log('FCM Token:', fcmToken);
    }

    // Handle token refresh
    messaging().onTokenRefresh(async (token) => {
      await AsyncStorage.setItem('fcmToken', token);
      // TODO: Update token on backend
    });

    // Handle foreground messages
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      // TODO: Show local notification
    });

    return unsubscribe;
  } catch (error) {
    console.error('Firebase initialization error:', error);
  }
};

export const handleBackgroundMessage = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    // TODO: Handle background message
  });
};
