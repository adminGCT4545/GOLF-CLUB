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
  TablePagination,
  useTheme,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  GolfCourse,
  Restaurant,
  Store,
  People,
  Refresh,
  FileDownload,
  FilterList,
} from '@mui/icons-material';

interface RevenueStreamData {
  id: string;
  name: string;
  current: number;
  previous: number;
  change: number;
  transactions: number;
  avgTransaction: number;
  icon: React.ReactNode;
  color: string;
}

interface RevenueTransaction {
  id: string;
  date: string;
  member: string;
  type: string;
  amount: number;
  department: string;
  status: string;
}

const RevenueAnalyticsSimple: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('monthly');
  const [selectedStream, setSelectedStream] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data - replace with actual API calls
  const [revenueStreams] = useState<RevenueStreamData[]>([
    {
      id: 'membership',
      name: 'Membership Dues',
      current: 75000,
      previous: 70000,
      change: 7.1,
      transactions: 450,
      avgTransaction: 166.67,
      icon: <People sx={{ color: 'white' }} />,
      color: theme.palette.primary.main,
    },
    {
      id: 'green_fees',
      name: 'Green Fees',
      current: 25750,
      previous: 23500,
      change: 9.6,
      transactions: 234,
      avgTransaction: 110.04,
      icon: <GolfCourse sx={{ color: 'white' }} />,
      color: theme.palette.success.main,
    },
    {
      id: 'fnb',
      name: 'Food & Beverage',
      current: 15000,
      previous: 14200,
      change: 5.6,
      transactions: 187,
      avgTransaction: 80.21,
      icon: <Restaurant sx={{ color: 'white' }} />,
      color: theme.palette.secondary.main,
    },
    {
      id: 'pro_shop',
      name: 'Pro Shop',
      current: 10000,
      previous: 11500,
      change: -13.0,
      transactions: 78,
      avgTransaction: 128.21,
      icon: <Store sx={{ color: 'white' }} />,
      color: theme.palette.info.main,
    },
  ]);

  const [recentTransactions] = useState<RevenueTransaction[]>([
    { id: '1', date: '2025-05-31', member: 'John Smith', type: 'Green Fee', amount: 110.00, department: 'Golf', status: 'Completed' },
    { id: '2', date: '2025-05-31', member: 'Sarah Johnson', type: 'F&B Purchase', amount: 45.50, department: 'F&B', status: 'Completed' },
    { id: '3', date: '2025-05-30', member: 'Robert Williams', type: 'Pro Shop', amount: 199.99, department: 'Pro Shop', status: 'Completed' },
    { id: '4', date: '2025-05-30', member: 'Emily Davis', type: 'Membership Dues', amount: 350.00, department: 'Membership', status: 'Completed' },
    { id: '5', date: '2025-05-29', member: 'Michael Brown', type: 'Tournament Entry', amount: 75.00, department: 'Golf', status: 'Pending' },
  ]);

  useEffect(() => {
    loadData();
  }, [period, selectedStream]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (err) {
      setError('Failed to load revenue analytics data');
    } finally {
      setLoading(false);
    }
  };

  const totalRevenue = revenueStreams.reduce((sum, stream) => sum + stream.current, 0);
  const totalChange = ((totalRevenue - revenueStreams.reduce((sum, stream) => sum + stream.previous, 0)) / revenueStreams.reduce((sum, stream) => sum + stream.previous, 0)) * 100;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Revenue Analytics
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Stream</InputLabel>
            <Select
              value={selectedStream}
              label="Stream"
              onChange={(e) => setSelectedStream(e.target.value)}
            >
              <MenuItem value="all">All Streams</MenuItem>
              <MenuItem value="membership">Membership</MenuItem>
              <MenuItem value="green_fees">Green Fees</MenuItem>
              <MenuItem value="fnb">F&B</MenuItem>
              <MenuItem value="pro_shop">Pro Shop</MenuItem>
            </Select>
          </FormControl>
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
            </Select>
          </FormControl>
          <IconButton onClick={loadData} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button
            startIcon={<FileDownload />}
            variant="outlined"
            size="small"
          >
            Export
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Box textAlign="center">
                <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  ${totalRevenue.toLocaleString()}
                </Typography>
                <Typography variant="h6" color="textSecondary">
                  Total Revenue
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
                  {totalChange > 0 ? (
                    <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography
                    variant="body1"
                    sx={{ 
                      color: totalChange > 0 ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}% vs last period
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={9}>
              <Grid container spacing={2}>
                {revenueStreams.map((stream) => (
                  <Grid item xs={6} md={3} key={stream.id}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          backgroundColor: stream.color,
                          borderRadius: 1,
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 40,
                          minHeight: 40,
                        }}
                      >
                        {stream.icon}
                      </Box>
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          {stream.name}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          ${stream.current.toLocaleString()}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ 
                            color: stream.change > 0 ? 'success.main' : 'error.main',
                            fontWeight: 'medium'
                          }}
                        >
                          {stream.change > 0 ? '+' : ''}{stream.change.toFixed(1)}%
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Revenue Stream Details */}
      <Grid container spacing={3} mb={4}>
        {revenueStreams.map((stream) => (
          <Grid item xs={12} sm={6} md={3} key={stream.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {stream.name}
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                      ${stream.current.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: stream.color,
                      borderRadius: 2,
                      p: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 48,
                      minHeight: 48,
                    }}
                  >
                    {stream.icon}
                  </Box>
                </Box>
                
                <Box mb={2}>
                  <Box display="flex" alignItems="center" mb={0.5}>
                    {stream.change > 0 ? (
                      <TrendingUp sx={{ color: 'success.main', mr: 0.5, fontSize: 20 }} />
                    ) : (
                      <TrendingDown sx={{ color: 'error.main', mr: 0.5, fontSize: 20 }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ 
                        color: stream.change > 0 ? 'success.main' : 'error.main',
                        fontWeight: 'medium'
                      }}
                    >
                      {stream.change > 0 ? '+' : ''}{stream.change.toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Transactions: {stream.transactions}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Avg. Transaction: ${stream.avgTransaction.toFixed(2)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Transactions */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Recent Revenue Transactions
          </Typography>
          <Button startIcon={<FilterList />} size="small">
            Filter
          </Button>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Member</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Department</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.date}</TableCell>
                  <TableCell>{transaction.member}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>{transaction.department}</TableCell>
                  <TableCell align="right">
                    ${transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={transaction.status}
                      color={transaction.status === 'Completed' ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={recentTransactions.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
        />
      </Paper>

      {/* Status Alert */}
      <Alert severity="info" sx={{ mt: 3 }}>
        Financial ERP system is active. Advanced charting will be available once all components are loaded.
      </Alert>
    </Box>
  );
};

export default RevenueAnalyticsSimple;