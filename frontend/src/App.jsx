import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import AccountDetailPage from './pages/AccountDetailPage';
import TransactionsPage from './pages/TransactionsPage';
import BudgetsPage from './pages/BudgetsPage';
import ReportsPage from './pages/ReportsPage';
import CreditCardsPage from './pages/CreditCardsPage';
import CreditCardDetailPage from './pages/CreditCardDetailPage';
import LoansPage from './pages/LoansPage';
import LoanDetailPage from './pages/LoanDetailPage';
import ContactsPage from './pages/ContactsPage';

import { ThemeProvider, CssBaseline } from '@mui/material';
import { createAppTheme } from './theme';
import MainLayout from './components/layout/MainLayout';

function AppContent() {
  const storedMode = localStorage.getItem('darkMode') === 'true' ? 'dark' : 'light';
  const [mode, setMode] = useState(storedMode);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const toggleColorMode = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    localStorage.setItem('darkMode', nextMode === 'dark');
  };

  useEffect(() => {
    // For syncing with Tailwind if any legacy classes remain
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainLayout mode={mode} toggleColorMode={toggleColorMode}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/accounts/:id" element={<AccountDetailPage />} />
          <Route path="/credit-cards" element={<CreditCardsPage />} />
          <Route path="/credit-cards/:id" element={<CreditCardDetailPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/loans/:id" element={<LoanDetailPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/budgets" element={<BudgetsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
