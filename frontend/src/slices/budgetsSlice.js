import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchBudgets = createAsyncThunk('budgets/fetchBudgets', async () => {
  const res = await api.get('/api/budgets');
  return res.data;
});

export const createBudget = createAsyncThunk('budgets/createBudget', async (budget) => {
  const res = await api.post('/api/budgets', budget);
  return res.data;
});

export const updateBudget = createAsyncThunk('budgets/updateBudget', async ({ id, budget }) => {
  const res = await api.put(`/api/budgets/${id}`, budget);
  return res.data;
});

export const deleteBudget = createAsyncThunk('budgets/deleteBudget', async (id) => {
  await api.delete(`/api/budgets/${id}`);
  return id;
});

const budgetsSlice = createSlice({
  name: 'budgets',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        const idx = state.items.findIndex(b => b.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteBudget.fulfilled, (state, action) => {
        state.items = state.items.filter(b => b.id !== action.payload);
      });
  },
});

export default budgetsSlice.reducer; 