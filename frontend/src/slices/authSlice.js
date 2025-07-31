import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api';

export const loginUser = createAsyncThunk('auth/loginUser', async (credentials, { rejectWithValue }) => {
  try {
    const response = await authAPI.login(credentials);
    const { token, user } = response.data;
    
    // Store user data in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Login failed');
  }
});

export const registerUser = createAsyncThunk('auth/registerUser', async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData);
    const { token, user } = response.data;
    
    // Store user data in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    return { token, user };
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Registration failed');
  }
});

export const getProfile = createAsyncThunk('auth/getProfile', async (_, { rejectWithValue }) => {
  try {
    const response = await authAPI.getProfile();
    const user = response.data;
    
    // Update user data in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch profile');
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (profileData, { rejectWithValue }) => {
  try {
    const response = await authAPI.updateProfile(profileData);
    const user = response.data;
    
    // Update user data in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to update profile');
  }
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    error: null,
    registered: false,
  },
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    clearRegistered(state) {
      state.registered = false;
    },
    updateUserData(state, action) {
      state.user = { ...state.user, ...action.payload };
      localStorage.setItem('user', JSON.stringify(state.user));
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.registered = true;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.token = null;
        state.user = null;
        state.error = null;
      });
  },
});

export const { clearAuthError, clearRegistered, updateUserData } = authSlice.actions;
export default authSlice.reducer; 