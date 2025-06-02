import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Stack,
  TextField
} from '@mui/material';
import {
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  ShoppingCart as ShoppingCartIcon,
  Restaurant as RestaurantIcon,
  SportsGolf as GolfIcon,
  Payment as PaymentIcon,
  Event as EventIcon,
  Note as NoteIcon,
  Edit as EditIcon
} from '@mui/icons-material';

interface MemberProfileProps {
  open: boolean;
  onClose: () => void;
  memberId: string;
}

interface MemberDetails {
  id: string;
  member_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: any;
  membership_tier: string;
  tier_description: string;
  tier_benefits: any;
  handicap_index: number | null;
  join_date: string;
  status: string;
  profile_image_url: string | null;
  preferences: any;
  emergency_contact: any;
  recentBookings: any[];
  financialSummary: any;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`member-tabpanel-${index}`}
      aria-labelledby={`member-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const MemberProfile: React.FC<MemberProfileProps> = ({ open, onClose, memberId }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [member, setMember] = useState<MemberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [proShopPurchases, setProShopPurchases] = useState([]);
  const [fnbPurchases, setFnbPurchases] = useState([]);
  const [memberStats, setMemberStats] = useState<any>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && memberId) {
      fetchMemberDetails();
      fetchPurchaseHistory();
      fetchMemberStats();
    }
  }, [open, memberId]);

  const fetchMemberDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/members/${memberId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMember(data.data);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchaseHistory = async () => {
    try {
      // Fetch Pro Shop purchases
      const proShopResponse = await fetch(`/api/v1/pos/member/${memberId}/purchases?category=pro_shop&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (proShopResponse.ok) {
        const proShopData = await proShopResponse.json();
        setProShopPurchases(proShopData.data || []);
      }

      // Fetch F&B purchases
      const fnbResponse = await fetch(`/api/v1/pos/member/${memberId}/purchases?category=fnb&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (fnbResponse.ok) {
        const fnbData = await fnbResponse.json();
        setFnbPurchases(fnbData.data || []);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
    }
  };

  const fetchMemberStats = async () => {
    try {
      const response = await fetch(`/api/v1/members/${memberId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMemberStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching member stats:', error);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading || !member) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading member profile...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar 
            src={member.profile_image_url || undefined}
            sx={{ width: 60, height: 60 }}
          >
            {member.first_name[0]}{member.last_name[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" component="div">
              {member.first_name} {member.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Member #{member.member_number}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Personal Information" />
          <Tab label="Membership Details" />
          <Tab label="Activities" />
          <Tab label="Purchase History" />
          <Tab label="Notes" />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 0 }}>
        {/* Personal Information Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Contact Information
                    </Typography>
                    <Stack spacing={2}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon color="action" />
                        <Typography>{member.email}</Typography>
                      </Box>
                      {member.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon color="action" />
                          <Typography>{member.phone}</Typography>
                        </Box>
                      )}
                      {member.address && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationIcon color="action" />
                          <Box>
                            {member.address.line1 && <Typography>{member.address.line1}</Typography>}
                            {member.address.line2 && <Typography>{member.address.line2}</Typography>}
                            {member.address.city && (
                              <Typography>
                                {member.address.city}, {member.address.state} {member.address.postal_code}
                              </Typography>
                            )}
                            {member.address.country && <Typography>{member.address.country}</Typography>}
                          </Box>
                        </Box>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Emergency Contact
                    </Typography>
                    {member.emergency_contact ? (
                      <Stack spacing={1}>
                        <Typography>
                          <strong>Name:</strong> {member.emergency_contact.name}
                        </Typography>
                        <Typography>
                          <strong>Relationship:</strong> {member.emergency_contact.relationship}
                        </Typography>
                        <Typography>
                          <strong>Phone:</strong> {member.emergency_contact.phone}
                        </Typography>
                      </Stack>
                    ) : (
                      <Typography color="text.secondary">No emergency contact on file</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Membership Details Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Membership Type
                        </Typography>
                        <Chip 
                          label={member.membership_tier} 
                          color="primary" 
                          variant="outlined"
                          size="medium"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Points Balance
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TrendingUpIcon sx={{ color: 'success.main' }} />
                          <Typography variant="h5" color="success.main">
                            {memberStats?.points || 0}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Join Date
                        </Typography>
                        <Typography variant="h6" color="primary">
                          {formatDate(member.join_date)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Status
                        </Typography>
                        <Chip 
                          label={member.status.toUpperCase()} 
                          color={member.status === 'active' ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Membership Benefits
                    </Typography>
                    {member.tier_benefits ? (
                      <List dense>
                        {Array.isArray(member.tier_benefits) ? 
                          member.tier_benefits.map((benefit: string, index: number) => (
                            <ListItem key={index}>
                              <ListItemText primary={benefit} />
                            </ListItem>
                          )) : (
                            typeof member.tier_benefits === 'object' ? (
                              Object.entries(member.tier_benefits).map(([key, value]: [string, any]) => (
                                <ListItem key={key}>
                                  <ListItemText 
                                    primary={key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    secondary={value === true ? 'Included' : value === false ? 'Not included' : String(value)}
                                  />
                                </ListItem>
                              ))
                            ) : (
                              <ListItem>
                                <ListItemText primary={String(member.tier_benefits)} />
                              </ListItem>
                            )
                          )
                        }
                      </List>
                    ) : (
                      <Typography color="text.secondary">No benefits listed</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Activities Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <GolfIcon /> Recent Bookings
                    </Typography>
                    {member.recentBookings && member.recentBookings.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Course</TableCell>
                              <TableCell>Players</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {member.recentBookings.slice(0, 5).map((booking: any) => (
                              <TableRow key={booking.id}>
                                <TableCell>{formatDate(booking.tee_time)}</TableCell>
                                <TableCell>{booking.course_name}</TableCell>
                                <TableCell>{booking.players_count}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={booking.status} 
                                    size="small"
                                    color={booking.status === 'completed' ? 'success' : 'default'}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="text.secondary">No recent bookings</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EventIcon /> Tournament Participation
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography color="text.secondary">Tournaments Played</Typography>
                        <Typography variant="h4">{memberStats?.tournaments?.tournaments_participated || 0}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography color="text.secondary">Completed</Typography>
                        <Typography variant="h4">{memberStats?.tournaments?.tournaments_completed || 0}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Purchase History Tab */}
        <TabPanel value={activeTab} index={3}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingCartIcon /> Pro Shop Purchases
                    </Typography>
                    {proShopPurchases.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Items</TableCell>
                              <TableCell>Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {proShopPurchases.slice(0, 5).map((purchase: any) => (
                              <TableRow key={purchase.id}>
                                <TableCell>{formatDate(purchase.order_date)}</TableCell>
                                <TableCell>{purchase.items?.length || 0} items</TableCell>
                                <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="text.secondary">No pro shop purchases</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <RestaurantIcon /> F&B Purchases
                    </Typography>
                    {fnbPurchases.length > 0 ? (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Items</TableCell>
                              <TableCell>Amount</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {fnbPurchases.slice(0, 5).map((purchase: any) => (
                              <TableRow key={purchase.id}>
                                <TableCell>{formatDate(purchase.order_date)}</TableCell>
                                <TableCell>{purchase.items?.length || 0} items</TableCell>
                                <TableCell>{formatCurrency(purchase.total_amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography color="text.secondary">No F&B purchases</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon /> Financial Summary
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography color="text.secondary">Total Spent</Typography>
                        <Typography variant="h5" color="primary">
                          {formatCurrency(memberStats?.financial?.total_spent || 0)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography color="text.secondary">Total Transactions</Typography>
                        <Typography variant="h5">
                          {memberStats?.financial?.total_transactions || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Typography color="text.secondary">Avg Transaction</Typography>
                        <Typography variant="h5">
                          {formatCurrency(memberStats?.financial?.avg_transaction_amount || 0)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Notes Tab */}
        <TabPanel value={activeTab} index={4}>
          <Box sx={{ p: 3 }}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NoteIcon /> Member Notes
                  </Typography>
                  <IconButton size="small">
                    <EditIcon />
                  </IconButton>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this member..."
                  variant="outlined"
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" size="small">
                    Save Notes
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </DialogContent>

      <DialogActions sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" startIcon={<EditIcon />}>
          Edit Member
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MemberProfile;
