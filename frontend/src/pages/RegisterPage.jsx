import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearAuthError, clearRegistered } from '../slices/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  TextField, Button, Box, Typography, Alert, CircularProgress, Card, CardContent, Avatar, useTheme
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, registered } = useSelector((state) => state.auth);
  const theme = useTheme();

  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (registered) {
      dispatch(clearRegistered());
      navigate('/login');
    }
    return () => dispatch(clearAuthError());
  }, [registered, navigate, dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.firstName) errors.firstName = 'First name is required.';
    if (!form.lastName) errors.lastName = 'Last name is required.';
    if (!form.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) errors.email = 'Valid email is required.';
    if (!form.password || form.password.length < 6) errors.password = 'Password must be at least 6 characters.';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    dispatch(registerUser(form));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(135deg, #232526 0%, #414345 100%)'
          : 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)',
        transition: 'background 0.5s',
      }}
    >
      <Card
        sx={{
          width: 420,
          boxShadow: 6,
          borderRadius: 4,
          p: 2,
          background: theme.palette.background.paper,
          transition: 'background 0.5s',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ m: 1, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <LockOutlinedIcon fontSize="large" />
            </Avatar>
            <Typography component="h1" variant="h5" fontWeight={700} mb={1}>
              FinanceEase
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Create your account
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="First Name"
              name="firstName"
              fullWidth
              margin="normal"
              value={form.firstName}
              onChange={handleChange}
              error={!!formErrors.firstName}
              helperText={formErrors.firstName}
              autoComplete="given-name"
              autoFocus
            />
            <TextField
              label="Last Name"
              name="lastName"
              fullWidth
              margin="normal"
              value={form.lastName}
              onChange={handleChange}
              error={!!formErrors.lastName}
              helperText={formErrors.lastName}
              autoComplete="family-name"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              fullWidth
              margin="normal"
              value={form.email}
              onChange={handleChange}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              autoComplete="email"
            />
            <TextField
              label="Phone"
              name="phone"
              fullWidth
              margin="normal"
              value={form.phone}
              onChange={handleChange}
              autoComplete="tel"
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              fullWidth
              margin="normal"
              value={form.password}
              onChange={handleChange}
              required
              error={!!formErrors.password}
              helperText={formErrors.password}
              autoComplete="new-password"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, py: 1.2, fontWeight: 600, fontSize: 16 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
            </Button>
          </form>
          <Button
            color="secondary"
            fullWidth
            sx={{ mt: 2, textTransform: 'none', fontWeight: 500 }}
            onClick={() => navigate('/login')}
          >
            Already have an account? <b>&nbsp;Login</b>
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;