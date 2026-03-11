import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchCreditCardTransactions = createAsyncThunk(
  'creditCardTransactions/fetchCreditCardTransactions',
  async ({ creditCardId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/credit-cards/${creditCardId}/transactions`, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch credit card transactions.');
    }
  }
);

export const createCreditCardTransaction = createAsyncThunk(
  'creditCardTransactions/createCreditCardTransaction',
  async ({ creditCardId, transaction }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/credit-cards/${creditCardId}/transactions`, transaction);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to create credit card transaction.');
    }
  }
);

export const updateCreditCardTransaction = createAsyncThunk(
  'creditCardTransactions/updateCreditCardTransaction',
  async ({ creditCardId, transactionId, transaction }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/credit-cards/${creditCardId}/transactions/${transactionId}`, transaction);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to update credit card transaction.');
    }
  }
);

export const deleteCreditCardTransaction = createAsyncThunk(
  'creditCardTransactions/deleteCreditCardTransaction',
  async ({ creditCardId, transactionId }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/credit-cards/${creditCardId}/transactions/${transactionId}`);
      return transactionId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to delete credit card transaction.');
    }
  }
);

export const getCreditCardTransactionSummary = createAsyncThunk(
  'creditCardTransactions/getCreditCardTransactionSummary',
  async ({ creditCardId, params = {} }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/credit-cards/${creditCardId}/transactions/summary`, { params });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.error || 'Failed to fetch credit card transaction summary.');
    }
  }
);

const creditCardTransactionsSlice = createSlice({
  name: 'creditCardTransactions',
  initialState: {
    transactions: [],
    summary: null,
    loading: false,
    error: null,
    pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
  },
  reducers: {
    clearCreditCardTransactionsError(state) {
      state.error = null;
    },
    clearCreditCardTransactions(state) {
      state.transactions = [];
      state.summary = null;
      state.pagination = { page: 1, limit: 50, total: 0, totalPages: 0 };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch transactions
      .addCase(fetchCreditCardTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditCardTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload.transactions || [];
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchCreditCardTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create transaction
      .addCase(createCreditCardTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCreditCardTransaction.fulfilled, (state, action) => {
        state.loading = false;
        // Prepend new transaction to the list
        state.transactions.unshift(action.payload);
      })
      .addCase(createCreditCardTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update transaction
      .addCase(updateCreditCardTransaction.fulfilled, (state, action) => {
        const index = state.transactions.findIndex((t) => t.id === action.payload.id);
        if (index !== -1) {
          state.transactions[index] = action.payload;
        }
      })
      .addCase(updateCreditCardTransaction.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete transaction
      .addCase(deleteCreditCardTransaction.fulfilled, (state, action) => {
        state.transactions = state.transactions.filter((t) => t.id !== action.payload);
      })
      .addCase(deleteCreditCardTransaction.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Get summary
      .addCase(getCreditCardTransactionSummary.fulfilled, (state, action) => {
        state.summary = action.payload;
      })
      .addCase(getCreditCardTransactionSummary.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearCreditCardTransactionsError, clearCreditCardTransactions } = creditCardTransactionsSlice.actions;
export default creditCardTransactionsSlice.reducer;
