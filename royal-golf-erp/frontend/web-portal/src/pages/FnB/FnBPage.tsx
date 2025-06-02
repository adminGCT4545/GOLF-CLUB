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
  Restaurant,
  MenuBook,
  Settings,
} from '@mui/icons-material';

// Import new tab components
import FnBSalesTab from './FnBSalesTab';
import FnBProductsTab from './FnBProductsTab';
import FnBSettingsTab from './FnBSettingsTab';

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
      id={`fnb-tabpanel-${index}`}
      aria-labelledby={`fnb-tab-${index}`}
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
    id: `fnb-tab-${index}`,
    'aria-controls': `fnb-tabpanel-${index}`,
  };
}

const FnBPage: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const tabs = [
    {
      label: 'Sales',
      icon: <Restaurant />,
      component: <FnBSalesTab />,
    },
    {
      label: 'Menu Items',
      icon: <MenuBook />,
      component: <FnBProductsTab />,
    },
    {
      label: 'Settings',
      icon: <Settings />,
      component: <FnBSettingsTab />,
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Food & Beverage Operations
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

export default FnBPage;