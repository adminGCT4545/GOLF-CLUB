export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: ProductCategory;
  brand: string;
  images: string[];
  rating: number;
  reviewCount: number;
  inStock: boolean;
  stockQuantity: number;
  sizes?: string[];
  colors?: string[];
  sku: string;
  barcode?: string;
  specifications?: { [key: string]: string };
  tags: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  loyaltyPoints: number;
  memberDiscount?: number;
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  customizations?: string;
  addedAt: Date;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: 'proshop' | 'fnb';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  loyaltyPointsUsed: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  deliveryType: 'pickup' | 'delivery';
  deliveryAddress?: Address;
  estimatedReady?: Date;
  placedAt: Date;
  updatedAt: Date;
  specialInstructions?: string;
  memberId?: string;
  promoCode?: string;
}

export interface OrderItem {
  id: string;
  productId?: string;
  menuItemId?: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string;
  image?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  images: string[];
  ingredients: string[];
  allergens: string[];
  nutritionalInfo: NutritionalInfo;
  dietary: DietaryTag[];
  spiceLevel?: number;
  cookingTime: number;
  isAvailable: boolean;
  isDailySpecial?: boolean;
  customizations: Customization[];
  portionSizes: PortionSize[];
}

export interface FnBOrder {
  id: string;
  orderNumber: string;
  items: FnBOrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  orderType: 'dine-in' | 'takeaway' | 'delivery';
  tableNumber?: string;
  estimatedTime: number;
  specialInstructions?: string;
  placedAt: Date;
  reservationId?: string;
}

export interface FnBOrderItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
  portionSize?: string;
  customizations: string[];
  specialInstructions?: string;
  price: number;
}

export interface Reservation {
  id: string;
  memberId: string;
  memberName: string;
  date: Date;
  time: string;
  partySize: number;
  tableNumber?: string;
  specialRequests?: string;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled';
  contactNumber: string;
  email: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'member-account' | 'cash' | 'digital-wallet';
  cardLast4?: string;
  cardType?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  nickname?: string;
}

export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

export type ProductCategory =
  | 'apparel'
  | 'equipment'
  | 'accessories'
  | 'shoes'
  | 'bags'
  | 'gift-cards';

export type MenuCategory =
  | 'appetizers'
  | 'mains'
  | 'desserts'
  | 'beverages'
  | 'salads'
  | 'soups'
  | 'specials';

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'keto'
  | 'low-carb'
  | 'halal'
  | 'kosher';

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
}

export interface Customization {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  additionalPrice: number;
}

export interface PortionSize {
  id: string;
  name: string;
  multiplier: number;
  additionalPrice: number;
}

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minimumAmount?: number;
  expiryDate: Date;
  isValid: boolean;
}

export interface LoyaltyProgram {
  memberId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnRate: number;
  redemptionRate: number;
}

export interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  addedAt: Date;
}

export interface Review {
  id: string;
  productId?: string;
  menuItemId?: string;
  orderId: string;
  memberId: string;
  memberName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  images?: string[];
}
