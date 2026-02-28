import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchBudgets } from '../slices/budgetsSlice';
import { Box, Typography, Grid, Button, CircularProgress, Paper, Avatar } from '@mui/material';
import { Add, Savings, CheckCircle, PieChart, Warning, AccessTime } from '@mui/icons-material';

import SummaryCard from '../components/common/SummaryCard';
import BudgetCard from '../components/budgets/BudgetCard';
import BudgetFormDialog from '../components/budgets/BudgetFormDialog';

const BudgetsPage = () => {
  const dispatch = useDispatch();
  const { budgets, loading } = useSelector((state) => state.budgets);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    dispatch(fetchBudgets());
  }, [dispatch]);

  const getBudgetStatus = (budget) => {
    const spent = Number(budget.spent) || 0;
    const amount = Number(budget.amount) || 0;
    const percentage = amount > 0 ? (spent / amount) * 100 : 0;

    if (percentage >= 100) {
      return { color: 'error', icon: Warning, text: 'Over Budget' };
    } else if (percentage >= 80) {
      return { color: 'warning', icon: AccessTime, text: 'Warning' };
    } else {
      return { color: 'success', icon: CheckCircle, text: 'On Track' };
    }
  };

  const totalBudgets = budgets?.length || 0;
  const activeBudgets = budgets?.filter(b => b.status === 'active').length || 0;
  const totalBudgeted = budgets?.reduce((sum, b) => sum + (Number(b.amount) || 0), 0) || 0;
  const totalSpent = budgets?.reduce((sum, b) => sum + (Number(b.spent) || 0), 0) || 0;

  if (loading) {
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
          <Typography variant="h4" fontWeight="bold">Budgets</Typography>
          <Typography color="text.secondary">Track your spending and stay on budget</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setShowAddModal(true)}
          sx={{ borderRadius: 2 }}
        >
          Create Budget
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Budgets"
            value={totalBudgets}
            icon={<Savings />}
            colorConfig={{ bg: 'info.light', iconColor: 'info.dark' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Active Budgets"
            value={activeBudgets}
            icon={<CheckCircle />}
            colorConfig={{ bg: 'success.light', iconColor: 'success.dark' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Budgeted"
            value={`₹${totalBudgeted.toLocaleString()}`}
            icon={<PieChart />}
            colorConfig={{ bg: 'secondary.light', iconColor: 'secondary.dark' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Spent"
            value={`₹${totalSpent.toLocaleString()}`}
            icon={<Warning />}
            colorConfig={{ bg: 'warning.light', iconColor: 'warning.dark' }}
          />
        </Grid>
      </Grid>

      {/* Budgets Grid */}
      <Grid container spacing={3}>
        {!budgets || budgets.length === 0 ? (
          <Grid size={{ xs: 12 }}>
            <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 3 }} elevation={1}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'action.hover' }}>
                <Savings fontSize="large" color="action" />
              </Avatar>
              <Typography variant="h6" fontWeight="medium" gutterBottom>No budgets yet</Typography>
              <Typography color="text.secondary" mb={3}>Create your first budget to start tracking your spending</Typography>
              <Button variant="contained" onClick={() => setShowAddModal(true)} sx={{ borderRadius: 2 }}>
                Create Budget
              </Button>
            </Paper>
          </Grid>
        ) : (
          budgets.map((budget) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={budget.id}>
              <BudgetCard budget={budget} getBudgetStatus={getBudgetStatus} />
            </Grid>
          ))
        )}
      </Grid>

      {/* Add Budget Dialog */}
      <BudgetFormDialog
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
      />
    </Box>
  );
};

export default BudgetsPage;