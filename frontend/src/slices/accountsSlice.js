import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { accountsAPI } from '../api';

export const fetchAccounts = createAsyncThunk('accounts/fetchAccounts', async (params, { rejectWithValue }) => {
  try {
    const response = await accountsAPI.getAll(params);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch accounts');
  }
});

export const fetchAccountById = createAsyncThunk('accounts/fetchAccountById', async (id, { rejectWithValue }) => {
  try {
    const response = await accountsAPI.getById(id);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch account');
  }
});

export const createAccount = createAsyncThunk('accounts/createAccount', async (accountData, { rejectWithValue }) => {
  try {
    const response = await accountsAPI.create(accountData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to create account');
  }
});

export const updateAccount = createAsyncThunk('accounts/updateAccount', async ({ id, accountData }, { rejectWithValue }) => {
  try {
    const response = await accountsAPI.update(id, accountData);
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to update account');
  }
});

export const deleteAccount = createAsyncThunk('accounts/deleteAccount', async (id, { rejectWithValue }) => {
  try {
    await accountsAPI.delete(id);
    return id;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to delete account');
  }
});

export const fetchAccountTypes = createAsyncThunk('accounts/fetchAccountTypes', async (_, { rejectWithValue }) => {
  try {
    const response = await accountsAPI.getTypes();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch account types');
  }
});

export const fetchFinancialInstitutions = createAsyncThunk('accounts/fetchFinancialInstitutions', async (_, { rejectWithValue }) => {
  try {
    const response = await accountsAPI.getInstitutions();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch financial institutions');
  }
});

export const fetchAccountSummary = createAsyncThunk('accounts/fetchAccountSummary', async (_, { rejectWithValue }) => {
  try {
    const response = await accountsAPI.getSummary();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Failed to fetch account summary');
  }
});

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    items: [],
    accountTypes: [],
    financialInstitutions: [],
    summary: null,
    currentAccount: null,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  },
  reducers: {
    clearAccountsError(state) {
      state.error = null;
    },
    clearCurrentAccount(state) {
      state.currentAccount = null;
    },
    setPagination(state, action) {
      state.pagination = { ...state.pagination, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Accounts
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.accounts || action.payload;
        if (action.payload.pagination) {
          state.pagination = action.payload.pagination;
        }
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Account by ID
      .addCase(fetchAccountById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentAccount = action.payload;
      })
      .addCase(fetchAccountById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Account
      .addCase(createAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Account
      .addCase(updateAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(account => account.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentAccount && state.currentAccount.id === action.payload.id) {
          state.currentAccount = action.payload;
        }
        state.error = null;
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete Account
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(account => account.id !== action.payload);
        if (state.currentAccount && state.currentAccount.id === action.payload) {
          state.currentAccount = null;
        }
        state.error = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Account Types
      .addCase(fetchAccountTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.accountTypes = action.payload;
        state.error = null;
      })
      .addCase(fetchAccountTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Financial Institutions
      .addCase(fetchFinancialInstitutions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFinancialInstitutions.fulfilled, (state, action) => {
        state.loading = false;
        state.financialInstitutions = action.payload;
        state.error = null;
      })
      .addCase(fetchFinancialInstitutions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Account Summary
      .addCase(fetchAccountSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountSummary.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
        state.error = null;
      })
      .addCase(fetchAccountSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearAccountsError, clearCurrentAccount, setPagination } = accountsSlice.actions;
export default accountsSlice.reducer; 