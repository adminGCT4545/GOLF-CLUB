import { Platform } from 'react-native';

// API Configuration
const DEV_API_URL = Platform.select({
  ios: 'http://localhost:3000/api',
  android: 'http://10.0.2.2:3000/api',
});

const PROD_API_URL = 'https://api.royalgolfclub.com/api';

export const API_BASE_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;
export const WS_BASE_URL = __DEV__
  ? API_BASE_URL.replace('/api', '').replace('http', 'ws')
  : 'wss://api.royalgolfclub.com';

// App Configuration
export const APP_NAME = 'Royal Golf Club';
export const APP_VERSION = '1.0.0';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  FCM_TOKEN: 'fcm_token',
  THEME: 'theme',
  LANGUAGE: 'language',
};

// Time Formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const TIME_FORMAT = 'HH:mm';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Image Upload
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

// Booking Configuration
export const BOOKING_RULES = {
  MAX_ADVANCE_DAYS: 30,
  MIN_ADVANCE_HOURS: 24,
  MAX_PLAYERS_PER_BOOKING: 4,
  CANCELLATION_HOURS: 24,
};
