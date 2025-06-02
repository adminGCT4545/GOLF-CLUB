import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
} from '@mui/material';
import {
  ShoppingCart,
  Inventory,
  Settings,
} from '@mui/icons-material';

// Import tab components
import SalesTab from './SalesTab';
import ProductsTab from './ProductsTab';
import SettingsTab from './SettingsTab';

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
      id={`proshop-tabpanel-${index}`}
      aria-labelledby={`proshop-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `proshop-tab-${index}`,
    'aria-controls': `proshop-tabpanel-${index}`,
  };
}

const ProShopPage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const tabs = [
    {
      label: 'Sales',
      icon: <ShoppingCart />,
      component: <SalesTab />,
    },
    {
      label: 'Products',
      icon: <Inventory />,
      component: <ProductsTab />,
    },
    {
      label: 'Settings',
      icon: <Settings />,
      component: <SettingsTab />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Pro Shop - Retail Operations
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={value}
            onChange={handleChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontWeight: 'medium',
              },
            }}
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                icon={tab.icon}
                label={tab.label}
                iconPosition="start"
                {...a11yProps(index)}
                sx={{
                  '& .MuiTab-iconWrapper': {
                    marginBottom: '0 !important',
                    marginRight: 1,
                  },
                }}
              />
            ))}
          </Tabs>
        </Box>

        <CardContent>
          {tabs.map((tab, index) => (
            <TabPanel key={index} value={value} index={index}>
              {tab.component}
            </TabPanel>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProShopPage;
