import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    Box, Typography, Paper, Chip, IconButton, Button,
    Divider, Grid, CircularProgress, LinearProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Alert, Avatar, Tooltip,
} from '@mui/material';
import {
    ArrowBack, Edit, AccountBalance, CreditCard, Savings, BusinessCenter,
    TrendingUp, TrendingDown, SwapHoriz, Star, AccountBalanceWallet,
} from '@mui/icons-material';
import { fetchAccountById } from '../slices/accountsSlice';
import { transactionsAPI } from '../api';
import EditAccountDialog from '../components/accounts/EditAccountDialog';

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (val) =>
    `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const CATEGORY_GRADIENT = {
    liability: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    equity: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    asset: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
};

const TX_COLORS = { income: 'success', expense: 'error', transfer: 'info' };
const TX_ICONS = {
    income: <TrendingUp fontSize="small" />,
    expense: <TrendingDown fontSize="small" />,
    transfer: <SwapHoriz fontSize="small" />,
};

const getAccountIcon = (typeName = '') => {
    const t = typeName.toLowerCase();
    if (t.includes('credit')) return <CreditCard />;
    if (t.includes('invest') || t.includes('saving')) return <Savings />;
    if (t.includes('business')) return <BusinessCenter />;
    return <AccountBalance />;
};

/* ─── Stat Card ────────────────────────────────────────────────────────── */
const StatBox = ({ label, value, accent }) => (
    <Box>
        <Typography
            variant="caption"
            fontWeight={600}
            letterSpacing={0.8}
            color="text.secondary"
            sx={{ textTransform: 'uppercase', fontSize: '0.68rem', opacity: 0.75 }}
        >
            {label}
        </Typography>
        <Typography
            variant="h4"
            fontWeight={800}
            letterSpacing={-0.5}
            sx={{
                mt: 0.25,
                background: accent,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
            }}
        >
            {value}
        </Typography>
    </Box>
);

/* ─── Info Row ─────────────────────────────────────────────────────────── */
const InfoRow = ({ label, value }) => (
    <Box>
        <Typography
            variant="caption"
            fontWeight={600}
            letterSpacing={0.8}
            sx={{ color: 'text.disabled', textTransform: 'uppercase', fontSize: '0.66rem' }}
        >
            {label}
        </Typography>
        <Typography variant="body1" fontWeight={600} sx={{ mt: 0.25 }}>
            {value}
        </Typography>
        <Divider sx={{ mt: 1.5 }} />
    </Box>
);

/* ─── Main Component ───────────────────────────────────────────────────── */
const AccountDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentAccount: account, loading } = useSelector((state) => state.accounts);

    const [transactions, setTransactions] = useState([]);
    const [txLoading, setTxLoading] = useState(true);
    const [txError, setTxError] = useState('');
    const [editOpen, setEditOpen] = useState(false);

    useEffect(() => { dispatch(fetchAccountById(id)); }, [dispatch, id]);

    useEffect(() => {
        const fetchTx = async () => {
            setTxLoading(true);
            setTxError('');
            try {
                const res = await transactionsAPI.getAll({ accountId: id, limit: 20 });
                setTransactions(res.data.transactions || res.data || []);
            } catch {
                setTxError('Failed to load transactions.');
            } finally {
                setTxLoading(false);
            }
        };
        if (id) fetchTx();
    }, [id]);

    if (loading && !account) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!account) {
        return (
            <Box p={4} textAlign="center">
                <Typography variant="h6" color="text.secondary">Account not found.</Typography>
                <Button onClick={() => navigate('/accounts')} sx={{ mt: 2 }}>← Back</Button>
            </Box>
        );
    }

    const typeName = account.account_type_name || account.accountTypeName || '';
    const category = account.account_type_category || account.accountTypeCategory || 'asset';
    const institution = account.institution_name || account.institutionName || '';
    const maskedNumber = account.account_number_masked || account.accountNumberMasked || '';
    const status = account.account_status || account.accountStatus || '';
    const isPrimary = account.is_primary || account.isPrimary;
    const creditLimit = Number(account.credit_limit || account.creditLimit || 0);
    const balance = Number(account.balance || 0);
    const availBalance = Number(account.available_balance || account.availableBalance || 0);
    const minBalance = Number(account.minimum_balance || account.minimumBalance || 0);
    const gradient = CATEGORY_GRADIENT[category] || CATEGORY_GRADIENT.asset;
    const utilisation = creditLimit > 0 ? Math.min(((creditLimit - availBalance) / creditLimit) * 100, 100) : 0;
    const utilisationColor = utilisation > 75 ? 'error' : utilisation > 40 ? 'warning' : 'success';

    return (
        <Box>
            {/* ── Back bar ── */}
            <Box display="flex" alignItems="center" gap={1} mb={3}>
                <IconButton
                    onClick={() => navigate('/accounts')}
                    size="small"
                    sx={{
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' },
                    }}
                >
                    <ArrowBack fontSize="small" />
                </IconButton>
                <Typography variant="body2" color="text.secondary" fontWeight={600}>
                    Accounts / <span style={{ color: 'inherit', opacity: 0.6 }}>{account.account_name || account.accountName}</span>
                </Typography>
            </Box>

            {/* ── Hero Card ── */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '24px',
                    p: { xs: 3, md: 4 },
                    mb: 3,
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
                            : 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #ede9fe 100%)',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background glow blob */}
                <Box sx={{
                    position: 'absolute', top: -60, right: -60,
                    width: 220, height: 220, borderRadius: '50%',
                    background: gradient, filter: 'blur(80px)', opacity: 0.2, pointerEvents: 'none',
                }} />

                {/* Header row */}
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" flexWrap="wrap" gap={2} mb={4}>
                    <Box display="flex" alignItems="center" gap={2.5}>
                        <Box sx={{
                            width: 72, height: 72, borderRadius: '20px',
                            background: gradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                            '& svg': { fontSize: 32, color: 'white' },
                        }}>
                            {getAccountIcon(typeName)}
                        </Box>
                        <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>
                                    {account.account_name || account.accountName}
                                </Typography>
                                {isPrimary && (
                                    <Tooltip title="Primary Account">
                                        <Star sx={{ color: 'warning.main', fontSize: 18 }} />
                                    </Tooltip>
                                )}
                            </Box>
                            <Typography variant="body2" color="text.secondary" mb={1}>
                                {institution || 'No institution'}{maskedNumber ? ` · ${maskedNumber}` : ''}
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap">
                                <Chip
                                    label={status}
                                    size="small"
                                    color={status === 'active' ? 'success' : 'default'}
                                    sx={{ height: 22, fontWeight: 600, fontSize: '0.7rem' }}
                                />
                                {typeName && (
                                    <Chip
                                        label={typeName}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 22, fontWeight: 500, fontSize: '0.7rem' }}
                                    />
                                )}
                                {account.currency && (
                                    <Chip
                                        label={account.currency}
                                        size="small"
                                        variant="outlined"
                                        sx={{ height: 22, fontWeight: 600, fontSize: '0.7rem' }}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<Edit fontSize="small" />}
                        onClick={() => setEditOpen(true)}
                        sx={{ borderRadius: '10px', fontWeight: 700, px: 2.5, height: 40 }}
                    >
                        Edit
                    </Button>
                </Box>

                {/* Balance stats */}
                <Grid container spacing={4}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <StatBox label="Current Balance" value={fmt(balance)} accent={gradient} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <StatBox label="Available Balance" value={fmt(availBalance)} accent="linear-gradient(135deg,#10b981,#34d399)" />
                    </Grid>
                    {creditLimit > 0 && (
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <StatBox label="Credit Limit" value={fmt(creditLimit)} accent="linear-gradient(135deg,#f59e0b,#fbbf24)" />
                        </Grid>
                    )}
                </Grid>

                {/* Utilisation bar */}
                {creditLimit > 0 && (
                    <Box mt={3.5}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary">
                                Credit Utilisation
                            </Typography>
                            <Typography variant="caption" fontWeight={800} color={`${utilisationColor}.main`}>
                                {utilisation.toFixed(1)}%
                            </Typography>
                        </Box>
                        <LinearProgress
                            variant="determinate"
                            value={utilisation}
                            color={utilisationColor}
                            sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover' }}
                        />
                    </Box>
                )}
            </Paper>

            {/* ── Account Info ── */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '20px',
                    p: 3,
                    mb: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))'
                            : 'linear-gradient(145deg,#ffffff,#f8fafc)',
                }}
            >
                <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                    <Box sx={{ width: 4, height: 20, borderRadius: 2, background: gradient }} />
                    <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>Account Information</Typography>
                </Box>

                <Grid container spacing={3}>
                    {[
                        { label: 'Account Type', value: typeName || '—' },
                        { label: 'Institution', value: institution || '—' },
                        { label: 'Account Number', value: maskedNumber || '—' },
                        { label: 'Currency', value: account.currency || 'INR' },
                        { label: 'Minimum Balance', value: minBalance > 0 ? fmt(minBalance) : '—' },
                        { label: 'Opened On', value: fmtDate(account.created_at || account.createdAt) },
                    ].map(({ label, value }) => (
                        <Grid key={label} size={{ xs: 12, sm: 6, md: 4 }}>
                            <InfoRow label={label} value={value} />
                        </Grid>
                    ))}
                    {account.notes && (
                        <Grid size={12}>
                            <Typography variant="caption" fontWeight={600} letterSpacing={0.8}
                                sx={{ color: 'text.disabled', textTransform: 'uppercase', fontSize: '0.66rem' }}>
                                Notes
                            </Typography>
                            <Typography variant="body1" fontWeight={500} mt={0.5}>{account.notes}</Typography>
                        </Grid>
                    )}
                </Grid>
            </Paper>

            {/* ── Recent Transactions ── */}
            <Paper
                elevation={0}
                sx={{
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))'
                            : 'linear-gradient(145deg,#ffffff,#f8fafc)',
                }}
            >
                <Box
                    px={3} py={2.5}
                    display="flex" alignItems="center" justifyContent="space-between"
                    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ width: 4, height: 20, borderRadius: 2, background: gradient }} />
                        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>Recent Transactions</Typography>
                    </Box>
                    <Button
                        size="small"
                        onClick={() => navigate(`/transactions`)}
                        sx={{ fontWeight: 600, fontSize: '0.8rem', color: 'primary.main' }}
                    >
                        View All →
                    </Button>
                </Box>

                {txLoading ? (
                    <Box p={5} display="flex" justifyContent="center"><CircularProgress size={32} /></Box>
                ) : txError ? (
                    <Box p={3}><Alert severity="error" sx={{ borderRadius: 2 }}>{txError}</Alert></Box>
                ) : transactions.length === 0 ? (
                    <Box p={6} textAlign="center">
                        <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'action.hover' }}>
                            <AccountBalanceWallet sx={{ color: 'text.disabled', fontSize: 32 }} />
                        </Avatar>
                        <Typography variant="body1" color="text.secondary" fontWeight={600}>No transactions found</Typography>
                        <Typography variant="body2" color="text.disabled">Transactions for this account will appear here.</Typography>
                    </Box>
                ) : (
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.72rem', letterSpacing: 0.8, textTransform: 'uppercase', color: 'text.disabled', py: 1.5 } }}>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Description</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Type</TableCell>
                                    <TableCell align="right">Amount</TableCell>
                                    <TableCell>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow
                                        key={tx.id}
                                        sx={{ '&:hover': { bgcolor: 'action.hover' }, '& td': { py: 1.5, borderColor: 'divider' } }}
                                    >
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary" fontWeight={500} noWrap>
                                                {fmtDate(tx.transactionDate || tx.transaction_date)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight={600}>
                                                {tx.description || tx.merchant || '—'}
                                            </Typography>
                                            {tx.merchant && tx.description && (
                                                <Typography variant="caption" color="text.secondary">{tx.merchant}</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" color="text.secondary">
                                                {tx.categoryName || tx.category_name || '—'}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={TX_ICONS[tx.type]}
                                                label={tx.type}
                                                size="small"
                                                color={TX_COLORS[tx.type] || 'default'}
                                                variant="outlined"
                                                sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                variant="body2"
                                                fontWeight={800}
                                                sx={{
                                                    color: tx.type === 'income'
                                                        ? 'success.main'
                                                        : tx.type === 'expense'
                                                            ? 'error.main'
                                                            : 'text.primary',
                                                }}
                                            >
                                                {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}
                                                {fmt(Math.abs(tx.amount))}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={tx.status}
                                                size="small"
                                                color={
                                                    tx.status === 'completed' ? 'success'
                                                        : tx.status === 'pending' ? 'warning'
                                                            : 'default'
                                                }
                                                sx={{ fontSize: '0.68rem', height: 22, fontWeight: 600 }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>

            <EditAccountDialog
                open={editOpen}
                account={account}
                onClose={() => setEditOpen(false)}
                onSuccess={() => dispatch(fetchAccountById(id))}
            />
        </Box>
    );
};

export default AccountDetailPage;
