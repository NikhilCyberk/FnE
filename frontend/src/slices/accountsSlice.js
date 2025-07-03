import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchAccounts = createAsyncThunk('accounts/fetchAccounts', async () => {
  const res = await api.get('/api/accounts');
  return res.data;
});

export const createAccount = createAsyncThunk('accounts/createAccount', async (account) => {
  const res = await api.post('/api/accounts', account);
  return res.data;
});

export const updateAccount = createAsyncThunk('accounts/updateAccount', async ({ id, account }) => {
  const res = await api.put(`/api/accounts/${id}`, account);
  return res.data;
});

export const deleteAccount = createAsyncThunk('accounts/deleteAccount', async (id) => {
  await api.delete(`/api/accounts/${id}`);
  return id;
});

const accountsSlice = createSlice({
  name: 'accounts',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        const idx = state.items.findIndex(a => a.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.items = state.items.filter(a => a.id !== action.payload);
      });
  },
});

export default accountsSlice.reducer; 