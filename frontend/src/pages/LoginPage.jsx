import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearAuthError } from '../slices/authSlice';
import { useNavigate } from 'react-router-dom';
import {
  TextField, Button, Box, Typography, Alert, CircularProgress, Card, CardContent, Avatar, useTheme
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import log from 'loglevel';

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading, error } = useSelector((state) => state.auth);
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (token) navigate('/dashboard');
    return () => dispatch(clearAuthError());
  }, [token, navigate, dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email = 'Valid email is required.';
    if (!password) errors.password = 'Password is required.';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    log.info('Login attempt', { email, password });
    dispatch(loginUser({ email, password }));
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
          width: 380,
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
              Sign in to your account
            </Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              error={!!formErrors.email}
              helperText={formErrors.email}
              autoComplete="email"
              autoFocus
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              error={!!formErrors.password}
              helperText={formErrors.password}
              autoComplete="current-password"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 2, py: 1.2, fontWeight: 600, fontSize: 16 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
            </Button>
          </form>
          <Button
            color="secondary"
            fullWidth
            sx={{ mt: 2, textTransform: 'none', fontWeight: 500 }}
            onClick={() => navigate('/register')}
          >
            Don't have an account? <b>&nbsp;Register</b>
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;