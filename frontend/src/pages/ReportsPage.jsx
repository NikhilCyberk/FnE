import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Typography, Grid, Paper, Button, MenuItem, TextField, useTheme, CircularProgress, Alert } from '@mui/material';
import { Download, FilterList, AttachMoney, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import dayjs from 'dayjs';

import { reportsAPI } from '../api';
import SummaryCard from '../components/common/SummaryCard';
import CashFlowChart from '../components/reports/CashFlowChart';
import ExpenseCategoryChart from '../components/reports/ExpenseCategoryChart';
import TopExpensesList from '../components/reports/TopExpensesList';
import MonthlyComparisonChart from '../components/reports/MonthlyComparisonChart';

const ReportsPage = () => {
  const theme = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [summaryData, setSummaryData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netAmount: 0,
    topCategories: []
  });
  const [categoryData, setCategoryData] = useState([]);
  const [cashFlowData, setCashFlowData] = useState([]);

  const getDateRange = useCallback((period) => {
    const now = dayjs();
    let startDate;
    let endDate = now.endOf('day').format('YYYY-MM-DD');

    switch (period) {
      case 'week':
        startDate = now.startOf('week').format('YYYY-MM-DD');
        break;
      case 'month':
        startDate = now.startOf('month').format('YYYY-MM-DD');
        break;
      case 'quarter':
        startDate = now.subtract(3, 'month').startOf('month').format('YYYY-MM-DD');
        break;
      case 'year':
        startDate = now.startOf('year').format('YYYY-MM-DD');
        break;
      default:
        startDate = now.startOf('month').format('YYYY-MM-DD');
    }

    return { startDate, endDate };
  }, []);

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(selectedPeriod);
      const params = { startDate, endDate };

      const [summaryRes, categoryRes, cashFlowRes] = await Promise.all([
        reportsAPI.getSpendingSummary(params),
        reportsAPI.getCategoryBreakdown({ ...params, type: selectedType === 'all' ? 'expense' : selectedType }),
        reportsAPI.getCashFlow({ ...params, groupBy: selectedPeriod === 'week' ? 'day' : 'month' })
      ]);

      setSummaryData(summaryRes.data);
      setCategoryData(categoryRes.data.categories || []);
      setCashFlowData(cashFlowRes.data.cashFlow || []);
    } catch (err) {
      console.error('Failed to fetch report data:', err);
      setError('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [selectedPeriod, selectedType, getDateRange]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const tooltipStyle = {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '8px',
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[3]
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

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
          onClick={() => window.print()}
        >
          Export Report
        </Button>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 2 }} display="flex" alignItems="center" gap={1}>
            <FilterList color="action" />
            <Typography fontWeight="medium">Filters:</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
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
              <MenuItem value="quarter">Last 3 Months</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 5 }}>
            <TextField
              select
              fullWidth
              size="small"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              label="Category Type"
            >
              <MenuItem value="all">All Expenses</MenuItem>
              <MenuItem value="income">Income Only</MenuItem>
              <MenuItem value="expense">Expenses Only</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Total Income"
            value={`₹${(summaryData?.totalIncome || 0).toLocaleString()}`}
            icon={<ArrowUpward />}
            colorConfig={{ bg: 'success.light', iconColor: 'success.dark', valueColor: 'success.main' }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Total Expenses"
            value={`₹${(summaryData?.totalExpenses || 0).toLocaleString()}`}
            icon={<ArrowDownward />}
            colorConfig={{ bg: 'error.light', iconColor: 'error.dark', valueColor: 'error.main' }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Net Amount"
            value={`₹${(summaryData?.netAmount || 0).toLocaleString()}`}
            icon={<AttachMoney />}
            colorConfig={{
              bg: 'primary.light',
              iconColor: 'primary.dark',
              valueColor: (summaryData?.netAmount || 0) >= 0 ? "success.main" : "error.main"
            }}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <CashFlowChart data={cashFlowData || []} tooltipStyle={tooltipStyle} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <ExpenseCategoryChart
            data={(categoryData || []).map(c => ({ name: c.name, value: c.value, color: c.color }))}
            tooltipStyle={tooltipStyle}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <TopExpensesList topExpenses={(summaryData?.topCategories || []).map(c => ({
            category: c.category_name,
            amount: c.amount,
            percentage: Math.round(c.percentage)
          }))} />
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <MonthlyComparisonChart data={cashFlowData || []} tooltipStyle={tooltipStyle} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsPage;
