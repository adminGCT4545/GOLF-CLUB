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
  Store,
  Receipt,
  Percent,
  AttachMoney,
  Security,
  Notifications,
} from '@mui/icons-material';

interface PosSettings {
  storeName: string;
  storeAddress: string;
  taxRate: number;
  currency: string;
  receiptFooter: string;
  autoCloseRegister: boolean;
  requireManagerOverride: boolean;
  allowDiscounts: boolean;
  maxDiscountPercent: number;
  enableInventoryTracking: boolean;
  lowStockThreshold: number;
  enableNotifications: boolean;
  printerName: string;
  cashDrawerEnabled: boolean;
}

const SettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<PosSettings>({
    storeName: 'Royal Golf Club Pro Shop',
    storeAddress: '123 Golf Course Drive, Royal City, RC 12345',
    taxRate: 8.0,
    currency: 'USD',
    receiptFooter: 'Thank you for shopping at Royal Golf Club!',
    autoCloseRegister: true,
    requireManagerOverride: true,
    allowDiscounts: true,
    maxDiscountPercent: 15,
    enableInventoryTracking: true,
    lowStockThreshold: 10,
    enableNotifications: true,
    printerName: 'Receipt Printer',
    cashDrawerEnabled: true,
  });

  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSettingChange = (key: keyof PosSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setUnsavedChanges(true);
    setSaveSuccess(false);
  };

  const handleSaveSettings = () => {
    // Here you would typically save to backend
    console.log('Saving settings:', settings);
    setUnsavedChanges(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetSettings = () => {
    setSettings({
      storeName: 'Royal Golf Club Pro Shop',
      storeAddress: '123 Golf Course Drive, Royal City, RC 12345',
      taxRate: 8.0,
      currency: 'USD',
      receiptFooter: 'Thank you for shopping at Royal Golf Club!',
      autoCloseRegister: true,
      requireManagerOverride: true,
      allowDiscounts: true,
      maxDiscountPercent: 15,
      enableInventoryTracking: true,
      lowStockThreshold: 10,
      enableNotifications: true,
      printerName: 'Receipt Printer',
      cashDrawerEnabled: true,
    });
    setUnsavedChanges(false);
    setSaveSuccess(false);
  };

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Settings />
        Settings
      </Typography>

      {saveSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}

      {unsavedChanges && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You have unsaved changes. Don't forget to save your settings.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Store Information */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Store />
                Store Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Store Name"
                    value={settings.storeName}
                    onChange={(e) => handleSettingChange('storeName', e.target.value)}
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
                    label="Store Address"
                    multiline
                    rows={2}
                    value={settings.storeAddress}
                    onChange={(e) => handleSettingChange('storeAddress', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Tax & Pricing */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Percent />
                Tax & Pricing
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

        {/* Receipt Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Receipt />
                Receipt Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Printer Name"
                    value={settings.printerName}
                    onChange={(e) => handleSettingChange('printerName', e.target.value)}
                  />
                </Grid>
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

        {/* Inventory Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <AttachMoney />
                Inventory Settings
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableInventoryTracking}
                        onChange={(e) => handleSettingChange('enableInventoryTracking', e.target.checked)}
                      />
                    }
                    label="Enable Inventory Tracking"
                  />
                </Grid>
                {settings.enableInventoryTracking && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Low Stock Threshold"
                      type="number"
                      value={settings.lowStockThreshold}
                      onChange={(e) => handleSettingChange('lowStockThreshold', Number(e.target.value))}
                      helperText="Alert when stock falls below this number"
                    />
                  </Grid>
                )}
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
                    label="Require Manager Override for Voids/Returns"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoCloseRegister}
                        onChange={(e) => handleSettingChange('autoCloseRegister', e.target.checked)}
                      />
                    }
                    label="Auto-close Register at End of Day"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.cashDrawerEnabled}
                        onChange={(e) => handleSettingChange('cashDrawerEnabled', e.target.checked)}
                      />
                    }
                    label="Enable Cash Drawer"
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
                    <Chip label="Daily Sales Reports" color="primary" size="small" />
                    <Chip label="Cash Drawer Alerts" color="primary" size="small" />
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

export default SettingsTab;
