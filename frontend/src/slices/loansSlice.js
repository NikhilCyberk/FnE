import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

export const fetchLoans = createAsyncThunk('loans/fetchLoans', async (_, { rejectWithValue }) => {
    try {
        const response = await api.get('/api/loans');
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch loans');
    }
});

export const createLoan = createAsyncThunk('loans/createLoan', async (loanData, { rejectWithValue }) => {
    try {
        const response = await api.post('/api/loans', loanData);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to create loan');
    }
});

export const updateLoan = createAsyncThunk('loans/updateLoan', async ({ id, data }, { rejectWithValue }) => {
    try {
        const response = await api.put(`/api/loans/${id}`, data);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to update loan');
    }
});

export const deleteLoan = createAsyncThunk('loans/deleteLoan', async (id, { rejectWithValue }) => {
    try {
        await api.delete(`/api/loans/${id}`);
        return id;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to delete loan');
    }
});

const loansSlice = createSlice({
    name: 'loans',
    initialState: {
        loans: [],
        status: 'idle',
        error: null,
    },
    reducers: {
        clearLoansError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch
            .addCase(fetchLoans.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchLoans.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.loans = action.payload;
            })
            .addCase(fetchLoans.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Create
            .addCase(createLoan.fulfilled, (state, action) => {
                state.loans.unshift(action.payload);
            })
            // Update
            .addCase(updateLoan.fulfilled, (state, action) => {
                const index = state.loans.findIndex(l => l.id === action.payload.id);
                if (index !== -1) {
                    state.loans[index] = action.payload;
                }
            })
            // Delete
            .addCase(deleteLoan.fulfilled, (state, action) => {
                state.loans = state.loans.filter(l => l.id !== action.payload);
            });
    }
});

export const { clearLoansError } = loansSlice.actions;
export default loansSlice.reducer;
