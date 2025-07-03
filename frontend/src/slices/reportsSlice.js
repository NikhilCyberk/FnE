import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchSpendingSummary = createAsyncThunk('reports/fetchSpendingSummary', async () => {
  const res = await api.get('/api/reports/spending-summary');
  return res.data;
});

export const fetchCategoryBreakdown = createAsyncThunk('reports/fetchCategoryBreakdown', async () => {
  const res = await api.get('/api/reports/category-breakdown');
  return res.data;
});

const reportsSlice = createSlice({
  name: 'reports',
  initialState: {
    spendingSummary: [],
    categoryBreakdown: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpendingSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpendingSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.spendingSummary = action.payload;
      })
      .addCase(fetchSpendingSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchCategoryBreakdown.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryBreakdown.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryBreakdown = action.payload;
      })
      .addCase(fetchCategoryBreakdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default reportsSlice.reducer; 