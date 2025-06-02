import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Collapse,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  GolfCourse,
  EmojiEvents,
  Message,
  People,
  Store,
  Restaurant,
  AccountCircle,
  AccountBalance,
  Logout,
  Settings,
  ShoppingCart,
  Inventory,
  AccessTime,
  ExpandLess,
  ExpandMore,
  Business,
  MenuBook,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { logoutUser } from '../../store/slices/authSlice';
import AIChatbot from '../Common/AIChatbot';

const drawerWidth = 240;
const mobileBreakpoint = 'md'; // Changed from 'sm' to 'md' for better mobile experience

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [proShopOpen, setProShopOpen] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [fnbOpen, setFnbOpen] = useState(false);
  const [financialOpen, setFinancialOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.message);

  const menuItemsBeforeProShop = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Tee Times', icon: <GolfCourse />, path: '/bookings' },
    { text: 'Tournaments', icon: <EmojiEvents />, path: '/tournaments' },
    { text: 'Messages', icon: <Message />, path: '/messages', badge: unreadCount },
    { text: 'Members', icon: <People />, path: '/members' },
  ];

  const financialItems = [
    { text: 'Executive Dashboard', icon: <Dashboard />, path: '/financial/executive' },
    { text: 'Revenue Analytics', icon: <AccountBalance />, path: '/financial/revenue' },
    { text: 'Expense Management', icon: <AccountBalance />, path: '/financial/expenses' },
    { text: 'Member Analytics', icon: <People />, path: '/financial/member-analytics' },
    { text: 'Reports', icon: <Settings />, path: '/financial/reports' },
  ];

  const menuItemsAfterProShop: Array<{ text: string; icon: React.ReactNode; path: string; badge?: number }> = [];

  const proShopItems = [
    { text: 'Sales', icon: <ShoppingCart />, path: '/proshop/sales' },
    { text: 'Products', icon: <Inventory />, path: '/proshop/products' },
    { text: 'Settings', icon: <Settings />, path: '/proshop/settings' },
  ];

  const employeeItems = [
    { text: 'Time Clock', icon: <AccessTime />, path: '/employees/timekeeping' },
    { text: 'Employee Directory', icon: <People />, path: '/employees/directory' },
    { text: 'Time Reports', icon: <Settings />, path: '/employees/reports' },
    { text: 'Settings', icon: <Settings />, path: '/employees/settings' },
  ];

  const fnbItems = [
    { text: 'Sales', icon: <Restaurant />, path: '/fnb/sales' },
    { text: 'Menu Items', icon: <MenuBook />, path: '/fnb/menu-items' },
    { text: 'Settings', icon: <Settings />, path: '/fnb/settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    handleProfileMenuClose();
  };

  const handleProfileClick = () => {
    navigate('/profile');
    handleProfileMenuClose();
  };

  const handleProShopClick = () => {
    setProShopOpen(!proShopOpen);
  };

  const handleEmployeeClick = () => {
    setEmployeeOpen(!employeeOpen);
  };

  const handleFnbClick = () => {
    setFnbOpen(!fnbOpen);
  };

  const handleFinancialClick = () => {
    setFinancialOpen(!financialOpen);
  };

  const isProShopSelected = location.pathname.startsWith('/proshop');
  const isEmployeeSelected = location.pathname.startsWith('/employees');
  const isFnbSelected = location.pathname.startsWith('/fnb');
  const isFinancialSelected = location.pathname.startsWith('/financial');

  // Auto-expand dropdowns when user is on respective pages
  useEffect(() => {
    if (isProShopSelected) {
      setProShopOpen(true);
    }
    if (isEmployeeSelected) {
      setEmployeeOpen(true);
    }
    if (isFnbSelected) {
      setFnbOpen(true);
    }
    if (isFinancialSelected) {
      setFinancialOpen(true);
    }
  }, [isProShopSelected, isEmployeeSelected, isFnbSelected, isFinancialSelected]);

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          Royal Golf Club
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {/* Render menu items before Pro Shop */}
        {menuItemsBeforeProShop.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}>
                {'badge' in item && typeof item.badge === 'number' && item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
        
        {/* Employee Management with dropdown */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isEmployeeSelected}
            onClick={handleEmployeeClick}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: isEmployeeSelected ? 'inherit' : 'inherit' }}>
              <Business />
            </ListItemIcon>
            <ListItemText primary="Employee Management" />
            {employeeOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={employeeOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {employeeItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
        
        {/* Pro Shop with dropdown */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isProShopSelected}
            onClick={handleProShopClick}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: isProShopSelected ? 'inherit' : 'inherit' }}>
              <Store />
            </ListItemIcon>
            <ListItemText primary="Pro Shop" />
            {proShopOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={proShopOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {proShopItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
        
        {/* F&B with dropdown */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isFnbSelected}
            onClick={handleFnbClick}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: isFnbSelected ? 'inherit' : 'inherit' }}>
              <Restaurant />
            </ListItemIcon>
            <ListItemText primary="F&B" />
            {fnbOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={fnbOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {fnbItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
        
        {/* Financial ERP with dropdown */}
        <ListItem disablePadding>
          <ListItemButton
            selected={isFinancialSelected}
            onClick={handleFinancialClick}
            sx={{
              '&.Mui-selected': {
                backgroundColor: 'primary.light',
                color: 'primary.contrastText',
                '&:hover': {
                  backgroundColor: 'primary.main',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: isFinancialSelected ? 'inherit' : 'inherit' }}>
              <AccountBalance />
            </ListItemIcon>
            <ListItemText primary="Financial ERP" />
            {financialOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        
        <Collapse in={financialOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {financialItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  sx={{
                    pl: 4,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'primary.contrastText',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
        
        {/* Render menu items after Pro Shop */}
        {menuItemsAfterProShop.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}>
                {'badge' in item && typeof item.badge === 'number' && item.badge > 0 ? (
                  <Badge badgeContent={item.badge} color="error">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ 
      display: 'flex', 
      width: '100vw', 
      height: '100vh',
      overflow: 'hidden'
    }}>
      <AppBar
        position="fixed"
        sx={{
          width: { [mobileBreakpoint]: `calc(100% - ${drawerWidth}px)` },
          ml: { [mobileBreakpoint]: `${drawerWidth}px` },
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { [mobileBreakpoint]: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {proShopItems.find(item => item.path === location.pathname)?.text || 
             employeeItems.find(item => item.path === location.pathname)?.text ||
             fnbItems.find(item => item.path === location.pathname)?.text ||
             financialItems.find(item => item.path === location.pathname)?.text ||
             [...menuItemsBeforeProShop, ...menuItemsAfterProShop].find(item => item.path === location.pathname)?.text || 
             (location.pathname.startsWith('/proshop') ? 'Pro Shop' : 
              location.pathname.startsWith('/employees') ? 'Employee Management' : 
              location.pathname.startsWith('/fnb') ? 'F&B' :
              location.pathname.startsWith('/financial') ? 'Financial ERP' : 'Royal Golf Club')}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2">
              {user?.firstName} {user?.lastName}
            </Typography>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="primary-search-account-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <AccountCircle fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ 
          width: { [mobileBreakpoint]: drawerWidth }, 
          flexShrink: { [mobileBreakpoint]: 0 },
        }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', [mobileBreakpoint]: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              height: '100%',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', [mobileBreakpoint]: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              position: 'relative',
              height: '100vh',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: { xs: 1, sm: 2, md: 3 },
          width: { 
            xs: '100%', 
            [mobileBreakpoint]: `calc(100vw - ${drawerWidth}px)` 
          },
          minHeight: '100vh',
          pt: { xs: 9, sm: 10 },
          pb: { xs: 2, sm: 3 },
          overflow: 'auto',
          boxSizing: 'border-box',
          backgroundColor: 'background.default'
        }}
      >
        {children}
      </Box>
      
      {/* AI Chatbot - appears on all pages */}
      <AIChatbot />
    </Box>
  );
};

export default Layout;
