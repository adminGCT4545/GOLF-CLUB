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
    byStream: Array<{ name: string; value: number; color: string }>;
  };
  expenses: {
    total: number;
    change: number;
    byCategory: Array<{ name: string; value: number }>;
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
}

const KPICard: React.FC<KPICardProps> = ({ title, value, change, icon, color, isLoading }) => {
  return (
    <Card sx={{ height: '100%' }}>
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
                  {typeof value === 'number' && title.includes('$') 
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
                </Box>
              </>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: color,
              borderRadius: 2,
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 48,
              minHeight: 48,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const ExecutiveDashboardSimple: React.FC = () => {
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
      
      // Mock data for now - replace with actual API calls
      const mockData: DashboardData = {
        revenue: {
          total: 125750,
          change: 12.5,
          byStream: [
            { name: 'Membership', value: 75000, color: theme.palette.primary.main },
            { name: 'Green Fees', value: 25750, color: theme.palette.success.main },
            { name: 'F&B', value: 15000, color: theme.palette.secondary.main },
            { name: 'Pro Shop', value: 10000, color: theme.palette.info.main },
          ],
        },
        expenses: {
          total: 87500,
          change: -8.2,
          byCategory: [
            { name: 'Payroll', value: 45000 },
            { name: 'Maintenance', value: 25000 },
            { name: 'Utilities', value: 12500 },
            { name: 'Other', value: 5000 },
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
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      setDashboardData(mockData);
    } catch (err) {
      setError('Failed to load dashboard data');
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
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Executive Dashboard
        </Typography>
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
            </Select>
          </FormControl>
          <IconButton onClick={loadDashboardData} disabled={loading}>
            <Refresh />
          </IconButton>
          <IconButton>
            <FileDownload />
          </IconButton>
        </Box>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={dashboardData?.revenue.total || 0}
            change={dashboardData?.revenue.change || 0}
            icon={<AttachMoney sx={{ color: 'white' }} />}
            color={theme.palette.primary.main}
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Expenses"
            value={dashboardData?.expenses.total || 0}
            change={dashboardData?.expenses.change || 0}
            icon={<AccountBalance sx={{ color: 'white' }} />}
            color={theme.palette.error.main}
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Net Profit"
            value={dashboardData?.profitability.net || 0}
            change={8.7}
            icon={<Assessment sx={{ color: 'white' }} />}
            color={theme.palette.success.main}
            isLoading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Members"
            value={dashboardData?.members.active || 0}
            change={dashboardData?.members.change || 0}
            icon={<People sx={{ color: 'white' }} />}
            color={theme.palette.info.main}
            isLoading={loading}
          />
        </Grid>
      </Grid>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Revenue Streams
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                <CircularProgress />
              </Box>
            ) : (
              <Box display="flex" flexDirection="column" gap={2} pt={2}>
                {dashboardData?.revenue.byStream.map((stream, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" alignItems="center">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          backgroundColor: stream.color,
                          borderRadius: 1,
                        }}
                      />
                      <Typography>{stream.name}</Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      ${stream.value.toLocaleString()}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Key Performance Indicators
            </Typography>
            <Box display="flex" flexDirection="column" gap={3} pt={2}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body1">Member Retention Rate</Typography>
                  <Chip 
                    label={`${dashboardData?.members.retention || 0}%`} 
                    color="success" 
                    variant="outlined"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body1">Profit Margin</Typography>
                  <Chip 
                    label={`${dashboardData?.profitability.margin || 0}%`} 
                    color="primary" 
                    variant="outlined"
                  />
                </Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="body1">Avg. Member LTV</Typography>
                  <Chip 
                    label={`$${dashboardData?.members.ltv.toLocaleString() || 0}`} 
                    color="info" 
                    variant="outlined"
                  />
                </Box>
              </Box>
              
              {/* Department Performance */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Department Performance
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <GolfCourse sx={{ color: theme.palette.primary.main }} />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Golf</Typography>
                        <Typography variant="h6">$25.7K</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Restaurant sx={{ color: theme.palette.secondary.main }} />
                      <Box>
                        <Typography variant="body2" color="textSecondary">F&B</Typography>
                        <Typography variant="h6">$15.0K</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Store sx={{ color: theme.palette.info.main }} />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Pro Shop</Typography>
                        <Typography variant="h6">$10.0K</Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <People sx={{ color: theme.palette.success.main }} />
                      <Box>
                        <Typography variant="body2" color="textSecondary">Members</Typography>
                        <Typography variant="h6">$75.0K</Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* System Status */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Financial ERP System Status
        </Typography>
        <Box display="flex" gap={2}>
          <Chip label="Database Connected" color="success" />
          <Chip label="Real-time Updates" color="info" />
          <Chip label="Charts Loading..." color="warning" />
        </Box>
      </Paper>
    </Box>
  );
};

export default ExecutiveDashboardSimple;