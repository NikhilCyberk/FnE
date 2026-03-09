import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTransactions } from '../slices/transactionsSlice';
import { Box, Typography, Grid, Button, Snackbar, Alert } from '@mui/material';
import { Add, ArrowUpward, ArrowDownward, AccountBalanceWallet } from '@mui/icons-material';

import SummaryCard from '../components/common/SummaryCard';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import AddTransactionDialog from '../components/transactions/AddTransactionDialog';

const fmt = (val) =>
  `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { transactions, loading } = useSelector((state) => state.transactions);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    dispatch(fetchTransactions());
  }, [dispatch]);

  /* ── Filtering ── */
  const filteredTransactions = (transactions || []).filter((tx) => {
    const term = searchTerm.toLowerCase();
    const matchSearch = !term ||
      tx.description?.toLowerCase().includes(term) ||
      tx.merchant?.toLowerCase().includes(term) ||
      (tx.account_name || tx.accountName || '').toLowerCase().includes(term) ||
      (tx.category_name || tx.categoryName || '').toLowerCase().includes(term) ||
      (tx.is_cash && 'cash'.includes(term)) ||
      (tx.cash_source || tx.cashSource || '').toLowerCase().includes(term);
    const matchType = selectedType === 'all' || tx.type === selectedType;
    const matchStatus = selectedStatus === 'all' || tx.status === selectedStatus;
    return matchSearch && matchType && matchStatus;
  });

  /* ── Summary Metrics ── */
  const totalIncome = filteredTransactions.filter((t) => t.type === 'income')
    .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
  const totalExpenses = filteredTransactions.filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
  const netAmount = totalIncome - totalExpenses;

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

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
            Transactions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 0.2 }}>
            Track and manage all your income, expenses, and transfers
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setEditTx(null); setShowAddModal(true); }}
          sx={{
            borderRadius: '12px', px: 3, py: 1.1, fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
            '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.55)', opacity: 0.93 },
          }}
        >
          Add Transaction
        </Button>
      </Box>

      {/* ── Summary Cards ── */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Total Income"
            value={fmt(totalIncome)}
            icon={<ArrowUpward />}
            gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
            glowColor="rgba(16,185,129,0.4)"
            subtitle={`${filteredTransactions.filter((t) => t.type === 'income').length} transactions`}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Total Expenses"
            value={fmt(totalExpenses)}
            icon={<ArrowDownward />}
            gradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
            glowColor="rgba(239,68,68,0.4)"
            subtitle={`${filteredTransactions.filter((t) => t.type === 'expense').length} transactions`}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <SummaryCard
            title="Net Amount"
            value={fmt(Math.abs(netAmount))}
            icon={<AccountBalanceWallet />}
            gradient={netAmount >= 0
              ? 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)'
              : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'}
            glowColor={netAmount >= 0 ? 'rgba(79,70,229,0.4)' : 'rgba(245,158,11,0.4)'}
            subtitle={netAmount >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
          />
        </Grid>
      </Grid>

      {/* ── Section Label ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>All Transactions</Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        <Typography variant="caption" color="text.disabled" fontWeight={600}>
          {filteredTransactions.length} of {transactions?.length || 0} total
        </Typography>
      </Box>

      {/* ── Filters ── */}
      <TransactionFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        selectedType={selectedType} setSelectedType={setSelectedType}
        selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
      />

      {/* ── Table — always rendered so dialog stays mounted ── */}
      <Box sx={{ mt: 3 }}>
        <TransactionTable
          filteredTransactions={filteredTransactions}
          setShowAddModal={() => { setEditTx(null); setShowAddModal(true); }}
          onEdit={(tx) => { setEditTx(tx); setShowAddModal(true); }}
          onSuccess={(msg) => showSnackbar(msg)}
        />
      </Box>

      {/* ── Dialog — always mounted ── */}
      <AddTransactionDialog
        open={showAddModal}
        transaction={editTx}
        onClose={() => { setShowAddModal(false); setEditTx(null); }}
        onSuccess={(msg) => showSnackbar(msg)}
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

export default TransactionsPage;