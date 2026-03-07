import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchCreditCards, createCreditCard, updateCreditCard, deleteCreditCard,
} from '../slices/creditCardsSlice';
import {
  Box, Typography, Grid, Button, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import { Add, CreditCard, Warning, CheckCircle, PieChart } from '@mui/icons-material';
import SummaryCard from '../components/common/SummaryCard';
import CreditCardItem from '../components/creditCards/CreditCardItem';
import CreditCardEditDialog from '../components/creditCards/CreditCardEditDialog';

const fmt = (val) =>
  `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const CreditCardsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { creditCards, loading } = useSelector((state) => state.creditCards);
  const user = useSelector((state) => state.auth.user);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => { dispatch(fetchCreditCards()); }, [dispatch]);

  /* ── Metrics ── */
  const totalCreditLimit = (creditCards || []).reduce((s, c) => s + (Number(c.creditLimit) || 0), 0);
  const totalBalance = (creditCards || []).reduce((s, c) => s + (Number(c.totalPaymentDue) || 0), 0);
  const totalAvailable = totalCreditLimit - totalBalance;
  const utilisation = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  const showSnack = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  /* ── Save (Add / Edit) ── */
  const handleSave = async (form) => {
    const payload = { ...form, user_id: user?.email };
    try {
      let result;
      if (editCard) {
        result = await dispatch(updateCreditCard({ id: editCard.id, creditCardData: payload }));
        if (updateCreditCard.rejected.match(result)) throw new Error(result.payload);
        showSnack('Card updated successfully!');
      } else {
        result = await dispatch(createCreditCard(payload));
        if (createCreditCard.rejected.match(result)) throw new Error(result.payload);
        showSnack('Card added successfully!');
      }
      setShowAddModal(false);
      setEditCard(null);
      dispatch(fetchCreditCards());
    } catch (err) {
      showSnack(err.message || 'Failed to save card.', 'error');
    }
  };

  /* ── Delete ── */
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const result = await dispatch(deleteCreditCard(deleteTarget.id));
    if (deleteCreditCard.rejected.match(result)) {
      showSnack(result.payload || 'Failed to delete card.', 'error');
    } else {
      showSnack('Card deleted.');
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography
            variant="h4" fontWeight={800} letterSpacing={-0.5} gutterBottom
            sx={{
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #fff 30%, #818cf8 100%)'
                  : 'linear-gradient(135deg, #1e1b4b 30%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Credit Cards
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 0.2 }}>
            Manage your credit cards and track spending
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setEditCard(null); setShowAddModal(true); }}
          sx={{
            borderRadius: '12px', px: 3, py: 1.1, fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
            '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.55)', opacity: 0.93 },
          }}
        >
          Add Card
        </Button>
      </Box>

      {/* ── Summary Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Credit Limit"
            value={fmt(totalCreditLimit)}
            icon={<CreditCard />}
            gradient="linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)"
            glowColor="rgba(79,70,229,0.4)"
            subtitle="Across all cards"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Total Balance Due"
            value={fmt(totalBalance)}
            icon={<Warning />}
            gradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
            glowColor="rgba(239,68,68,0.4)"
            subtitle="Total payment due"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Available Credit"
            value={fmt(Math.max(0, totalAvailable))}
            icon={<CheckCircle />}
            gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
            glowColor="rgba(16,185,129,0.4)"
            subtitle="Remaining credit"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="Utilization Rate"
            value={`${utilisation.toFixed(1)}%`}
            icon={<PieChart />}
            gradient={utilisation > 50
              ? 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'}
            glowColor={utilisation > 50 ? 'rgba(239,68,68,0.4)' : 'rgba(245,158,11,0.4)'}
            subtitle={utilisation > 30 ? 'High utilization' : 'Good standing'}
          />
        </Grid>
      </Grid>

      {/* ── Section Label ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>Your Cards</Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        <Typography variant="caption" color="text.disabled" fontWeight={600}>
          {creditCards?.length || 0} total
        </Typography>
      </Box>

      {/* ── Cards Grid — always rendered ── */}
      {!creditCards || creditCards.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 10, borderRadius: '20px',
          border: '1px dashed', borderColor: 'divider', bgcolor: 'background.paper',
        }}>
          <CreditCard sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>No credit cards yet</Typography>
          <Typography variant="body2" color="text.disabled" mb={3}>Add your first card to start tracking</Typography>
          <Button
            variant="contained"
            onClick={() => { setEditCard(null); setShowAddModal(true); }}
            sx={{
              borderRadius: '12px', px: 3,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            }}
          >
            Add Credit Card
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {creditCards.map((card) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={card.id}>
              <CreditCardItem
                card={card}
                showBalances={showBalances}
                setShowBalances={setShowBalances}
                onEdit={(c) => { setEditCard(c); setShowAddModal(true); }}
                onDelete={(c) => setDeleteTarget(c)}
                onViewDetail={(c) => navigate(`/credit-cards/${c.id}`)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* ── Add / Edit Dialog — always mounted ── */}
      <CreditCardEditDialog
        open={showAddModal}
        onClose={() => { setShowAddModal(false); setEditCard(null); }}
        card={editCard}
        onSave={handleSave}
      />

      {/* ── Delete Confirm ── */}
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Delete Card?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{deleteTarget?.cardName || 'this card'}</strong>? This also removes all
            associated transactions and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting}
            sx={{ borderRadius: '10px', fontWeight: 700 }}
          >
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%', borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CreditCardsPage;