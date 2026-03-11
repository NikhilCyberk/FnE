import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accountsAPI } from '../../services';
import { AccountRepository } from '../../repositories';

// Async thunks
export const fetchAccounts = createAsyncThunk(
  'accounts/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.getAll(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch accounts');
    }
  }
);

export const fetchAccountById = createAsyncThunk(
  'accounts/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.getById(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch account');
    }
  }
);

export const createAccount = createAsyncThunk(
  'accounts/create',
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.create(accountData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create account');
    }
  }
);

export const updateAccount = createAsyncThunk(
  'accounts/update',
  async ({ id, accountData }, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.update(id, accountData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update account');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'accounts/delete',
  async (id, { rejectWithValue }) => {
    try {
      await accountsAPI.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete account');
    }
  }
);

export const fetchAccountBalance = createAsyncThunk(
  'accounts/fetchBalance',
  async (id, { rejectWithValue }) => {
    try {
      const response = await accountsAPI.getBalance(id);
      return { id, balance: response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch balance');
    }
  }
);

const initialState = {
  accounts: [],
  currentAccount: null,
  balances: {},
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  }
};

const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentAccount: (state) => {
      state.currentAccount = null;
    },
    updateBalance: (state, action) => {
      const { id, balance } = action.payload;
      state.balances[id] = balance;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload.accounts || action.payload.data || [];
        state.pagination = action.payload.pagination || state.pagination;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch account by ID
      .addCase(fetchAccountById.fulfilled, (state, action) => {
        state.currentAccount = action.payload;
      })
      .addCase(fetchAccountById.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Create account
      .addCase(createAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts.push(action.payload);
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update account
      .addCase(updateAccount.fulfilled, (state, action) => {
        const index = state.accounts.findIndex(acc => acc.id === action.payload.id);
        if (index !== -1) {
          state.accounts[index] = action.payload;
        }
        if (state.currentAccount?.id === action.payload.id) {
          state.currentAccount = action.payload;
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete account
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(acc => acc.id !== action.payload);
        delete state.balances[action.payload];
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch balance
      .addCase(fetchAccountBalance.fulfilled, (state, action) => {
        state.balances[action.payload.id] = action.payload.balance;
      });
  }
});

export const { clearError, clearCurrentAccount, updateBalance } = accountsSlice.actions;
export default accountsSlice.reducer;
