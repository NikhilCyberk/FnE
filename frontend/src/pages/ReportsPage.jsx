import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTransactions } from '../slices/transactionsSlice';
import { Box, Typography, Grid, Paper, Button, MenuItem, TextField, useTheme } from '@mui/material';
import { Download, FilterList, AttachMoney, ArrowUpward, ArrowDownward } from '@mui/icons-material';

import SummaryCard from '../components/common/SummaryCard';
import CashFlowChart from '../components/reports/CashFlowChart';
import ExpenseCategoryChart from '../components/reports/ExpenseCategoryChart';
import TopExpensesList from '../components/reports/TopExpensesList';
import MonthlyComparisonChart from '../components/reports/MonthlyComparisonChart';

const ReportsPage = () => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { transactions } = useSelector((state) => state.transactions);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  // Sample data for charts
  const monthlyData = [
    { month: 'Jan', income: 4000, expenses: 2400, net: 1600 },
    { month: 'Feb', income: 3000, expenses: 1398, net: 1602 },
    { month: 'Mar', income: 2000, expenses: 9800, net: -7800 },
    { month: 'Apr', income: 2780, expenses: 3908, net: -1128 },
    { month: 'May', income: 1890, expenses: 4800, net: -2910 },
    { month: 'Jun', income: 2390, expenses: 3800, net: -1410 },
  ];

  const categoryData = [
    { name: 'Food & Dining', value: 400, color: '#8884d8' },
    { name: 'Transportation', value: 300, color: '#82ca9d' },
    { name: 'Shopping', value: 300, color: '#ffc658' },
    { name: 'Bills & Utilities', value: 200, color: '#ff7300' },
    { name: 'Entertainment', value: 150, color: '#8dd1e1' },
    { name: 'Healthcare', value: 100, color: '#d084d0' },
  ];

  const topExpenses = [
    { category: 'Food & Dining', amount: 2400, percentage: 25 },
    { category: 'Transportation', amount: 1800, percentage: 19 },
    { category: 'Shopping', amount: 1500, percentage: 16 },
    { category: 'Bills & Utilities', amount: 1200, percentage: 13 },
    { category: 'Entertainment', amount: 900, percentage: 9 },
  ];

  const totalIncome = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
  const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0) || 0;
  const netAmount = totalIncome - totalExpenses;

  // Custom Tooltip style for charts
  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '8px',
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3]
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h4" fontWeight="bold">Reports</Typography>
          <Typography color="text.secondary">Analyze your financial data and trends</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Download />}
          sx={{ borderRadius: 2 }}
        >
          Export Report
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2} display="flex" alignItems="center" gap={1}>
            <FilterList color="action" />
            <Typography fontWeight="medium">Filters:</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              label="Period"
            >
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="quarter">This Quarter</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={5}>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Type"
            >
              <MenuItem value="all">All Transactions</MenuItem>
              <MenuItem value="income">Income Only</MenuItem>
              <MenuItem value="expense">Expenses Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Total Income"
            value={`₹${totalIncome.toLocaleString()}`}
            icon={<ArrowUpward />}
            colorConfig={{ bg: 'success.light', iconColor: 'success.dark', valueColor: 'success.main' }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Total Expenses"
            value={`₹${totalExpenses.toLocaleString()}`}
            icon={<ArrowDownward />}
            colorConfig={{ bg: 'error.light', iconColor: 'error.dark', valueColor: 'error.main' }}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Net Amount"
            value={`₹${netAmount.toLocaleString()}`}
            icon={<AttachMoney />}
            colorConfig={{
              bg: 'primary.light',
              iconColor: 'primary.dark',
              valueColor: netAmount >= 0 ? "success.main" : "error.main"
            }}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={6}>
          <CashFlowChart data={monthlyData} tooltipStyle={tooltipStyle} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <ExpenseCategoryChart data={categoryData} tooltipStyle={tooltipStyle} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <TopExpensesList topExpenses={topExpenses} />
        </Grid>
        <Grid item xs={12} lg={6}>
          <MonthlyComparisonChart data={monthlyData} tooltipStyle={tooltipStyle} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;