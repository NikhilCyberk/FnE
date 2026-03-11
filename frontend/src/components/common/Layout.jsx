import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

export const LoadingSpinner = ({ size = 40, message = 'Loading...' }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4}>
    <CircularProgress size={size} />
    {message && (
      <Typography variant="body2" color="text.secondary" mt={2}>
        {message}
      </Typography>
    )}
  </Box>
);

export const EmptyState = ({ icon, title, description, action }) => (
  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={4} textAlign="center">
    {icon && <Box mb={2}>{icon}</Box>}
    <Typography variant="h6" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={3}>
      {description}
    </Typography>
    {action}
  </Box>
);

export const ErrorState = ({ error, onRetry }) => (
  <Box p={3} textAlign="center">
    <Typography variant="h6" color="error" gutterBottom>
      Something went wrong
    </Typography>
    <Typography variant="body2" color="text.secondary" mb={2}>
      {error?.message || 'An unexpected error occurred'}
    </Typography>
    {onRetry && (
      <button 
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Try Again
      </button>
    )}
  </Box>
);

export const PageContainer = ({ children, maxWidth = 'lg', ...props }) => (
  <Box maxWidth={maxWidth} mx="auto" p={3} {...props}>
    {children}
  </Box>
);

export const SectionHeader = ({ title, subtitle, action }) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
    <Box>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Box>
    {action}
  </Box>
);
