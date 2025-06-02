import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Tooltip,
  Dialog,
  Avatar,
  Stack,
  Checkbox,
  Toolbar,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Warning as WarningIcon,
  Send as SendIcon,
  SelectAll as SelectAllIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import MemberProfile from './MemberProfile';
import MassMessageDialog from '../../components/Common/MassMessageDialog';

interface Member {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  membership_tier: string;
  handicap_index: number | null;
  join_date: string;
  status: string;
  profile_image_url: string | null;
}

interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  expiringMembers: number;
  newThisMonth: number;
}

interface Filters {
  search: string;
  membershipTier: string;
  status: string;
  joinDateFrom: Date | null;
  joinDateTo: Date | null;
  emailDomain: string;
  phoneAreaCode: string;
  handicapMin: number | null;
  handicapMax: number | null;
  memberNumber: string;
}

const MemberDirectoryPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [orderBy, setOrderBy] = useState('created_at');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filters
  const [filters, setFilters] = useState<Filters>({
    search: '',
    membershipTier: '',
    status: '',
    joinDateFrom: null,
    joinDateTo: null,
    emailDomain: '',
    phoneAreaCode: '',
    handicapMin: null,
    handicapMax: null,
    memberNumber: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Dialogs
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showMemberProfile, setShowMemberProfile] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  
  // Menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMemberForMenu, setSelectedMemberForMenu] = useState<Member | null>(null);
  
  // Mass messaging
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [showMassMessage, setShowMassMessage] = useState(false);
  const [notification, setNotification] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  
  // Stats
  const [stats, setStats] = useState<MemberStats>({
    totalMembers: 0,
    activeMembers: 0,
    expiringMembers: 0,
    newThisMonth: 0
  });

  // Fetch members data
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: (page + 1).toString(),
        limit: rowsPerPage.toString()
      };

      if (filters.search) params.search = filters.search;
      if (filters.membershipTier) params.membershipTier = filters.membershipTier;
      if (filters.status) params.status = filters.status;
      if (filters.emailDomain) params.emailDomain = filters.emailDomain;
      if (filters.phoneAreaCode) params.phoneAreaCode = filters.phoneAreaCode;
      if (filters.handicapMin !== null) params.handicapMin = filters.handicapMin.toString();
      if (filters.handicapMax !== null) params.handicapMax = filters.handicapMax.toString();
      if (filters.memberNumber) params.memberNumber = filters.memberNumber;
      if (filters.joinDateFrom) params.joinDateFrom = filters.joinDateFrom.toISOString();
      if (filters.joinDateTo) params.joinDateTo = filters.joinDateTo.toISOString();
      if (orderBy) params.orderBy = orderBy;
      if (order) params.order = order;

      const queryParams = new URLSearchParams(params);

      const response = await fetch(`/api/v1/members?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.data);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/v1/members/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchStats();
  }, [page, rowsPerPage, filters, orderBy, order]);

  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (key: keyof Filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(0);
  };

  const handleViewMember = (member: Member) => {
    setSelectedMember(member);
    setShowMemberProfile(true);
    setAnchorEl(null);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, member: Member) => {
    setAnchorEl(event.currentTarget);
    setSelectedMemberForMenu(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMemberForMenu(null);
  };

  // Member selection handlers
  const handleSelectMember = (member: Member) => {
    setSelectedMembers(prev => {
      const isSelected = prev.some(m => m.id === member.id);
      if (isSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleSelectAll = () => {
    const allSelected = members.length > 0 && selectedMembers.length === members.length;
    if (allSelected) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers([...members]);
    }
  };

  const handleClearSelection = () => {
    setSelectedMembers([]);
  };

  const handleMassMessageSuccess = () => {
    setSelectedMembers([]);
    setNotification({
      open: true,
      message: `Mass message sent successfully to ${selectedMembers.length} members!`,
      severity: 'success'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'suspended': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const StatCard: React.FC<{ title: string; value: number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ color, fontSize: '2rem' }}>
            {icon}
          </Box>
          <Box>
            <Typography color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value.toLocaleString()}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Member Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowAddMember(true)}
            sx={{ px: 3 }}
          >
            Add New Member
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Total Members" 
              value={stats.totalMembers} 
              icon={<GroupIcon />} 
              color="#1976d2" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Active Members" 
              value={stats.activeMembers} 
              icon={<TrendingUpIcon />} 
              color="#2e7d32" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="Expiring Soon" 
              value={stats.expiringMembers} 
              icon={<WarningIcon />} 
              color="#ed6c02" 
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard 
              title="New This Month" 
              value={stats.newThisMonth} 
              icon={<CalendarIcon />} 
              color="#9c27b0" 
            />
          </Grid>
        </Grid>

        {/* Search and Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <FilterIcon sx={{ mr: 1 }} />
              Advanced Filters
            </Typography>
            
            {/* Primary Filters Row */}
            <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Search Name/Email"
                  placeholder="Search members..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField
                  fullWidth
                  label="Member Number"
                  placeholder="RGC-2023-001"
                  value={filters.memberNumber}
                  onChange={(e) => handleFilterChange('memberNumber', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Membership Tier</InputLabel>
                  <Select
                    value={filters.membershipTier}
                    label="Membership Tier"
                    onChange={(e) => handleFilterChange('membershipTier', e.target.value)}
                  >
                    <MenuItem value="">All Tiers</MenuItem>
                    <MenuItem value="standard">Standard</MenuItem>
                    <MenuItem value="premium">Premium</MenuItem>
                    <MenuItem value="family">Family</MenuItem>
                    <MenuItem value="corporate">Corporate</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={() => setFilters({
                      search: '',
                      membershipTier: '',
                      status: '',
                      joinDateFrom: null,
                      joinDateTo: null,
                      emailDomain: '',
                      phoneAreaCode: '',
                      handicapMin: null,
                      handicapMax: null,
                      memberNumber: ''
                    })}
                    size="small"
                  >
                    Clear All
                  </Button>
                  <Button
                    variant="text"
                    onClick={() => setShowFilters(!showFilters)}
                    size="small"
                  >
                    {showFilters ? 'Less Filters' : 'More Filters'}
                  </Button>
                </Stack>
              </Grid>
            </Grid>

            {/* Advanced Filters Row */}
            {showFilters && (
              <>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Contact Filters
                </Typography>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Email Domain"
                      placeholder="@gmail.com"
                      value={filters.emailDomain}
                      onChange={(e) => handleFilterChange('emailDomain', e.target.value)}
                      InputProps={{
                        startAdornment: <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Phone Area Code"
                      placeholder="555"
                      value={filters.phoneAreaCode}
                      onChange={(e) => handleFilterChange('phoneAreaCode', e.target.value)}
                      InputProps={{
                        startAdornment: <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} />
                      }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Date Range Filters
                </Typography>
                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Grid item xs={12} md={3}>
                    <DatePicker
                      label="Join Date From"
                      value={filters.joinDateFrom}
                      onChange={(date) => handleFilterChange('joinDateFrom', date)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <DatePicker
                      label="Join Date To"
                      value={filters.joinDateTo}
                      onChange={(date) => handleFilterChange('joinDateTo', date)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                </Grid>

                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Handicap Range Filters
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Min Handicap"
                      type="number"
                      value={filters.handicapMin || ''}
                      onChange={(e) => handleFilterChange('handicapMin', e.target.value ? parseFloat(e.target.value) : null)}
                      inputProps={{ min: 0, max: 54, step: 0.1 }}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Max Handicap"
                      type="number"
                      value={filters.handicapMax || ''}
                      onChange={(e) => handleFilterChange('handicapMax', e.target.value ? parseFloat(e.target.value) : null)}
                      inputProps={{ min: 0, max: 54, step: 0.1 }}
                      size="small"
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </CardContent>
        </Card>

        {/* Mass Message Toolbar */}
        {selectedMembers.length > 0 && (
          <Card sx={{ mb: 2, backgroundColor: 'primary.light', color: 'primary.contrastText' }}>
            <Toolbar>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<SendIcon />}
                  onClick={() => setShowMassMessage(true)}
                  disabled={selectedMembers.length === 0}
                >
                  Send Mass Message
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  startIcon={<ClearIcon />}
                  onClick={handleClearSelection}
                >
                  Clear Selection
                </Button>
              </Stack>
            </Toolbar>
          </Card>
        )}

        {/* Members Table */}
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      color="primary"
                      indeterminate={selectedMembers.length > 0 && selectedMembers.length < members.length}
                      checked={members.length > 0 && selectedMembers.length === members.length}
                      onChange={handleSelectAll}
                      inputProps={{
                        'aria-label': 'select all members',
                      }}
                    />
                  </TableCell>
                  <TableCell>Member</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell>Membership</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Join Date</TableCell>
                  <TableCell>Handicap</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  Array.from({ length: rowsPerPage }).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell colSpan={8}>
                        <Box sx={{ height: 53, bgcolor: 'action.hover', borderRadius: 1 }} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  members.map((member) => {
                    const isSelected = selectedMembers.some(m => m.id === member.id);
                    return (
                      <TableRow key={member.id} hover selected={isSelected}>
                        <TableCell padding="checkbox">
                          <Checkbox
                            color="primary"
                            checked={isSelected}
                            onChange={() => handleSelectMember(member)}
                            inputProps={{
                              'aria-labelledby': `member-${member.id}`,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar 
                              src={member.profile_image_url || undefined}
                              sx={{ width: 40, height: 40 }}
                            >
                              {member.first_name[0]}{member.last_name[0]}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }} id={`member-${member.id}`}>
                                {member.first_name} {member.last_name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                #{member.member_number}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <EmailIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                            <Typography variant="body2">{member.email}</Typography>
                          </Stack>
                          {member.phone && (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <PhoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                              <Typography variant="body2">{member.phone}</Typography>
                            </Stack>
                          )}
                        </Stack>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={member.membership_tier} 
                            variant="outlined"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={member.status} 
                            color={getStatusColor(member.status) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(member.join_date)}</TableCell>
                        <TableCell>
                          {member.handicap_index ? parseFloat(member.handicap_index.toString()).toFixed(1) : 'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Tooltip title="View Profile">
                              <IconButton 
                                size="small" 
                                onClick={() => handleViewMember(member)}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            <IconButton 
                              size="small"
                              onClick={(e) => handleMenuClick(e, member)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[10, 25, 50, 100]}
              component="div"
              count={total}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </Card>

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => selectedMemberForMenu && handleViewMember(selectedMemberForMenu)}>
            <ViewIcon sx={{ mr: 1 }} /> View Profile
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <EditIcon sx={{ mr: 1 }} /> Edit Member
          </MenuItem>
          <MenuItem onClick={handleMenuClose}>
            <EmailIcon sx={{ mr: 1 }} /> Send Message
          </MenuItem>
          <MenuItem onClick={handleMenuClose} sx={{ color: 'error.main' }}>
            <DeleteIcon sx={{ mr: 1 }} /> Delete Member
          </MenuItem>
        </Menu>

        {/* Member Profile Dialog */}
        {selectedMember && (
          <MemberProfile
            open={showMemberProfile}
            onClose={() => {
              setShowMemberProfile(false);
              setSelectedMember(null);
            }}
            memberId={selectedMember.id}
          />
        )}

        {/* Mass Message Dialog */}
        <MassMessageDialog
          open={showMassMessage}
          onClose={() => setShowMassMessage(false)}
          selectedMembers={selectedMembers}
          onSuccess={handleMassMessageSuccess}
        />

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default MemberDirectoryPage;
