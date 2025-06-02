import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Product,
  CartItem,
  Order,
  PaymentMethod,
  PromoCode,
  LoyaltyProgram,
  WishlistItem,
  ProductCategory,
} from '../../types/commerce';

interface CommerceState {
  products: Product[];
  featuredProducts: Product[];
  categories: ProductCategory[];
  cart: CartItem[];
  orders: Order[];
  paymentMethods: PaymentMethod[];
  wishlist: WishlistItem[];
  loyaltyProgram: LoyaltyProgram | null;
  appliedPromoCode: PromoCode | null;
  loading: {
    products: boolean;
    cart: boolean;
    orders: boolean;
    payment: boolean;
  };
  error: {
    products: string | null;
    cart: string | null;
    orders: string | null;
    payment: string | null;
  };
  filters: {
    category: string | null;
    priceRange: [number, number] | null;
    brand: string | null;
    inStock: boolean;
    sortBy: 'name' | 'price-low' | 'price-high' | 'rating' | 'popularity';
  };
  searchQuery: string;
}

const initialState: CommerceState = {
  products: [],
  featuredProducts: [],
  categories: ['apparel', 'equipment', 'accessories', 'shoes', 'bags', 'gift-cards'],
  cart: [],
  orders: [],
  paymentMethods: [],
  wishlist: [],
  loyaltyProgram: null,
  appliedPromoCode: null,
  loading: {
    products: false,
    cart: false,
    orders: false,
    payment: false,
  },
  error: {
    products: null,
    cart: null,
    orders: null,
    payment: null,
  },
  filters: {
    category: null,
    priceRange: null,
    brand: null,
    inStock: true,
    sortBy: 'popularity',
  },
  searchQuery: '',
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'commerce/fetchProducts',
  async (params: {
    category?: string;
    search?: string;
    priceRange?: [number, number];
    brand?: string;
    sortBy?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });

    const response = await fetch(`/api/proshop/products?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  'commerce/fetchFeaturedProducts',
  async () => {
    const response = await fetch('/api/proshop/products/featured');
    if (!response.ok) {
      throw new Error('Failed to fetch featured products');
    }
    return response.json();
  }
);

export const addToCart = createAsyncThunk(
  'commerce/addToCart',
  async (item: {
    productId: string;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
    customizations?: string;
  }) => {
    const response = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }
    return response.json();
  }
);

export const updateCartItem = createAsyncThunk(
  'commerce/updateCartItem',
  async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) {
      throw new Error('Failed to update cart item');
    }
    return response.json();
  }
);

export const removeFromCart = createAsyncThunk(
  'commerce/removeFromCart',
  async (itemId: string) => {
    const response = await fetch(`/api/cart/items/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove item from cart');
    }
    return { itemId };
  }
);

export const applyPromoCode = createAsyncThunk('commerce/applyPromoCode', async (code: string) => {
  const response = await fetch('/api/promo/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!response.ok) {
    throw new Error('Invalid promo code');
  }
  return response.json();
});

export const processPayment = createAsyncThunk(
  'commerce/processPayment',
  async (paymentData: {
    paymentMethodId: string;
    amount: number;
    currency: string;
    usePoints?: number;
  }) => {
    const response = await fetch('/api/payments/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) {
      throw new Error('Payment failed');
    }
    return response.json();
  }
);

export const fetchOrderHistory = createAsyncThunk('commerce/fetchOrderHistory', async () => {
  const response = await fetch('/api/orders/history');
  if (!response.ok) {
    throw new Error('Failed to fetch order history');
  }
  return response.json();
});

export const trackOrder = createAsyncThunk('commerce/trackOrder', async (orderId: string) => {
  const response = await fetch(`/api/orders/${orderId}/track`);
  if (!response.ok) {
    throw new Error('Failed to track order');
  }
  return response.json();
});

export const addToWishlist = createAsyncThunk(
  'commerce/addToWishlist',
  async (productId: string) => {
    const response = await fetch('/api/wishlist/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId }),
    });
    if (!response.ok) {
      throw new Error('Failed to add to wishlist');
    }
    return response.json();
  }
);

export const removeFromWishlist = createAsyncThunk(
  'commerce/removeFromWishlist',
  async (productId: string) => {
    const response = await fetch(`/api/wishlist/remove/${productId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove from wishlist');
    }
    return { productId };
  }
);

export const scanBarcode = createAsyncThunk('commerce/scanBarcode', async (barcode: string) => {
  const response = await fetch(`/api/products/barcode/${barcode}`);
  if (!response.ok) {
    throw new Error('Product not found');
  }
  return response.json();
});

const commerceSlice = createSlice({
  name: 'commerce',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<CommerceState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearCart: (state) => {
      state.cart = [];
    },
    clearPromoCode: (state) => {
      state.appliedPromoCode = null;
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const order = state.orders.find((o) => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status as any;
        order.updatedAt = new Date();
      }
    },
    clearErrors: (state) => {
      state.error = {
        products: null,
        cart: null,
        orders: null,
        payment: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading.products = true;
        state.error.products = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading.products = false;
        state.products = action.payload.products;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading.products = false;
        state.error.products = action.error.message || 'Failed to fetch products';
      })
      // Fetch featured products
      .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
        state.featuredProducts = action.payload;
      })
      // Add to cart
      .addCase(addToCart.pending, (state) => {
        state.loading.cart = true;
        state.error.cart = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        state.loading.cart = false;
        state.cart.push(action.payload);
      })
      .addCase(addToCart.rejected, (state, action) => {
        state.loading.cart = false;
        state.error.cart = action.error.message || 'Failed to add to cart';
      })
      // Update cart item
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const index = state.cart.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.cart[index] = action.payload;
        }
      })
      // Remove from cart
      .addCase(removeFromCart.fulfilled, (state, action) => {
        state.cart = state.cart.filter((item) => item.id !== action.payload.itemId);
      })
      // Apply promo code
      .addCase(applyPromoCode.fulfilled, (state, action) => {
        state.appliedPromoCode = action.payload;
      })
      // Process payment
      .addCase(processPayment.pending, (state) => {
        state.loading.payment = true;
        state.error.payment = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.loading.payment = false;
        state.orders.unshift(action.payload.order);
        state.cart = [];
        state.appliedPromoCode = null;
        if (action.payload.loyaltyPoints) {
          if (state.loyaltyProgram) {
            state.loyaltyProgram.points = action.payload.loyaltyPoints;
          }
        }
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading.payment = false;
        state.error.payment = action.error.message || 'Payment failed';
      })
      // Fetch order history
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      // Track order
      .addCase(trackOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      // Wishlist actions
      .addCase(addToWishlist.fulfilled, (state, action) => {
        state.wishlist.push(action.payload);
      })
      .addCase(removeFromWishlist.fulfilled, (state, action) => {
        state.wishlist = state.wishlist.filter(
          (item) => item.productId !== action.payload.productId
        );
      })
      // Barcode scan
      .addCase(scanBarcode.fulfilled, (state, action) => {
        // Add scanned product to featured or update product list
        const existingIndex = state.products.findIndex((p) => p.id === action.payload.id);
        if (existingIndex !== -1) {
          state.products[existingIndex] = action.payload;
        } else {
          state.products.unshift(action.payload);
        }
      });
  },
});

export const {
  setSearchQuery,
  setFilters,
  clearCart,
  clearPromoCode,
  updateOrderStatus,
  clearErrors,
} = commerceSlice.actions;

export default commerceSlice.reducer;
