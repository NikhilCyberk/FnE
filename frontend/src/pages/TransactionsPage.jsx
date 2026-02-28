import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTransactions } from '../slices/transactionsSlice';
import { Box, Typography, Grid, Button, CircularProgress } from '@mui/material';
import { Add, ArrowUpward, ArrowDownward, AccountBalanceWallet, SwapHoriz } from '@mui/icons-material';

import SummaryCard from '../components/common/SummaryCard';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import AddTransactionDialog from '../components/transactions/AddTransactionDialog';

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector((state) => state.transactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'income': return <ArrowUpward fontSize="small" color="success" />;
      case 'expense': return <ArrowDownward fontSize="small" color="error" />;
      case 'transfer': return <SwapHoriz fontSize="small" color="info" />;
      default: return <AccountBalanceWallet fontSize="small" color="action" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  const filteredTransactions = transactions?.filter(transaction => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = transaction.description?.toLowerCase().includes(term) ||
      transaction.merchant?.toLowerCase().includes(term);
    const matchesType = selectedType === 'all' || transaction.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || transaction.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const netAmount = totalIncome - totalExpenses;

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
          <Typography variant="h4" fontWeight="bold">Transactions</Typography>
          <Typography color="text.secondary">Track your income and expenses</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setShowAddModal(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Transaction
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Income"
            value={`₹${totalIncome.toLocaleString()}`}
            icon={<ArrowUpward />}
            colorConfig={{ bg: 'success.light', iconColor: 'success.dark', valueColor: 'success.main' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Total Expenses"
            value={`₹${totalExpenses.toLocaleString()}`}
            icon={<ArrowDownward />}
            colorConfig={{ bg: 'error.light', iconColor: 'error.dark', valueColor: 'error.main' }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <SummaryCard
            title="Net Amount"
            value={`₹${netAmount.toLocaleString()}`}
            icon={<AccountBalanceWallet />}
            colorConfig={{ bg: 'info.light', iconColor: 'info.dark', valueColor: netAmount >= 0 ? 'success.main' : 'error.main' }}
          />
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <TransactionFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedType={selectedType}
        setSelectedType={setSelectedType}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
      />

      {/* Transactions Table */}
      <TransactionTable
        filteredTransactions={filteredTransactions}
        getTransactionIcon={getTransactionIcon}
        getStatusColor={getStatusColor}
        setShowAddModal={setShowAddModal}
      />

      {/* Add Transaction Dialog */}
      <AddTransactionDialog
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
      />
    </Box>
  );
};

export default TransactionsPage;