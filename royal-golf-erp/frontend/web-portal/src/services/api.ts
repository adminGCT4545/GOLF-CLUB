import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });
          
          const { token } = response.data;
          localStorage.setItem('token', token);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  logout: () =>
    api.post('/auth/logout'),
  
  refresh: () => {
    const refreshToken = localStorage.getItem('refreshToken');
    return api.post('/auth/refresh', { refreshToken });
  },
  
  getCurrentUser: () =>
    api.get('/auth/me'),
  
  updateProfile: (data: any) =>
    api.put('/auth/profile', data),
  
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/auth/password', data),
};

// Member API
export const memberAPI = {
  getMembers: (params?: any) =>
    api.get('/members', { params }),
  
  getMember: (id: string) =>
    api.get(`/members/${id}`),
  
  updateMember: (id: string, data: any) =>
    api.put(`/members/${id}`, data),
  
  getMemberStats: (id: string) =>
    api.get(`/members/${id}/stats`),
  
  getMemberDirectory: (params?: any) =>
    api.get('/members/directory', { params }),
};

// Booking API
export const bookingAPI = {
  getBookings: (params?: any) =>
    api.get('/bookings', { params }),
  
  createBooking: (data: any) =>
    api.post('/bookings', data),
  
  updateBooking: (id: string, data: any) =>
    api.put(`/bookings/${id}`, data),
  
  cancelBooking: (id: string) =>
    api.delete(`/bookings/${id}`),
  
  getTeeTimeAvailability: (date: string, courseId?: string) =>
    api.get('/bookings/availability', { params: { date, courseId } }),
  
  getUpcomingBookings: () =>
    api.get('/bookings/upcoming'),
};

// Tournament API
export const tournamentAPI = {
  getTournaments: (params?: any) =>
    api.get('/tournaments', { params }),
  
  getTournament: (id: string) =>
    api.get(`/tournaments/${id}`),
  
  registerForTournament: (id: string, data?: any) =>
    api.post(`/tournaments/${id}/register`, data),
  
  unregisterFromTournament: (id: string) =>
    api.delete(`/tournaments/${id}/register`),
  
  getTournamentLeaderboard: (id: string) =>
    api.get(`/tournaments/${id}/leaderboard`),
  
  submitScore: (tournamentId: string, roundId: string, data: any) =>
    api.post(`/tournaments/${tournamentId}/rounds/${roundId}/scores`, data),
};

// Message API
export const messageAPI = {
  getConversations: () =>
    api.get('/messages/conversations'),
  
  getMessages: (conversationId: string, params?: any) =>
    api.get(`/messages/conversations/${conversationId}`, { params }),
  
  sendMessage: (data: any) =>
    api.post('/messages', data),
  
  markAsRead: (messageId: string) =>
    api.put(`/messages/${messageId}/read`),
  
  createConversation: (data: any) =>
    api.post('/messages/conversations', data),
  
  getUnreadCount: () =>
    api.get('/messages/unread-count'),
};

// Event API
export const eventAPI = {
  getEvents: (params?: any) =>
    api.get('/events', { params }),
  
  getEvent: (id: string) =>
    api.get(`/events/${id}`),
  
  registerForEvent: (id: string, data?: any) =>
    api.post(`/events/${id}/register`, data),
  
  unregisterFromEvent: (id: string) =>
    api.delete(`/events/${id}/register`),
  
  getUpcomingEvents: () =>
    api.get('/events/upcoming'),
};

// Pro Shop API
export const proShopAPI = {
  getProducts: (params?: any) =>
    api.get('/inventory/products', { params: { ...params, is_proshop: true } }),
  
  getProduct: (id: string) =>
    api.get(`/inventory/products/${id}`),
  
  getCategories: () =>
    api.get('/inventory/categories'),
  
  createProduct: (data: any) =>
    api.post('/inventory/products', data),
  
  updateProduct: (id: string, data: any) =>
    api.put(`/inventory/products/${id}`, data),
  
  adjustStock: (data: any) =>
    api.post('/inventory/stock-adjustment', data),
  
  getLowStock: () =>
    api.get('/inventory/low-stock'),
  
  getMovements: (params?: any) =>
    api.get('/inventory/movements', { params }),
  
  getValuationReport: () =>
    api.get('/inventory/reports/valuation'),
  
  createOrder: (data: any) =>
    api.post('/proshop/orders', data),
  
  getOrders: (params?: any) =>
    api.get('/proshop/orders', { params }),
  
  getOrder: (id: string) =>
    api.get(`/proshop/orders/${id}`),
};

