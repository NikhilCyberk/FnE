import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchCashSources = createAsyncThunk(
  'cashSources/fetchCashSources',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/cash-sources');
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch cash sources.');
    }
  }
);

const cashSourcesSlice = createSlice({
  name: 'cashSources',
  initialState: {
    cashSources: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch cash sources
      .addCase(fetchCashSources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashSources.fulfilled, (state, action) => {
        state.loading = false;
        state.cashSources = action.payload;
      })
      .addCase(fetchCashSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default cashSourcesSlice.reducer;
