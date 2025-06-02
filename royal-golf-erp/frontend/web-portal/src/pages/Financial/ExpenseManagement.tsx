import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Chip,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  LinearProgress,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Fab,
  Badge,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Receipt,
  Add,
  FileUpload,
  CheckCircle,
  Schedule,
  Error,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Business,
  Assessment,
  Refresh,
  FileDownload,
  CloudUpload,
  Visibility,
  Edit,
  Delete,
  FilterList,
  Search,
  Warning,
  Policy,
  Analytics,
  Assignment,
  CameraAlt,
  Description,
  Category,
  DateRange,
} from '@mui/icons-material';

interface ExpenseData {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'reimbursed';
  submittedBy: string;
  department: string;
  receiptUrl?: string;
  description: string;
}

interface ExpenseKPI {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`expense-tabpanel-${index}`}
      aria-labelledby={`expense-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const ExpenseKPICard: React.FC<ExpenseKPI> = ({ title, value, change, icon, color, isLoading }) => {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              {title}
            </Typography>
            {isLoading ? (
              <CircularProgress size={24} />
            ) : (
              <>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
                </Typography>
                <Box display="flex" alignItems="center">
                  {change > 0 ? (
                    <TrendingUp sx={{ color: 'error.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ color: 'success.main', mr: 0.5 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ 
                      color: change > 0 ? 'error.main' : 'success.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                    vs last month
                  </Typography>
                </Box>
              </>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 56,
              minHeight: 56,
              boxShadow: 2,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ExpenseManagement: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<ExpenseData | null>(null);
  const [period, setPeriod] = useState('monthly');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const [expenses, setExpenses] = useState<ExpenseData[]>([
    {
      id: '1',
      title: 'Golf Equipment Purchase',
      amount: 450.00,
      category: 'Equipment',
      date: '2024-05-15',
      status: 'approved',
      submittedBy: 'John Smith',
      department: 'Pro Shop',
      description: 'New golf clubs for pro shop inventory',
    },
    {
      id: '2',
      title: 'Course Maintenance Supplies',
      amount: 1200.00,
      category: 'Maintenance',
      date: '2024-05-14',
      status: 'pending',
      submittedBy: 'Mike Johnson',
      department: 'Maintenance',
      description: 'Fertilizer and irrigation supplies',
    },
    {
      id: '3',
      title: 'Office Supplies',
      amount: 85.50,
      category: 'Office',
      date: '2024-05-13',
      status: 'reimbursed',
      submittedBy: 'Sarah Davis',
      department: 'Administration',
      description: 'Printing paper and office supplies',
    },
    {
      id: '4',
      title: 'Marketing Materials',
      amount: 320.00,
      category: 'Marketing',
      date: '2024-05-12',
      status: 'rejected',
      submittedBy: 'Tom Wilson',
      department: 'Marketing',
      description: 'Promotional banners and flyers',
    },
  ]);

  const kpiData = [
    {
      title: 'Total Expenses',
      value: 15750,
      change: 8.5,
      icon: <AttachMoney sx={{ color: 'white', fontSize: 28 }} />,
      color: theme.palette.error.main,
    },
    {
      title: 'Pending Approval',
      value: 3200,
      change: -12.3,
      icon: <Schedule sx={{ color: 'white', fontSize: 28 }} />,
      color: theme.palette.warning.main,
    },
    {
      title: 'This Month',
      value: 4850,
      change: 15.2,
      icon: <DateRange sx={{ color: 'white', fontSize: 28 }} />,
      color: theme.palette.info.main,
    },
    {
      title: 'Compliance Rate',
      value: '94.2%',
      change: 2.1,
      icon: <Policy sx={{ color: 'white', fontSize: 28 }} />,
      color: theme.palette.success.main,
    },
  ];

  useEffect(() => {
    loadExpenseData();
  }, [period]);

  const loadExpenseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      setError('Failed to load expense data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'reimbursed': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle />;
      case 'pending': return <Schedule />;
      case 'rejected': return <Error />;
      case 'reimbursed': return <AttachMoney />;
      default: return <Assignment />;
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewExpense = (expense: ExpenseData) => {
    setSelectedExpense(expense);
    setViewDialogOpen(true);
  };

  const filteredExpenses = expenses.filter(expense => 
    statusFilter === 'all' || expense.status === statusFilter
  );

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadExpenseData} startIcon={<Refresh />}>
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100%', pb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
            Expense Management
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Automated expense tracking and management system
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={loadExpenseData} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button
            startIcon={<FileDownload />}
            variant="outlined"
            size="small"
          >
            Export Report
          </Button>
          <Fab
            color="primary"
            aria-label="add expense"
            size="small"
            onClick={() => setSubmitDialogOpen(true)}
          >
            <Add />
          </Fab>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        {kpiData.map((kpi, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <ExpenseKPICard
              title={kpi.title}
              value={kpi.value}
              change={kpi.change}
              icon={kpi.icon}
              color={kpi.color}
              isLoading={loading}
            />
          </Grid>
        ))}
      </Grid>

      {/* Main Content Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Assessment />} label="Dashboard" />
          <Tab icon={<Receipt />} label="All Expenses" />
          <Tab icon={<Analytics />} label="Analytics" />
          <Tab icon={<Policy />} label="Policies" />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Recent Expense Activity
                  </Typography>
                  <List>
                    {expenses.slice(0, 5).map((expense) => (
                      <ListItem key={expense.id} divider>
                        <ListItemIcon>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <Receipt />
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText
                          primary={expense.title}
                          secondary={`${expense.submittedBy} • ${expense.department} • ${expense.date}`}
                        />
                        <Box sx={{ mr: 2 }}>
                          <Typography variant="h6" fontWeight="bold">
                            ${expense.amount.toFixed(2)}
                          </Typography>
                        </Box>
                        <Chip
                          icon={getStatusIcon(expense.status)}
                          label={expense.status.toUpperCase()}
                          color={getStatusColor(expense.status) as any}
                          variant="outlined"
                          size="small"
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Quick Actions
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setSubmitDialogOpen(true)}
                      fullWidth
                    >
                      Submit Expense
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<CloudUpload />}
                      fullWidth
                    >
                      Bulk Upload
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Analytics />}
                      fullWidth
                    >
                      Generate Report
                    </Button>
                  </Box>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={2}>
                    Expense Categories
                  </Typography>
                  <Box>
                    {['Equipment', 'Maintenance', 'Office', 'Marketing', 'Travel'].map((category, index) => (
                      <Box key={category} display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2">{category}</Typography>
                        <Chip size="small" label={`${Math.floor(Math.random() * 20) + 5}%`} />
                      </Box>
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* All Expenses Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box mb={2} display="flex" justifyContent="between" alignItems="center" gap={2}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="reimbursed">Reimbursed</MenuItem>
              </Select>
            </FormControl>
            <Button startIcon={<FilterList />} variant="outlined" size="small">
              More Filters
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Submitted By</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id} hover>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell>${expense.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip size="small" label={expense.category} variant="outlined" />
                      </TableCell>
                      <TableCell>{expense.date}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(expense.status)}
                          label={expense.status.toUpperCase()}
                          color={getStatusColor(expense.status) as any}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{expense.submittedBy}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewExpense(expense)}>
                          <Visibility />
                        </IconButton>
                        <IconButton size="small">
                          <Edit />
                        </IconButton>
                        <IconButton size="small" color="error">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    Expense Analytics Dashboard
                  </Typography>
                  <Alert severity="info">
                    Advanced analytics charts will be implemented here showing expense trends, 
                    department comparisons, budget adherence, and forecasting.
                  </Alert>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Policies Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight="bold" mb={3}>
                    Company Expense Policies
                  </Typography>
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Policy management system will enforce compliance rules and approval workflows.
                  </Alert>
                  <List>
                    <ListItem>
                      <ListItemIcon><Policy /></ListItemIcon>
                      <ListItemText 
                        primary="Maximum Expense Limit" 
                        secondary="$500 per transaction without prior approval"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Receipt /></ListItemIcon>
                      <ListItemText 
                        primary="Receipt Requirement" 
                        secondary="All expenses over $25 must have receipt attached"
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle /></ListItemIcon>
                      <ListItemText 
                        primary="Approval Workflow" 
                        secondary="Department head approval required for expenses over $200"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Submit Expense Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submit New Expense</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Expense Title"
                placeholder="Enter expense description"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                placeholder="0.00"
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category">
                  <MenuItem value="equipment">Equipment</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="office">Office Supplies</MenuItem>
                  <MenuItem value="marketing">Marketing</MenuItem>
                  <MenuItem value="travel">Travel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                placeholder="Provide additional details about the expense"
              />
            </Grid>
            <Grid item xs={12}>
              <Paper
                sx={{
                  border: '2px dashed',
                  borderColor: 'grey.300',
                  p: 3,
                  textAlign: 'center',
                  backgroundColor: 'grey.50',
                }}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Upload Receipt
                </Typography>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  Drag and drop your receipt or click to browse
                </Typography>
                <Button variant="contained" startIcon={<FileUpload />}>
                  Choose File
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmitDialogOpen(false)}>Cancel</Button>
          <Button variant="contained">Submit Expense</Button>
        </DialogActions>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Expense Details</DialogTitle>
        <DialogContent>
          {selectedExpense && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Title</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedExpense.title}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Amount</Typography>
                <Typography variant="body1" fontWeight="bold">${selectedExpense.amount.toFixed(2)}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Category</Typography>
                <Chip size="small" label={selectedExpense.category} variant="outlined" />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Chip
                  icon={getStatusIcon(selectedExpense.status)}
                  label={selectedExpense.status.toUpperCase()}
                  color={getStatusColor(selectedExpense.status) as any}
                  variant="outlined"
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Description</Typography>
                <Typography variant="body1">{selectedExpense.description}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExpenseManagement;
