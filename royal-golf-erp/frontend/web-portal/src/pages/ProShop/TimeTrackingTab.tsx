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
  Tabs,
  Tab,
  Divider,
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
  Assessment,
  Schedule,
  AttachMoney,
  Groups,
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

interface TimeReport {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  position: string;
  department: string;
  hourlyRate: number;
  totalHours: number;
  totalPay: number;
  timeEntries: {
    date: string;
    clockIn: string;
    clockOut: string;
    hours: number;
    pay: number;
    description: string;
  }[];
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
      id={`time-tabpanel-${index}`}
      aria-labelledby={`time-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `time-tab-${index}`,
    'aria-controls': `time-tabpanel-${index}`,
  };
}

const TimeTrackingTab: React.FC = () => {
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
  ]);

  const [employees] = useState<Employee[]>([
    { id: '1', name: 'John Smith', position: 'Pro Shop Manager', department: 'Pro Shop', hourlyRate: 28.50, employeeCode: 'RGC-2025-001' },
    { id: '2', name: 'Sarah Johnson', position: 'Sales Associate', department: 'Pro Shop', hourlyRate: 26.44, employeeCode: 'RGC-2025-002' },
    { id: '3', name: 'Mike Wilson', position: 'Inventory Clerk', department: 'Pro Shop', hourlyRate: 22.75, employeeCode: 'RGC-2025-003' },
    { id: '4', name: 'Lisa Chen', position: 'Golf Instructor', department: 'Golf Operations', hourlyRate: 35.00, employeeCode: 'RGC-2025-004' },
    { id: '5', name: 'David Rodriguez', position: 'Cart Attendant', department: 'Course Maintenance', hourlyRate: 18.50, employeeCode: 'RGC-2025-005' },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('2025-06-01');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Time Reports filters
  const [startDate, setStartDate] = useState('2025-05-27');
  const [endDate, setEndDate] = useState('2025-06-01');
  const [reportEmployee, setReportEmployee] = useState('');
  const [reportDepartment, setReportDepartment] = useState('');

  // Sample time report data
  const [timeReports] = useState<TimeReport[]>([
    {
      employeeId: '2',
      employeeName: 'Sarah Johnson',
      employeeCode: 'RGC-2025-002',
      position: 'Sales Associate',
      department: 'Pro Shop',
      hourlyRate: 26.44,
      totalHours: 43.25,
      totalPay: 1143.53,
      timeEntries: [
        {
          date: '2025-05-29',
          clockIn: '6:00:00 AM',
          clockOut: '3:00:00 PM',
          hours: 8.50,
          pay: 224.74,
          description: 'Weekly planning meeting'
        },
        {
          date: '2025-05-28',
          clockIn: '6:00:00 AM',
          clockOut: '3:00:00 PM',
          hours: 8.50,
          pay: 224.74,
          description: 'Regular shift'
        },
        {
          date: '2025-05-27',
          clockIn: '6:00:00 AM',
          clockOut: '3:30:00 PM',
          hours: 8.75,
          pay: 231.35,
          description: 'Staff training session after shift'
        }
      ]
    },
    {
      employeeId: '1',
      employeeName: 'John Smith',
      employeeCode: 'RGC-2025-001',
      position: 'Pro Shop Manager',
      department: 'Pro Shop',
      hourlyRate: 28.50,
      totalHours: 40.00,
      totalPay: 1140.00,
      timeEntries: [
        {
          date: '2025-05-29',
          clockIn: '7:00:00 AM',
          clockOut: '4:00:00 PM',
          hours: 8.00,
          pay: 228.00,
          description: 'Management duties'
        },
        {
          date: '2025-05-28',
          clockIn: '7:00:00 AM',
          clockOut: '4:00:00 PM',
          hours: 8.00,
          pay: 228.00,
          description: 'Staff coordination'
        },
        {
          date: '2025-05-27',
          clockIn: '7:00:00 AM',
          clockOut: '4:00:00 PM',
          hours: 8.00,
          pay: 228.00,
          description: 'Vendor meetings'
        }
      ]
    },
    {
      employeeId: '3',
      employeeName: 'Mike Wilson',
      employeeCode: 'RGC-2025-003',
      position: 'Inventory Clerk',
      department: 'Pro Shop',
      hourlyRate: 22.75,
      totalHours: 32.50,
      totalPay: 739.38,
      timeEntries: [
        {
          date: '2025-05-29',
          clockIn: '8:00:00 AM',
          clockOut: '4:30:00 PM',
          hours: 7.50,
          pay: 170.63,
          description: 'Inventory counting'
        },
        {
          date: '2025-05-28',
          clockIn: '8:00:00 AM',
          clockOut: '4:30:00 PM',
          hours: 7.50,
          pay: 170.63,
          description: 'Stock organization'
        },
        {
          date: '2025-05-27',
          clockIn: '8:00:00 AM',
          clockOut: '5:00:00 PM',
          hours: 8.50,
          pay: 193.38,
          description: 'Receiving shipments'
        }
      ]
    }
  ]);

  const filteredTimeEntries = timeEntries.filter(entry => {
    const matchesSearch = entry.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || entry.date === dateFilter;
    return matchesSearch && matchesDate;
  });

  const handleClockIn = () => {
    if (!selectedEmployee) return;
    
    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return;

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter time reports based on criteria
  const getFilteredTimeReports = () => {
    return timeReports.filter(report => {
      const matchesEmployee = !reportEmployee || report.employeeId === reportEmployee;
      const matchesDepartment = !reportDepartment || report.department === reportDepartment;
      
      // Filter time entries by date range
      const filteredEntries = report.timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return entryDate >= start && entryDate <= end;
      });
      
      if (filteredEntries.length === 0) return false;
      
      return true;
    }).map(report => {
      const filteredEntries = report.timeEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return entryDate >= start && entryDate <= end;
      });
      
      const totalHours = filteredEntries.reduce((sum, entry) => sum + entry.hours, 0);
      const totalPay = filteredEntries.reduce((sum, entry) => sum + entry.pay, 0);
      
      return {
        ...report,
        totalHours,
        totalPay,
        timeEntries: filteredEntries
      };
    });
  };

  const getReportSummary = () => {
    const filteredReports = getFilteredTimeReports();
    const totalEmployees = filteredReports.length;
    const totalHours = filteredReports.reduce((sum, report) => sum + report.totalHours, 0);
    const totalPay = filteredReports.reduce((sum, report) => sum + report.totalPay, 0);
    const avgHoursPerEmployee = totalEmployees > 0 ? totalHours / totalEmployees : 0;
    
    return {
      totalEmployees,
      totalHours,
      totalPay,
      avgHoursPerEmployee
    };
  };

  const getDepartments = () => {
    const departments = Array.from(new Set(employees.map(emp => emp.department)));
    return departments;
  };

  const renderTimeClockTab = () => (
    <Box>
      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
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
        <Grid item xs={12} sm={4}>
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
      </Grid>

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
                        <Typography variant="body2">
                          {entry.employeeName}
                        </Typography>
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

  const renderTimeReportsTab = () => {
    const summary = getReportSummary();
    const filteredReports = getFilteredTimeReports();

    return (
      <Box>
        {/* Report Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Employee</InputLabel>
                  <Select
                    value={reportEmployee}
                    label="Employee"
                    onChange={(e) => setReportEmployee(e.target.value)}
                  >
                    <MenuItem value="">All Employees</MenuItem>
                    {employees.map(employee => (
                      <MenuItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    value={reportDepartment}
                    label="Department"
                    onChange={(e) => setReportDepartment(e.target.value)}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {getDepartments().map(dept => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Summary Statistics */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Groups sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
                <Typography color="text.secondary" variant="body2">TOTAL EMPLOYEES</Typography>
                <Typography variant="h4" component="div" color="primary.main">
                  {summary.totalEmployees}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Schedule sx={{ fontSize: 40, color: 'info.main' }} />
                </Box>
                <Typography color="text.secondary" variant="body2">TOTAL HOURS</Typography>
                <Typography variant="h4" component="div" color="info.main">
                  {summary.totalHours.toFixed(2)}h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <AttachMoney sx={{ fontSize: 40, color: 'success.main' }} />
                </Box>
                <Typography color="text.secondary" variant="body2">TOTAL PAY</Typography>
                <Typography variant="h4" component="div" color="success.main">
                  ${summary.totalPay.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <Assessment sx={{ fontSize: 40, color: 'warning.main' }} />
                </Box>
                <Typography color="text.secondary" variant="body2">AVG HOURS/EMPLOYEE</Typography>
                <Typography variant="h4" component="div" color="warning.main">
                  {summary.avgHoursPerEmployee.toFixed(2)}h
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Employee Reports */}
        {filteredReports.map((report) => (
          <Card key={report.employeeId} sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      {getInitials(report.employeeName)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight="bold">
                        {report.employeeName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.employeeCode} - {report.position}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {report.department}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={3}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Total Hours:</Typography>
                      <Typography variant="h6" color="info.main">
                        {report.totalHours.toFixed(2)}h
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Hourly Rate:</Typography>
                      <Typography variant="h6" color="primary.main">
                        ${report.hourlyRate.toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Total Pay:</Typography>
                      <Typography variant="h6" color="success.main">
                        ${report.totalPay.toFixed(2)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" sx={{ mb: 2 }}>
                Time Entries ({report.timeEntries.length})
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Time</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Hours</TableCell>
                      <TableCell align="right">Pay</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.timeEntries.map((entry, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                              month: 'numeric',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2" fontFamily="monospace">
                            {entry.clockIn} - {entry.clockOut}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            {entry.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="info.main">
                            {entry.hours.toFixed(2)}h
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium" color="success.main">
                            ${entry.pay.toFixed(2)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <AccessTime />
        Employee Management
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 48,
                fontWeight: 'medium',
              },
            }}
          >
            <Tab
              icon={<AccessTime />}
              label="Time Clock"
              iconPosition="start"
              {...a11yProps(0)}
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginBottom: '0 !important',
                  marginRight: 1,
                },
              }}
            />
            <Tab
              icon={<Assessment />}
              label="Time Reports"
              iconPosition="start"
              {...a11yProps(1)}
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginBottom: '0 !important',
                  marginRight: 1,
                },
              }}
            />
          </Tabs>
        </Box>

        <CardContent>
          <TabPanel value={tabValue} index={0}>
            {renderTimeClockTab()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderTimeReportsTab()}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeTrackingTab;
