import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Avatar,
  Alert,
} from '@mui/material';
import {
  AccessTime,
  PlayArrow,
  Stop,
  Edit,
  Delete,
  Search,
  CalendarToday,
  Person,
} from '@mui/icons-material';

interface TimeEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  clockIn: string;
  clockOut: string | null;
  totalHours: number;
  status: 'Active' | 'Completed';
  notes: string;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  hourlyRate: number;
  employeeCode: string;
}

const TimekeepingPage: React.FC = () => {
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([
    {
      id: '1',
      employeeId: '1',
      employeeName: 'John Smith',
      date: '2025-06-01',
      clockIn: '08:00',
      clockOut: '16:00',
      totalHours: 8.0,
      status: 'Completed',
      notes: 'Regular shift',
    },
    {
      id: '2',
      employeeId: '2',
      employeeName: 'Sarah Johnson',
      date: '2025-06-01',
      clockIn: '09:00',
      clockOut: null,
      totalHours: 0,
      status: 'Active',
      notes: 'Currently working',
    },
    {
      id: '3',
      employeeId: '3',
      employeeName: 'Mike Wilson',
      date: '2025-06-01',
      clockIn: '10:00',
      clockOut: '18:00',
      totalHours: 8.0,
      status: 'Completed',
      notes: 'Inventory day',
    },
    {
      id: '4',
      employeeId: '4',
      employeeName: 'Lisa Chen',
      date: '2025-06-01',
      clockIn: '07:00',
      clockOut: '15:00',
      totalHours: 8.0,
      status: 'Completed',
      notes: 'Golf lessons',
    },
    {
      id: '5',
      employeeId: '5',
      employeeName: 'David Rodriguez',
      date: '2025-06-01',
      clockIn: '06:00',
      clockOut: null,
      totalHours: 0,
      status: 'Active',
      notes: 'Course maintenance',
    },
  ]);

  const [employees] = useState<Employee[]>([
    { id: '1', name: 'John Smith', position: 'Pro Shop Manager', department: 'Pro Shop', hourlyRate: 28.50, employeeCode: 'RGC-2025-001' },
    { id: '2', name: 'Sarah Johnson', position: 'Sales Associate', department: 'Pro Shop', hourlyRate: 26.44, employeeCode: 'RGC-2025-002' },
    { id: '3', name: 'Mike Wilson', position: 'Inventory Clerk', department: 'Pro Shop', hourlyRate: 22.75, employeeCode: 'RGC-2025-003' },
    { id: '4', name: 'Lisa Chen', position: 'Golf Instructor', department: 'Golf Operations', hourlyRate: 35.00, employeeCode: 'RGC-2025-004' },
    { id: '5', name: 'David Rodriguez', position: 'Cart Attendant', department: 'Course Maintenance', hourlyRate: 18.50, employeeCode: 'RGC-2025-005' },
    { id: '6', name: 'Emily Thompson', position: 'F&B Manager', department: 'F&B', hourlyRate: 28.00, employeeCode: 'RGC-2025-006' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('2025-06-01');
  const [selectedEmployee, setSelectedEmployee] = useState('');

  const filteredTimeEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || entry.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const handleClockIn = () => {
    if (!selectedEmployee) return;
    
    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return;

    // Check if employee is already clocked in
    const existingEntry = timeEntries.find(entry => 
      entry.employeeId === selectedEmployee && entry.status === 'Active'
    );

    if (existingEntry) {
      alert('Employee is already clocked in');
      return;
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const currentDate = now.toISOString().split('T')[0];

    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      employeeId: selectedEmployee,
      employeeName: employee.name,
      date: currentDate,
      clockIn: currentTime,
      clockOut: null,
      totalHours: 0,
      status: 'Active',
      notes: '',
    };

    setTimeEntries(prev => [...prev, newEntry]);
    setSelectedEmployee('');
  };

  const handleClockOut = (entryId: string) => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    setTimeEntries(prev => prev.map(entry => {
      if (entry.id === entryId && entry.status === 'Active') {
        const clockInTime = new Date(`2000-01-01 ${entry.clockIn}`);
        const clockOutTime = new Date(`2000-01-01 ${currentTime}`);
        const diffMs = clockOutTime.getTime() - clockInTime.getTime();
        const totalHours = diffMs / (1000 * 60 * 60);

        return {
          ...entry,
          clockOut: currentTime,
          totalHours: Math.round(totalHours * 100) / 100,
          status: 'Completed' as const,
        };
      }
      return entry;
    }));
  };

  const handleDeleteEntry = (entryId: string) => {
    setTimeEntries(prev => prev.filter(entry => entry.id !== entryId));
  };

  const getTotalHoursForDay = () => {
    return filteredTimeEntries
      .filter(entry => entry.status === 'Completed')
      .reduce((sum, entry) => sum + entry.totalHours, 0);
  };

  const getActiveEmployees = () => {
    return filteredTimeEntries.filter(entry => entry.status === 'Active');
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const getDepartmentSummary = () => {
    const departments: { [key: string]: { active: number; total: number; hours: number } } = {};
    
    employees.forEach(emp => {
      if (!departments[emp.department]) {
        departments[emp.department] = { active: 0, total: 0, hours: 0 };
      }
      departments[emp.department].total++;
    });

    timeEntries.forEach(entry => {
      const employee = employees.find(emp => emp.id === entry.employeeId);
      if (employee && entry.date === dateFilter) {
        if (entry.status === 'Active') {
          departments[employee.department].active++;
        }
        if (entry.status === 'Completed') {
          departments[employee.department].hours += entry.totalHours;
        }
      }
    });

    return Object.entries(departments).map(([dept, stats]) => ({
      department: dept,
      ...stats
    }));
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime />
        Time Clock
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Active Employees
              </Typography>
              <Typography variant="h4" component="div">
                {getActiveEmployees().length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Hours Today
              </Typography>
              <Typography variant="h4" component="div">
                {getTotalHoursForDay().toFixed(1)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Entries
              </Typography>
              <Typography variant="h4" component="div">
                {filteredTimeEntries.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Departments Active
              </Typography>
              <Typography variant="h4" component="div">
                {getDepartmentSummary().filter(dept => dept.active > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Department Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Department Status
          </Typography>
          <Grid container spacing={2}>
            {getDepartmentSummary().map((dept) => (
              <Grid item xs={12} sm={6} md={4} key={dept.department}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="subtitle2" color="primary">
                    {dept.department}
                  </Typography>
                  <Typography variant="h6">
                    {dept.active}/{dept.total}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {dept.hours.toFixed(1)}h completed
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Active Employees Alert */}
      {getActiveEmployees().length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {getActiveEmployees().length} employee(s) currently clocked in: {' '}
          {getActiveEmployees().map(entry => entry.employeeName).join(', ')}
        </Alert>
      )}

      {/* Clock In/Out Section */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Clock In/Out
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Select Employee</InputLabel>
                <Select
                  value={selectedEmployee}
                  label="Select Employee"
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  startAdornment={<Person sx={{ mr: 1, color: 'action.active' }} />}
                >
                  {employees.map(employee => (
                    <MenuItem key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={handleClockIn}
                disabled={!selectedEmployee}
                size="large"
                fullWidth
              >
                Clock In
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Filter by Date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday />
                    </InputAdornment>
                  ),
                }}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Time Entries Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Time Entries
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Clock In</TableCell>
                  <TableCell align="center">Clock Out</TableCell>
                  <TableCell align="center">Total Hours</TableCell>
                  <TableCell align="center">Status</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTimeEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                          {getInitials(entry.employeeName)}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {entry.employeeName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {employees.find(emp => emp.id === entry.employeeId)?.department}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(entry.date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontFamily="monospace">
                        {entry.clockIn}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {entry.clockOut ? (
                        <Typography variant="body2" fontFamily="monospace">
                          {entry.clockOut}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Still working
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {entry.status === 'Completed' ? 
                          `${entry.totalHours.toFixed(1)}h` : 
                          'In progress'
                        }
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={entry.status} 
                        color={entry.status === 'Active' ? 'success' : 'default'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {entry.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {entry.status === 'Active' ? (
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Stop />}
                          onClick={() => handleClockOut(entry.id)}
                          color="error"
                        >
                          Clock Out
                        </Button>
                      ) : (
                        <Box>
                          <IconButton 
                            size="small" 
                            sx={{ mr: 1 }}
                          >
                            <Edit />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            color="error" 
                            onClick={() => handleDeleteEntry(entry.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTimeEntries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No time entries found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimekeepingPage;