import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api';

// Async thunks
export const fetchCreditCards = createAsyncThunk(
  'creditCards/fetchCreditCards',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/credit-cards');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch credit cards');
    }
  }
);

export const fetchCreditCardById = createAsyncThunk(
  'creditCards/fetchCreditCardById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/credit-cards/${id}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch credit card');
    }
  }
);

export const createCreditCard = createAsyncThunk(
  'creditCards/createCreditCard',
  async (creditCardData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/credit-cards', creditCardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create credit card');
    }
  }
);

export const updateCreditCard = createAsyncThunk(
  'creditCards/updateCreditCard',
  async ({ id, creditCardData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/credit-cards/${id}`, creditCardData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update credit card');
    }
  }
);

export const deleteCreditCard = createAsyncThunk(
  'creditCards/deleteCreditCard',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/api/credit-cards/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete credit card');
    }
  }
);

export const extractCreditCardInfo = createAsyncThunk(
  'creditCards/extractCreditCardInfo',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/credit-cards/extract-credit-card-info', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to extract credit card info');
    }
  }
);

export const getCardNameOptions = createAsyncThunk(
  'creditCards/getCardNameOptions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/credit-cards/card-names');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch card name options');
    }
  }
);

export const addCardNameOption = createAsyncThunk(
  'creditCards/addCardNameOption',
  async (cardName, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/credit-cards/card-names', { cardName });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add card name option');
    }
  }
);

export const fetchCardTransactions = createAsyncThunk(
  'creditCards/fetchCardTransactions',
  async ({ id, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/credit-cards/${id}/transactions`, { params: { page, limit } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
    }
  }
);

export const fetchCardStatements = createAsyncThunk(
  'creditCards/fetchCardStatements',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/credit-cards/${id}/statements`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch statements');
    }
  }
);

export const saveCardStatement = createAsyncThunk(
  'creditCards/saveCardStatement',
  async ({ id, statementData }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/api/credit-cards/${id}/statements`, statementData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to save statement');
    }
  }
);

const initialState = {
  creditCards: [],
  selectedCard: null,
  cardNameOptions: [],
  extractedInfo: null,
  loading: false,
  error: null,
  cardTransactions: [],
  transactionsTotal: 0,
  transactionsLoading: false,
  cardStatements: [],
  statementsLoading: false,
};

const creditCardsSlice = createSlice({
  name: 'creditCards',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSelectedCard: (state) => {
      state.selectedCard = null;
    },
    clearExtractedInfo: (state) => {
      state.extractedInfo = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch credit cards
      .addCase(fetchCreditCards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditCards.fulfilled, (state, action) => {
        state.loading = false;
        state.creditCards = Array.isArray(action.payload) ? action.payload : (action.payload.creditCards || []);
      })
      .addCase(fetchCreditCards.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch credit card by ID
      .addCase(fetchCreditCardById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditCardById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCard = action.payload;
      })
      .addCase(fetchCreditCardById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create credit card
      .addCase(createCreditCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCreditCard.fulfilled, (state, action) => {
        state.loading = false;
        state.creditCards.push(action.payload);
      })
      .addCase(createCreditCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update credit card
      .addCase(updateCreditCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCreditCard.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.creditCards.findIndex(card => card.id === action.payload.id);
        if (index !== -1) {
          state.creditCards[index] = action.payload;
        }
        if (state.selectedCard && state.selectedCard.id === action.payload.id) {
          state.selectedCard = action.payload;
        }
      })
      .addCase(updateCreditCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Delete credit card
      .addCase(deleteCreditCard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCreditCard.fulfilled, (state, action) => {
        state.loading = false;
        state.creditCards = state.creditCards.filter(card => card.id !== action.payload);
        if (state.selectedCard && state.selectedCard.id === action.payload) {
          state.selectedCard = null;
        }
      })
      .addCase(deleteCreditCard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Extract credit card info
      .addCase(extractCreditCardInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(extractCreditCardInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.extractedInfo = action.payload;
      })
      .addCase(extractCreditCardInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get card name options
      .addCase(getCardNameOptions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCardNameOptions.fulfilled, (state, action) => {
        state.loading = false;
        state.cardNameOptions = action.payload;
      })
      .addCase(getCardNameOptions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Add card name option
      .addCase(addCardNameOption.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCardNameOption.fulfilled, (state, action) => {
        state.loading = false;
        if (!state.cardNameOptions.includes(action.payload.cardName)) {
          state.cardNameOptions.push(action.payload.cardName);
        }
      })
      .addCase(addCardNameOption.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch card transactions
      .addCase(fetchCardTransactions.pending, (state) => {
        state.transactionsLoading = true;
      })
      .addCase(fetchCardTransactions.fulfilled, (state, action) => {
        state.transactionsLoading = false;
        state.cardTransactions = action.payload.transactions || [];
        state.transactionsTotal = action.payload.total || 0;
      })
      .addCase(fetchCardTransactions.rejected, (state) => {
        state.transactionsLoading = false;
      })
      // Card statements
      .addCase(fetchCardStatements.pending, (state) => {
        state.statementsLoading = true;
      })
      .addCase(fetchCardStatements.fulfilled, (state, action) => {
        state.statementsLoading = false;
        state.cardStatements = action.payload || [];
      })
      .addCase(fetchCardStatements.rejected, (state) => {
        state.statementsLoading = false;
      })
      .addCase(saveCardStatement.pending, (state) => {
        state.loading = true;
      })
      .addCase(saveCardStatement.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(saveCardStatement.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const { clearError, clearSelectedCard, clearExtractedInfo } = creditCardsSlice.actions;
export default creditCardsSlice.reducer; 