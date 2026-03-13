import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Grid } from '@mui/material';
import { CalendarToday, AccountBalanceWallet, TrendingUp, TrendingDown, Savings } from '@mui/icons-material';
import dayjs from 'dayjs';

// Slices
import { fetchAccounts } from '../slices/accountsSlice';
import { fetchTransactions } from '../slices/transactionsSlice';
import { fetchBudgets } from '../slices/budgetsSlice';
import { fetchLoans } from '../slices/loansSlice';
import { fetchCreditCards } from '../slices/creditCardsSlice';

// Dashboard components
import DashboardSummaryCard from '../components/dashboard/DashboardSummaryCard';
import DashboardCashFlowChart from '../components/dashboard/DashboardCashFlowChart';
import DashboardCategoryChart from '../components/dashboard/DashboardCategoryChart';
import RecentTransactionsList from '../components/dashboard/RecentTransactionsList';
import DashboardLoansWidget from '../components/dashboard/DashboardLoansWidget';
import DashboardCreditCardsWidget from '../components/dashboard/DashboardCreditCardsWidget';
import DashboardAccountsWidget from '../components/dashboard/DashboardAccountsWidget';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build real monthly income / expenses for the last 6 months from transactions */
const buildMonthlyData = (transactions) => {
  const months = Array.from({ length: 6 }, (_, i) => dayjs().subtract(5 - i, 'month'));
  return months.map((m) => {
    const txInMonth = (type) =>
      transactions
        .filter(t => t.type === type && dayjs(t.transactionDate || t.date || t.transaction_date).isSame(m, 'month'))
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    return { month: m.format('MMM'), income: txInMonth('income'), expenses: txInMonth('expense') };
  });
};

/** Aggregate expense amounts by category (top 6) */
const buildCategoryData = (transactions) => {
  const PALETTE = ['#6366f1', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
  const map = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    const cat = t.categoryName || t.category_name || t.category || 'Other';
    map[cat] = (map[cat] || 0) + Number(t.amount || 0);
  });
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return sorted.length > 0
    ? sorted.map(([name, value], i) => ({ name, value: Math.round(value), color: PALETTE[i % PALETTE.length] }))
    : [
      { name: 'Food', value: 0, color: PALETTE[0] },
      { name: 'Transport', value: 0, color: PALETTE[1] },
      { name: 'Bills', value: 0, color: PALETTE[2] },
    ];
};

// ── Component ─────────────────────────────────────────────────────────────────

