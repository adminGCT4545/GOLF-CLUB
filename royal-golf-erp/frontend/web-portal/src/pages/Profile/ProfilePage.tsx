import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';

const ProfilePage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        My Profile
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            Profile management functionality will be implemented here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfilePage;
