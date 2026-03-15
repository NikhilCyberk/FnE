// Transactions Page with Server-side Pagination and Filtering
import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTransactions } from '../slices/transactionsSlice';
import dayjs from 'dayjs';
import { Box, Typography, Grid, Button, Snackbar, Alert, Pagination, Paper, IconButton, ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import { Add, ArrowUpward, ArrowDownward, AccountBalanceWallet, ViewList, CalendarMonth } from '@mui/icons-material';

import SummaryCard from '../components/common/SummaryCard';
import TransactionFilters from '../components/transactions/TransactionFilters';
import TransactionTable from '../components/transactions/TransactionTable';
import TransactionCalendar from '../components/transactions/TransactionCalendar';
import AddTransactionDialog from '../components/transactions/AddTransactionDialog';
import DebtSummaryWidget from '../components/transactions/DebtSummaryWidget';
import { accountsAPI, creditCardsAPI, categoriesAPI } from '../api';

const fmt = (val) =>
  `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { transactions, loading, pagination } = useSelector((state) => state.transactions);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(dayjs());

  const [accounts, setAccounts] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [categories, setCategories] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editTx, setEditTx] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedType, selectedStatus, selectedAccount, selectedCategory]);

  // Fetch reference data for filters
  useEffect(() => {
    const loadFiltersData = async () => {
        try {
            const [accRes, ccRes, catRes] = await Promise.all([
                accountsAPI.getAll({ includeLiabilities: 'true', limit: 100 }),
                creditCardsAPI.getAll(),
                categoriesAPI.getAll({ limit: 100 })
            ]);
            // Filter accounts to exclude shadow CC accounts as done in AddTransactionDialog
            setAccounts((accRes.data?.accounts || accRes.data || []).filter(a => 
                !(a.account_name || a.accountName)?.toLowerCase().startsWith('credit card - ') &&
                (a.account_type_category || a.accountTypeCategory) !== 'liability'
            ));
            setCreditCards(ccRes.data?.creditCards || ccRes.data || []);
            setCategories(catRes.data?.categories || catRes.data || []);
        } catch (err) {
            console.error('Failed to load filter reference data', err);
        }
    };
    loadFiltersData();
  }, []);

  const fetchCurrentTransactions = useCallback(() => {
    const isCalendar = viewMode === 'calendar';
    const params = {
        page: isCalendar ? 1 : page,
        limit: isCalendar ? 500 : limit, // Fetch more for calendar to ensure we see the whole month
        type: selectedType === 'all' ? undefined : selectedType,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        accountId: selectedAccount === 'all' ? undefined : selectedAccount,
        categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchTerm || undefined,
        // If API supported date ranges, we'd add currentMonth start/end here
    };
    dispatch(fetchTransactions(params));
  }, [dispatch, page, limit, selectedType, selectedStatus, selectedAccount, selectedCategory, searchTerm, viewMode, currentMonth]);

  useEffect(() => {
    fetchCurrentTransactions();
  }, [fetchCurrentTransactions]);

  const showSnackbar = (message, severity = 'success') =>
    setSnackbar({ open: true, message, severity });

  const handleTransactionSuccess = (msg) => {
    showSnackbar(msg);
    if (page === 1) fetchCurrentTransactions();
    else setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  // Summary Metrics (calculated from current page's transactions for now, or fetch from stats api)
  const totalIncome = transactions.filter((t) => t.type === 'income')
    .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense')
    .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
  const netAmount = totalIncome - totalExpenses;

  return (
    <Box>
      {/* ── Page Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
        <Box>
          <Typography
            variant="h5" fontWeight={800} letterSpacing={-0.5} gutterBottom
            sx={{
              lineHeight: 1,
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
        <Box display="flex" alignItems="center" gap={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, next) => next && setViewMode(next)}
            size="small"
            sx={{ 
                bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                '& .MuiToggleButton-root': { border: 'none', px: 1.5, py: 0.5, borderRadius: '8px', m: 0.4 }
            }}
          >
            <ToggleButton value="list">
              <Tooltip title="List View"><ViewList fontSize="small" /></Tooltip>
            </ToggleButton>
            <ToggleButton value="calendar">
              <Tooltip title="Calendar View"><CalendarMonth fontSize="small" /></Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => { setEditTx(null); setShowAddModal(true); }}
            sx={{
              borderRadius: '10px', px: 2, py: 0.8, fontWeight: 700,
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
              '&:hover': { boxShadow: '0 6px 20px rgba(79,70,229,0.5)', opacity: 0.93 },
            }}
          >
            Add Transaction
          </Button>
        </Box>
      </Box>

      {/* ── Summary Cards ── */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Total Income"
            value={fmt(totalIncome)}
            icon={<ArrowUpward />}
            gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
            glowColor="rgba(16,185,129,0.4)"
            subtitle={`${transactions.filter((t) => t.type === 'income').length} items`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <SummaryCard
            title="Total Expenses"
            value={fmt(totalExpenses)}
            icon={<ArrowDownward />}
            gradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
            glowColor="rgba(239,68,68,0.4)"
            subtitle={`${transactions.filter((t) => t.type === 'expense').length} items`}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
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
        <Grid item xs={12} sm={6} lg={3}>
          <DebtSummaryWidget />
        </Grid>
      </Grid>

      {/* ── Section Label ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>All Transactions</Typography>
        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
        <Typography variant="caption" color="text.disabled" fontWeight={600}>
          Showing {transactions.length} of {pagination?.total || 0} total
        </Typography>
      </Box>

      {/* ── Filters ── */}
      <TransactionFilters
        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
        selectedType={selectedType} setSelectedType={setSelectedType}
        selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
        selectedAccount={selectedAccount} setSelectedAccount={setSelectedAccount}
        selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
        accounts={accounts} creditCards={creditCards} categories={categories}
      />

      {/* ── Table / Calendar ── */}
      <Box sx={{ mt: 3 }}>
        {viewMode === 'calendar' ? (
          <TransactionCalendar 
            transactions={transactions} 
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
          />
        ) : (
          <>
            <TransactionTable
              filteredTransactions={transactions}
              setShowAddModal={() => { setEditTx(null); setShowAddModal(true); }}
              onEdit={(tx) => { setEditTx(tx); setShowAddModal(true); }}
              onSuccess={handleTransactionSuccess}
            />
            
            {/* ── Pagination ── */}
            {pagination && pagination.totalPages > 1 && (
              <Paper sx={{ mt: 2, p: 2, display: 'flex', justifyContent: 'center', borderRadius: 2 }} elevation={1}>
                <Pagination 
                  count={pagination.totalPages} 
                  page={page} 
                  onChange={handlePageChange} 
                  color="primary" 
                  shape="rounded"
                  size="large"
                />
              </Paper>
            )}
          </>
        )}
      </Box>

      {/* ── Dialog — always mounted ── */}
      <AddTransactionDialog
        open={showAddModal}
        transaction={editTx}
        onClose={() => { setShowAddModal(false); setEditTx(null); }}
        onSuccess={handleTransactionSuccess}
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