import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCreditCards } from '../slices/creditCardsSlice';
import CreditCardEditDialog from '../components/creditCards/CreditCardEditDialog';
import CreditCardItem from '../components/creditCards/CreditCardItem';
import SummaryCard from '../components/common/SummaryCard';
import {
  Box, Typography, Grid, Button, CircularProgress, Avatar, Paper
} from '@mui/material';
import {
  Add, CreditCard, Upload, Warning, Visibility, PieChart
} from '@mui/icons-material';

const CreditCardsPage = () => {
  const dispatch = useDispatch();
  const { creditCards, loading } = useSelector((state) => state.creditCards);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    dispatch(fetchCreditCards());
  }, [dispatch]);

  const totalCreditLimit = creditCards?.reduce((sum, card) => sum + (Number(card.creditLimit) || 0), 0) || 0;
  const totalBalance = creditCards?.reduce((sum, card) => sum + (Number(card.currentBalance) || 0), 0) || 0;
  const totalAvailable = totalCreditLimit - totalBalance;
  const utilizationRate = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

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
          <Typography variant="h4" fontWeight="bold">Credit Cards</Typography>
          <Typography color="text.secondary">Manage your credit cards and track spending</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Button variant="outlined" startIcon={<Upload />} sx={{ borderRadius: 2 }}>
            Import Statement
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setShowAddModal(true)}
            sx={{ borderRadius: 2 }}
          >
            Add Card
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Credit Limit"
            value={`₹${totalCreditLimit.toLocaleString()}`}
            icon={<CreditCard />}
            colorConfig={{ bg: 'info.light', iconColor: 'info.dark' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Balance"
            value={`₹${totalBalance.toLocaleString()}`}
            icon={<Warning />}
            colorConfig={{ bg: 'error.light', iconColor: 'error.dark', valueColor: 'error.main' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Available Credit"
            value={`₹${Math.max(0, totalAvailable).toLocaleString()}`}
            icon={<Visibility />}
            colorConfig={{ bg: 'success.light', iconColor: 'success.dark', valueColor: 'success.main' }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Utilization Rate"
            value={`${utilizationRate.toFixed(1)}%`}
            icon={<PieChart />}
            colorConfig={{ bg: 'secondary.light', iconColor: 'secondary.dark', valueColor: utilizationRate > 30 ? 'error.main' : 'success.main' }}
          />
        </Grid>
      </Grid>

      {/* Credit Cards Grid */}
      <Grid container spacing={3}>
        {!creditCards || creditCards.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ textAlign: 'center', py: 8, borderRadius: 3 }} elevation={1}>
              <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'action.hover' }}>
                <CreditCard fontSize="large" color="action" />
              </Avatar>
              <Typography variant="h6" fontWeight="medium" gutterBottom>No credit cards yet</Typography>
              <Typography color="text.secondary" mb={3}>Add your first credit card to start tracking</Typography>
              <Button variant="contained" onClick={() => setShowAddModal(true)} sx={{ borderRadius: 2 }}>
                Add Credit Card
              </Button>
            </Paper>
          </Grid>
        ) : (
          creditCards.map((card) => (
            <Grid item xs={12} md={6} lg={4} key={card.id}>
              <CreditCardItem
                card={card}
                showBalances={showBalances}
                setShowBalances={setShowBalances}
              />
            </Grid>
          ))
        )}
      </Grid>

      {showAddModal && (
        <CreditCardEditDialog
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={() => { setShowAddModal(false); }}
        />
      )}
    </Box>
  );
};

export default CreditCardsPage;