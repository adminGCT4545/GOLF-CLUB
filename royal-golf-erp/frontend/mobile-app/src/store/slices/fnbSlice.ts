import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  MenuItem,
  FnBOrder,
  FnBOrderItem,
  Reservation,
  MenuCategory,
  DietaryTag,
} from '../../types/commerce';

// POS Integration Types
interface MemberTab {
  id: string;
  tab_number: string;
  member_id: string;
  member_name?: string;
  status: 'open' | 'closed' | 'paid' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  opened_at: string;
  closed_at?: string;
  item_count: number;
}

interface TabItem {
  id: string;
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  added_at: string;
  notes?: string;
}

interface TabPayment {
  id: string;
  tab_id: string;
  payment_amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'member_account' | 'gift_card';
  payment_reference?: string;
  processed_at: string;
}

interface FnBState {
  menu: MenuItem[];
  dailySpecials: MenuItem[];
  categories: MenuCategory[];
  currentOrder: FnBOrderItem[];
  orders: FnBOrder[];
  reservations: Reservation[];
  availableTimeSlots: string[];
  // POS Integration State
  memberTabs: MemberTab[];
  currentTab: MemberTab | null;
  currentTabItems: TabItem[];
  tabPayments: TabPayment[];
  memberInvoices: MemberTab[];
  loading: {
    menu: boolean;
    order: boolean;
    reservation: boolean;
    tabs: boolean;
    payments: boolean;
  };
  error: {
    menu: string | null;
    order: string | null;
    reservation: string | null;
    tabs: string | null;
    payments: string | null;
  };
  filters: {
    category: string | null;
    dietary: DietaryTag[];
    spiceLevel: number | null;
    priceRange: [number, number] | null;
    availability: boolean;
  };
  orderSettings: {
    orderType: 'dine-in' | 'takeaway' | 'delivery';
    scheduledTime?: Date;
    tableNumber?: string;
    specialInstructions?: string;
  };
}

const initialState: FnBState = {
  menu: [],
  dailySpecials: [],
  categories: ['appetizers', 'mains', 'desserts', 'beverages', 'salads', 'soups', 'specials'],
  currentOrder: [],
  orders: [],
  reservations: [],
  availableTimeSlots: [],
  // POS Integration Initial State
  memberTabs: [],
  currentTab: null,
  currentTabItems: [],
  tabPayments: [],
  memberInvoices: [],
  loading: {
    menu: false,
    order: false,
    reservation: false,
    tabs: false,
    payments: false,
  },
  error: {
    menu: null,
    order: null,
    reservation: null,
    tabs: null,
    payments: null,
  },
  filters: {
    category: null,
    dietary: [],
    spiceLevel: null,
    priceRange: null,
    availability: true,
  },
  orderSettings: {
    orderType: 'dine-in',
  },
};

// POS Integration Async Thunks
export const fetchMemberTabs = createAsyncThunk(
  'fnb/fetchMemberTabs',
  async (memberId: string) => {
    const response = await fetch(`/api/v1/tabs/member/${memberId}?status=open`);
    if (!response.ok) {
      throw new Error('Failed to fetch member tabs');
    }
    return response.json();
  }
);

export const fetchMemberInvoices = createAsyncThunk(
  'fnb/fetchMemberInvoices',
  async (memberId: string) => {
    const response = await fetch(`/api/v1/tabs/member/${memberId}/invoices`);
    if (!response.ok) {
      throw new Error('Failed to fetch member invoices');
    }
    return response.json();
  }
);

export const fetchTabDetails = createAsyncThunk(
  'fnb/fetchTabDetails',
  async (tabId: string) => {
    const response = await fetch(`/api/v1/tabs/${tabId}/details`);
    if (!response.ok) {
      throw new Error('Failed to fetch tab details');
    }
    return response.json();
  }
);