// F&B API - Updated to match backend routes
export const fnbAPI = {
  getMenuItems: (params?: any) =>
    api.get('/inventory/products', { params: { ...params, is_fnb: true } }),
  
  getMenuItem: (id: string) =>
    api.get(`/inventory/products/${id}`),
  
  // Tab management
  getMemberTabs: (memberId: string, status?: string) =>
    api.get(`/tabs/member/${memberId}`, { params: { status } }),
  
  openTab: (data: { member_id: string; notes?: string }) =>
    api.post('/tabs/open', data),
  
  addItemToTab: (tabId: string, data: { product_id: string; quantity: number; special_instructions?: string }) =>
    api.post(`/tabs/${tabId}/add-item`, data),
  
  removeItemFromTab: (tabId: string, itemId: string) =>
    api.delete(`/tabs/${tabId}/remove-item/${itemId}`),
  
  closeTab: (tabId: string, notes?: string) =>
    api.post(`/tabs/${tabId}/close`, { notes }),
  
  payTab: (tabId: string, data: { payment_amount: number; payment_method: string; payment_reference?: string }) =>
    api.post(`/tabs/${tabId}/payment`, data),
  
  getTabDetails: (tabId: string) =>
    api.get(`/tabs/${tabId}/details`),
  
  // Invoice management
  getInvoices: (params?: any) =>
    api.get('/tabs/invoices', { params }),
  
  getMemberInvoices: (memberId: string) =>
    api.get(`/tabs/member/${memberId}/invoices`),
  
  payInvoice: (invoiceId: string, data: { payment_method: string; payment_reference?: string }) =>
    api.post(`/tabs/invoices/${invoiceId}/pay`, data),
  
  // POS Operations
  createPOSTransaction: (data: any) =>
    api.post('/pos/transactions', data),
  
  getPOSTransactions: (params?: any) =>
    api.get('/pos/transactions', { params }),
  
  processRefund: (transactionId: string, data: { refund_amount: number; reason: string; items?: any[] }) =>
    api.post(`/pos/transactions/${transactionId}/refund`, data),
};

// Financial API
export const financialAPI = {
  getTransactions: (params?: any) =>
    api.get('/financial/transactions', { params }),
  
  getStatements: (params?: any) =>
    api.get('/financial/statements', { params }),
  
  makePayment: (data: any) =>
    api.post('/financial/payments', data),
  
  getPaymentMethods: () =>
    api.get('/financial/payment-methods'),
  
  addPaymentMethod: (data: any) =>
    api.post('/financial/payment-methods', data),
  
  getOutstandingBalance: () =>
    api.get('/financial/balance'),
};

// Financial ERP API
export const erpAPI = {
  // Executive Dashboard
  getExecutiveDashboard: () =>
    api.get('/erp/executive/dashboard'),
  
  // Revenue Management
  getRevenueSummary: (params?: { period?: string; start_date?: string; end_date?: string }) =>
    api.get('/erp/revenue/summary', { params }),
  
  getRevenueStreams: (params?: { stream_type?: string; department?: string }) =>
    api.get('/erp/revenue/streams', { params }),
  
  getLiveRevenue: (params?: { dashboard_type?: string }) =>
    api.get('/erp/revenue/live', { params }),
  
  createRevenueTransaction: (data: any) =>
    api.post('/erp/revenue/transaction', data),
  
  // Expense Management
  getExpenseSummary: (params?: { category?: string; department?: string; period?: string }) =>
    api.get('/erp/expenses/summary', { params }),
  
  createExpense: (data: any) =>
    api.post('/erp/expenses/create', data),
  
  approveExpense: (id: string, data: { approved_by: string; notes?: string }) =>
    api.put(`/erp/expenses/${id}/approve`, data),
  
  getBudgetVariance: (params: { department: string; period: string }) =>
    api.get('/erp/expenses/budget-variance', { params }),
  
  // Member Analytics
  getMemberSpendingPatterns: (params?: { member_id?: string; segment?: string; period?: string }) =>
    api.get('/erp/members/spending-patterns', { params }),
  
  getRetentionAnalysis: (params?: { risk_level?: string; lifecycle_stage?: string }) =>
    api.get('/erp/members/retention-analysis', { params }),
  
  getMemberLifetimeValue: (params?: { member_id?: string; calculation_method?: string }) =>
    api.get('/erp/members/lifetime-value', { params }),
  
  updateEngagementScore: (data: { member_id: string; factors: any }) =>
    api.post('/erp/members/engagement-score', data),
  
  // KPI Dashboard
  getKPIMetrics: (params?: { metric_type?: string; date?: string; department?: string }) =>
    api.get('/erp/kpi/metrics', { params }),
  
  // Financial Reports
  getProfitLossStatement: (params: { period_start: string; period_end: string; department?: string }) =>
    api.get('/erp/reports/profit-loss', { params }),
  
  getCashFlowStatement: (params: { period_start: string; period_end: string }) =>
    api.get('/erp/reports/cash-flow', { params }),
  
  getBudgetReport: (params: { period: string; department?: string }) =>
    api.get('/erp/reports/budget', { params }),
  
  getMemberAnalyticsReport: (params: { period_start: string; period_end: string }) =>
    api.get('/erp/reports/member-analytics', { params }),
  
  // Real-time Data
  getRealtimeMetrics: () =>
    api.get('/erp/realtime/metrics'),
  
  // Export functionality
  exportReport: (reportType: string, params: any) =>
    api.get(`/erp/export/${reportType}`, { params, responseType: 'blob' }),
};

// AI API
export const aiAPI = {
  chat: (data: { message: string; conversationId?: string }) =>
    api.post('/ai/chat', data),
  
  getConversationHistory: (conversationId: string) =>
    api.get(`/ai/conversations/${conversationId}`),
  
  uploadDocument: (formData: FormData) =>
    api.post('/ai/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  
  processDocument: (documentId: string) =>
    api.post(`/ai/documents/${documentId}/process`),
  
  getInsights: (type: string, params?: any) =>
    api.get(`/ai/insights/${type}`, { params }),
};

// Utility function for downloading exported files
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default api;
