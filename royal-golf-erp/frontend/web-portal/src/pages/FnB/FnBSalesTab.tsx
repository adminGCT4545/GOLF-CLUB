import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  InputAdornment,
  CircularProgress,
  Chip,
  Stack,
} from '@mui/material';
import {
  Restaurant,
  Add,
  Remove,
  Delete,
  Receipt,
  Payment,
  CreditCard,
  Search,
} from '@mui/icons-material';
import { fnbAPI } from '../../services/api';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  description: string;
  is_active: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const FnBSalesTab: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Fetch menu items from API
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fnbAPI.getMenuItems({ is_fnb: true, limit: 100 });
      setMenuItems(response.data.products || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch menu items');
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories for filter buttons
  const getUniqueCategories = () => {
    const categoryNames = menuItems.map(item => 
      item.category.replace('fnb_', '').replace('_', ' ').split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ')
    );
    const categorySet = new Set<string>(categoryNames);
    return ['All', ...Array.from(categorySet)];
  };

  const categories = getUniqueCategories();

  // Filter menu items based on search term and category
  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedCategory === 'All') return matchesSearch;
    
    const itemCategory = item.category.replace('fnb_', '').replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    return matchesSearch && itemCategory === selectedCategory;
  });

  const updateQuantity = (id: string, change: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: Math.max(0, item.quantity + change) }
          : item
      ).filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const getSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.08; // 8% tax
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      updateQuantity(item.id, 1);
    } else {
      setCartItems(prev => [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        category: item.category
      }]);
    }
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <Box 
      sx={{ 
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: { xs: 1, sm: 2, md: 3 },
        boxSizing: 'border-box'
      }}
    >
      <Typography 
        variant="h4" 
        sx={{ 
          mb: { xs: 2, sm: 3 }, 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          flexShrink: 0
        }}
      >
        <Restaurant />
        F&B Sales
      </Typography>

      <Grid 
        container 
        spacing={{ xs: 2, sm: 3 }}
        sx={{ 
          flexGrow: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 120px)'
        }}
      >
        {/* Menu Items Search and Selection */}
        <Grid 
          item 
          xs={12} 
          md={7} 
          lg={8}
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                p: { xs: 2, sm: 3 },
                '&:last-child': { pb: { xs: 2, sm: 3 } }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  flexShrink: 0
                }}
              >
                Menu Items
              </Typography>
              
              <TextField
                fullWidth
                label="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
                sx={{ 
                  mb: 2,
                  flexShrink: 0
                }}
              />
              
              {/* Category Filter Buttons */}
              <Box sx={{ mb: 2, flexShrink: 0 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 'medium' }}>
                  Quick Filters
                </Typography>
                <Stack 
                  direction="row" 
                  spacing={1} 
                  sx={{ 
                    flexWrap: 'wrap',
                    gap: 1,
                    '& .MuiChip-root': {
                      fontSize: { xs: '0.65rem', sm: '0.75rem' },
                      height: { xs: 28, sm: 32 }
                    }
                  }}
                >
                  {categories.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      onClick={() => setSelectedCategory(category)}
                      color={selectedCategory === category ? 'primary' : 'default'}
                      variant={selectedCategory === category ? 'filled' : 'outlined'}
                      size="small"
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: selectedCategory === category 
                            ? 'primary.dark' 
                            : 'action.hover'
                        }
                      }}
                    />
                  ))}
                </Stack>
              </Box>
              
              <Box 
                sx={{ 
                  flexGrow: 1,
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '6px',
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    borderRadius: '3px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    borderRadius: '3px',
                    '&:hover': {
                      backgroundColor: 'rgba(0,0,0,0.5)',
                    },
                  },
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : error ? (
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography color="error">Error: {error}</Typography>
                    <Button onClick={fetchMenuItems} sx={{ mt: 2 }}>Retry</Button>
                  </Box>
                ) : (
                  <Grid container spacing={{ xs: 1, sm: 2 }}>
                    {filteredMenuItems.map((item) => (
                      <Grid item xs={6} sm={4} md={6} lg={4} key={item.id}>
                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{ 
                            p: { xs: 1, sm: 2 }, 
                            height: { xs: 100, sm: 120 },
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            lineHeight: 1.2,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textTransform: 'none',
                            '&:hover': {
                              backgroundColor: 'primary.light',
                              color: 'white'
                            }
                          }}
                          onClick={() => addToCart(item)}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold',
                              mb: 0.5,
                              fontSize: { xs: '0.7rem', sm: '0.8rem' },
                              textAlign: 'center',
                              lineHeight: 1.2
                            }}
                          >
                            {item.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontSize: { xs: '0.65rem', sm: '0.75rem' },
                              color: 'text.secondary'
                            }}
                          >
                            {formatCurrency(item.price)}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              fontSize: { xs: '0.6rem', sm: '0.65rem' },
                              color: 'success.main'
                            }}
                          >
                            {item.category.replace('fnb_', '').replace('_', ' ')}
                          </Typography>
                        </Button>
                      </Grid>
                    ))}
                    {filteredMenuItems.length === 0 && !loading && !error && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ p: 2 }}>
                          No menu items found
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Cart */}
        <Grid 
          item 
          xs={12} 
          md={5} 
          lg={4}
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          <Card
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <CardContent
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                p: { xs: 2, sm: 3 },
                '&:last-child': { pb: { xs: 2, sm: 3 } }
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  flexShrink: 0
                }}
              >
                Order Cart
              </Typography>
              
              {/* Cart Items Table */}
              {cartItems.length > 0 ? (
                <TableContainer 
                  component={Paper} 
                  variant="outlined"
                  sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    mb: 2,
                    '&::-webkit-scrollbar': {
                      width: '6px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      borderRadius: '3px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      borderRadius: '3px',
                      '&:hover': {
                        backgroundColor: 'rgba(0,0,0,0.5)',
                      },
                    },
                  }}
                >
                  <Table 
                    size="small"
                    stickyHeader
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold', minWidth: 120 }}>Item</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: { xs: 60, sm: 80 } }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', minWidth: 70 }}>Price</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold', minWidth: 50 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cartItems.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Box>
                              <Typography 
                                variant="body2" 
                                fontWeight="medium"
                                sx={{ 
                                  lineHeight: 1.2,
                                  wordBreak: 'break-word',
                                  fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                }}
                              >
                                {item.name}
                              </Typography>
                              <Typography 
                                variant="caption" 
                                color="text.secondary"
                                sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                              >
                                {item.category}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: { xs: 0.5, sm: 0 }
                            }}>
                              <IconButton 
                                size="small" 
                                onClick={() => updateQuantity(item.id, -1)}
                                sx={{ p: { xs: 0.5, sm: 1 } }}
                              >
                                <Remove sx={{ fontSize: { xs: '16px', sm: '20px' } }} />
                              </IconButton>
                              <Typography 
                                sx={{ 
                                  mx: { xs: 0.5, sm: 1 },
                                  minWidth: '20px',
                                  textAlign: 'center',
                                  fontSize: { xs: '0.8rem', sm: '1rem' }
                                }}
                              >
                                {item.quantity}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={() => updateQuantity(item.id, 1)}
                                sx={{ p: { xs: 0.5, sm: 1 } }}
                              >
                                <Add sx={{ fontSize: { xs: '16px', sm: '20px' } }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2"
                              fontWeight="medium"
                              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                              {formatCurrency(item.price * item.quantity)}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              color="error" 
                              onClick={() => removeItem(item.id)}
                              sx={{ p: { xs: 0.5, sm: 1 } }}
                            >
                              <Delete sx={{ fontSize: { xs: '16px', sm: '20px' } }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  sx={{
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  <Typography color="text.secondary" textAlign="center">
                    Cart is empty<br />
                    <Typography variant="caption">
                      Add menu items to start an order
                    </Typography>
                  </Typography>
                </Box>
              )}

              {/* Checkout Section - Always Visible */}
              <Box sx={{ flexShrink: 0 }}>
                <Divider sx={{ my: 2 }} />
                
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(getSubtotal())}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tax (8%):</Typography>
                    <Typography variant="body2">{formatCurrency(getTax())}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                    <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Total:</Typography>
                    <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>{formatCurrency(getTotal())}</Typography>
                  </Box>
                </Box>

                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<CreditCard />}
                      color="primary"
                      size="small"
                      disabled={cartItems.length === 0}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Card
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Payment />}
                      color="primary"
                      size="small"
                      disabled={cartItems.length === 0}
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Cash
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<Receipt />}
                      size="large"
                      disabled={cartItems.length === 0}
                      sx={{ 
                        mt: 1,
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}
                    >
                      Complete Order
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FnBSalesTab;