import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import CreditCardVisual from '../components/creditCards/CreditCardVisual';
import CreditCardEditDialog from '../components/creditCards/CreditCardEditDialog';
import CreditCardTransactionList from '../components/creditCards/CreditCardTransactionList';
import CreditCardPaymentDialog from '../components/creditCards/CreditCardPaymentDialog';
import AddStatementDialog from '../components/creditCards/AddStatementDialog';
import {
  Box, Typography, Grid, Button, IconButton, CircularProgress,
  LinearProgress, Chip, Divider, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, TablePagination, TableContainer, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Snackbar, Alert,
  Tooltip, Stack, Tabs, Tab,
} from '@mui/material';
import {
  ArrowBack, Edit, Delete, CreditCard, AccountBalanceWallet,
  Warning, TrendingUp, CalendarToday, PieChart, Receipt,
  VisibilityOff, Visibility, LocalAtm, Percent, EventNote,
  CheckCircle, Block, Payment, ListAlt, Add
} from '@mui/icons-material';
import {
  fetchCreditCardById, deleteCreditCard, updateCreditCard,
  fetchCardTransactions, clearSelectedCard,
  fetchCardStatements, saveCardStatement
} from '../slices/creditCardsSlice';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (val, show = true) =>
  show
    ? `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '••••••';

const fmtDate = (d) => {
  if (!d) return '—';
  const dateObj = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)
    ? (() => { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day); })()
    : new Date(d);
  return isNaN(dateObj.getTime()) ? '—' : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const utilColor = (u) => (u > 75 ? '#ef4444' : u > 40 ? '#f59e0b' : '#22c55e');

/* ─── Sub-components ──────────────────────────────────────────── */
function StatPill({ label, value, icon, accent = '#6366f1' }) {
  return (
    <Box sx={{
      p: 2, borderRadius: '14px',
      background: `linear-gradient(135deg, ${accent}18 0%, ${accent}08 100%)`,
      border: `1px solid ${accent}28`,
      display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: '10px',
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}aa 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {React.cloneElement(icon, { sx: { color: 'white', fontSize: 18 } })}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.1}>{label}</Typography>
        <Typography variant="subtitle2" fontWeight="700" lineHeight={1.4}>{value}</Typography>
      </Box>
    </Box>
  );
}

function StatusBadge({ status }) {
  const map = {
    active: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', label: 'Active' },
    inactive: { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.3)', label: 'Inactive' },
    frozen: { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', label: 'Frozen' },
    closed: { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)', label: 'Closed' },
  };
  const s = map[(status || '').toLowerCase()] || map['active'];
  return (
    <Box sx={{
      px: 1.5, py: 0.4, borderRadius: '20px',
      border: `1px solid ${s.border}`, background: s.bg,
      display: 'inline-flex', alignItems: 'center', gap: 0.75,
    }}>
      <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: s.color }} />
      <Typography variant="caption" fontWeight={700} sx={{ color: s.color }}>{s.label}</Typography>
    </Box>
  );
}

/* ─── Main Page ───────────────────────────────────────────────── */
const CreditCardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { selectedCard: card, loading, cardTransactions, transactionsTotal, transactionsLoading } =
    useSelector((s) => s.creditCards);
  const user = useSelector((s) => s.auth.user);

  const [showBalances, setShowBalances] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [txPage, setTxPage] = useState(0);
  const [txRowsPerPage, setTxRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { cardStatements, statementsLoading } = useSelector((s) => s.creditCards);

  useEffect(() => {
    if (id) {
      dispatch(fetchCreditCardById(id));
      dispatch(fetchCardTransactions({ id, page: 1, limit: 200 }));
      dispatch(fetchCardStatements(id));
    }
    return () => { dispatch(clearSelectedCard()); };
  }, [id, dispatch]);

  /* ── Loading / Not Found ── */
  if (loading && !card) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh" gap={2}>
        <CircularProgress size={48} thickness={3} />
        <Typography color="text.secondary">Loading card details…</Typography>
      </Box>
    );
  }

  if (!card) {
    return (
      <Box textAlign="center" py={12}>
        <CreditCard sx={{ fontSize: 64, color: 'text.disabled', mb: 2, opacity: 0.3 }} />
        <Typography variant="h6" fontWeight={700} gutterBottom>Card not found</Typography>
        <Typography color="text.secondary" mb={4}>The credit card you're looking for doesn't exist.</Typography>
        <Button variant="contained" onClick={() => navigate('/credit-cards')}
          sx={{ borderRadius: '12px', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
          Back to Credit Cards
        </Button>
      </Box>
    );
  }

  /* ── Computed Values ── */
  const limit = Number(card.creditLimit) || 0;
  const avail = card.availableCredit !== undefined ? Number(card.availableCredit) : Math.max(0, limit - (Number(card.currentBalance) || 0));
  const balance = limit > 0 && card.availableCredit !== undefined ? Math.max(0, limit - avail) : (Number(card.currentBalance) || 0);
  const stmtBal = Number(card.statementBalance) || 0;
  const minDue = Number(card.minimumPayment) || 0;
  const util = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0;
  const cashLim = Number(card.cashAdvanceLimit) || 0;
  const apr = Number(card.apr) || 0;
  const annFee = Number(card.annualFee) || 0;
  const dueDate = card.paymentDueDate;
  const isDueClose = dueDate && (new Date(dueDate) - new Date()) < 7 * 24 * 60 * 60 * 1000;
  const isOverdue = dueDate && new Date(dueDate) < new Date() && minDue > 0;

  /* ── Handlers ── */
  const showSnack = (message, severity = 'success') => setSnackbar({ open: true, message, severity });

  const handleSave = async (form) => {
    const payload = { ...form, user_id: user?.email };
    try {
      const res = await dispatch(updateCreditCard({ id: card.id, creditCardData: payload }));
      if (updateCreditCard.rejected.match(res)) throw new Error(res.payload);
      showSnack('Card updated successfully!');
      setEditOpen(false);
      dispatch(fetchCreditCardById(id));
    } catch (err) {
      showSnack(err.message || 'Failed to update card.', 'error');
    }
  };

  const handleSaveStatement = async (statementData) => {
    try {
      const res = await dispatch(saveCardStatement({ id: card.id, statementData }));
      if (saveCardStatement.rejected.match(res)) throw new Error(res.payload);
      showSnack('Statement saved successfully!');
      dispatch(fetchCreditCardById(id));
      dispatch(fetchCardStatements(id));
    } catch (err) {
      showSnack(err.message || 'Failed to save statement.', 'error');
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await dispatch(deleteCreditCard(card.id));
    if (deleteCreditCard.rejected.match(res)) {
      showSnack(res.payload || 'Failed to delete card.', 'error');
      setDeleting(false);
    } else {
      navigate('/credit-cards');
    }
  };

  /* ── Transaction pagination ── */
  const txSlice = cardTransactions.slice(txPage * txRowsPerPage, txPage * txRowsPerPage + txRowsPerPage);

  return (
    <Box>
      {/* ── Hero Header ─────────────────────────────────────────── */}
      <Box sx={{
        mb: 3, p: 3, borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(79,70,229,0.14) 0%, rgba(124,58,237,0.07) 50%, transparent 100%)',
        border: '1px solid rgba(79,70,229,0.18)',
      }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2}>
          {/* Left */}
          <Box display="flex" alignItems="center" gap={2}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/credit-cards')}
              size="small"
              sx={{ borderRadius: '10px', border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.light' } }}
            >
              Back
            </Button>
            <Box sx={{
              width: 52, height: 52, borderRadius: '14px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 20px rgba(79,70,229,0.4)', flexShrink: 0,
            }}>
              <CreditCard sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight="800" letterSpacing={-0.5}>
                {card.cardName || 'Credit Card'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {card.bankName || card.issuer || 'Bank'} · {(card.cardType || 'card').toUpperCase()}
              </Typography>
            </Box>
          </Box>

          {/* Right */}
          <Box display="flex" alignItems="center" gap={1.5}>
            <StatusBadge status={card.status || 'active'} />
            <Tooltip title={showBalances ? 'Hide balances' : 'Show balances'}>
              <IconButton size="small" onClick={() => setShowBalances(!showBalances)}
                sx={{ border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.main' } }}>
                {showBalances ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<Edit />} onClick={() => setEditOpen(true)}
              sx={{ borderRadius: '10px', fontWeight: 700, borderColor: 'primary.main', color: 'primary.main' }}>
              Edit
            </Button>
            <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => setDeleteOpen(true)}
              sx={{ borderRadius: '10px', fontWeight: 700 }}>
              Delete
            </Button>
          </Box>
        </Box>

        {/* Utilization Progress */}
        <Box sx={{ mt: 3 }}>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="text.secondary">Credit Utilization</Typography>
            <Typography variant="caption" fontWeight={700} sx={{ color: utilColor(util) }}>
              {util.toFixed(1)}% used
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={util}
            sx={{
              height: 8, borderRadius: 4,
              bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                background: `linear-gradient(90deg, ${utilColor(util)}, ${utilColor(util)}aa)`,
              }
            }}
          />
          <Box display="flex" justifyContent="space-between" mt={0.5}>
            <Typography variant="caption" color="text.disabled">
              {fmt(balance, showBalances)} used
            </Typography>
            <Typography variant="caption" color="text.disabled">
              of {fmt(limit, showBalances)} limit
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Payment Due Alert ─────────────────────────────────────── */}
      {dueDate && (isOverdue || isDueClose) && (
        <Box sx={{
          mb: 3, p: 2, borderRadius: '14px',
          background: isOverdue
            ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
            : 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))',
          border: '1px solid',
          borderColor: isOverdue ? 'rgba(239,68,68,0.4)' : 'rgba(234,179,8,0.4)',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Warning sx={{ color: isOverdue ? 'error.main' : 'warning.main', fontSize: 24, flexShrink: 0 }} />
          <Box>
            <Typography variant="subtitle2" fontWeight={800} color={isOverdue ? 'error.main' : 'warning.dark'}>
              {isOverdue ? 'Payment Overdue!' : 'Payment Due Soon'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Due on {fmtDate(dueDate)} · Minimum payment: {fmt(minDue, showBalances)}
            </Typography>
          </Box>
        </Box>
      )}

      {/* ── Stat Pills ───────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatPill label="Credit Limit" value={fmt(limit, showBalances)} icon={<CreditCard />} accent="#6366f1" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatPill label="Available Credit" value={fmt(avail, showBalances)} icon={<AccountBalanceWallet />} accent="#22c55e" />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatPill
            label="Utilization"
            value={`${util.toFixed(1)}%`}
            icon={<PieChart />}
            accent={util > 75 ? '#ef4444' : util > 40 ? '#f59e0b' : '#10b981'}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatPill
            label="Min Payment Due"
            value={minDue > 0 ? fmt(minDue, showBalances) : '—'}
            icon={<TrendingUp />}
            accent={minDue > 0 ? '#f59e0b' : '#64748b'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ── Left Column ────────────────────────────────────────── */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5}>
            {/* Card Visual */}
            <Box>
              <CreditCardVisual
                card={card}
                showBalances={showBalances}
                setShowBalances={setShowBalances}
              />
            </Box>

            {/* Card Details Panel */}
            <Box sx={{
              borderRadius: '16px', border: '1px solid', borderColor: 'divider',
              overflow: 'hidden',
              background: (t) => t.palette.mode === 'dark'
                ? 'linear-gradient(160deg, rgba(30,30,46,1) 0%, rgba(22,22,35,0.95) 100%)'
                : 'background.paper',
            }}>
              <Box sx={{
                p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                borderBottom: '1px solid', borderColor: 'divider',
                bgcolor: 'rgba(79,70,229,0.06)',
              }}>
                <Receipt sx={{ color: '#8b5cf6', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight="700">Card Details</Typography>
              </Box>

              <Box sx={{ p: 2 }}>
                {[
                  { label: 'Statement Balance', value: fmt(stmtBal, showBalances), icon: <EventNote sx={{ fontSize: 15, color: '#f59e0b' }} /> },
                  { label: 'Cash Advance Limit', value: cashLim ? fmt(cashLim, showBalances) : '—', icon: <LocalAtm sx={{ fontSize: 15, color: '#60a5fa' }} /> },
                  { label: 'APR', value: apr ? `${apr}%` : '—', icon: <Percent sx={{ fontSize: 15, color: '#f87171' }} /> },
                  { label: 'Annual Fee', value: annFee ? fmt(annFee, showBalances) : 'None', icon: <Receipt sx={{ fontSize: 15, color: '#94a3b8' }} /> },
                  { label: 'Rewards Program', value: card.rewardsProgram || 'None', icon: <CheckCircle sx={{ fontSize: 15, color: '#22c55e' }} /> },
                  { label: 'Expiry Date', value: fmtDate(card.expiryDate), icon: <CalendarToday sx={{ fontSize: 15, color: '#a78bfa' }} /> },
                  { label: 'Statement Date', value: fmtDate(card.statementDate), icon: <CalendarToday sx={{ fontSize: 15, color: '#6366f1' }} /> },
                  { label: 'Last Payment', value: card.lastPaymentAmount ? fmt(card.lastPaymentAmount, showBalances) : '—', icon: <CreditCard sx={{ fontSize: 15, color: '#34d399' }} /> },
                  { label: 'Last Payment Date', value: fmtDate(card.lastPaymentDate), icon: <CalendarToday sx={{ fontSize: 15, color: '#34d399' }} /> },
                ].map((r, i) => (
                  <Box key={i} sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    py: 1.1, borderBottom: i < 8 ? '1px solid' : 'none', borderColor: 'divider',
                    opacity: r.value === '—' ? 0.5 : 1,
                  }}>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      {r.icon}
                      <Typography variant="body2" color="text.secondary" fontSize="0.8rem">{r.label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="600" fontSize="0.82rem">{r.value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Payment Due Box */}
            {dueDate && (
              <Box sx={{
                p: 2.5, borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(234,179,8,0.04))',
                border: '1px solid rgba(234,179,8,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
              }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Box sx={{ p: 1.2, borderRadius: '10px', bgcolor: 'rgba(234,179,8,0.2)' }}>
                    <CalendarToday sx={{ color: 'warning.main', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="caption" fontWeight={800} color="warning.dark" display="block" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Payment Due
                    </Typography>
                    <Typography variant="body2" fontWeight="700" color="warning.dark">
                      {fmtDate(dueDate)}
                    </Typography>
                    {minDue > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Min: {fmt(minDue, showBalances)}
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Button variant="contained" color="warning" size="small" sx={{ borderRadius: '8px', fontWeight: 600, color: 'warning.dark', bgcolor: 'rgba(234,179,8,0.2)', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(234,179,8,0.3)', boxShadow: 'none' }, whiteSpace: 'nowrap' }} onClick={() => setPaymentOpen(true)}>
                  Pay Now
                </Button>
              </Box>
            )}
          </Stack>
        </Grid>

        {/* ── Right Column ────────────────────────────────────────── */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Box sx={{ mb: 2 }}>
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab icon={<ListAlt fontSize="small" />} iconPosition="start" label="Transactions" sx={{ fontWeight: 700 }} />
              <Tab icon={<Receipt fontSize="small" />} iconPosition="start" label="Statements" sx={{ fontWeight: 700 }} />
            </Tabs>
          </Box>

          {activeTab === 0 ? (
            <CreditCardTransactionList creditCard={card} />
          ) : (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight={700}>Statement History</Typography>
                <Button variant="contained" startIcon={<Add />} size="small"
                  onClick={() => setStatementOpen(true)}
                  sx={{ borderRadius: '8px', background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' }}>
                  Add Statement
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '16px', overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Statement Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Period</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Amount Due</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Min Due</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {statementsLoading ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                    ) : cardStatements.length === 0 ? (
                      <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No statements found</Typography></TableCell></TableRow>
                    ) : (
                      cardStatements.map((s) => (
                        <TableRow key={s.id} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{fmtDate(s.statementDate)}</TableCell>
                          <TableCell variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                            {s.statementPeriodStart ? fmtDate(s.statementPeriodStart) : '—'} to {s.statementPeriodEnd ? fmtDate(s.statementPeriodEnd) : '—'}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(s.totalAmountDue)}</TableCell>
                          <TableCell align="right" color="text.secondary">{fmt(s.minimumAmountDue)}</TableCell>
                          <TableCell>{fmtDate(s.paymentDueDate)}</TableCell>
                          <TableCell>
                            <Chip label={s.isPaid ? 'Paid' : 'Unpaid'} size="small" color={s.isPaid ? 'success' : 'warning'} variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '0.65rem' }} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* ── Statement Dialog ─────────────────────────────────────────── */}
      <AddStatementDialog
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        onSave={handleSaveStatement}
      />

      {/* ── Payment Dialog ─────────────────────────────────────────── */}
      <CreditCardPaymentDialog
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        creditCard={card}
        onPaymentComplete={() => {
          showSnack('Payment processed successfully');
          dispatch(fetchCreditCardById(id));
          dispatch(fetchCardTransactions({ id, page: txPage + 1, limit: txRowsPerPage }));
        }}
      />

      {/* ── Edit Dialog ────────────────────────────────────────────── */}
      <CreditCardEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        card={card}
        onSave={handleSave}
      />

      {/* ── Delete Confirm ─────────────────────────────────────────── */}
      <Dialog
        open={deleteOpen}
        onClose={() => !deleting && setDeleteOpen(false)}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Delete Card?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{card.cardName || 'this card'}</strong>? This also removes all associated
            transactions and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} color="inherit" disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDelete}
            variant="contained" color="error"
            disabled={deleting}
            sx={{ borderRadius: '10px', fontWeight: 700 }}
          >
            {deleting ? 'Deleting…' : 'Yes, Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ───────────────────────────────────────────────── */}
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

export default CreditCardDetailPage;