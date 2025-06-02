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
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  People,
  AttachMoney,
  GolfCourse,
  Restaurant,
  Store,
  Event,
  Refresh,
  FileDownload,
  FilterList,
  PersonAdd,
  PersonRemove,
  LocalOffer,
  Timeline,
  Analytics,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
} from 'recharts';

interface MemberMetrics {
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  retentionRate: number;
  avgSpendPerMember: number;
  avgVisitsPerMonth: number;
  membershipGrowthRate: number;
}

interface MemberSpendingData {
  memberId: string;
  memberName: string;
  memberNumber: string;
  membershipTier: string;
  totalSpent: number;
  avgSpendPerVisit: number;
  visitCount: number;
  greenFeesSpent: number;
  fnbSpent: number;
  proShopSpent: number;
  eventSpent: number;
  joinDate: string;
  lastVisit: string;
  handicap: number;
  status: string;
}

interface MemberSegment {
  segment: string;
  count: number;
  avgSpend: number;
  totalRevenue: number;
  percentage: number;
  color: string;
}

interface MemberEngagement {
  month: string;
  newMembers: number;
  activeMembers: number;
  churnedMembers: number;
  totalBookings: number;
  avgSpendPerMember: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`member-analytics-tabpanel-${index}`}
      aria-labelledby={`member-analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MemberAnalytics: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState('monthly');
  const [membershipTier, setMembershipTier] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Mock data - replace with actual API calls
  const [memberMetrics] = useState<MemberMetrics>({
    totalMembers: 1250,
    activeMembers: 1180,
    newMembersThisMonth: 15,
    retentionRate: 94.4,
    avgSpendPerMember: 1847.50,
    avgVisitsPerMonth: 8.3,
    membershipGrowthRate: 1.2,
  });

  const [memberSegments] = useState<MemberSegment[]>([
    { segment: 'Premium Members', count: 185, avgSpend: 3250.00, totalRevenue: 601250, percentage: 14.8, color: '#1976d2' },
    { segment: 'Regular Members', count: 650, avgSpend: 1850.00, totalRevenue: 1202500, percentage: 52.0, color: '#2e7d32' },
    { segment: 'Basic Members', count: 285, avgSpend: 950.00, totalRevenue: 270750, percentage: 22.8, color: '#ed6c02' },
    { segment: 'Social Members', count: 130, avgSpend: 450.00, totalRevenue: 58500, percentage: 10.4, color: '#9c27b0' },
  ]);

  const [memberSpendingData] = useState<MemberSpendingData[]>([
    {
      memberId: 'M001',
      memberName: 'John Smith',
      memberNumber: 'RGC-2023-001',
      membershipTier: 'Premium',
      totalSpent: 4250.00,
      avgSpendPerVisit: 185.50,
      visitCount: 23,
      greenFeesSpent: 1800.00,
      fnbSpent: 1200.00,
      proShopSpent: 950.00,
      eventSpent: 300.00,
      joinDate: '2023-01-15',
      lastVisit: '2025-05-30',
      handicap: 12.5,
      status: 'Active'
    },
    {
      memberId: 'M002',
      memberName: 'Sarah Johnson',
      memberNumber: 'RGC-2023-047',
      membershipTier: 'Premium',
      totalSpent: 3800.00,
      avgSpendPerVisit: 190.00,
      visitCount: 20,
      greenFeesSpent: 1600.00,
      fnbSpent: 1100.00,
      proShopSpent: 800.00,
      eventSpent: 300.00,
      joinDate: '2023-03-22',
      lastVisit: '2025-05-29',
      handicap: 8.2,
      status: 'Active'
    },
    {
      memberId: 'M003',
      memberName: 'Robert Williams',
      memberNumber: 'RGC-2022-156',
      membershipTier: 'Regular',
      totalSpent: 2100.00,
      avgSpendPerVisit: 105.00,
      visitCount: 20,
      greenFeesSpent: 1200.00,
      fnbSpent: 600.00,
      proShopSpent: 250.00,
      eventSpent: 50.00,
      joinDate: '2022-08-10',
      lastVisit: '2025-05-28',
      handicap: 16.8,
      status: 'Active'
    },
    // Add more mock data...
  ]);

  const [engagementData] = useState<MemberEngagement[]>([
    { month: 'Jan', newMembers: 12, activeMembers: 1165, churnedMembers: 8, totalBookings: 2340, avgSpendPerMember: 1620 },
    { month: 'Feb', newMembers: 18, activeMembers: 1175, churnedMembers: 5, totalBookings: 2180, avgSpendPerMember: 1580 },
    { month: 'Mar', newMembers: 22, activeMembers: 1192, churnedMembers: 7, totalBookings: 2650, avgSpendPerMember: 1720 },
    { month: 'Apr', newMembers: 15, activeMembers: 1200, churnedMembers: 6, totalBookings: 2890, avgSpendPerMember: 1890 },
    { month: 'May', newMembers: 15, activeMembers: 1209, churnedMembers: 4, totalBookings: 3120, avgSpendPerMember: 1847 },
  ]);

  const [membershipTierData] = useState([
    { tier: 'Premium', value: 185, color: '#1976d2' },
    { tier: 'Regular', value: 650, color: '#2e7d32' },
    { tier: 'Basic', value: 285, color: '#ed6c02' },
    { tier: 'Social', value: 130, color: '#9c27b0' },
  ]);

  useEffect(() => {
    loadData();
  }, [period, membershipTier]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would make actual API calls to:
      // - GET /api/v1/erp/members/analytics/overview
      // - GET /api/v1/erp/members/spending-patterns
      // - GET /api/v1/erp/members/engagement-metrics
      // - GET /api/v1/erp/members/segmentation
      
    } catch (err) {
      setError('Failed to load member analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Simulate export
      const exportData = {
        reportType: 'member-analytics',
        period,
        membershipTier,
        generatedAt: new Date().toISOString(),
        data: memberSpendingData
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `member_analytics_${period}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const getMembershipTierColor = (tier: string) => {
    switch (tier) {
      case 'Premium': return theme.palette.primary.main;
      case 'Regular': return theme.palette.success.main;
      case 'Basic': return theme.palette.warning.main;
      case 'Social': return theme.palette.secondary.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Member Analytics
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Tier</InputLabel>
            <Select
              value={membershipTier}
              label="Tier"
              onChange={(e) => setMembershipTier(e.target.value)}
            >
              <MenuItem value="all">All Tiers</MenuItem>
              <MenuItem value="premium">Premium</MenuItem>
              <MenuItem value="regular">Regular</MenuItem>
              <MenuItem value="basic">Basic</MenuItem>
              <MenuItem value="social">Social</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="quarterly">Quarterly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
          <IconButton onClick={loadData} disabled={loading}>
            <Refresh />
          </IconButton>
          <Button
            startIcon={<FileDownload />}
            onClick={handleExport}
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

      {/* Key Metrics Overview */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Members
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {memberMetrics.totalMembers.toLocaleString()}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <PersonAdd sx={{ color: 'success.main', mr: 0.5, fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: 'success.main' }}>
                      +{memberMetrics.newMembersThisMonth} this month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
                  <People />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Members
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {memberMetrics.activeMembers.toLocaleString()}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography variant="body2" color="textSecondary">
                      {((memberMetrics.activeMembers / memberMetrics.totalMembers) * 100).toFixed(1)}% of total
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.success.main, width: 56, height: 56 }}>
                  <TrendingUp />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Avg Spend/Member
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {formatCurrency(memberMetrics.avgSpendPerMember)}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <Typography variant="body2" color="textSecondary">
                      {memberMetrics.avgVisitsPerMonth} visits/month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 56, height: 56 }}>
                  <AttachMoney />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Retention Rate
                  </Typography>
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {memberMetrics.retentionRate}%
                  </Typography>
                  <Box mt={1}>
                    <LinearProgress 
                      variant="determinate" 
                      value={memberMetrics.retentionRate} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: theme.palette.info.main, width: 56, height: 56 }}>
                  <Analytics />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for Different Analytics Views */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Member Segmentation" icon={<People />} />
          <Tab label="Spending Analysis" icon={<AttachMoney />} />
          <Tab label="Engagement Trends" icon={<Timeline />} />
          <Tab label="Member Details" icon={<Analytics />} />
        </Tabs>

        {/* Tab 1: Member Segmentation */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Members by Tier
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={membershipTierData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={(entry) => `${entry.tier}: ${entry.value}`}
                    >
                      {membershipTierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Revenue by Segment
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={memberSegments}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="segment" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="totalRevenue" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Segment</TableCell>
                      <TableCell align="right">Members</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                      <TableCell align="right">Avg Spend</TableCell>
                      <TableCell align="right">Total Revenue</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {memberSegments.map((segment) => (
                      <TableRow key={segment.segment}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Box
                              sx={{
                                width: 16,
                                height: 16,
                                backgroundColor: segment.color,
                                borderRadius: '50%',
                                mr: 1
                              }}
                            />
                            {segment.segment}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{segment.count}</TableCell>
                        <TableCell align="right">{segment.percentage}%</TableCell>
                        <TableCell align="right">{formatCurrency(segment.avgSpend)}</TableCell>
                        <TableCell align="right">{formatCurrency(segment.totalRevenue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 2: Spending Analysis */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Member Engagement & Spending Trends
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalBookings" fill={theme.palette.primary.main} name="Total Bookings" />
                    <Line yAxisId="right" type="monotone" dataKey="avgSpendPerMember" stroke={theme.palette.secondary.main} name="Avg Spend per Member" />
                    <Line yAxisId="left" type="monotone" dataKey="activeMembers" stroke={theme.palette.success.main} name="Active Members" />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Spending Distribution by Category
                </Typography>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={3}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    {['Green Fees', 'Food & Beverage', 'Pro Shop', 'Events'].map((category, index) => {
                      const colors = [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.warning.main];
                      const percentages = [40, 30, 20, 10];
                      return (
                        <Box key={category} mb={2}>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">{category}</Typography>
                            <Typography variant="body2" fontWeight="bold">{percentages[index]}%</Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={percentages[index]}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: colors[index]
                              }
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Member Value Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart data={memberSpendingData}>
                    <CartesianGrid />
                    <XAxis dataKey="visitCount" name="Visits" />
                    <YAxis dataKey="totalSpent" name="Total Spent" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={memberSpendingData} fill={theme.palette.primary.main} />
                  </ScatterChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 3: Engagement Trends */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Member Growth & Churn Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newMembers" fill={theme.palette.success.main} name="New Members" />
                    <Bar dataKey="churnedMembers" fill={theme.palette.error.main} name="Churned Members" />
                    <Line type="monotone" dataKey="activeMembers" stroke={theme.palette.primary.main} name="Active Members" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Member Growth Rate
                  </Typography>
                  <Typography variant="h3" color="primary" fontWeight="bold">
                    +{memberMetrics.membershipGrowthRate}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Monthly growth rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Churn Rate
                  </Typography>
                  <Typography variant="h3" color="error" fontWeight="bold">
                    {(100 - memberMetrics.retentionRate).toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Monthly churn rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Member Lifetime Value
                  </Typography>
                  <Typography variant="h3" color="secondary" fontWeight="bold">
                    {formatCurrency(memberMetrics.avgSpendPerMember * 24)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Estimated 2-year value
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Tab 4: Member Details */}
        <TabPanel value={tabValue} index={3}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Top Spending Members
              </Typography>
              <Button startIcon={<FilterList />} size="small">
                Filter
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell align="right">Total Spent</TableCell>
                    <TableCell align="right">Visits</TableCell>
                    <TableCell align="right">Avg/Visit</TableCell>
                    <TableCell align="right">Green Fees</TableCell>
                    <TableCell align="right">F&B</TableCell>
                    <TableCell align="right">Pro Shop</TableCell>
                    <TableCell align="right">Events</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {memberSpendingData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((member) => (
                    <TableRow key={member.memberId}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {member.memberName}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {member.memberNumber}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.membershipTier}
                          size="small"
                          sx={{
                            backgroundColor: getMembershipTierColor(member.membershipTier),
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(member.totalSpent)}
                      </TableCell>
                      <TableCell align="right">{member.visitCount}</TableCell>
                      <TableCell align="right">{formatCurrency(member.avgSpendPerVisit)}</TableCell>
                      <TableCell align="right">{formatCurrency(member.greenFeesSpent)}</TableCell>
                      <TableCell align="right">{formatCurrency(member.fnbSpent)}</TableCell>
                      <TableCell align="right">{formatCurrency(member.proShopSpent)}</TableCell>
                      <TableCell align="right">{formatCurrency(member.eventSpent)}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          color={member.status === 'Active' ? 'success' : 'default'}
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
              count={memberSpendingData.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => setRowsPerPage(parseInt(e.target.value, 10))}
            />
          </Paper>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default MemberAnalytics;
