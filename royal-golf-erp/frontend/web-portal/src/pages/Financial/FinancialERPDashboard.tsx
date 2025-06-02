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
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  People,
  Restaurant,
  Store,
  GolfCourse,
  AccountBalance,
  Assessment,
  Refresh,
  FileDownload,
  Business,
  Timeline,
  PieChart,
} from '@mui/icons-material';

interface KPICardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
  isLoading?: boolean;
}

interface DashboardData {
  revenue: {
    total: number;
    change: number;
    byStream: Array<{ name: string; value: number; percentage: number; color: string }>;
    monthlyTrend: Array<{ month: string; value: number }>;
  };
  expenses: {
    total: number;
    change: number;
    byCategory: Array<{ name: string; value: number; percentage: number }>;
  };
  members: {
    active: number;
    change: number;
    retention: number;
    ltv: number;
  };
  profitability: {
    gross: number;
    net: number;
    margin: number;
  };
  kpis: {
    revenuePerMember: number;
    avgTransactionValue: number;
    membershipGrowth: number;
    operationalEfficiency: number;
  };
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, color, isLoading }) => {
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
                  {typeof value === 'number' && title.toLowerCase().includes('revenue') 
                    ? `$${value.toLocaleString()}` 
                    : typeof value === 'number' && title.toLowerCase().includes('expense')
                    ? `$${value.toLocaleString()}`
                    : typeof value === 'number' && title.toLowerCase().includes('profit')
                    ? `$${value.toLocaleString()}`
                    : value}
                </Typography>
                <Box display="flex" alignItems="center">
                  {change > 0 ? (
                    <TrendingUp sx={{ color: 'success.main', mr: 0.5 }} />
                  ) : (
                    <TrendingDown sx={{ color: 'error.main', mr: 0.5 }} />
                  )}
                  <Typography
                    variant="body2"
                    sx={{ 
                      color: change > 0 ? 'success.main' : 'error.main',
                      fontWeight: 'medium'
                    }}
                  >
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                    vs last period
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

const FinancialERPDashboard: React.FC = () => {
  const theme = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('monthly');

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data - in production, this would call the ERP API
      const mockData: DashboardData = {
        revenue: {
          total: 125750,
          change: 12.5,
          byStream: [
            { name: 'Membership Dues', value: 75000, percentage: 59.6, color: theme.palette.primary.main },
            { name: 'Green Fees', value: 25750, percentage: 20.5, color: theme.palette.success.main },
            { name: 'Food & Beverage', value: 15000, percentage: 11.9, color: theme.palette.secondary.main },
            { name: 'Pro Shop', value: 10000, percentage: 8.0, color: theme.palette.info.main },
          ],
          monthlyTrend: [
            { month: 'Jan', value: 95000 },
            { month: 'Feb', value: 102000 },
            { month: 'Mar', value: 118000 },
            { month: 'Apr', value: 115000 },
            { month: 'May', value: 125750 },
          ],
        },
        expenses: {
          total: 87500,
          change: -8.2,
          byCategory: [
            { name: 'Payroll & Benefits', value: 45000, percentage: 51.4 },
            { name: 'Course Maintenance', value: 25000, percentage: 28.6 },
            { name: 'Utilities', value: 12500, percentage: 14.3 },
            { name: 'Other Operations', value: 5000, percentage: 5.7 },
          ],
        },
        members: {
          active: 1247,
          change: 5.3,
          retention: 94.2,
          ltv: 15750,
        },
        profitability: {
          gross: 38250,
          net: 30125,
          margin: 23.9,
        },
        kpis: {
          revenuePerMember: 100.84,
          avgTransactionValue: 87.50,
          membershipGrowth: 5.3,
          operationalEfficiency: 76.8,
        },
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      setDashboardData(mockData);
    } catch (err) {
      setError('Failed to load Financial ERP dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={loadDashboardData} startIcon={<Refresh />}>
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
            Financial ERP Dashboard
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Real-time financial performance and analytics
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
          <IconButton onClick={loadDashboardData} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button
            startIcon={<FileDownload />}
            variant="outlined"
            size="small"
          >
            Export Report
          </Button>
        </Box>
      </Box>

      {/* Main KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={dashboardData?.revenue.total || 0}
            change={dashboardData?.revenue.change || 0}
            icon={<AttachMoney sx={{ color: 'white', fontSize: 28 }} />}
            color={theme.palette.primary.main}
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Expenses"
            value={dashboardData?.expenses.total || 0}
            change={dashboardData?.expenses.change || 0}
            icon={<Business sx={{ color: 'white', fontSize: 28 }} />}
            color={theme.palette.error.main}
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Net Profit"
            value={dashboardData?.profitability.net || 0}
            change={8.7}
            icon={<Assessment sx={{ color: 'white', fontSize: 28 }} />}
            color={theme.palette.success.main}
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Members"
            value={dashboardData?.members.active || 0}
            change={dashboardData?.members.change || 0}
            icon={<People sx={{ color: 'white', fontSize: 28 }} />}
            color={theme.palette.info.main}
            isLoading={loading}
          />
        </Grid>
      </Grid>

      {/* Revenue Breakdown */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 450, position: 'relative', overflow: 'hidden' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6" fontWeight="bold">
                Revenue Streams Analysis
              </Typography>
              <Chip icon={<Timeline />} label="Monthly View" color="primary" variant="outlined" />
            </Box>
            
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                <CircularProgress size={60} />
              </Box>
            ) : (
              <Box>
                {/* Revenue Streams */}
                {dashboardData?.revenue.byStream.map((stream, index) => (
                  <Box key={index} mb={2}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Box
                          sx={{
                            width: 20,
                            height: 20,
                            backgroundColor: stream.color,
                            borderRadius: 1,
                            boxShadow: 1,
                          }}
                        />
                        <Typography variant="body1" fontWeight="medium">
                          {stream.name}
                        </Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="h6" fontWeight="bold">
                          ${stream.value.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {stream.percentage}% of total
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={stream.percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: 'grey.200',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: stream.color,
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                ))}

                <Divider sx={{ my: 3 }} />

                {/* Monthly Trend - Simple display */}
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Monthly Trend (Last 5 Months)
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={2} sx={{ justifyContent: 'space-between' }}>
                    {dashboardData?.revenue.monthlyTrend.map((month, index) => (
                      <Grid item xs={2.4} key={index}>
                        <Box 
                          textAlign="center" 
                          sx={{ 
                            p: 1, 
                            border: '1px solid', 
                            borderColor: 'grey.200', 
                            borderRadius: 1,
                            backgroundColor: 'grey.50'
                          }}
                        >
                          <Typography variant="body2" color="textSecondary">
                            {month.month}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" color="primary">
                            ${(month.value / 1000).toFixed(0)}K
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, height: 450, position: 'relative', overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Key Performance Indicators
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                <CircularProgress />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2}>
                {/* KPI Metrics */}
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Revenue per Member
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    ${dashboardData?.kpis.revenuePerMember.toFixed(2)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Average Transaction Value
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="secondary">
                    ${dashboardData?.kpis.avgTransactionValue.toFixed(2)}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Member Retention Rate
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="success.main">
                    {dashboardData?.members.retention}%
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Operational Efficiency
                  </Typography>
                  <Typography variant="h6" fontWeight="bold" color="info.main">
                    {dashboardData?.kpis.operationalEfficiency}%
                  </Typography>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, height: 450, position: 'relative', overflow: 'hidden' }}>
            <Typography variant="h6" fontWeight="bold" mb={3}>
              Department Performance
            </Typography>
            
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                <CircularProgress />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={3}>
                <Box display="flex" alignItems="center" gap={2}>
                  <GolfCourse sx={{ color: theme.palette.primary.main, fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Golf</Typography>
                    <Typography variant="h6" fontWeight="bold">$25.7K</Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <Restaurant sx={{ color: theme.palette.secondary.main, fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">F&B</Typography>
                    <Typography variant="h6" fontWeight="bold">$15.0K</Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <Store sx={{ color: theme.palette.info.main, fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Pro Shop</Typography>
                    <Typography variant="h6" fontWeight="bold">$10.0K</Typography>
                  </Box>
                </Box>
                
                <Box display="flex" alignItems="center" gap={2}>
                  <People sx={{ color: theme.palette.success.main, fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" color="textSecondary">Members</Typography>
                    <Typography variant="h6" fontWeight="bold">$75.0K</Typography>
                  </Box>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Expense Analysis */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          Expense Analysis & Budget Performance
        </Typography>
        
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                Expense Categories
              </Typography>
              {dashboardData?.expenses.byCategory.map((category, index) => (
                <Box key={index} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2">{category.name}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ${category.value.toLocaleString()} ({category.percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={category.percentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: theme.palette.error.main,
                        borderRadius: 3,
                      },
                    }}
                  />
                </Box>
              ))}
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="medium" mb={2}>
                Budget vs Actual Performance
              </Typography>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body2">Total Expenses</Typography>
                  <Chip 
                    label={`${(dashboardData?.expenses.change || 0) > 0 ? '+' : ''}${(dashboardData?.expenses.change || 0).toFixed(1)}%`}
                    color={(dashboardData?.expenses.change || 0) < 0 ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="h5" fontWeight="bold" color="error.main" mb={2}>
                  ${dashboardData?.expenses.total.toLocaleString()}
                </Typography>
                
                <Alert severity="success" sx={{ mt: 2 }}>
                  Expenses are {Math.abs(dashboardData?.expenses.change || 0).toFixed(1)}% below budget for this period
                </Alert>
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* System Status */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" mb={3}>
          Financial ERP System Status
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Chip 
              icon={<AccountBalance />} 
              label="Database Connected" 
              color="success" 
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip 
              icon={<Timeline />} 
              label="Real-time Updates Active" 
              color="info" 
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip 
              icon={<PieChart />} 
              label="Analytics Ready" 
              color="primary" 
              variant="outlined"
            />
          </Grid>
          <Grid item>
            <Chip 
              icon={<Assessment />} 
              label="Reporting Available" 
              color="secondary" 
              variant="outlined"
            />
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default FinancialERPDashboard;
