// Re-export all types for easier importing
export * from './commerce';
export * from './engagement';
export * from './courseConditions';

// Additional common types that might be useful across the app
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
  role: 'member' | 'staff' | 'admin';
  status: 'active' | 'inactive' | 'suspended';
}

export interface Member extends User {
  memberId: string;
  membershipType: 'full' | 'social' | 'junior' | 'corporate';
  joinDate: Date;
  handicap?: number;
  phoneNumber: string;
  address: Address;
  emergencyContact: {
    name: string;
    phoneNumber: string;
    relationship: string;
  };
  preferences: {
    notifications: boolean;
    marketing: boolean;
    newsletter: boolean;
  };
}

// Navigation types for TypeScript navigation
export type RootStackParamList = {
  // Auth screens
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;

  // Main tab navigation
  Home: undefined;
  Bookings: undefined;
  Tournaments: undefined;
  Members: undefined;
  Messages: undefined;
  Profile: undefined;

  // Pro Shop screens
  ProShop: undefined;
  ProductCatalog: {
    category?: string;
    showFilters?: boolean;
    filter?: string;
  };
  ProductDetails: { productId: string };
  ShoppingCart: undefined;
  Checkout: { pointsToUse?: number };
  OrderHistory: undefined;
  PaymentMethods: undefined;

  // F&B screens
  FnBMenu: undefined;
  MenuItemDetails: { menuItemId: string };
  FnBOrder: undefined;
  TableReservation: undefined;

  // Engagement screens
  Leaderboards: undefined;
  Achievements: undefined;
  SocialFeed: undefined;
  CreatePost: {
    shareContent?: string;
    prefilledData?: any;
  };
  PostDetails: { postId: string };
  CourseConditions: undefined;
  Weather: undefined;

  // Shared screens
  OrderDetails: {
    orderId: string;
    orderType: 'proshop' | 'fnb';
  };
  MemberProfile: { userId: string };

  // Other screens
  Settings: undefined;
  Help: undefined;
  About: undefined;
};

export interface NavigationProps {
  navigation: any; // In a real app, type this properly with NavigationProp
  route: any; // In a real app, type this properly with RouteProp
}
