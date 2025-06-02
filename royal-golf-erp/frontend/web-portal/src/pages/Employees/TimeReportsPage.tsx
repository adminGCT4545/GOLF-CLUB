import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Divider,
  Button,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Assessment,
  Groups,
  Schedule,
  AttachMoney,
  Person,
  CalendarToday,
  Download,
  Print,
} from '@mui/icons-material';

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
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
    id: `reports-tab-${index}`,
    'aria-controls': `reports-tabpanel-${index}`,
  };
}

const TimeReportsPage: React.FC = () => {
  const [employees] = useState<Employee[]>([
    { id: '1', name: 'John Smith', position: 'Pro Shop Manager', department: 'Pro Shop', hourlyRate: 28.50, employeeCode: 'RGC-2025-001' },
    { id: '2', name: 'Sarah Johnson', position: 'Sales Associate', department: 'Pro Shop', hourlyRate: 26.44, employeeCode: 'RGC-2025-002' },
    { id: '3', name: 'Mike Wilson', position: 'Inventory Clerk', department: 'Pro Shop', hourlyRate: 22.75, employeeCode: 'RGC-2025-003' },
    { id: '4', name: 'Lisa Chen', position: 'Golf Instructor', department: 'Golf Operations', hourlyRate: 35.00, employeeCode: 'RGC-2025-004' },
    { id: '5', name: 'David Rodriguez', position: 'Cart Attendant', department: 'Course Maintenance', hourlyRate: 18.50, employeeCode: 'RGC-2025-005' },
    { id: '6', name: 'Emily Thompson', position: 'F&B Manager', department: 'F&B', hourlyRate: 28.00, employeeCode: 'RGC-2025-006' },
  ]);

  const [tabValue, setTabValue] = useState(0);
  
  // Time Reports filters
  const [startDate, setStartDate] = useState('2025-05-27');
  const [endDate, setEndDate] = useState('2025-06-01');
  const [reportEmployee, setReportEmployee] = useState('');
  const [reportDepartment, setReportDepartment] = useState('');

  // Payroll filters
  const [payrollStartDate, setPayrollStartDate] = useState('2025-05-18');
  const [payrollEndDate, setPayrollEndDate] = useState('2025-06-01');

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
      employeeId: '4',
      employeeName: 'Lisa Chen',
      employeeCode: 'RGC-2025-004',
      position: 'Golf Instructor',
      department: 'Golf Operations',
      hourlyRate: 35.00,
      totalHours: 36.00,
      totalPay: 1260.00,
      timeEntries: [
        {
          date: '2025-05-29',
          clockIn: '8:00:00 AM',
          clockOut: '4:00:00 PM',
          hours: 8.00,
          pay: 280.00,
          description: 'Golf lessons and course management'
        },
        {
          date: '2025-05-28',
          clockIn: '8:00:00 AM',
          clockOut: '6:00:00 PM',
          hours: 10.00,
          pay: 350.00,
          description: 'Tournament preparation'
        },
        {
          date: '2025-05-27',
          clockIn: '9:00:00 AM',
          clockOut: '7:00:00 PM',
          hours: 10.00,
          pay: 350.00,
          description: 'Private lessons and group clinics'
        }
      ]
    }
  ]);

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
      
      return matchesEmployee && matchesDepartment;
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const renderTimeReportsTab = () => {
    const summary = getReportSummary();
    const filteredReports = getFilteredTimeReports();

    return (
      <Box>
        {/* Report Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Report Filters
            </Typography>
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
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="outlined" startIcon={<Download />}>
                Export to Excel
              </Button>
              <Button variant="outlined" startIcon={<Print />}>
                Print Report
              </Button>
            </Box>
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

  const renderPayrollTab = () => (
    <Box>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Payroll Period
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pay Period Start"
                type="date"
                value={payrollStartDate}
                onChange={(e) => setPayrollStartDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pay Period End"
                type="date"
                value={payrollEndDate}
                onChange={(e) => setPayrollEndDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Button variant="contained" fullWidth size="large">
                Generate Payroll
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h6" sx={{ mb: 2 }}>
        Payroll Summary
      </Typography>
      <Typography color="text.secondary">
        Payroll processing will be available once time entries are approved and finalized.
      </Typography>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Assessment />
        Time Reports
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
              icon={<Assessment />}
              label="Time Reports"
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
              icon={<AttachMoney />}
              label="Payroll"
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
            {renderTimeReportsTab()}
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            {renderPayrollTab()}
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default TimeReportsPage;