import React from 'react';
import { 
  Button, 
  TextField, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Select,
  Chip,
  Box
} from '@mui/material';

export const FormField = ({ label, value, onChange, type = 'text', options, helperText, error, ...props }) => {
  if (type === 'select') {
    return (
      <FormControl fullWidth error={error} {...props}>
        <InputLabel>{label}</InputLabel>
        <Select
          value={value}
          onChange={onChange}
          label={label}
        >
          {options?.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && <Box mt={1} fontSize="0.75rem" color={error ? 'error.main' : 'text.secondary'}>{helperText}</Box>}
      </FormControl>
    );
  }

  return (
    <TextField
      fullWidth
      label={label}
      value={value}
      onChange={onChange}
      type={type}
      error={error}
      helperText={helperText}
      {...props}
    />
  );
};

export const ActionButton = ({ 
  children, 
  variant = 'contained', 
  loading = false, 
  startIcon, 
  onClick, 
  disabled = false,
  color = 'primary',
  ...props 
}) => (
  <Button
    variant={variant}
    color={color}
    disabled={disabled || loading}
    startIcon={loading ? null : startIcon}
    onClick={onClick}
    {...props}
  >
    {loading ? 'Loading...' : children}
  </Button>
);

export const StatusChip = ({ status, color = 'default', size = 'small' }) => {
  const getStatusColor = (status) => {
    const colors = {
      completed: 'success',
      pending: 'warning',
      cancelled: 'error',
      failed: 'error',
      active: 'success',
      inactive: 'default'
    };
    return colors[status] || color;
  };

  return (
    <Chip
      label={status?.replace('_', ' ').toUpperCase() || status}
      color={getStatusColor(status)}
      size={size}
    />
  );
};

export const AmountDisplay = ({ amount, currency = 'INR', showSign = false, type = 'default' }) => {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(Math.abs(amount));

  const sign = showSign && amount > 0 ? '+' : showSign && amount < 0 ? '-' : '';

  return (
    <Box component="span" color={type === 'income' ? 'success.main' : type === 'expense' ? 'error.main' : 'inherit'}>
      {sign}{formatted}
    </Box>
  );
};
