import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCreditCardById, deleteCreditCard, updateCreditCard,
  fetchCardTransactions, clearSelectedCard,
} from '../slices/creditCardsSlice';
import CreditCardVisual from '../components/creditCards/CreditCardVisual';
import CreditCardEditDialog from '../components/creditCards/CreditCardEditDialog';
import {
  Box, Typography, Grid, Button, IconButton, CircularProgress,
  LinearProgress, Chip, Divider, Paper, Table, TableHead, TableBody,
  TableRow, TableCell, TablePagination, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, Snackbar, Alert,
  Tooltip, Stack,
} from '@mui/material';
import {
  ArrowBack, Edit, Delete, CreditCard, AccountBalanceWallet,
  Warning, TrendingUp, CalendarToday, PieChart, Receipt,
  VisibilityOff, Visibility, LocalAtm, Percent, EventNote,
  CheckCircle, Block,
} from '@mui/icons-material';

/* ─── Helpers ─────────────────────────────────────────────────── */
const fmt = (val, show = true) =>
  show
    ? `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '••••••';

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

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
  const [deleting, setDeleting] = useState(false);
  const [txPage, setTxPage] = useState(0);
  const [txRowsPerPage, setTxRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (id) {
      dispatch(fetchCreditCardById(id));
      dispatch(fetchCardTransactions({ id, page: 1, limit: 200 }));
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
  const balance = Number(card.currentBalance) || 0;
  const stmtBal = Number(card.statementBalance) || 0;
  const avail = Number(card.availableCredit) || Math.max(0, limit - balance);
  const minDue = Number(card.minimumPayment) || 0;
  const util = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0;
  const cashLim = Number(card.cashAdvanceLimit) || 0;
  const apr = Number(card.apr) || 0;
  const annFee = Number(card.annualFee) || 0;
  const dueDate = card.paymentDueDate;
  const isDueClose = dueDate && (new Date(dueDate) - new Date()) < 7 * 24 * 60 * 60 * 1000;
  const isOverdue = dueDate && new Date(dueDate) < new Date();

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
                display: 'flex', alignItems: 'center', gap: 2,
              }}>
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
            )}
          </Stack>
        </Grid>

        {/* ── Right Column ────────────────────────────────────────── */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {/* Transactions Table */}
          <Box sx={{
            borderRadius: '16px', border: '1px solid', borderColor: 'divider',
            overflow: 'hidden',
            background: (t) => t.palette.mode === 'dark'
              ? 'linear-gradient(160deg, rgba(30,30,46,1) 0%, rgba(22,22,35,0.95) 100%)'
              : 'background.paper',
          }}>
            {/* Table Header */}
            <Box sx={{
              p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderBottom: '1px solid', borderColor: 'divider',
              bgcolor: 'rgba(79,70,229,0.06)',
            }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Receipt sx={{ color: '#8b5cf6', fontSize: 20 }} />
                <Typography variant="subtitle1" fontWeight="700">Transactions</Typography>
                {cardTransactions.length > 0 && (
                  <Box sx={{ px: 1, py: 0.2, borderRadius: '12px', bgcolor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                    <Typography variant="caption" fontWeight={700} color="primary.light">
                      {transactionsTotal || cardTransactions.length} total
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            {/* Table Body */}
            {transactionsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={6}>
                <CircularProgress size={32} />
              </Box>
            ) : cardTransactions.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Receipt sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.4, mb: 1.5 }} />
                <Typography variant="body2" color="text.secondary" mb={1}>
                  No transactions recorded yet.
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Transactions will appear here once you import a PDF statement.
                </Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ overflowX: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['Date', 'Description', 'Merchant', 'Category', 'Amount'].map((h, i) => (
                          <TableCell key={h} align={i === 4 ? 'right' : 'left'} sx={{
                            bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(20,20,32,0.6)' : 'rgba(247,248,250,0.8)',
                            fontWeight: 700, fontSize: '0.73rem',
                            color: 'text.secondary', py: 1, px: 2,
                            borderBottom: '1px solid', borderColor: 'divider',
                            whiteSpace: 'nowrap',
                          }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {txSlice.map((tx, i) => {
                        const amount = Number(tx.amount) || 0;
                        const isDebit = tx.transactionType === 'purchase' || tx.transactionType === 'fee' || amount < 0 || (tx.transactionType !== 'credit' && tx.transactionType !== 'payment');
                        return (
                          <TableRow key={i} sx={{
                            '&:hover': { bgcolor: 'action.hover' },
                            '& td': { borderBottom: '1px solid', borderColor: 'divider', px: 2, py: 1.1 }
                          }}>
                            <TableCell>
                              <Typography variant="body2" fontSize="0.8rem" color="text.secondary" whiteSpace="nowrap">
                                {fmtDate(tx.transactionDate || tx.date)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontSize="0.82rem" fontWeight={500}>
                                {tx.description || tx.details || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontSize="0.8rem" color="text.secondary">
                                {tx.merchant || tx.name || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {tx.category ? (
                                <Box sx={{
                                  display: 'inline-flex', px: 1, py: 0.2,
                                  borderRadius: '10px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                }}>
                                  <Typography variant="caption" fontWeight={600} color="primary.light">
                                    {tx.category}
                                  </Typography>
                                </Box>
                              ) : (
                                <Typography variant="body2" color="text.disabled">—</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              <Typography
                                variant="body2" fontSize="0.84rem" fontWeight={700}
                                sx={{ color: isDebit ? '#f87171' : '#34d399' }}
                              >
                                {isDebit ? '-' : '+'}{fmt(Math.abs(amount), showBalances)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>

                <TablePagination
                  component="div"
                  count={cardTransactions.length}
                  page={txPage}
                  rowsPerPage={txRowsPerPage}
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  onPageChange={(_, p) => setTxPage(p)}
                  onRowsPerPageChange={(e) => { setTxRowsPerPage(parseInt(e.target.value, 10)); setTxPage(0); }}
                  sx={{
                    borderTop: '1px solid', borderColor: 'divider', color: 'text.secondary',
                    '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': { fontSize: '0.78rem' },
                    '.MuiTablePagination-select': { fontSize: '0.78rem' },
                    '.MuiIconButton-root': { borderRadius: '8px', '&:hover': { bgcolor: 'rgba(99,102,241,0.1)' } },
                  }}
                />
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

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