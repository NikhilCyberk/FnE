import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchTransactions = createAsyncThunk(
  'transactions/fetchTransactions',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/transactions', { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch transactions.');
    }
  }
);

export const fetchTransactionStats = createAsyncThunk(
  'transactions/fetchStats',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/transactions/stats', { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch stats.');
    }
  }
);

export const createTransaction = createAsyncThunk(
  'transactions/createTransaction',
  async (transaction, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/transactions', transaction);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create transaction.');
    }
  }
);

export const updateTransaction = createAsyncThunk(
  'transactions/updateTransaction',
  async ({ id, transaction }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/transactions/${id}`, transaction);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update transaction.');
    }
  }
);

export const deleteTransaction = createAsyncThunk(
  'transactions/deleteTransaction',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/transactions/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete transaction.');
    }
  }
);

export const deleteBulkTransactions = createAsyncThunk(
  'transactions/deleteBulkTransactions',
  async (transactionIds, { rejectWithValue }) => {
    try {
      await api.post('/api/transactions/bulk/delete', { transactionIds });
      return transactionIds;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete transactions.');
    }
  }
);

export const updateBulkTransactionsCategory = createAsyncThunk(
  'transactions/updateBulkTransactionsCategory',
  async ({ transactionIds, categoryId }, { rejectWithValue }) => {
    try {
      await api.post('/api/transactions/bulk/category', { transactionIds, categoryId });
      return { transactionIds, categoryId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update categories.');
    }
  }
);

export const updateBulkTransactionsStatus = createAsyncThunk(
  'transactions/updateBulkTransactionsStatus',
  async ({ transactionIds, status }, { rejectWithValue }) => {
    try {
      await api.post('/api/transactions/bulk/status', { transactionIds, status });
      return { transactionIds, status };
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update statuses.');
    }
  }
);

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    stats: null,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch list
      .addCase(fetchTransactions.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.transactions) {
          state.transactions = action.payload.transactions;
          state.pagination = {
            page: action.payload.page,
            limit: action.payload.limit,
            total: action.payload.total,
            totalPages: action.payload.totalPages
          };
        } else {
          state.transactions = action.payload;
        }
      })
      .addCase(fetchTransactions.rejected, (state, action) => { state.loading = false; state.error = action.payload; })

      // Stats
      .addCase(fetchTransactionStats.fulfilled, (state, action) => { state.stats = action.payload; })

      // Create
      .addCase(createTransaction.fulfilled, (state, action) => {
        // Prepend so it appears at the top
        state.transactions.unshift(action.payload);
      })

      // Update
      .addCase(updateTransaction.fulfilled, (state, action) => {
        const idx = state.transactions.findIndex((t) => t.id === action.payload.id);
        if (idx !== -1) state.transactions[idx] = action.payload;
      })

      // Delete
      .addCase(deleteTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter((t) => t.id !== action.payload);
      })

      // Bulk Operations Reducers
      .addCase(deleteBulkTransactions.fulfilled, (state, action) => {
        const deletedIds = action.payload;
        state.transactions = state.transactions.filter((t) => !deletedIds.includes(t.id));
      });
  },
});

export default transactionsSlice.reducer;