const DashboardPage = () => {
  const dispatch = useDispatch();

  // Redux state
  const { items: accounts = [] } = useSelector(s => s.accounts);
  const { transactions = [] } = useSelector(s => s.transactions);
  const { budgets = [] } = useSelector(s => s.budgets);
  const { loans = [] } = useSelector(s => s.loans);
  const { creditCards = [] } = useSelector(s => s.creditCards);

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchTransactions());
    dispatch(fetchBudgets());
    dispatch(fetchLoans());
    dispatch(fetchCreditCards());
  }, [dispatch]);

  // ── Derived metrics ───────────────────────────────────────────────────────
  const totalBalance = accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const activeBudgets = budgets.filter(b => b.status === 'active').length;

  const activeLoans = loans.filter(l => l.status === 'Active');
  const totalDebt = activeLoans.reduce((s, l) => s + parseFloat(l.remaining_balance || l.remainingBalance || 0), 0);
  const totalEMI = activeLoans.reduce((s, l) => s + parseFloat(l.emi_amount || l.emiAmount || 0), 0);

  const totalCCDebt = creditCards.reduce((s, c) => s + parseFloat(c.current_balance || c.currentBalance || c.outstanding_balance || c.outstandingBalance || 0), 0);
  const totalCCLimit = creditCards.reduce((s, c) => s + parseFloat(c.credit_limit || c.creditLimit || 0), 0);
  const utilisation = totalCCLimit > 0 ? Math.min((totalCCDebt / totalCCLimit) * 100, 100) : 0;

  // ── Month-over-month trends ───────────────────────────────────────────────
  const { prevIncome, prevExpenses } = useMemo(() => {
    const prev = dayjs().subtract(1, 'month');
    const filter = (type) =>
      transactions
        .filter(t => t.type === type
          && dayjs(t.transactionDate || t.date).month() === prev.month()
          && dayjs(t.transactionDate || t.date).year() === prev.year())
        .reduce((s, t) => s + Number(t.amount || 0), 0);
    return { prevIncome: filter('income'), prevExpenses: filter('expense') };
  }, [transactions]);

  const trendPct = (current, prev) =>
    prev > 0 ? ((current - prev) / prev * 100).toFixed(1) : null;

  const incomeTrendPct = trendPct(totalIncome, prevIncome);
  const expenseTrendPct = trendPct(totalExpenses, prevExpenses);

  const incomeTrend = incomeTrendPct !== null ? { value: `${Number(incomeTrendPct) >= 0 ? '+' : ''}${incomeTrendPct}%`, positive: Number(incomeTrendPct) >= 0 } : null;
  const expenseTrend = expenseTrendPct !== null ? { value: `${Number(expenseTrendPct) >= 0 ? '+' : ''}${expenseTrendPct}%`, positive: Number(expenseTrendPct) <= 0 } : null;

  // ── Chart data ────────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => buildMonthlyData(transactions), [transactions]);
  const categoryData = useMemo(() => buildCategoryData(transactions), [transactions]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography
            variant="h4" fontWeight={800} letterSpacing={-0.5}
            sx={{
              background: theme => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #fff 30%, #a78bfa 100%)'
                : 'linear-gradient(135deg, #1e1b4b 30%, #7c3aed 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Dashboard
          </Typography>
          <Typography color="text.secondary" variant="body2" mt={0.25} letterSpacing={0.2}>
            Welcome back! Here's your complete financial overview.
          </Typography>
        </Box>
        <Box
          display="flex" alignItems="center" gap={1}
          px={2} py={1} borderRadius={3}
          sx={{ border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}
        >
          <CalendarToday fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={600}>
            {dayjs().format('ddd, D MMM YYYY')}
          </Typography>
        </Box>
      </Box>

      {/* ── Summary Cards ─────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardSummaryCard
            title="Total Balance"
            value={`₹${totalBalance.toLocaleString('en-IN')}`}
            icon={<AccountBalanceWallet />}
            gradient="linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)"
            glowColor="rgba(14,165,233,0.35)"
            subtitle={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardSummaryCard
            title="Total Income"
            value={`₹${totalIncome.toLocaleString('en-IN')}`}
            icon={<TrendingUp />}
            gradient="linear-gradient(135deg, #10b981 0%, #34d399 100%)"
            glowColor="rgba(16,185,129,0.35)"
            trend={incomeTrend}
            subtitle="vs. last month"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardSummaryCard
            title="Total Expenses"
            value={`₹${totalExpenses.toLocaleString('en-IN')}`}
            icon={<TrendingDown />}
            gradient="linear-gradient(135deg, #ef4444 0%, #f87171 100%)"
            glowColor="rgba(239,68,68,0.35)"
            trend={expenseTrend}
            subtitle="vs. last month"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardSummaryCard
            title="Active Budgets"
            value={activeBudgets}
            icon={<Savings />}
            gradient="linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)"
            glowColor="rgba(139,92,246,0.35)"
            subtitle={`${budgets.length} total budgets`}
          />
        </Grid>
      </Grid>

      {/* ── Charts ────────────────────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <DashboardCashFlowChart data={monthlyData} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <DashboardCategoryChart data={categoryData} />
        </Grid>
      </Grid>

      {/* ── Loans + Credit Cards ──────────────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardLoansWidget
            activeLoans={activeLoans}
            totalDebt={totalDebt}
            totalEMI={totalEMI}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <DashboardCreditCardsWidget
            creditCards={creditCards}
            totalCCDebt={totalCCDebt}
            totalCCLimit={totalCCLimit}
            utilisation={utilisation}
          />
        </Grid>
      </Grid>

      {/* ── Accounts + Recent Transactions ────────────────────────────── */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <DashboardAccountsWidget accounts={accounts} />
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <RecentTransactionsList transactions={transactions} />
        </Grid>
      </Grid>

    </Box>
  );
};

export default DashboardPage;