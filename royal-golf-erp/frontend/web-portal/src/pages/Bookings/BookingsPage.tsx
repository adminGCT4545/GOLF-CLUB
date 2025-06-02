import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CalendarToday,
  AccessTime,
  People,
  GolfCourse,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';

interface Booking {
  id: string;
  date: Date;
  time: string;
  course: string;
  players: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  memberName: string;
  notes?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
  course: string;
}

const BookingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      date: new Date('2024-01-15'),
      time: '09:00',
      course: 'Championship Course',
      players: 4,
      status: 'confirmed',
      memberName: 'John Doe',
      notes: 'Birthday celebration round'
    },
    {
      id: '2',
      date: new Date('2024-01-18'),
      time: '14:30',
      course: 'Executive Course',
      players: 2,
      status: 'pending',
      memberName: 'Jane Smith'
    },
  ]);

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [playerCount, setPlayerCount] = useState(1);
  const [notes, setNotes] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const courses = [
    { value: 'championship', label: 'Championship Course' },
    { value: 'executive', label: 'Executive Course' },
    { value: 'practice', label: 'Practice Course' }
  ];

  const timeSlots: TimeSlot[] = [
    { time: '07:00', available: true, course: 'championship' },
    { time: '07:30', available: false, course: 'championship' },
    { time: '08:00', available: true, course: 'championship' },
    { time: '08:30', available: true, course: 'championship' },
    { time: '09:00', available: false, course: 'championship' },
    { time: '09:30', available: true, course: 'executive' },
    { time: '10:00', available: true, course: 'executive' },
    { time: '10:30', available: true, course: 'executive' },
    { time: '11:00', available: false, course: 'executive' },
    { time: '11:30', available: true, course: 'practice' },
  ];

  const availableTimeSlots = timeSlots.filter(
    slot => slot.available && (!selectedCourse || slot.course === selectedCourse)
  );

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedCourse || !playerCount) {
      setAlert({ type: 'error', message: 'Please fill in all required fields' });
      return;
    }

    setLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBooking: Booking = {
        id: Date.now().toString(),
        date: selectedDate,
        time: selectedTime,
        course: courses.find(c => c.value === selectedCourse)?.label || '',
        players: playerCount,
        status: 'confirmed',
        memberName: `${user?.firstName} ${user?.lastName}` || 'Member',
        notes
      };

      if (editingBooking) {
        setBookings(prev => prev.map(b => b.id === editingBooking.id ? { ...newBooking, id: editingBooking.id } : b));
        setAlert({ type: 'success', message: 'Booking updated successfully!' });
      } else {
        setBookings(prev => [...prev, newBooking]);
        setAlert({ type: 'success', message: 'Tee time booked successfully!' });
      }
      
      handleCloseDialog();
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to book tee time. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (booking: Booking) => {
    setEditingBooking(booking);
    setSelectedDate(booking.date);
    setSelectedTime(booking.time);
    setSelectedCourse(courses.find(c => c.label === booking.course)?.value || '');
    setPlayerCount(booking.players);
    setNotes(booking.notes || '');
    setOpenDialog(true);
  };

  const handleDelete = async (bookingId: string) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setBookings(prev => prev.filter(b => b.id !== bookingId));
      setAlert({ type: 'success', message: 'Booking cancelled successfully!' });
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to cancel booking.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBooking(null);
    setSelectedDate(new Date());
    setSelectedTime('');
    setSelectedCourse('');
    setPlayerCount(1);
    setNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Tee Time Bookings
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{ borderRadius: 2 }}
          >
            Book Tee Time
          </Button>
        </Box>

        {alert && (
          <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert(null)}>
            {alert.message}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Quick Stats */}
          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">Total Bookings</Typography>
                    <Typography variant="h4">{bookings.length}</Typography>
                  </Box>
                  <CalendarToday sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #388e3c 0%, #66bb6a 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">Confirmed</Typography>
                    <Typography variant="h4">
                      {bookings.filter(b => b.status === 'confirmed').length}
                    </Typography>
                  </Box>
                  <AccessTime sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #f57c00 0%, #ffb74d 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">Pending</Typography>
                    <Typography variant="h4">
                      {bookings.filter(b => b.status === 'pending').length}
                    </Typography>
                  </Box>
                  <People sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={3}>
            <Card sx={{ background: 'linear-gradient(135deg, #7b1fa2 0%, #ba68c8 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h6">This Week</Typography>
                    <Typography variant="h4">
                      {bookings.filter(b => {
                        const bookingDate = new Date(b.date);
                        const today = new Date();
                        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return bookingDate >= today && bookingDate <= weekFromNow;
                      }).length}
                    </Typography>
                  </Box>
                  <GolfCourse sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Bookings Table */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Your Bookings
                </Typography>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Date</strong></TableCell>
                        <TableCell><strong>Time</strong></TableCell>
                        <TableCell><strong>Course</strong></TableCell>
                        <TableCell><strong>Players</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Notes</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id} hover>
                          <TableCell>
                            {booking.date.toLocaleDateString()}
                          </TableCell>
                          <TableCell>{booking.time}</TableCell>
                          <TableCell>{booking.course}</TableCell>
                          <TableCell>{booking.players}</TableCell>
                          <TableCell>
                            <Chip
                              label={booking.status}
                              color={getStatusColor(booking.status) as any}
                              size="small"
                              sx={{ textTransform: 'capitalize' }}
                            />
                          </TableCell>
                          <TableCell>{booking.notes || '-'}</TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(booking)}
                              color="primary"
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(booking.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Booking Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingBooking ? 'Edit Tee Time' : 'Book Tee Time'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="Select Date"
                  value={selectedDate}
                  onChange={(newValue) => setSelectedDate(newValue || new Date())}
                  minDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Course</InputLabel>
                  <Select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    label="Course"
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.value} value={course.value}>
                        {course.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Time</InputLabel>
                  <Select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    label="Time"
                  >
                    {availableTimeSlots.map((slot) => (
                      <MenuItem key={slot.time} value={slot.time}>
                        {slot.time}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Number of Players"
                  type="number"
                  value={playerCount}
                  onChange={(e) => setPlayerCount(Number(e.target.value))}
                  inputProps={{ min: 1, max: 4 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleBooking}
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {editingBooking ? 'Update Booking' : 'Book Tee Time'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default BookingsPage;
