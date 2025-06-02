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
  Alert,
  InputAdornment,
  Chip,
} from '@mui/material';
import {
  Settings,
  Save,
  RestartAlt,
  Restaurant,
  Receipt,
  Percent,
  AttachMoney,
  Security,
  Notifications,
} from '@mui/icons-material';

interface FnBSettings {
  restaurantName: string;
  restaurantAddress: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
  autoCloseDay: boolean;
  requireManagerOverride: boolean;
  allowDiscounts: boolean;
  maxDiscountPercent: number;
  enableMenuTracking: boolean;
  lowStockThreshold: number;
  enableNotifications: boolean;
  printerName: string;
  kitchenDisplayEnabled: boolean;
  tableServiceEnabled: boolean;
  orderTimeout: number;
  serviceFeePercent: number;
  gratuityEnabled: boolean;
}

const FnBSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<FnBSettings>({
    restaurantName: 'Royal Golf Club Restaurant',
    restaurantAddress: '123 Golf Course Drive, Royal City, RC 12345',
    taxRate: 8.0,
    currency: 'USD',
    receiptFooter: 'Thank you for dining with Royal Golf Club!',
    autoCloseDay: true,
    requireManagerOverride: true,
    allowDiscounts: true,
    maxDiscountPercent: 15,
    enableMenuTracking: true,
    lowStockThreshold: 5,
    enableNotifications: true,
    printerName: 'Kitchen Printer',
    kitchenDisplayEnabled: true,
    tableServiceEnabled: true,
    orderTimeout: 30,
    serviceFeePercent: 12,
    gratuityEnabled: true,
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSettingChange = (key: keyof FnBSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSaveSettings = () => {
    // Here you would typically save to backend
    console.log('Saving F&B settings:', settings);
    setUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetSettings = () => {
    setSettings({
      restaurantName: 'Royal Golf Club Restaurant',
      restaurantAddress: '123 Golf Course Drive, Royal City, RC 12345',
      taxRate: 8.0,
      currency: 'USD',
      receiptFooter: 'Thank you for dining with Royal Golf Club!',
      autoCloseDay: true,
      requireManagerOverride: true,
      allowDiscounts: true,
      maxDiscountPercent: 15,
      enableMenuTracking: true,
      lowStockThreshold: 5,
      enableNotifications: true,
      printerName: 'Kitchen Printer',
      kitchenDisplayEnabled: true,
      tableServiceEnabled: true,
      orderTimeout: 30,
      serviceFeePercent: 12,
      gratuityEnabled: true,
    });
    setUnsavedChanges(false);
    setSaveSuccess(false);
  };

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'LKR'];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings />
        F&B Settings
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          F&B settings saved successfully!
        </Alert>
      )}

      {unsavedChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Don't forget to save your settings.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Restaurant Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Restaurant />
                Restaurant Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Restaurant Name"
                    value={settings.restaurantName}
                    onChange={(e) => handleSettingChange('restaurantName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={settings.currency}
                      label="Currency"
                      onChange={(e) => handleSettingChange('currency', e.target.value)}
                    >
                      {currencies.map(currency => (
                        <MenuItem key={currency} value={currency}>{currency}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Restaurant Address"
                    multiline
                    rows={2}
                    value={settings.restaurantAddress}
                    onChange={(e) => handleSettingChange('restaurantAddress', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Service & Pricing */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Percent />
                Service & Pricing
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tax Rate"
                    type="number"
                    value={settings.taxRate}
                    onChange={(e) => handleSettingChange('taxRate', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Service Fee"
                    type="number"
                    value={settings.serviceFeePercent}
                    onChange={(e) => handleSettingChange('serviceFeePercent', Number(e.target.value))}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">%</InputAdornment>,
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.gratuityEnabled}
                        onChange={(e) => handleSettingChange('gratuityEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Gratuity/Tips"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.allowDiscounts}
                        onChange={(e) => handleSettingChange('allowDiscounts', e.target.checked)}
                      />
                    }
                    label="Allow Discounts"
                  />
                </Grid>
                {settings.allowDiscounts && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Maximum Discount Percentage"
                      type="number"
                      value={settings.maxDiscountPercent}
                      onChange={(e) => handleSettingChange('maxDiscountPercent', Number(e.target.value))}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Order Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt />
                Order Management
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Order Timeout (minutes)"
                    type="number"
                    value={settings.orderTimeout}
                    onChange={(e) => handleSettingChange('orderTimeout', Number(e.target.value))}
                    helperText="Time before order is automatically cancelled"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.tableServiceEnabled}
                        onChange={(e) => handleSettingChange('tableServiceEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Table Service"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.kitchenDisplayEnabled}
                        onChange={(e) => handleSettingChange('kitchenDisplayEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Kitchen Display System"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Kitchen Printer Name"
                    value={settings.printerName}
                    onChange={(e) => handleSettingChange('printerName', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Menu & Inventory */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney />
                Menu & Inventory Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableMenuTracking}
                        onChange={(e) => handleSettingChange('enableMenuTracking', e.target.checked)}
                      />
                    }
                    label="Enable Menu Item Tracking"
                  />
                </Grid>
                {settings.enableMenuTracking && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Low Stock Threshold"
                      type="number"
                      value={settings.lowStockThreshold}
                      onChange={(e) => handleSettingChange('lowStockThreshold', Number(e.target.value))}
                      helperText="Alert when ingredients fall below this number"
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Receipt Footer"
                    multiline
                    rows={3}
                    value={settings.receiptFooter}
                    onChange={(e) => handleSettingChange('receiptFooter', e.target.value)}
                    helperText="This text will appear at the bottom of all receipts"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Security />
                Security Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.requireManagerOverride}
                        onChange={(e) => handleSettingChange('requireManagerOverride', e.target.checked)}
                      />
                    }
                    label="Require Manager Override for Voids/Comps"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoCloseDay}
                        onChange={(e) => handleSettingChange('autoCloseDay', e.target.checked)}
                      />
                    }
                    label="Auto-close Day at End of Business"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Notifications />
                Notification Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications}
                        onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                      />
                    }
                    label="Enable System Notifications"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip label="Low Stock Alerts" color="primary" size="small" />
                    <Chip label="Order Ready Notifications" color="primary" size="small" />
                    <Chip label="Kitchen Alerts" color="primary" size="small" />
                    <Chip label="Daily Sales Reports" color="primary" size="small" />
                    <Chip label="Table Status Updates" color="primary" size="small" />
                    <Chip label="System Updates" color="primary" size="small" />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Action Buttons */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<RestartAlt />}
                  onClick={handleResetSettings}
                  disabled={!unsavedChanges}
                >
                  Reset to Defaults
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSaveSettings}
                  disabled={!unsavedChanges}
                >
                  Save Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FnBSettingsTab;