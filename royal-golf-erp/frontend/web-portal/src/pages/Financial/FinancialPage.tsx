import React from 'react';
import { Navigate } from 'react-router-dom';

const FinancialPage: React.FC = () => {
  // Redirect to Executive Dashboard as the default financial page
  return <Navigate to="/financial/executive" replace />;
};

export default FinancialPage;
