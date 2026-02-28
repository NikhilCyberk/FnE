import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchAccounts } from '../slices/accountsSlice';
import { Box, Typography, Grid, Button, CircularProgress } from '@mui/material';
import { Add, AccountBalance, CreditCard, BusinessCenter } from '@mui/icons-material';
import SummaryCard from '../components/common/SummaryCard';
import AccountList from '../components/accounts/AccountList';
import AddAccountDialog from '../components/accounts/AddAccountDialog';

const AccountsPage = () => {
  const dispatch = useDispatch();
  const { accounts, loading } = useSelector((state) => state.accounts);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    dispatch(fetchAccounts());
  }, [dispatch]);

  const totalBalance = accounts?.reduce((sum, account) => sum + (Number(account.balance) || 0), 0) || 0;
  const totalAccounts = accounts?.length || 0;
  const activeAccounts = accounts?.filter(acc => acc.accountStatus === 'active').length || 0;

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
          <Typography variant="h4" fontWeight="bold">Accounts</Typography>
          <Typography color="text.secondary">Manage your financial accounts</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setShowAddModal(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Account
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Balance"
            value={`₹${totalBalance.toLocaleString()}`}
            icon={<AccountBalance />}
            colorConfig={{ bg: 'primary.light', iconColor: 'primary.dark' }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Accounts"
            value={totalAccounts}
            icon={<BusinessCenter />}
            colorConfig={{ bg: 'success.light', iconColor: 'success.dark' }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Active Accounts"
            value={activeAccounts}
            icon={<CreditCard />}
            colorConfig={{ bg: 'secondary.light', iconColor: 'secondary.dark' }}
          />
        </Grid>
      </Grid>

      {/* Accounts List */}
      <AccountList
        accounts={accounts}
        showBalances={showBalances}
        setShowBalances={setShowBalances}
        setShowAddModal={setShowAddModal}
      />

      {/* Add Account Dialog */}
      <AddAccountDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </Box>
  );
};

export default AccountsPage;