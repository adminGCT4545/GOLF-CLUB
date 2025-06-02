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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Stack,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Restaurant,
  Add,
  Edit,
  Delete,
  Search,
  CheckCircle,
  AttachMoney,
  BarChart,
  Warning
} from '@mui/icons-material';
import { fnbAPI } from '../../services/api';

interface MenuItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  sku: string;
  description: string;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
  created_at?: string;
  updated_at?: string;
}

const FnBProductsTab: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>(['All Categories']);
  const [summary, setSummary] = useState({
    total_products: 0,
    total_inventory_value: 0,
    out_of_stock_count: 0,
    low_stock_count: 0
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [stockFilter, setStockFilter] = useState('All Stock');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [newMenuItem, setNewMenuItem] = useState<Partial<MenuItem>>({
    name: '',
    category: '',
    subcategory: '',
    price: 0,
    sku: '',
    description: '',
    cost: 0,
    stock_quantity: 0,
    min_stock_level: 0,
    is_active: true,
  });

  const statusFilters = ['All Status', 'Active', 'Inactive'];
  const stockFilters = ['All Stock', 'Available', 'Low Stock', 'Out of Stock'];

  // Fetch menu items from API
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await fnbAPI.getMenuItems({ is_fnb: true, limit: 1000 });
      const items = response.data.products || [];
      setMenuItems(items);
      
      // Extract unique categories
      const categoryNames = items.map((item: MenuItem) => 
        item.category.replace('fnb_', '').replace('_', ' ').split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      );
      const categorySet = new Set<string>(categoryNames);
      const uniqueCategories: string[] = ['All Categories', ...Array.from(categorySet)];
      setCategories(uniqueCategories);
      
      // Calculate summary
      const totalValue = items.reduce((sum: number, item: MenuItem) => sum + (item.price * item.stock_quantity), 0);
      const outOfStock = items.filter((item: MenuItem) => item.stock_quantity === 0).length;
      const lowStock = items.filter((item: MenuItem) => item.stock_quantity > 0 && item.stock_quantity <= item.min_stock_level).length;
      
      setSummary({
        total_products: items.length,
        total_inventory_value: totalValue,
        out_of_stock_count: outOfStock,
        low_stock_count: lowStock
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch menu items');
      console.error('Error fetching menu items:', err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics from empty data
  const totalMenuItems = summary.total_products || menuItems.length;
  const activeMenuItems = menuItems.filter(item => item.is_active).length;
  const totalInventoryValue = summary.total_inventory_value || 0;
  const totalSalesCount = 0;

  const getStockStatus = (item: MenuItem) => {
    if (item.stock_quantity === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (item.stock_quantity <= item.min_stock_level) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'Available', color: 'success' as const };
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatCategoryDisplay = (category: string) => {
    return category.replace('fnb_', '').replace('_', ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryDisplay = formatCategoryDisplay(item.category);
    const matchesCategory = categoryFilter === 'All Categories' || categoryDisplay === categoryFilter;
    const status = item.is_active ? 'Active' : 'Inactive';
    const matchesStatus = statusFilter === 'All Status' || status === statusFilter;
    
    const stockStatus = getStockStatus(item);
    const matchesStock = stockFilter === 'All Stock' || stockStatus.label === stockFilter;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const handleAddMenuItem = () => {
    setEditingMenuItem(null);
    setNewMenuItem({
      name: '',
      category: '',
      subcategory: '',
      price: 0,
      sku: '',
      description: '',
      cost: 0,
      stock_quantity: 0,
      min_stock_level: 0,
      is_active: true,
    });
    setOpenDialog(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setNewMenuItem(item);
    setOpenDialog(true);
  };

  const handleSaveMenuItem = () => {
    // This would normally save to backend
    setOpenDialog(false);
  };

  const handleDeleteMenuItem = (id: string) => {
    // This would normally delete from backend
  };

  const clearFilters = () => {
    setCategoryFilter('All Categories');
    setStatusFilter('All Status');
    setStockFilter('All Stock');
    setSearchTerm('');
  };

  return (
    <Box 
      sx={{ 
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 0,
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: { xs: 2, sm: 3 },
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: { xs: 2, md: 0 },
          flexShrink: 0,
          p: { xs: 2, sm: 3, md: 3 }
        }}
      >
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            order: { xs: 1, md: 1 },
            width: { xs: '100%', md: 'auto' }
          }}
        >
          Menu Items
        </Typography>
        <TextField
          size="small"
          placeholder="Search menu items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ 
            width: { xs: '100%', sm: 250, md: 300 },
            order: { xs: 3, md: 2 },
            maxWidth: { xs: '100%', md: 300 }
          }}
        />
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddMenuItem}
          sx={{ 
            bgcolor: '#1976d2',
            minWidth: { xs: '100%', sm: 140 },
            height: 40,
            order: { xs: 2, md: 3 },
            maxWidth: { xs: '100%', md: 'none' }
          }}
        >
          Add Menu Item
        </Button>
      </Box>

      {/* Metric Cards */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 3 } }}>
        <Grid 
          container 
          spacing={{ xs: 2, sm: 3 }} 
          sx={{ 
            mb: { xs: 2, sm: 3 },
            flexShrink: 0,
            '& .MuiGrid-item': {
              display: 'flex'
            }
          }}
        >
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%', width: '100%' }}>
              <CardContent 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1.5, sm: 2 },
                  p: { xs: 2, sm: 3 },
                  '&:last-child': { pb: { xs: 2, sm: 3 } },
                  height: '100%',
                  minHeight: 80
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#e3f2fd', 
                    color: '#1976d2', 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    flexShrink: 0
                  }}
                >
                  <Restaurant />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 0,
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    {totalMenuItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Menu Items
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%', width: '100%' }}>
              <CardContent 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1.5, sm: 2 },
                  p: { xs: 2, sm: 3 },
                  '&:last-child': { pb: { xs: 2, sm: 3 } },
                  height: '100%',
                  minHeight: 80
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#e8f5e8', 
                    color: '#2e7d32', 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    flexShrink: 0
                  }}
                >
                  <CheckCircle />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 0,
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    {activeMenuItems}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Items
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%' }}>
              <CardContent 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1.5, sm: 2 },
                  p: { xs: 2, sm: 3 },
                  '&:last-child': { pb: { xs: 2, sm: 3 } },
                  height: '100%',
                  minHeight: 80
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#fff3e0', 
                    color: '#f57c00', 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    flexShrink: 0
                  }}
                >
                  <AttachMoney />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 0,
                      fontSize: { xs: '1rem', sm: '1.2rem' },
                      lineHeight: 1.1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    LKR {totalInventoryValue.toLocaleString('en-LK', { 
                      minimumFractionDigits: 0, 
                      maximumFractionDigits: 0 
                    })}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      fontSize: '0.75rem',
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    Total Menu Value
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Card sx={{ height: '100%', width: '100%' }}>
              <CardContent 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1.5, sm: 2 },
                  p: { xs: 2, sm: 3 },
                  '&:last-child': { pb: { xs: 2, sm: 3 } },
                  height: '100%',
                  minHeight: 80
                }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: '#e3f2fd', 
                    color: '#1976d2', 
                    width: { xs: 48, sm: 56 }, 
                    height: { xs: 48, sm: 56 },
                    flexShrink: 0
                  }}
                >
                  <BarChart />
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 'bold', 
                      mb: 0,
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    {totalSalesCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Filters */}
      <Box 
        sx={{ 
          mb: { xs: 2, sm: 3 },
          flexShrink: 0,
          px: { xs: 2, sm: 3, md: 3 }
        }}
      >
        <Grid container spacing={{ xs: 1, sm: 2 }} alignItems="flex-start">
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Category</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                displayEmpty
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Status</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                displayEmpty
              >
                {statusFilters.map(status => (
                  <MenuItem key={status} value={status}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={2}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Stock</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                displayEmpty
              >
                {stockFilters.map(stock => (
                  <MenuItem key={stock} value={stock}>{stock}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={12} md={6}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Filters</Typography>
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={1}
              sx={{ 
                flexWrap: 'wrap',
                '& .MuiButton-root': {
                  minWidth: { xs: '100%', sm: 100 },
                  height: 32
                }
              }}
            >
              <Button
                variant="outlined"
                size="small"
                startIcon={<Warning />}
                onClick={() => setStockFilter('Low Stock')}
              >
                Low Stock
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setStockFilter('Out of Stock')}
              >
                Out of Stock
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setStatusFilter('Inactive')}
              >
                Inactive
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Menu Items Table */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer 
          component={Paper}
          sx={{
            flexGrow: 1,
            overflow: 'auto',
            maxHeight: 'calc(100vh - 400px)',
            minHeight: 300,
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
          <Table sx={{ minWidth: { xs: 800, md: 'auto' } }} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 200 }}>Menu Item</TableCell>
                <TableCell align="right" sx={{ minWidth: 80 }}>Price</TableCell>
                <TableCell sx={{ minWidth: 120, display: { xs: 'none', sm: 'table-cell' } }}>Category</TableCell>
                <TableCell align="right" sx={{ minWidth: 80, display: { xs: 'none', md: 'table-cell' } }}>Cost</TableCell>
                <TableCell align="center" sx={{ minWidth: 100 }}>Status</TableCell>
                <TableCell align="center" sx={{ minWidth: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                      <Typography color="error" gutterBottom>Error: {error}</Typography>
                      <Button onClick={fetchMenuItems} variant="outlined" sx={{ mt: 2 }}>Retry</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : filteredMenuItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: { xs: 3, sm: 4 } }}>
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                      <Restaurant sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Menu Items Found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {menuItems.length === 0 ? 'No menu items available' : 'No items match the current filters'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMenuItems.map((item) => {
                  const stockStatus = getStockStatus(item);
                  return (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium" sx={{ lineHeight: 1.2 }}>
                            {item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            SKU: {item.sku}
                          </Typography>
                          {item.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              {item.description.length > 50 ? `${item.description.substring(0, 50)}...` : item.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight="medium">
                          {formatCurrency(item.price)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                        <Typography variant="body2">
                          {formatCategoryDisplay(item.category)}
                        </Typography>
                        {item.subcategory && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {item.subcategory}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2">
                          {formatCurrency(item.cost)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack spacing={0.5}>
                          <Chip
                            label={item.is_active ? 'Active' : 'Inactive'}
                            color={item.is_active ? 'success' : 'default'}
                            size="small"
                          />
                          <Chip
                            label={stockStatus.label}
                            color={stockStatus.color}
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMenuItem(item)}
                            color="primary"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMenuItem(item.id)}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add/Edit Menu Item Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            margin: { xs: 1, sm: 3 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' },
            maxHeight: { xs: 'calc(100% - 16px)', sm: 'calc(100% - 64px)' }
          }
        }}
      >
        <DialogTitle>
          {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={newMenuItem.name}
                onChange={(e) => setNewMenuItem(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={newMenuItem.sku}
                onChange={(e) => setNewMenuItem(prev => ({ ...prev, sku: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newMenuItem.category}
                  label="Category"
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, category: e.target.value }))}
                >
                  {categories.filter(cat => cat !== 'All Categories').map(category => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price"
                type="number"
                value={newMenuItem.price}
                onChange={(e) => setNewMenuItem(prev => ({ ...prev, price: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Cost"
                type="number"
                value={newMenuItem.cost}
                onChange={(e) => setNewMenuItem(prev => ({ ...prev, cost: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newMenuItem.is_active ? 'Active' : 'Inactive'}
                  label="Status"
                  onChange={(e) => setNewMenuItem(prev => ({ ...prev, is_active: e.target.value === 'Active' }))}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="Inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={newMenuItem.description}
                onChange={(e) => setNewMenuItem(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            sx={{ minWidth: 100, height: 40 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveMenuItem} 
            variant="contained"
            sx={{ minWidth: 120, height: 40 }}
          >
            {editingMenuItem ? 'Update' : 'Add'} Item
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FnBProductsTab;