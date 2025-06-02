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
} from '@mui/material';
import {
  Inventory,
  Add,
  Edit,
  Delete,
  Search,
  CheckCircle,
  AttachMoney,
  BarChart,
  Warning
} from '@mui/icons-material';
import { proShopAPI } from '../../services/api';

interface Product {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  price: number;
  stock_quantity: number;
  sku: string;
  description: string;
  cost: number;
  min_stock_level: number;
  is_active: boolean;
  is_low_stock?: boolean;
  is_out_of_stock?: boolean;
  sales_last_30_days?: number;
  created_at?: string;
  updated_at?: string;
}

const ProductsTab: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
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
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    category: '',
    subcategory: '',
    price: 0,
    stock_quantity: 0,
    sku: '',
    description: '',
    cost: 0,
    min_stock_level: 0,
    is_active: true,
  });

  const statusFilters = ['All Status', 'Active', 'Inactive'];
  const stockFilters = ['All Stock', 'In Stock', 'Low Stock', 'Out of Stock'];

  // Fetch products from API
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await proShopAPI.getProducts();
      setProducts(response.data.products || []);
      setSummary(response.data.summary || summary);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await proShopAPI.getCategories();
      const categoryList = response.data.categories?.map((cat: any) => cat.category) || [];
      setCategories(['All Categories', ...categoryList]);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Set default categories if API fails
      setCategories(['All Categories', 'proshop_clubs', 'proshop_balls', 'proshop_apparel', 'proshop_shoes', 'proshop_accessories']);
    }
  };

  // Calculate metrics from summary or fallback to products data
  const totalProducts = summary.total_products || products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const totalInventoryValue = summary.total_inventory_value || products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);
  const totalSalesCount = products.reduce((sum, p) => sum + (p.sales_last_30_days || 0), 0);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: 'error' as const };
    if (stock < 10) return { label: 'Low Stock', color: 'warning' as const };
    return { label: 'In Stock', color: 'success' as const };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All Categories' || product.category === categoryFilter;
    const status = product.is_active ? 'Active' : 'Inactive';
    const matchesStatus = statusFilter === 'All Status' || status === statusFilter;
    const stockStatus = getStockStatus(product.stock_quantity);
    const matchesStock = stockFilter === 'All Stock' || 
                        (stockFilter === 'In Stock' && stockStatus.label === 'In Stock') ||
                        (stockFilter === 'Low Stock' && stockStatus.label === 'Low Stock') ||
                        (stockFilter === 'Out of Stock' && stockStatus.label === 'Out of Stock');
    return matchesSearch && matchesCategory && matchesStatus && matchesStock;
  });

  const handleAddProduct = () => {
    setEditingProduct(null);
    setNewProduct({
      name: '',
      category: '',
      subcategory: '',
      price: 0,
      stock_quantity: 0,
      sku: '',
      description: '',
      cost: 0,
      min_stock_level: 0,
      is_active: true,
    });
    setOpenDialog(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setOpenDialog(true);
  };

  const handleSaveProduct = () => {
    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? { ...newProduct as Product } : p));
    } else {
      setProducts(prev => [...prev, { ...newProduct, id: Date.now().toString() } as Product]);
    }
    setOpenDialog(false);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
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
          Products
        </Typography>
        <TextField
          size="small"
          placeholder="Search products..."
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
          onClick={handleAddProduct}
          sx={{ 
            bgcolor: '#1976d2',
            minWidth: { xs: '100%', sm: 140 },
            height: 40,
            order: { xs: 2, md: 3 },
            maxWidth: { xs: '100%', md: 'none' }
          }}
        >
          Add Product
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
                  <Inventory />
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
                    {totalProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
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
                    {activeProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Products
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
                    Total Inventory Value
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
                    Total Sales Count
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
                variant={stockFilter === 'Low Stock' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<Warning />}
                onClick={() => setStockFilter('Low Stock')}
              >
                Low Stock
              </Button>
              <Button
                variant={stockFilter === 'Out of Stock' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setStockFilter('Out of Stock')}
              >
                Out of Stock
              </Button>
              <Button
                variant={statusFilter === 'Inactive' ? 'contained' : 'outlined'}
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

      {/* Products Table */}
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
                <TableCell sx={{ minWidth: 200 }}>Product</TableCell>
                <TableCell align="right" sx={{ minWidth: 80 }}>Price</TableCell>
                <TableCell align="center" sx={{ minWidth: 80 }}>Stock</TableCell>
                <TableCell sx={{ minWidth: 120, display: { xs: 'none', sm: 'table-cell' } }}>Category</TableCell>
                <TableCell align="right" sx={{ minWidth: 80, display: { xs: 'none', md: 'table-cell' } }}>Cost</TableCell>
                <TableCell align="center" sx={{ minWidth: 100 }}>Status</TableCell>
                <TableCell align="center" sx={{ minWidth: 80, display: { xs: 'none', sm: 'table-cell' } }}>Sales</TableCell>
                <TableCell align="center" sx={{ minWidth: 120 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity);
                const status = product.is_active ? 'Active' : 'Inactive';
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 'medium',
                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                            lineHeight: 1.2
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ fontSize: { xs: '0.75rem', sm: '0.75rem' } }}
                        >
                          SKU: {product.sku}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        LKR {product.price.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">
                        {product.stock_quantity}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2">
                        {product.category}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Typography variant="body2">
                        LKR {product.cost.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={status} 
                        color={status === 'Active' ? 'success' : 'default'}
                        size="small" 
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Typography variant="body2" color="success.main">
                        {product.sales_last_30_days || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          gap: { xs: 0.5, sm: 1 }, 
                          justifyContent: 'center',
                          flexDirection: { xs: 'column', sm: 'row' },
                          alignItems: 'center'
                        }}
                      >
                        <IconButton 
                          size="small" 
                          onClick={() => handleEditProduct(product)}
                          sx={{ 
                            width: { xs: 28, sm: 32 }, 
                            height: { xs: 28, sm: 32 },
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark'
                            }
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteProduct(product.id)}
                          sx={{ 
                            width: { xs: 28, sm: 32 }, 
                            height: { xs: 28, sm: 32 },
                            bgcolor: 'error.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'error.dark'
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: { xs: 3, sm: 4 } }}>
                    <Typography color="text.secondary">
                      No products found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Add/Edit Product Dialog */}
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
          {editingProduct ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={newProduct.sku}
                onChange={(e) => setNewProduct(prev => ({ ...prev, sku: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newProduct.category}
                  label="Category"
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
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
                value={newProduct.price}
                onChange={(e) => setNewProduct(prev => ({ ...prev, price: Number(e.target.value) }))}
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
                value={newProduct.cost}
                onChange={(e) => setNewProduct(prev => ({ ...prev, cost: Number(e.target.value) }))}
                InputProps={{
                  startAdornment: <InputAdornment position="start">LKR</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Stock Quantity"
                type="number"
                value={newProduct.stock_quantity}
                onChange={(e) => setNewProduct(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newProduct.is_active ? 'Active' : 'Inactive'}
                  label="Status"
                  onChange={(e) => setNewProduct(prev => ({ ...prev, is_active: e.target.value === 'Active' }))}
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
                value={newProduct.description}
                onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
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
            onClick={handleSaveProduct} 
            variant="contained"
            sx={{ minWidth: 120, height: 40 }}
          >
            {editingProduct ? 'Update' : 'Add'} Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductsTab;
