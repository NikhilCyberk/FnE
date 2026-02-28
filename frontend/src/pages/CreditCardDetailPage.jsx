import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCreditCardById } from '../slices/creditCardsSlice';
import SummaryCard from '../components/common/SummaryCard';
import CreditCardVisual from '../components/creditCards/CreditCardVisual';
import {
  Box, Typography, Grid, Button, IconButton,
  CircularProgress, Avatar, LinearProgress, Paper
} from '@mui/material';
import {
  ArrowBack, Edit, Delete, CreditCard,
  Download, CalendarToday, Warning, PieChart
} from '@mui/icons-material';

const CreditCardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedCard, loading } = useSelector((state) => state.creditCards);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchCreditCardById(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!selectedCard) {
    return (
      <Box textAlign="center" py={10}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>Card not found</Typography>
        <Typography color="text.secondary" mb={4}>The credit card you're looking for doesn't exist.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate('/credit-cards')}
          sx={{ borderRadius: 2 }}
        >
          Back to Credit Cards
        </Button>
      </Box>
    );
  }

  const limit = Number(selectedCard.creditLimit) || 0;
  const balance = Number(selectedCard.currentBalance) || 0;
  const utilization = limit > 0 ? (balance / limit) * 100 : 0;
  const isOverLimit = balance > limit;

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Page Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/credit-cards')} color="inherit">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">{selectedCard.cardName}</Typography>
            <Typography color="text.secondary">Credit card details and transactions</Typography>
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={2}>
          <Button variant="outlined" startIcon={<Download />} sx={{ borderRadius: 2 }}>
            Export Statement
          </Button>
          <IconButton color="primary"><Edit /></IconButton>
          <IconButton color="error"><Delete /></IconButton>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Credit Card Display */}
        <Grid item xs={12} lg={4}>
          <CreditCardVisual
            card={selectedCard}
            showBalances={showBalances}
            setShowBalances={setShowBalances}
            height={220}
          />
        </Grid>

        {/* Card Details */}
        <Grid item xs={12} lg={8}>
          <Box display="flex" flexDirection="column" gap={3}>
            {/* Summary Cards */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <SummaryCard
                  title="Credit Limit"
                  value={`₹${limit.toLocaleString()}`}
                  icon={<CreditCard />}
                  colorConfig={{ bg: 'info.light', iconColor: 'info.dark' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <SummaryCard
                  title="Current Balance"
                  value={`₹${balance.toLocaleString()}`}
                  icon={<Warning />}
                  colorConfig={{ bg: 'error.light', iconColor: 'error.dark', valueColor: isOverLimit ? 'error.main' : 'text.primary' }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <SummaryCard
                  title="Available Credit"
                  value={`₹${Math.max(0, limit - balance).toLocaleString()}`}
                  icon={<PieChart />}
                  colorConfig={{ bg: 'success.light', iconColor: 'success.dark', valueColor: 'success.main' }}
                />
              </Grid>
            </Grid>

            {/* Utilization */}
            <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
              <Typography variant="h6" fontWeight="bold" mb={2}>Credit Utilization</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2" fontWeight="medium" color="text.secondary">Utilization Rate</Typography>
                  <Typography variant="h6" fontWeight="bold" color={utilization > 30 ? 'error.main' : 'success.main'}>
                    {utilization.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(utilization, 100)}
                  color={utilization > 30 ? 'error' : 'success'}
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="caption" color="text.secondary">
                  {utilization > 30 ? 'High utilization - consider paying down balance' : 'Good utilization rate'}
                </Typography>
              </Box>
            </Paper>

            {/* Payment Information */}
            {(selectedCard.dueDate || selectedCard.minimumPayment) && (
              <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
                <Typography variant="h6" fontWeight="bold" mb={2}>Payment Information</Typography>
                <Grid container spacing={2}>
                  {selectedCard.dueDate && (
                    <Grid item xs={12} md={6}>
                      <Box bgcolor="warning.light" p={2} borderRadius={2} display="flex" alignItems="center" gap={2}>
                        <CalendarToday sx={{ color: 'warning.dark' }} />
                        <Box>
                          <Typography variant="caption" fontWeight="bold" color="warning.dark">Payment Due Date</Typography>
                          <Typography variant="body2" color="warning.dark">
                            {new Date(selectedCard.dueDate).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                  {selectedCard.minimumPayment && (
                    <Grid item xs={12} md={6}>
                      <Box bgcolor="info.light" p={2} borderRadius={2} display="flex" alignItems="center" gap={2}>
                        <CreditCard sx={{ color: 'info.dark' }} />
                        <Box>
                          <Typography variant="caption" fontWeight="bold" color="info.dark">Minimum Payment</Typography>
                          <Typography variant="body2" color="info.dark">
                            ₹{Number(selectedCard.minimumPayment).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            )}

            {/* Recent Transactions */}
            <Paper sx={{ p: 3, borderRadius: 3 }} elevation={1}>
              <Typography variant="h6" fontWeight="bold" mb={3}>Recent Transactions</Typography>
              <Box textAlign="center" py={4}>
                <Avatar sx={{ bgcolor: 'action.hover', mx: 'auto', mb: 2, width: 64, height: 64 }}>
                  <CreditCard fontSize="large" color="action" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom>No transactions yet</Typography>
                <Typography variant="body2" color="text.secondary">Transactions will appear here once you import a statement</Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CreditCardDetailPage;