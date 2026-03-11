import { configureStore } from '@reduxjs/toolkit';
import accountsReducer from './slices/accountsSlice';
import budgetsReducer from './slices/budgetsSlice';
import transactionsReducer from './slices/transactionsSlice';
import reportsReducer from './slices/reportsSlice';
import authReducer from './slices/authSlice';
import categoriesReducer from './slices/categoriesSlice';
import creditCardsReducer from './slices/creditCardsSlice';
import loansReducer from './slices/loansSlice';
import cashSourcesReducer from './slices/cashSourcesSlice';
import creditCardTransactionsReducer from './slices/creditCardTransactionsSlice';

const store = configureStore({
  reducer: {
    accounts: accountsReducer,
    budgets: budgetsReducer,
    transactions: transactionsReducer,
    reports: reportsReducer,
    auth: authReducer,
    categories: categoriesReducer,
    creditCards: creditCardsReducer,
    loans: loansReducer,
    cashSources: cashSourcesReducer,
    creditCardTransactions: creditCardTransactionsReducer,
  },
});

export default store;