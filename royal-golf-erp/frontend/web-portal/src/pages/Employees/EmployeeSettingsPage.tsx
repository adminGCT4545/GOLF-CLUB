import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
} from '@mui/material';
import {
  Settings,
  Add,
  Edit,
  Delete,
  Save,
  Business,
  Schedule,
  Security,
  Notifications,
  Assessment,
} from '@mui/icons-material';

interface Department {
  id: string;
  name: string;
  manager: string;
  budget: number;
  isActive: boolean;
}

interface WorkShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  department: string;
  isActive: boolean;
}

interface HRPolicy {
  id: string;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
}

const EmployeeSettingsPage: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: 'Pro Shop', manager: 'John Smith', budget: 150000, isActive: true },
    { id: '2', name: 'F&B', manager: 'Emily Thompson', budget: 200000, isActive: true },
    { id: '3', name: 'Golf Operations', manager: 'Lisa Chen', budget: 180000, isActive: true },
    { id: '4', name: 'Course Maintenance', manager: 'David Rodriguez', budget: 120000, isActive: true },
    { id: '5', name: 'Administration', manager: 'Sarah Johnson', budget: 100000, isActive: true },
  ]);

  const [workShifts, setWorkShifts] = useState<WorkShift[]>([
    { id: '1', name: 'Morning Shift', startTime: '06:00', endTime: '14:00', department: 'All', isActive: true },
    { id: '2', name: 'Day Shift', startTime: '08:00', endTime: '16:00', department: 'Pro Shop', isActive: true },
    { id: '3', name: 'Evening Shift', startTime: '14:00', endTime: '22:00', department: 'F&B', isActive: true },
    { id: '4', name: 'Weekend Shift', startTime: '07:00', endTime: '19:00', department: 'Golf Operations', isActive: true },
  ]);

  const [hrPolicies, setHRPolicies] = useState<HRPolicy[]>([
    { id: '1', name: 'Break Policy', description: '30-minute unpaid lunch break for shifts over 6 hours', category: 'Time & Attendance', isActive: true },
    { id: '2', name: 'Overtime Policy', description: 'Overtime paid at 1.5x rate for hours over 40 per week', category: 'Compensation', isActive: true },
    { id: '3', name: 'Dress Code', description: 'Professional attire required in all customer-facing areas', category: 'Conduct', isActive: true },
    { id: '4', name: 'PTO Policy', description: 'Paid time off accrual based on years of service', category: 'Benefits', isActive: true },
  ]);

  const [openDeptDialog, setOpenDeptDialog] = useState(false);
  const [openShiftDialog, setOpenShiftDialog] = useState(false);
  const [openPolicyDialog, setOpenPolicyDialog] = useState(false);

  const [newDepartment, setNewDepartment] = useState<Partial<Department>>({
    name: '',
    manager: '',
    budget: 0,
    isActive: true,
  });

  const [newShift, setNewShift] = useState<Partial<WorkShift>>({
    name: '',
    startTime: '',
    endTime: '',
    department: '',
    isActive: true,
  });

  const [newPolicy, setNewPolicy] = useState<Partial<HRPolicy>>({
    name: '',
    description: '',
    category: '',
    isActive: true,
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    autoClockOut: true,
    breakReminders: true,
    overtimeAlerts: true,
    approvalRequired: true,
    geofencing: false,
    biometricClock: false,
    maxDailyHours: 12,
    weekStartDay: 'Monday',
    payPeriodLength: 'bi-weekly',
  });

  const handleDepartmentSave = () => {
    if (newDepartment.name && newDepartment.manager) {
      setDepartments(prev => [...prev, { 
        ...newDepartment as Department, 
        id: Date.now().toString() 
      }]);
      setNewDepartment({ name: '', manager: '', budget: 0, isActive: true });
      setOpenDeptDialog(false);
    }
  };

  const handleShiftSave = () => {
    if (newShift.name && newShift.startTime && newShift.endTime) {
      setWorkShifts(prev => [...prev, { 
        ...newShift as WorkShift, 
        id: Date.now().toString() 
      }]);
      setNewShift({ name: '', startTime: '', endTime: '', department: '', isActive: true });
      setOpenShiftDialog(false);
    }
  };

  const handlePolicySave = () => {
    if (newPolicy.name && newPolicy.description) {
      setHRPolicies(prev => [...prev, { 
        ...newPolicy as HRPolicy, 
        id: Date.now().toString() 
      }]);
      setNewPolicy({ name: '', description: '', category: '', isActive: true });
      setOpenPolicyDialog(false);
    }
  };

  const handleDeleteDepartment = (id: string) => {
    setDepartments(prev => prev.filter(dept => dept.id !== id));
  };

  const handleDeleteShift = (id: string) => {
    setWorkShifts(prev => prev.filter(shift => shift.id !== id));
  };

  const handleDeletePolicy = (id: string) => {
    setHRPolicies(prev => prev.filter(policy => policy.id !== id));
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings />
        Employee Settings
      </Typography>

      {/* System Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security />
            System Settings
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.autoClockOut}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, autoClockOut: e.target.checked }))}
                    />
                  }
                  label="Auto Clock-Out after 12 hours"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.breakReminders}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, breakReminders: e.target.checked }))}
                    />
                  }
                  label="Break Reminders"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.overtimeAlerts}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, overtimeAlerts: e.target.checked }))}
                    />
                  }
                  label="Overtime Alerts"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.approvalRequired}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, approvalRequired: e.target.checked }))}
                    />
                  }
                  label="Time Entry Approval Required"
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.geofencing}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, geofencing: e.target.checked }))}
                    />
                  }
                  label="Geofencing (Location-based Clock In)"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={systemSettings.biometricClock}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, biometricClock: e.target.checked }))}
                    />
                  }
                  label="Biometric Time Clock"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  label="Maximum Daily Hours"
                  type="number"
                  value={systemSettings.maxDailyHours}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, maxDailyHours: Number(e.target.value) }))}
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Week Start Day</InputLabel>
                  <Select
                    value={systemSettings.weekStartDay}
                    label="Week Start Day"
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, weekStartDay: e.target.value }))}
                  >
                    <MenuItem value="Sunday">Sunday</MenuItem>
                    <MenuItem value="Monday">Monday</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" startIcon={<Save />}>
              Save System Settings
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Departments */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Business />
                  Departments
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenDeptDialog(true)}
                >
                  Add
                </Button>
              </Box>
              <List dense>
                {departments.map((dept) => (
                  <ListItem key={dept.id} divider>
                    <ListItemText
                      primary={dept.name}
                      secondary={`Manager: ${dept.manager} • Budget: $${dept.budget.toLocaleString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip 
                        label={dept.isActive ? 'Active' : 'Inactive'} 
                        color={dept.isActive ? 'success' : 'default'} 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <IconButton size="small" color="error" onClick={() => handleDeleteDepartment(dept.id)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Work Shifts */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Schedule />
                  Work Shifts
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenShiftDialog(true)}
                >
                  Add
                </Button>
              </Box>
              <List dense>
                {workShifts.map((shift) => (
                  <ListItem key={shift.id} divider>
                    <ListItemText
                      primary={shift.name}
                      secondary={`${shift.startTime} - ${shift.endTime} • ${shift.department}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip 
                        label={shift.isActive ? 'Active' : 'Inactive'} 
                        color={shift.isActive ? 'success' : 'default'} 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <IconButton size="small" color="error" onClick={() => handleDeleteShift(shift.id)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* HR Policies */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Assessment />
                  HR Policies
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Add />}
                  onClick={() => setOpenPolicyDialog(true)}
                >
                  Add
                </Button>
              </Box>
              <List dense>
                {hrPolicies.map((policy) => (
                  <ListItem key={policy.id} divider>
                    <ListItemText
                      primary={policy.name}
                      secondary={`${policy.category} • ${policy.description.substring(0, 50)}...`}
                    />
                    <ListItemSecondaryAction>
                      <Chip 
                        label={policy.isActive ? 'Active' : 'Inactive'} 
                        color={policy.isActive ? 'success' : 'default'} 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <IconButton size="small" color="error" onClick={() => handleDeletePolicy(policy.id)}>
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Integration Settings */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Notifications />
            Integration & Notifications
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            Integration with payroll systems and external HR platforms can be configured here.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">QuickBooks</Typography>
                <Typography variant="body2" color="text.secondary">Payroll Export</Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1 }}>
                  Configure
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">ADP</Typography>
                <Typography variant="body2" color="text.secondary">HR Integration</Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1 }}>
                  Configure
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">Slack</Typography>
                <Typography variant="body2" color="text.secondary">Notifications</Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1 }}>
                  Configure
                </Button>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2">Email</Typography>
                <Typography variant="body2" color="text.secondary">Reports & Alerts</Typography>
                <Button size="small" variant="outlined" sx={{ mt: 1 }}>
                  Configure
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Department Dialog */}
      <Dialog open={openDeptDialog} onClose={() => setOpenDeptDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Department</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Department Name"
                value={newDepartment.name}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Manager"
                value={newDepartment.manager}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, manager: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Annual Budget"
                type="number"
                value={newDepartment.budget}
                onChange={(e) => setNewDepartment(prev => ({ ...prev, budget: Number(e.target.value) }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeptDialog(false)}>Cancel</Button>
          <Button onClick={handleDepartmentSave} variant="contained">Add Department</Button>
        </DialogActions>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={openShiftDialog} onClose={() => setOpenShiftDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Work Shift</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Shift Name"
                value={newShift.name}
                onChange={(e) => setNewShift(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={newShift.startTime}
                onChange={(e) => setNewShift(prev => ({ ...prev, startTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={newShift.endTime}
                onChange={(e) => setNewShift(prev => ({ ...prev, endTime: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={newShift.department}
                  label="Department"
                  onChange={(e) => setNewShift(prev => ({ ...prev, department: e.target.value }))}
                >
                  <MenuItem value="All">All Departments</MenuItem>
                  {departments.map(dept => (
                    <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenShiftDialog(false)}>Cancel</Button>
          <Button onClick={handleShiftSave} variant="contained">Add Shift</Button>
        </DialogActions>
      </Dialog>

      {/* Policy Dialog */}
      <Dialog open={openPolicyDialog} onClose={() => setOpenPolicyDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New HR Policy</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Policy Name"
                value={newPolicy.name}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, name: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newPolicy.category}
                  label="Category"
                  onChange={(e) => setNewPolicy(prev => ({ ...prev, category: e.target.value }))}
                >
                  <MenuItem value="Time & Attendance">Time & Attendance</MenuItem>
                  <MenuItem value="Compensation">Compensation</MenuItem>
                  <MenuItem value="Conduct">Conduct</MenuItem>
                  <MenuItem value="Benefits">Benefits</MenuItem>
                  <MenuItem value="Safety">Safety</MenuItem>
                  <MenuItem value="Training">Training</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Policy Description"
                multiline
                rows={4}
                value={newPolicy.description}
                onChange={(e) => setNewPolicy(prev => ({ ...prev, description: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPolicyDialog(false)}>Cancel</Button>
          <Button onClick={handlePolicySave} variant="contained">Add Policy</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeeSettingsPage;