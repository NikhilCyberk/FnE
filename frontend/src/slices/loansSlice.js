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

export const fetchLoan = createAsyncThunk('loans/fetchLoan', async (id, { rejectWithValue }) => {
    try {
        const response = await api.get(`/api/loans/${id}`);
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.error || 'Failed to fetch loan');
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
        selectedLoan: null,
        status: 'idle',
        error: null,
    },
    reducers: {
        clearLoansError: (state) => {
            state.error = null;
        },
        clearSelectedLoan: (state) => {
            state.selectedLoan = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch all
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
            // Fetch single
            .addCase(fetchLoan.fulfilled, (state, action) => {
                state.selectedLoan = action.payload;
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
                if (state.selectedLoan?.id === action.payload.id) {
                    state.selectedLoan = action.payload;
                }
            })
            // Delete
            .addCase(deleteLoan.fulfilled, (state, action) => {
                state.loans = state.loans.filter(l => l.id !== action.payload);
            });
    }
});

export const { clearLoansError, clearSelectedLoan } = loansSlice.actions;
export default loansSlice.reducer;
