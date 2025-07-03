import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchCategories = createAsyncThunk('categories/fetchCategories', async () => {
  const res = await api.get('/api/categories');
  return res.data;
});

export const createCategory = createAsyncThunk('categories/createCategory', async (category) => {
  const res = await api.post('/api/categories', category);
  return res.data;
});

export const updateCategory = createAsyncThunk('categories/updateCategory', async ({ id, category }) => {
  const res = await api.put(`/api/categories/${id}`, category);
  return res.data;
});

export const deleteCategory = createAsyncThunk('categories/deleteCategory', async (id) => {
  await api.delete(`/api/categories/${id}`);
  return id;
});

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const idx = state.items.findIndex(c => c.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  },
});

export default categoriesSlice.reducer; 