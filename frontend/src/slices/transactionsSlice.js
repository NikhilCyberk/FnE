import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchTransactions = createAsyncThunk('transactions/fetchTransactions', async () => {
  const res = await api.get('/api/transactions');
  return res.data;
});

export const createTransaction = createAsyncThunk('transactions/createTransaction', async (transaction) => {
  const res = await api.post('/api/transactions', transaction);
  return res.data;
});

export const updateTransaction = createAsyncThunk('transactions/updateTransaction', async ({ id, transaction }) => {
  const res = await api.put(`/api/transactions/${id}`, transaction);
  return res.data;
});

export const deleteTransaction = createAsyncThunk('transactions/deleteTransaction', async (id) => {
  await api.delete(`/api/transactions/${id}`);
  return id;
});

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createTransaction.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const idx = state.items.findIndex(t => t.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.items = state.items.filter(t => t.id !== action.payload);
      });
  },
});

export default transactionsSlice.reducer; 