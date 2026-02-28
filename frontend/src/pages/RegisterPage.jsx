import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../slices/authSlice';
import {
  Box, Typography, TextField, Button, Paper, InputAdornment,
  IconButton, Divider, Link, CircularProgress, Alert, Grid
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, Person, Phone } from '@mui/icons-material';
import AuthLayout from '../components/auth/AuthLayout';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((state) => state.auth);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (validationError) setValidationError('');
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      setValidationError('Please fill in all required fields');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Remove confirmPassword before sending to API
      const registerData = { ...formData };
      delete registerData.confirmPassword;
      await dispatch(registerUser(registerData)).unwrap();
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create an account" subtitle="Join FinanceEase to manage your finances">
      <Paper elevation={0} sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper' }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Person /></InputAdornment>,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
          </Grid>

          <TextField
            fullWidth
            label="Email address"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
            }}
          />

          <TextField
            fullWidth
            label="Phone Number (Optional)"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Phone /></InputAdornment>,
            }}
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.confirmPassword}
            onChange={handleChange}
            margin="normal"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
            }}
          />

          {(error || validationError) && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validationError || error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={isLoading}
            sx={{
              mt: 3, mb: 2, py: 1.5,
              background: 'linear-gradient(45deg, #6366f1 30%, #ec4899 90%)',
              color: 'white',
              '&:hover': { background: 'linear-gradient(45deg, #4f46e5 30%, #db2777 90%)' }
            }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">Already have an account?</Typography>
        </Divider>

        <Box textAlign="center">
          <Link component={RouterLink} to="/login" variant="body2" fontWeight="medium">
            Sign in instead
          </Link>
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default RegisterPage;