export const addToTab = createAsyncThunk(
  'fnb/addToTab',
  async ({ tabId, productId, quantity, specialInstructions }: {
    tabId: string;
    productId: string;
    quantity: number;
    specialInstructions?: string;
  }) => {
    const response = await fetch(`/api/v1/tabs/${tabId}/add-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: productId,
        quantity,
        special_instructions: specialInstructions,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to add item to tab');
    }
    return response.json();
  }
);

export const removeFromTab = createAsyncThunk(
  'fnb/removeFromTab',
  async ({ tabId, itemId }: { tabId: string; itemId: string }) => {
    const response = await fetch(`/api/v1/tabs/${tabId}/remove-item/${itemId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to remove item from tab');
    }
    return { itemId };
  }
);

export const payInvoice = createAsyncThunk(
  'fnb/payInvoice',
  async ({ invoiceId, paymentMethod, paymentReference }: {
    invoiceId: string;
    paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'member_account' | 'gift_card';
    paymentReference?: string;
  }) => {
    const response = await fetch(`/api/v1/tabs/invoices/${invoiceId}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: paymentMethod,
        payment_reference: paymentReference,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to process payment');
    }
    return response.json();
  }
);

export const makeTabPayment = createAsyncThunk(
  'fnb/makeTabPayment',
  async ({ tabId, paymentAmount, paymentMethod, paymentReference }: {
    tabId: string;
    paymentAmount: number;
    paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'member_account' | 'gift_card';
    paymentReference?: string;
  }) => {
    const response = await fetch(`/api/v1/tabs/${tabId}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_amount: paymentAmount,
        payment_method: paymentMethod,
        payment_reference: paymentReference,
      }),
    });
    if (!response.ok) {
      throw new Error('Failed to process tab payment');
    }
    return response.json();
  }
);

// Update menu fetch to use new POS products endpoint
export const fetchMenu = createAsyncThunk(
  'fnb/fetchMenu',
  async (
    params: {
      category?: string;
      dietary?: DietaryTag[];
      available?: boolean;
    } = {}
  ) => {
    const queryParams = new URLSearchParams();
    
    // Filter for F&B products only
    queryParams.append('is_fnb', 'true');
    
    if (params.category) {
      queryParams.append('category', `fnb_${params.category}`);
    }
    if (params.available !== undefined) {
      queryParams.append('available_only', params.available.toString());
    }

    const response = await fetch(`/api/v1/inventory/products?${queryParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch menu');
    }
    const data = await response.json();
    
    // Transform POS product data to menu item format
    return data.products?.map((product: any) => {
      // Get category from the database category field
      let category: MenuCategory = 'mains';
      const cat = (product.category || '').toLowerCase();
      if (cat.includes('appetizer')) category = 'appetizers';
      else if (cat.includes('salad')) category = 'salads';
      else if (cat.includes('dessert')) category = 'desserts';
      else if (cat.includes('beverage')) category = 'beverages';
      else if (cat.includes('sandwich') || cat.includes('main') || cat.includes('entree')) category = 'mains';

      // Get dietary tags from subcategory
      const dietary: DietaryTag[] = [];
      const sub = (product.subcategory || '').toLowerCase();
      if (sub.includes('vegetarian')) dietary.push('vegetarian');
      if (sub.includes('vegan')) dietary.push('vegan');

      return {
        id: product.id,
        name: product.name,
        description: product.description || 'Delicious item from our kitchen',
        price: parseFloat(product.price) || 0,
        category,
        images: ['/images/default-food.jpg'],
        ingredients: [],
        allergens: [],
        nutritionalInfo: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sodium: 0
        },
        dietary,
        spiceLevel: product.name?.toLowerCase().includes('buffalo') ? 2 : 0,
        cookingTime: category === 'beverages' ? 2 : 15,
        isAvailable: (product.stock_quantity || 0) > 0,
        isDailySpecial: false,
        customizations: [],
        portionSizes: [{ id: '1', name: 'Regular', multiplier: 1, additionalPrice: 0 }],
      };
    }) || [];
  }
);

export const fetchDailySpecials = createAsyncThunk('fnb/fetchDailySpecials', async () => {
  const response = await fetch('/api/fnb/specials');
  if (!response.ok) {
    throw new Error('Failed to fetch daily specials');
  }
  return response.json();
});

export const addToOrder = createAsyncThunk(
  'fnb/addToOrder',
  async (item: {
    menuItemId: string;
    quantity: number;
    portionSize?: string;
    customizations: string[];
    specialInstructions?: string;
  }) => {
    const response = await fetch('/api/fnb/order/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      throw new Error('Failed to add item to order');
    }
    return response.json();
  }
);

export const updateOrderItem = createAsyncThunk(
  'fnb/updateOrderItem',
  async ({
    itemId,
    quantity,
    customizations,
  }: {
    itemId: string;
    quantity: number;
    customizations?: string[];
  }) => {
    const response = await fetch(`/api/fnb/order/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity, customizations }),
    });
    if (!response.ok) {
      throw new Error('Failed to update order item');
    }
    return response.json();
  }
);

