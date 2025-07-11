import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts } from '../slices/accountsSlice';
import { fetchTransactions } from '../slices/transactionsSlice';
import { fetchBudgets, updateBudget } from '../slices/budgetsSlice';
import { fetchSpendingSummary, fetchCategoryBreakdown } from '../slices/reportsSlice';
import { Box, Typography, Grid, Paper, CircularProgress, useTheme, Card, CardContent, Avatar, IconButton } from '@mui/material';
import { FaCalendarAlt, FaWallet, FaPiggyBank, FaChartPie } from 'react-icons/fa';
import { MdOutlineSavings } from 'react-icons/md';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Edit as EditIcon, Save as SaveIcon, Close as CloseIcon } from '@mui/icons-material';
import log from 'loglevel';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const { items: accounts } = useSelector((state) => state.accounts);
  const { items: transactions } = useSelector((state) => state.transactions);
  const { items: budgets } = useSelector((state) => state.budgets);
  const { spendingSummary, categoryBreakdown, loading } = useSelector((state) => state.reports);
  const theme = useTheme();
  const [editingField, setEditingField] = useState(null);
  const [fieldDraft, setFieldDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchTransactions());
    dispatch(fetchBudgets());
    dispatch(fetchSpendingSummary());
    dispatch(fetchCategoryBreakdown());
  }, [dispatch]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress size={48} /></Box>;

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalSpending = spendingSummary.length > 0 ? spendingSummary[0].expense : 0;
  const totalIncome = spendingSummary.length > 0 ? spendingSummary[0].income : 0;
  const budget = budgets.length > 0 ? budgets[0].total_amount : 0;
  const budgetSpent = budgets.length > 0 ? budgets[0].spent_amount : 0;

  const summaryCards = [
    {
      label: 'Current Month',
      value: currentMonth,
      icon: <FaCalendarAlt size={28} color={theme.palette.primary.main} />,
      color: 'primary.main',
    },
    {
      label: 'Total Spending',
      value: `₹${totalSpending}`,
      icon: <FaWallet size={28} color={theme.palette.error.main} />,
      color: 'error.main',
    },
    {
      label: 'Total Income',
      value: `₹${totalIncome}`,
      icon: <MdOutlineSavings size={32} color={theme.palette.success.main} />,
      color: 'success.main',
    },
    {
      label: 'Budget',
      value: `₹${budget}`,
      icon: <FaPiggyBank size={28} color={theme.palette.info.main} />,
      color: 'info.main',
      extra: <Typography variant="body2">Spent: ₹{budgetSpent}</Typography>,
    },
  ];

  const handleFieldEdit = (field, value) => {
    setEditingField(field);
    setFieldDraft(value);
  };

  const handleFieldSave = async (field) => {
    setSaving(true);
    if (field === 'budget' && budgets.length > 0) {
      await dispatch(updateBudget({ id: budgets[0].id, budget: { ...budgets[0], total_amount: Number(fieldDraft) } }));
    }
    setEditingField(null);
    setFieldDraft('');
    setSaving(false);
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setFieldDraft('');
  };

  return (
    <Box sx={{
      background: 'linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%)',
      minHeight: '100vh',
      p: { xs: 1, sm: 2, md: 4 }
    }}>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Dashboard</Typography>
      <Grid container spacing={3}>
        {summaryCards.map((card, idx) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Card
              sx={{
                borderRadius: 3,
                boxShadow: 4,
                p: 0,
                background: theme.palette.background.paper,
                transition: 'transform 0.2s, box-shadow 0.2s, background 0.5s',
                '&:hover': {
                  boxShadow: 8,
                  transform: 'scale(1.04)',
                  background: 'linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%)',
                },
              }}
            >
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                <Avatar sx={{ bgcolor: card.color, width: 48, height: 48, mb: 1, boxShadow: 2 }}>
                  {card.icon}
                </Avatar>
                <Typography variant="subtitle2" color="text.secondary" mb={0.5}>{card.label}</Typography>
                {/* Inline edit for Budget value as an example */}
                {card.label === 'Budget' ? (
                  editingField === 'budget' ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <input
                        type="number"
                        value={fieldDraft}
                        onChange={e => setFieldDraft(e.target.value)}
                        style={{ fontWeight: 600, fontSize: 20, width: 90, borderRadius: 6, border: '1px solid #ccc', padding: 4 }}
                      />
                      <IconButton size="small" color="primary" onClick={() => handleFieldSave('budget')} disabled={saving}><SaveIcon /></IconButton>
                      <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="h6" fontWeight={600} mb={card.extra ? 0 : 1} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('budget', budget)}>{card.value}</Typography>
                      <IconButton size="small" onClick={() => handleFieldEdit('budget', budget)}><EditIcon fontSize="small" /></IconButton>
                    </Box>
                  )
                ) : (
                  <Typography variant="h6" fontWeight={600} mb={card.extra ? 0 : 1}>{card.value}</Typography>
                )}
                {card.extra}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {/* Charts Section */}
      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: 340 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Spending Over Time</Typography>
            {spendingSummary.length === 0 ? (
              <Box sx={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                No spending data available.
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={spendingSummary} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="expense" fill={theme.palette.error.main} name="Spending" />
                  <Bar dataKey="income" fill={theme.palette.success.main} name="Income" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, height: 340, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2}>Category Breakdown</Typography>
            {categoryBreakdown.length === 0 ? (
              <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'text.secondary' }}>
                No category data available.
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    fill={theme.palette.primary.main}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryBreakdown.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={theme.palette.secondary.main} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
      {/* Category Breakdown Cards */}
      <Box mt={5}>
        <Typography variant="h6" fontWeight={600} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FaChartPie color={theme.palette.primary.main} /> Category Breakdown
        </Typography>
        <Grid container spacing={2}>
          {categoryBreakdown.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, textAlign: 'center', color: 'text.secondary' }}>
                No category breakdown data available.
              </Paper>
            </Grid>
          ) : (
            categoryBreakdown.map((cat) => (
              <Grid item xs={12} sm={6} md={4} key={cat.category}>
                <Paper sx={{
                  p: 2,
                  borderRadius: 2,
                  boxShadow: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: theme.palette.background.paper,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    boxShadow: 6,
                    transform: 'scale(1.03)',
                    background: 'linear-gradient(135deg, #e3f0ff 0%, #f8fbff 100%)',
                  },
                }}>
                  <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 36, height: 36, fontSize: 18, fontWeight: 700 }}>
                    {cat.category[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={500}>{cat.category}</Typography>
                    <Typography variant="body2" color="text.secondary">₹{cat.total}</Typography>
                  </Box>
                </Paper>
              </Grid>
            ))
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;