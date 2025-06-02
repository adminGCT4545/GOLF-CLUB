import React, { useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  Paper,
} from '@mui/material';
import {
  GolfCourse,
  EmojiEvents,
  Message,
  AccountBalance,
  TrendingUp,
  Event,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { unreadCount } = useSelector((state: RootState) => state.message);

  const quickStats = [
    {
      title: 'Upcoming Bookings',
      value: '3',
      icon: <GolfCourse />,
      color: 'primary',
      action: () => navigate('/bookings'),
    },
    {
      title: 'Active Tournaments',
      value: '2',
      icon: <EmojiEvents />,
      color: 'secondary',
      action: () => navigate('/tournaments'),
    },
    {
      title: 'Unread Messages',
      value: unreadCount.toString(),
      icon: <Message />,
      color: 'error',
      action: () => navigate('/messages'),
    },
    {
      title: 'Account Balance',
      value: '$0.00',
      icon: <AccountBalance />,
      color: 'success',
      action: () => navigate('/financial'),
    },
  ];

  const upcomingBookings = [
    {
      id: 1,
      date: '2024-01-15',
      time: '09:00 AM',
      course: 'Championship Course',
      players: 4,
    },
    {
      id: 2,
      date: '2024-01-18',
      time: '02:30 PM',
      course: 'Executive Course',
      players: 2,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'booking',
      message: 'Tee time booked for January 15th',
      time: '2 hours ago',
    },
    {
      id: 2,
      type: 'tournament',
      message: 'Registered for Spring Championship',
      time: '1 day ago',
    },
    {
      id: 3,
      type: 'message',
      message: 'New message from Pro Shop',
      time: '2 days ago',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Welcome back, {user?.firstName}!
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickStats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 3,
                },
              }}
              onClick={stat.action}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: `${stat.color}.main` }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Upcoming Bookings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="div">
                  Upcoming Tee Times
                </Typography>
                <Button size="small" onClick={() => navigate('/bookings')}>
                  View All
                </Button>
              </Box>
              <List>
                {upcomingBookings.map((booking) => (
                  <ListItem key={booking.id} divider>
                    <ListItemText
                      primary={`${booking.course} - ${booking.players} players`}
                      secondary={`${booking.date} at ${booking.time}`}
                    />
                    <Chip label="Confirmed" color="success" size="small" />
                  </ListItem>
                ))}
              </List>
              {upcomingBookings.length === 0 && (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No upcoming bookings
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>
              <List>
                {recentActivity.map((activity) => (
                  <ListItem key={activity.id} divider>
                    <ListItemText
                      primary={activity.message}
                      secondary={activity.time}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Member Info */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                Member Information
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ mr: 2, width: 56, height: 56 }}>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6">
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Typography color="text.secondary">
                    Member #{user?.memberNumber}
                  </Typography>
                  <Chip 
                    label={user?.membershipTier} 
                    color="primary" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Box>
              {user?.handicapIndex && (
                <Typography variant="body2" color="text.secondary">
                  Handicap Index: {user.handicapIndex}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="div" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<GolfCourse />}
                    onClick={() => navigate('/bookings')}
                  >
                    Book Tee Time
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EmojiEvents />}
                    onClick={() => navigate('/tournaments')}
                  >
                    View Tournaments
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Message />}
                    onClick={() => navigate('/messages')}
                  >
                    Messages
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Event />}
                    onClick={() => navigate('/profile')}
                  >
                    My Profile
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
