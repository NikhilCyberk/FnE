import { configureStore } from '@reduxjs/toolkit';
import authSlice from './features/auth/authSlice';
import accountsSlice from './features/accounts/accountsSlice';
import transactionsSlice from './features/transactions/transactionsSlice';
import categoriesSlice from './features/categories/categoriesSlice';
import budgetsSlice from './features/budgets/budgetsSlice';
import creditCardsSlice from './features/creditCards/creditCardsSlice';
import creditCardTransactionsSlice from './features/creditCards/creditCardTransactionsSlice';
import cashSourcesSlice from './features/cashSources/cashSourcesSlice';
import reportsSlice from './features/reports/reportsSlice';
import loansSlice from './features/loans/loansSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    accounts: accountsSlice,
    transactions: transactionsSlice,
    categories: categoriesSlice,
    budgets: budgetsSlice,
    creditCards: creditCardsSlice,
    creditCardTransactions: creditCardTransactionsSlice,
    cashSources: cashSourcesSlice,
    reports: reportsSlice,
    loans: loansSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export default store;