export const removeFromOrder = createAsyncThunk('fnb/removeFromOrder', async (itemId: string) => {
  const response = await fetch(`/api/fnb/order/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to remove item from order');
  }
  return { itemId };
});

export const submitOrder = createAsyncThunk(
  'fnb/submitOrder',
  async (orderData: {
    items: FnBOrderItem[];
    orderType: 'dine-in' | 'takeaway' | 'delivery';
    scheduledTime?: Date;
    tableNumber?: string;
    specialInstructions?: string;
    paymentMethodId: string;
  }) => {
    const response = await fetch('/api/fnb/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      throw new Error('Failed to submit order');
    }
    return response.json();
  }
);

export const fetchAvailableTimeSlots = createAsyncThunk(
  'fnb/fetchAvailableTimeSlots',
  async (date: string) => {
    const response = await fetch(`/api/fnb/reservations/available-slots?date=${date}`);
    if (!response.ok) {
      throw new Error('Failed to fetch available time slots');
    }
    return response.json();
  }
);

export const createReservation = createAsyncThunk(
  'fnb/createReservation',
  async (reservationData: {
    date: Date;
    time: string;
    partySize: number;
    specialRequests?: string;
    contactNumber: string;
    email: string;
  }) => {
    const response = await fetch('/api/fnb/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData),
    });
    if (!response.ok) {
      throw new Error('Failed to create reservation');
    }
    return response.json();
  }
);

export const fetchReservations = createAsyncThunk('fnb/fetchReservations', async () => {
  const response = await fetch('/api/fnb/reservations');
  if (!response.ok) {
    throw new Error('Failed to fetch reservations');
  }
  return response.json();
});

export const cancelReservation = createAsyncThunk(
  'fnb/cancelReservation',
  async (reservationId: string) => {
    const response = await fetch(`/api/fnb/reservations/${reservationId}/cancel`, {
      method: 'PUT',
    });
    if (!response.ok) {
      throw new Error('Failed to cancel reservation');
    }
    return { reservationId };
  }
);

export const trackOrder = createAsyncThunk('fnb/trackOrder', async (orderId: string) => {
  const response = await fetch(`/api/fnb/orders/${orderId}/track`);
  if (!response.ok) {
    throw new Error('Failed to track order');
  }
  return response.json();
});

export const fetchOrderHistory = createAsyncThunk('fnb/fetchOrderHistory', async () => {
  const response = await fetch('/api/fnb/orders/history');
  if (!response.ok) {
    throw new Error('Failed to fetch order history');
  }
  return response.json();
});

export const reorderPrevious = createAsyncThunk('fnb/reorderPrevious', async (orderId: string) => {
  const response = await fetch(`/api/fnb/orders/${orderId}/reorder`, {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to reorder');
  }
  return response.json();
});

const fnbSlice = createSlice({
  name: 'fnb',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<FnBState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setOrderSettings: (state, action: PayloadAction<Partial<FnBState['orderSettings']>>) => {
      state.orderSettings = { ...state.orderSettings, ...action.payload };
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = [];
    },
    updateOrderStatus: (state, action: PayloadAction<{ orderId: string; status: string }>) => {
      const order = state.orders.find((o) => o.id === action.payload.orderId);
      if (order) {
        order.status = action.payload.status as any;
      }
    },
    addDietaryFilter: (state, action: PayloadAction<DietaryTag>) => {
      if (!state.filters.dietary.includes(action.payload)) {
        state.filters.dietary.push(action.payload);
      }
    },
    removeDietaryFilter: (state, action: PayloadAction<DietaryTag>) => {
      state.filters.dietary = state.filters.dietary.filter((tag) => tag !== action.payload);
    },
    clearFilters: (state) => {
      state.filters = {
        category: null,
        dietary: [],
        spiceLevel: null,
        priceRange: null,
        availability: true,
      };
    },
    clearErrors: (state) => {
      state.error = {
        menu: null,
        order: null,
        reservation: null,
        tabs: null,
        payments: null,
      };
    },
    // POS Integration Reducers
    setCurrentTab: (state, action: PayloadAction<MemberTab | null>) => {
      state.currentTab = action.payload;
    },
    clearCurrentTab: (state) => {
      state.currentTab = null;
      state.currentTabItems = [];
      state.tabPayments = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch menu
      .addCase(fetchMenu.pending, (state) => {
        state.loading.menu = true;
        state.error.menu = null;
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading.menu = false;
        state.menu = action.payload.products || action.payload;
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading.menu = false;
        state.error.menu = action.error.message || 'Failed to fetch menu';
      })
      // Fetch daily specials
      .addCase(fetchDailySpecials.fulfilled, (state, action) => {
        state.dailySpecials = action.payload;
      })
      // Add to order
      .addCase(addToOrder.pending, (state) => {
        state.loading.order = true;
        state.error.order = null;
      })
      .addCase(addToOrder.fulfilled, (state, action) => {
        state.loading.order = false;
        state.currentOrder.push(action.payload);
      })
      .addCase(addToOrder.rejected, (state, action) => {
        state.loading.order = false;
        state.error.order = action.error.message || 'Failed to add to order';
      })
      // Update order item
      .addCase(updateOrderItem.fulfilled, (state, action) => {
        const index = state.currentOrder.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) {
          state.currentOrder[index] = action.payload;
        }
      })
      // Remove from order
      .addCase(removeFromOrder.fulfilled, (state, action) => {
        state.currentOrder = state.currentOrder.filter((item) => item.id !== action.payload.itemId);
      })
      // Submit order
      .addCase(submitOrder.pending, (state) => {
        state.loading.order = true;
        state.error.order = null;
      })
      .addCase(submitOrder.fulfilled, (state, action) => {
        state.loading.order = false;
        state.orders.unshift(action.payload);
        state.currentOrder = [];
      })
      .addCase(submitOrder.rejected, (state, action) => {
        state.loading.order = false;
        state.error.order = action.error.message || 'Failed to submit order';
      })
      // Fetch available time slots
      .addCase(fetchAvailableTimeSlots.fulfilled, (state, action) => {
        state.availableTimeSlots = action.payload;
      })
      // Create reservation
      .addCase(createReservation.pending, (state) => {
        state.loading.reservation = true;
        state.error.reservation = null;
      })
      .addCase(createReservation.fulfilled, (state, action) => {
        state.loading.reservation = false;
        state.reservations.push(action.payload);
      })
      .addCase(createReservation.rejected, (state, action) => {
        state.loading.reservation = false;
        state.error.reservation = action.error.message || 'Failed to create reservation';
      })
      // Fetch reservations
      .addCase(fetchReservations.fulfilled, (state, action) => {
        state.reservations = action.payload;
      })
      // Cancel reservation
      .addCase(cancelReservation.fulfilled, (state, action) => {
        const reservation = state.reservations.find((r) => r.id === action.payload.reservationId);
        if (reservation) {
          reservation.status = 'cancelled';
        }
      })
      // Track order
      .addCase(trackOrder.fulfilled, (state, action) => {
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      // Fetch order history
      .addCase(fetchOrderHistory.fulfilled, (state, action) => {
        state.orders = action.payload;
      })
      // Reorder previous
      .addCase(reorderPrevious.fulfilled, (state, action) => {
        state.currentOrder = action.payload.items;
      })
      // POS Integration Cases
      // Fetch member tabs
      .addCase(fetchMemberTabs.pending, (state) => {
        state.loading.tabs = true;
        state.error.tabs = null;
      })
      .addCase(fetchMemberTabs.fulfilled, (state, action) => {
        state.loading.tabs = false;
        state.memberTabs = action.payload.tabs || [];
      })
      .addCase(fetchMemberTabs.rejected, (state, action) => {
        state.loading.tabs = false;
        state.error.tabs = action.error.message || 'Failed to fetch member tabs';
      })
      // Fetch member invoices
      .addCase(fetchMemberInvoices.fulfilled, (state, action) => {
        state.memberInvoices = action.payload.invoices || [];
      })
      // Fetch tab details
      .addCase(fetchTabDetails.fulfilled, (state, action) => {
        state.currentTab = action.payload.tab;
        state.currentTabItems = action.payload.items || [];
        state.tabPayments = action.payload.payments || [];
      })
      // Add to tab
      .addCase(addToTab.pending, (state) => {
        state.loading.tabs = true;
        state.error.tabs = null;
      })
      .addCase(addToTab.fulfilled, (state, action) => {
        state.loading.tabs = false;
        // Refresh tab details after adding item
        if (state.currentTab) {
          state.currentTab.total_amount += action.payload.added_amount || 0;
        }
      })
      .addCase(addToTab.rejected, (state, action) => {
        state.loading.tabs = false;
        state.error.tabs = action.error.message || 'Failed to add item to tab';
      })
      // Remove from tab
      .addCase(removeFromTab.fulfilled, (state, action) => {
        state.currentTabItems = state.currentTabItems.filter(
          (item) => item.id !== action.payload.itemId
        );
      })
      // Pay invoice
      .addCase(payInvoice.pending, (state) => {
        state.loading.payments = true;
        state.error.payments = null;
      })
      .addCase(payInvoice.fulfilled, (state, action) => {
        state.loading.payments = false;
        // Update invoice status to paid
        const invoice = state.memberInvoices.find((inv) => inv.id === action.meta.arg.invoiceId);
        if (invoice) {
          invoice.status = 'paid';
        }
      })
      .addCase(payInvoice.rejected, (state, action) => {
        state.loading.payments = false;
        state.error.payments = action.error.message || 'Failed to process payment';
      })
      // Make tab payment
      .addCase(makeTabPayment.pending, (state) => {
        state.loading.payments = true;
        state.error.payments = null;
      })
      .addCase(makeTabPayment.fulfilled, (state, action) => {
        state.loading.payments = false;
        // Add payment to tab payments
        state.tabPayments.push(action.payload.payment);
        // Update tab status if needed
        if (action.payload.tab_status && state.currentTab) {
          state.currentTab.status = action.payload.tab_status;
        }
      })
      .addCase(makeTabPayment.rejected, (state, action) => {
        state.loading.payments = false;
        state.error.payments = action.error.message || 'Failed to process tab payment';
      });
  },
});

export const {
  setFilters,
  setOrderSettings,
  clearCurrentOrder,
  updateOrderStatus,
  addDietaryFilter,
  removeDietaryFilter,
  clearFilters,
  clearErrors,
  setCurrentTab,
  clearCurrentTab,
} = fnbSlice.actions;

export default fnbSlice.reducer;
