import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Box } from '@mui/material';
import { RootState, AppDispatch } from './store/store';
import { getCurrentUser } from './store/slices/authSlice';

// Components
import Layout from './components/Layout/Layout';
import LoginPage from './pages/Auth/LoginPage';
import Dashboard from './pages/Dashboard/Dashboard';
import BookingsPage from './pages/Bookings/BookingsPage';
import TournamentsPage from './pages/Tournaments/TournamentsPage';
import MessagesPage from './pages/Messages/MessagesPage';
import MemberDirectoryPage from './pages/Members/MemberDirectoryPage';
import ProShopPage from './pages/ProShop/ProShopPage';
import SalesPage from './pages/ProShop/SalesPage';
import ProductsPage from './pages/ProShop/ProductsPage';
import ProShopSettingsPage from './pages/ProShop/ProShopSettingsPage';
import EmployeeManagementPage from './pages/Employees/EmployeeManagementPage';
import EmployeeDirectoryPage from './pages/Employees/EmployeeDirectoryPage';
import TimekeepingPage from './pages/Employees/TimekeepingPage';
import TimeReportsPage from './pages/Employees/TimeReportsPage';
import EmployeeSettingsPage from './pages/Employees/EmployeeSettingsPage';
import FnBSalesPage from './pages/FnB/FnBSalesPage';
import FnBMenuItemsPage from './pages/FnB/FnBMenuItemsPage';
import FnBSettingsPage from './pages/FnB/FnBSettingsPage';
import ProfilePage from './pages/Profile/ProfilePage';
import FinancialPage from './pages/Financial/FinancialPage';
import FinancialERPDashboard from './pages/Financial/FinancialERPDashboard';
import RevenueAnalyticsSimple from './pages/Financial/RevenueAnalyticsSimple';
import ExpenseManagement from './pages/Financial/ExpenseManagement';
import MemberAnalytics from './pages/Financial/MemberAnalytics';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, token, loading } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on app load
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, token, isAuthenticated]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          } 
        />
        
        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/bookings" element={<BookingsPage />} />
                  <Route path="/tournaments" element={<TournamentsPage />} />
                  <Route path="/messages" element={<MessagesPage />} />
                  <Route path="/members" element={<MemberDirectoryPage />} />
                  <Route path="/employees" element={<Navigate to="/employees/timekeeping" replace />} />
                  <Route path="/employees/timekeeping" element={<TimekeepingPage />} />
                  <Route path="/employees/directory" element={<EmployeeDirectoryPage />} />
                  <Route path="/employees/reports" element={<TimeReportsPage />} />
                  <Route path="/employees/settings" element={<EmployeeSettingsPage />} />
                  <Route path="/proshop" element={<Navigate to="/proshop/sales" replace />} />
                  <Route path="/proshop/sales" element={<SalesPage />} />
                  <Route path="/proshop/products" element={<ProductsPage />} />
                  <Route path="/proshop/settings" element={<ProShopSettingsPage />} />
                  <Route path="/fnb" element={<Navigate to="/fnb/sales" replace />} />
                  <Route path="/fnb/sales" element={<FnBSalesPage />} />
                  <Route path="/fnb/menu-items" element={<FnBMenuItemsPage />} />
                  <Route path="/fnb/settings" element={<FnBSettingsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/financial" element={<FinancialPage />} />
                  <Route path="/financial/executive" element={<FinancialERPDashboard />} />
                  <Route path="/financial/revenue" element={<RevenueAnalyticsSimple />} />
                  <Route path="/financial/expenses" element={<ExpenseManagement />} />
                  <Route path="/financial/member-analytics" element={<MemberAnalytics />} />
                  <Route path="/financial/reports" element={<div>Financial Reports - Coming Soon</div>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Box>
  );
};

export default App;
