import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchAccounts,
  fetchAccountSummary,
  deleteAccount,
} from '../slices/accountsSlice';
import { Box, Typography, Grid, Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Add, AccountBalance, TrendingUp, CheckCircle } from '@mui/icons-material';
import SummaryCard from '../components/common/SummaryCard';
import AccountList from '../components/accounts/AccountList';
import AddAccountDialog from '../components/accounts/AddAccountDialog';
import EditAccountDialog from '../components/accounts/EditAccountDialog';
import DeleteAccountDialog from '../components/accounts/DeleteAccountDialog';

const fmt = (val) =>
  `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AccountsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: accounts, loading, summary } = useSelector((state) => state.accounts);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [editAccount, setEditAccount] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchAccountSummary());
  }, [dispatch]);

  const handleEdit = (account) => setEditAccount(account);
  const handleDeleteRequest = (account) => setDeleteTarget(account);
  const handleViewDetail = (account) => navigate(`/accounts/${account.id}`);

  const handleDeleteConfirm = async () => {
    const result = await dispatch(deleteAccount(deleteTarget.id));
    if (deleteAccount.fulfilled.match(result)) {
      setSnackbar({ open: true, message: 'Account deleted successfully.', severity: 'success' });
      dispatch(fetchAccountSummary());
    } else {
      setSnackbar({ open: true, message: result.payload || 'Failed to delete account.', severity: 'error' });
    }
    setDeleteTarget(null);
  };

  const handleAddSuccess = () => {
    setSnackbar({ open: true, message: 'Account added successfully!', severity: 'success' });
    dispatch(fetchAccountSummary());
  };

  const handleEditSuccess = () => {
    setSnackbar({ open: true, message: 'Account updated successfully!', severity: 'success' });
    dispatch(fetchAccountSummary());
  };

  const activeAccounts =
    accounts?.filter((acc) => acc.account_status === 'active' || acc.accountStatus === 'active').length || 0;

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={800}
            letterSpacing={-0.5}
            gutterBottom
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
            Accounts
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 0.2 }}>
            Manage your financial accounts and track your net worth
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowAddModal(true)}
          sx={{
            borderRadius: '12px',
            px: 3,
            py: 1.1,
            fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
            '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.55)', opacity: 0.93 },
          }}
        >
          Add Account
        </Button>
      </Box>

      {/* ── Summary Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 5 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Total Assets"
            value={fmt(summary?.total_assets)}
            icon={<AccountBalance />}
            gradient="linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)"
            glowColor="rgba(79,70,229,0.4)"
            subtitle="Across all asset accounts"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Net Worth"
            value={fmt(summary?.net_worth)}
            icon={<TrendingUp />}
            gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
            glowColor="rgba(16,185,129,0.4)"
            subtitle="Assets minus liabilities"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Active Accounts"
            value={String(activeAccounts)}
            icon={<CheckCircle />}
            gradient="linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)"
            glowColor="rgba(13,148,136,0.4)"
            subtitle="Currently active"
          />
        </Grid>
      </Grid>

      {/* ── Section Label ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>All Accounts</Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        <Typography variant="caption" color="text.disabled" fontWeight={600}>
          {accounts?.length || 0} total
        </Typography>
      </Box>

      {/* ── Accounts List ── */}
      {loading && (!accounts || accounts.length === 0) ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
          <CircularProgress />
        </Box>
      ) : (
        <AccountList
          accounts={accounts}
          showBalances={showBalances}
          setShowBalances={setShowBalances}
          setShowAddModal={setShowAddModal}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onViewDetail={handleViewDetail}
        />
      )}

      {/* ── Dialogs — always mounted ── */}
      <AddAccountDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
      <EditAccountDialog
        open={!!editAccount}
        account={editAccount}
        onClose={() => setEditAccount(null)}
        onSuccess={handleEditSuccess}
      />
      <DeleteAccountDialog
        open={!!deleteTarget}
        account={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AccountsPage;