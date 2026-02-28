import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAccounts } from '../slices/accountsSlice';
import { fetchTransactions } from '../slices/transactionsSlice';
import { fetchBudgets } from '../slices/budgetsSlice';
import { Box, Typography, Grid, CircularProgress } from '@mui/material';
import {
  AccountBalanceWallet, TrendingUp, TrendingDown,
  Savings, CalendarToday
} from '@mui/icons-material';

import DashboardSummaryCard from '../components/dashboard/DashboardSummaryCard';
import RecentTransactionsList from '../components/dashboard/RecentTransactionsList';
import DashboardCashFlowChart from '../components/dashboard/DashboardCashFlowChart';
import DashboardCategoryChart from '../components/dashboard/DashboardCategoryChart';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { accounts } = useSelector((state) => state.accounts);
  const { transactions } = useSelector((state) => state.transactions);
  const { budgets } = useSelector((state) => state.budgets);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        await Promise.all([
          dispatch(fetchAccounts()),
          dispatch(fetchTransactions()),
          dispatch(fetchBudgets())
        ]);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [dispatch]);

  // Calculate summary data
  const totalBalance = accounts?.reduce((sum, account) => sum + (Number(account.balance) || 0), 0) || 0;
  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
  const activeBudgets = budgets?.filter(b => b.status === 'active').length || 0;

  // Sample chart data
  const monthlyData = [
    { month: 'Jan', income: 4000, expenses: 2400 },
    { month: 'Feb', income: 3000, expenses: 1398 },
    { month: 'Mar', income: 2000, expenses: 9800 },
    { month: 'Apr', income: 2780, expenses: 3908 },
    { month: 'May', income: 1890, expenses: 4800 },
    { month: 'Jun', income: 2390, expenses: 3800 },
  ];

  const categoryData = [
    { name: 'Food', value: 400, color: '#8884d8' },
    { name: 'Transport', value: 300, color: '#82ca9d' },
    { name: 'Shopping', value: 300, color: '#ffc658' },
    { name: 'Bills', value: 200, color: '#ff7300' },
  ];

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight="bold">Dashboard</Typography>
          <Typography color="text.secondary">Welcome back! Here's your financial overview.</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
          <CalendarToday fontSize="small" />
          <Typography variant="body2">{new Date().toLocaleDateString()}</Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardSummaryCard
            title="Total Balance"
            value={`₹${totalBalance.toLocaleString()}`}
            icon={<AccountBalanceWallet />}
            iconConfig={{ bgcolor: 'info.light', color: 'info.dark' }}
            trend={{ icon: <TrendingUp color="success" fontSize="small" />, value: '+12.5%', label: 'from last month', color: 'success.main' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardSummaryCard
            title="Total Income"
            value={`₹${totalIncome.toLocaleString()}`}
            icon={<TrendingUp />}
            iconConfig={{ bgcolor: 'success.light', color: 'success.dark', opacity: 0.8 }}
            trend={{ icon: <TrendingUp color="success" fontSize="small" />, value: '+8.2%', label: 'from last month', color: 'success.main' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardSummaryCard
            title="Total Expenses"
            value={`₹${totalExpenses.toLocaleString()}`}
            icon={<TrendingDown />}
            iconConfig={{ bgcolor: 'error.light', color: 'error.dark', opacity: 0.8 }}
            trend={{ icon: <TrendingDown color="error" fontSize="small" />, value: '+3.1%', label: 'from last month', color: 'error.main' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardSummaryCard
            title="Active Budgets"
            value={activeBudgets}
            icon={<Savings />}
            iconConfig={{ bgcolor: 'secondary.light', color: 'secondary.dark', opacity: 0.8 }}
            trend={{ icon: <TrendingUp color="secondary" fontSize="small" />, value: 'On track', label: 'this month', color: 'secondary.main' }}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <DashboardCashFlowChart data={monthlyData} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <DashboardCategoryChart data={categoryData} />
        </Grid>
      </Grid>

      {/* Recent Transactions */}
      <RecentTransactionsList transactions={transactions} />
    </Box>
  );
};

export default DashboardPage;