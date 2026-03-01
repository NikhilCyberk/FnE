import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchLoan, updateLoan } from '../slices/loansSlice';
import {
    Box, Typography, CircularProgress, Chip,
    Table, TableHead, TableRow, TableCell, TableBody, TablePagination, Button,
    Grid, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, IconButton, Snackbar, Alert, InputAdornment,
    Tooltip, LinearProgress
} from '@mui/material';
import {
    ArrowBack as BackIcon,
    AccountBalance as BankIcon,
    CalendarToday as CalendarIcon,
    Add as AddIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    TrendingDown as TrendingIcon,
    Percent as RateIcon,
    Receipt as StatementIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

// Particulars that INCREASE the outstanding balance (credit type)
const CHARGE_PARTICULARS = new Set([
    'Late Payment Charges', 'NACH Bounce Charges', 'Processing Fee',
    'Other Charge', 'Penal Charges',
]);
const PAYMENT_PARTICULARS = new Set([
    'EMI Payment Received', 'Principal Payment', 'Part Payment', 'Prepayment',
]);
const PARTICULARS_OPTIONS = [
    'EMI Payment Received', 'Principal Payment', 'Part Payment', 'Prepayment',
    'Late Payment Charges', 'NACH Bounce Charges', 'Processing Fee',
    'Other Charge', 'Penal Charges', 'Adjustment',
];

const safeJson = (val) => {
    try { return typeof val === 'string' ? JSON.parse(val) : (val || []); }
    catch { return []; }
};

const BLANK_FORM = {
    date: dayjs().format('YYYY-MM-DD'),
    particulars: 'EMI Payment Received',
    type: 'debit',
    amount: '',
};

// --- Sub-components ---

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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
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

function ScheduleStatusBadge({ status }) {
    const map = {
        Paid: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', border: 'rgba(34,197,94,0.25)' },
        Unpaid: { bg: 'rgba(251,191,36,0.12)', color: '#f59e0b', border: 'rgba(251,191,36,0.25)' },
        'Partially Paid': { bg: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: 'rgba(59,130,246,0.25)' },
    };
    const s = map[status] || map['Unpaid'];
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5,
            px: 1.25, py: 0.3, borderRadius: '20px',
            background: s.bg, border: `1px solid ${s.border}`,
        }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: s.color }} />
            <Typography variant="caption" fontWeight={700} sx={{ color: s.color, fontSize: '0.68rem' }}>
                {status}
            </Typography>
        </Box>
    );
}

// --- Main Page ---

const LoanDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { selectedLoan: loan, status } = useSelector(state => state.loans);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editIndex, setEditIndex] = useState(null);
    const [entryForm, setEntryForm] = useState(BLANK_FORM);
    const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [saving, setSaving] = useState(false);

    // Statement of Account pagination
    const [stmtPage, setStmtPage] = useState(0);
    const [stmtRowsPerPage, setStmtRowsPerPage] = useState(10);

    useEffect(() => { dispatch(fetchLoan(id)); }, [id, dispatch]);

    if (status === 'loading' || !loan) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 12, gap: 2 }}>
                <CircularProgress size={48} thickness={3} />
                <Typography color="text.secondary">Loading loan details…</Typography>
            </Box>
        );
    }

    const schedule = safeJson(loan.loan_schedule);
    const rawTransactions = safeJson(loan.transactions);
    const transactions = [...rawTransactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    const penaltyHistory = safeJson(loan.penalty_history);

    const loanAmount = parseFloat(loan.loan_amount);
    const remaining = parseFloat(loan.remaining_balance);
    const paidAmount = Math.max(loanAmount - remaining, 0);
    const progress = Math.min((paidAmount / loanAmount) * 100, 100);
    const penaltyTotal = parseFloat(loan.penalty_amount || 0);
    const paidSchedule = schedule.filter(s => s.status === 'Paid').length;

    const handleOpenAdd = () => { setEditIndex(null); setEntryForm(BLANK_FORM); setDialogOpen(true); };
    const handleOpenEdit = (tx, idx) => {
        setEditIndex(idx);
        setEntryForm({ date: tx.date, particulars: tx.particulars, type: tx.debit > 0 ? 'debit' : 'credit', amount: String(tx.debit > 0 ? tx.debit : tx.credit) });
        setDialogOpen(true);
    };
    const handleCloseDialog = () => setDialogOpen(false);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setEntryForm(prev => {
            const updated = { ...prev, [name]: value };
            if (name === 'particulars') {
                if (CHARGE_PARTICULARS.has(value)) updated.type = 'credit';
                else if (PAYMENT_PARTICULARS.has(value)) updated.type = 'debit';
            }
            return updated;
        });
    };

    const commonData = {
        lender_name: loan.lender_name, loan_type: loan.loan_type, loan_amount: loan.loan_amount,
        interest_rate: loan.interest_rate, start_date: loan.start_date, end_date: loan.end_date,
        emi_amount: loan.emi_amount, penalty_amount: loan.penalty_amount,
        status: loan.status, next_emi_due_date: loan.next_emi_due_date,
    };

    const handleSaveEntry = async () => {
        if (!entryForm.amount || parseFloat(entryForm.amount) <= 0) return;
        setSaving(true);
        const isEdit = editIndex !== null;
        try {
            await dispatch(updateLoan({ id: loan.id, data: { ...commonData, _action: isEdit ? 'edit_entry' : 'manual_entry', _entry: { ...entryForm, amount: parseFloat(entryForm.amount) }, ...(isEdit && { _entry_index: editIndex }) } })).unwrap();
            setToast({ open: true, message: isEdit ? 'Entry updated' : 'Entry added successfully', severity: 'success' });
            handleCloseDialog();
            dispatch(fetchLoan(id));
        } catch { setToast({ open: true, message: 'Failed to save entry', severity: 'error' }); }
        finally { setSaving(false); }
    };

    const handleDeleteEntry = async (idx) => {
        setSaving(true);
        try {
            await dispatch(updateLoan({ id: loan.id, data: { ...commonData, _action: 'delete_entry', _entry_index: idx } })).unwrap();
            setToast({ open: true, message: 'Entry deleted and balances recalculated', severity: 'success' });
            setDeleteConfirmIndex(null);
            dispatch(fetchLoan(id));
        } catch { setToast({ open: true, message: 'Failed to delete entry', severity: 'error' }); }
        finally { setSaving(false); }
    };

    return (
        <Box>
            {/* ── Hero Header ─────────────────────────────────────────── */}
            <Box sx={{
                mb: 3, p: 3, borderRadius: '20px',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 50%, transparent 100%)',
                border: '1px solid rgba(99,102,241,0.2)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap' }}>
                    <Button
                        startIcon={<BackIcon />}
                        onClick={() => navigate('/loans')}
                        size="small"
                        sx={{ borderRadius: '10px', border: '1px solid', borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.light' } }}
                    >
                        Back
                    </Button>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{
                            width: 52, height: 52, borderRadius: '14px',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 6px 20px rgba(99,102,241,0.4)', flexShrink: 0,
                        }}>
                            <BankIcon sx={{ color: 'white', fontSize: 26 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="800" letterSpacing={-0.5}>{loan.lender_name}</Typography>
                            <Typography variant="body2" color="text.secondary">{loan.loan_type} Loan</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{
                            px: 1.5, py: 0.4, borderRadius: '20px',
                            border: `1px solid ${loan.status === 'Active' ? 'rgba(34,197,94,0.3)' : 'rgba(148,163,184,0.3)'}`,
                            background: loan.status === 'Active' ? 'rgba(34,197,94,0.1)' : 'rgba(148,163,184,0.1)',
                            display: 'flex', alignItems: 'center', gap: 0.75,
                        }}>
                            <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: loan.status === 'Active' ? '#22c55e' : '#94a3b8' }} />
                            <Typography variant="caption" fontWeight={700} sx={{ color: loan.status === 'Active' ? '#22c55e' : '#94a3b8' }}>
                                {loan.status}
                            </Typography>
                        </Box>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleOpenAdd}
                            size="small"
                            sx={{
                                borderRadius: '10px', fontWeight: 700,
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                                '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.5)' }
                            }}
                        >
                            Add Entry
                        </Button>
                    </Box>
                </Box>

                {/* Progress Bar */}
                <Box sx={{ mt: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">Repayment Progress</Typography>
                        <Typography variant="caption" fontWeight={700} color="primary.light">{progress.toFixed(1)}% paid</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.disabled">₹{paidAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })} paid</Typography>
                        <Typography variant="caption" color="text.disabled">of ₹{loanAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</Typography>
                    </Box>
                </Box>
            </Box>

            {/* ── Stat Pills Row ───────────────────────────────────────── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <StatPill label="Outstanding" value={`₹${remaining.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} icon={<TrendingIcon />} accent="#6366f1" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <StatPill label="Monthly EMI" value={`₹${parseFloat(loan.emi_amount).toLocaleString('en-IN')}`} icon={<StatementIcon />} accent="#8b5cf6" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    <StatPill label="Interest Rate" value={`${parseFloat(loan.interest_rate)}% p.a.`} icon={<RateIcon />} accent="#3b82f6" />
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                    {penaltyTotal > 0
                        ? <StatPill label="Penalties" value={`₹${penaltyTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} icon={<WarningIcon />} accent="#ef4444" />
                        : <StatPill label="Loan Tenure" value={`${schedule.length || '—'} months`} icon={<ScheduleIcon />} accent="#10b981" />
                    }
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* ── Account Details ──────────────────────────────────── */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{
                        borderRadius: '16px', border: '1px solid', borderColor: 'divider',
                        overflow: 'hidden', height: '100%',
                        background: 'linear-gradient(160deg, rgba(30,30,46,1) 0%, rgba(22,22,35,0.95) 100%)',
                    }}>
                        <Box sx={{
                            p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(99,102,241,0.06)',
                        }}>
                            <BankIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                            <Typography variant="subtitle1" fontWeight="700">Account Details</Typography>
                        </Box>
                        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0 }}>
                            {[
                                { label: 'Loan Amount', value: `₹${loanAmount.toLocaleString('en-IN')}` },
                                { label: 'Outstanding Balance', value: `₹${remaining.toLocaleString('en-IN')}`, highlight: true },
                                { label: 'Monthly EMI', value: `₹${parseFloat(loan.emi_amount).toLocaleString('en-IN')}` },
                                { label: 'Interest Rate', value: `${parseFloat(loan.interest_rate)}% p.a.` },
                            ].map((r, i) => (
                                <Box key={i} sx={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <Typography variant="body2" color="text.secondary" fontSize="0.8rem">{r.label}</Typography>
                                    <Typography variant="body2" fontWeight="700" fontSize="0.85rem"
                                        sx={{ color: r.highlight && penaltyTotal > 0 ? '#f87171' : 'text.primary' }}>
                                        {r.value}
                                    </Typography>
                                </Box>
                            ))}
                            <Box sx={{ mt: 1.5, mb: 0.5 }}>
                                {[
                                    { label: 'Start Date', value: loan.start_date ? dayjs(loan.start_date).format('DD MMM YYYY') : '—' },
                                    { label: 'End Date', value: loan.end_date ? dayjs(loan.end_date).format('DD MMM YYYY') : '—' },
                                ].map((r, i) => (
                                    <Box key={i} sx={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        py: 1.25, borderBottom: '1px solid rgba(255,255,255,0.04)',
                                    }}>
                                        <Typography variant="body2" color="text.secondary" fontSize="0.8rem">{r.label}</Typography>
                                        <Typography variant="body2" fontWeight="600" fontSize="0.85rem">{r.value}</Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Box>
                        {loan.next_emi_due_date && (
                            <Box sx={{
                                m: 2, mt: 0, p: 1.5, borderRadius: '12px',
                                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)',
                                display: 'flex', alignItems: 'center', gap: 1,
                            }}>
                                <CalendarIcon sx={{ color: '#60a5fa', fontSize: 16 }} />
                                <Typography variant="caption" fontWeight={600} sx={{ color: '#60a5fa' }}>
                                    Next EMI: {dayjs(loan.next_emi_due_date).format('DD MMM YYYY')}
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* ── Loan Schedule ─────────────────────────────────────── */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{
                        borderRadius: '16px', border: '1px solid', borderColor: 'divider',
                        overflow: 'hidden',
                        background: 'linear-gradient(160deg, rgba(30,30,46,1) 0%, rgba(22,22,35,0.95) 100%)',
                    }}>
                        <Box sx={{
                            p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(99,102,241,0.06)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <ScheduleIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                                <Typography variant="subtitle1" fontWeight="700">Loan Schedule</Typography>
                            </Box>
                            {schedule.length > 0 && (
                                <Box sx={{ px: 1.25, py: 0.35, borderRadius: '20px', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
                                    <Typography variant="caption" fontWeight={700} sx={{ color: '#22c55e' }}>
                                        {paidSchedule}/{schedule.length} paid
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        {schedule.length === 0 ? (
                            <Box sx={{ p: 5, textAlign: 'center' }}>
                                <ScheduleIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">No schedule generated.</Typography>
                                <Typography variant="caption" color="text.disabled">New loans auto-generate a schedule on creation.</Typography>
                            </Box>
                        ) : (
                            <Box sx={{ maxHeight: 340, overflowY: 'auto' }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            {['#', 'Due Date', 'EMI Amount', 'Status'].map(h => (
                                                <TableCell key={h} sx={{ bgcolor: 'rgba(20,20,32,0.95)', fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                                    {h}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {schedule.map((inst) => (
                                            <TableRow key={inst.installment} sx={{
                                                bgcolor: inst.status === 'Paid' ? 'rgba(34,197,94,0.03)' : 'transparent',
                                                '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                                '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)' }
                                            }}>
                                                <TableCell sx={{ color: 'text.disabled', fontSize: '0.78rem' }}>#{inst.installment}</TableCell>
                                                <TableCell sx={{ fontSize: '0.82rem' }}>{dayjs(inst.due_date).format('DD MMM YYYY')}</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '0.82rem' }}>₹{parseFloat(inst.amount).toLocaleString('en-IN')}</TableCell>
                                                <TableCell><ScheduleStatusBadge status={inst.status} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* ── Statement of Account ─────────────────────────────── */}
                <Grid size={{ xs: 12 }}>
                    <Box sx={{
                        borderRadius: '16px', border: '1px solid', borderColor: 'divider',
                        overflow: 'hidden',
                        background: 'linear-gradient(160deg, rgba(30,30,46,1) 0%, rgba(22,22,35,0.95) 100%)',
                    }}>
                        {/* Header */}
                        <Box sx={{
                            p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'rgba(99,102,241,0.06)',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <StatementIcon sx={{ color: '#8b5cf6', fontSize: 20 }} />
                                <Typography variant="subtitle1" fontWeight="700">Statement of Account</Typography>
                                {transactions.length > 0 && (
                                    <Box sx={{ px: 1, py: 0.2, borderRadius: '12px', bgcolor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
                                        <Typography variant="caption" fontWeight={700} color="primary.light">{transactions.length} entries</Typography>
                                    </Box>
                                )}
                            </Box>
                            <Button
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={handleOpenAdd}
                                sx={{
                                    borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem',
                                    border: '1px solid rgba(99,102,241,0.4)', color: 'primary.light',
                                    '&:hover': { bgcolor: 'rgba(99,102,241,0.1)' }
                                }}
                            >
                                Add Entry
                            </Button>
                        </Box>

                        {transactions.length === 0 ? (
                            <Box sx={{ p: 6, textAlign: 'center' }}>
                                <StatementIcon sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.4, mb: 1.5 }} />
                                <Typography variant="body2" color="text.secondary" mb={1}>No transactions recorded yet.</Typography>
                                <Button startIcon={<AddIcon />} onClick={handleOpenAdd} size="small" variant="outlined" sx={{ borderRadius: '10px' }}>
                                    Add First Entry
                                </Button>
                            </Box>
                        ) : (
                            <Box>
                                <Box sx={{ overflowX: 'auto' }}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                {['Date', 'Particulars', 'Debit (₹)', 'Credit (₹)', 'Balance (₹)', ''].map((h, i) => (
                                                    <TableCell key={i} align={i >= 2 && i <= 4 ? 'right' : 'left'} sx={{
                                                        bgcolor: 'rgba(20,20,32,0.6)',
                                                        fontWeight: 700, fontSize: '0.73rem',
                                                        color: 'text.secondary', py: 1, px: 2,
                                                        borderBottom: '1px solid rgba(255,255,255,0.06)',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {h}
                                                    </TableCell>
                                                ))}
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transactions
                                                .slice(stmtPage * stmtRowsPerPage, stmtPage * stmtRowsPerPage + stmtRowsPerPage)
                                                .map((t, relIdx) => {
                                                    const idx = stmtPage * stmtRowsPerPage + relIdx;
                                                    return (
                                                        <TableRow key={idx} sx={{
                                                            '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                                                            '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', px: 2, py: 1.1 }
                                                        }}>
                                                            <TableCell>
                                                                <Typography variant="body2" fontSize="0.8rem" color="text.secondary" whiteSpace="nowrap">
                                                                    {dayjs(t.date).format('DD MMM YYYY')}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontSize="0.82rem" fontWeight={500}>
                                                                    {t.particulars}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {t.debit > 0 ? (
                                                                    <Typography variant="body2" fontSize="0.82rem" fontWeight={600} sx={{ color: '#f87171' }}>
                                                                        {parseFloat(t.debit).toLocaleString('en-IN')}
                                                                    </Typography>
                                                                ) : (
                                                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                {t.credit > 0 ? (
                                                                    <Typography variant="body2" fontSize="0.82rem" fontWeight={600} sx={{ color: '#fb923c' }}>
                                                                        {parseFloat(t.credit).toLocaleString('en-IN')}
                                                                    </Typography>
                                                                ) : (
                                                                    <Typography variant="body2" color="text.disabled">—</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Typography variant="body2" fontSize="0.82rem" fontWeight="700">
                                                                    ₹{parseFloat(t.balance ?? 0).toLocaleString('en-IN')}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.25 }}>
                                                                    <Tooltip title="Edit">
                                                                        <IconButton size="small" onClick={() => handleOpenEdit(t, idx)}
                                                                            sx={{ color: 'text.disabled', '&:hover': { color: 'primary.light', bgcolor: 'rgba(99,102,241,0.12)' } }}>
                                                                            <EditIcon sx={{ fontSize: 15 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Delete">
                                                                        <IconButton size="small" onClick={() => setDeleteConfirmIndex(idx)}
                                                                            sx={{ color: 'text.disabled', '&:hover': { color: '#f87171', bgcolor: 'rgba(239,68,68,0.12)' } }}>
                                                                            <DeleteIcon sx={{ fontSize: 15 }} />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })
                                            }
                                        </TableBody>
                                    </Table>
                                </Box>

                                {/* Pagination footer */}
                                <TablePagination
                                    component="div"
                                    count={transactions.length}
                                    page={stmtPage}
                                    rowsPerPage={stmtRowsPerPage}
                                    rowsPerPageOptions={[5, 10, 25]}
                                    onPageChange={(_, newPage) => setStmtPage(newPage)}
                                    onRowsPerPageChange={(e) => {
                                        setStmtRowsPerPage(parseInt(e.target.value, 10));
                                        setStmtPage(0);
                                    }}
                                    sx={{
                                        borderTop: '1px solid rgba(255,255,255,0.06)',
                                        color: 'text.secondary',
                                        '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
                                            fontSize: '0.78rem',
                                        },
                                        '.MuiTablePagination-select': {
                                            fontSize: '0.78rem',
                                        },
                                        '.MuiIconButton-root': {
                                            borderRadius: '8px',
                                            '&:hover': { bgcolor: 'rgba(99,102,241,0.1)' },
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </Box>
                </Grid>

                {/* ── Unpaid Charges ────────────────────────────────────── */}
                {penaltyHistory.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                        <Box sx={{
                            borderRadius: '16px',
                            border: '1px solid rgba(239,68,68,0.25)',
                            overflow: 'hidden',
                            background: 'linear-gradient(160deg, rgba(239,68,68,0.06) 0%, rgba(22,22,35,0.95) 100%)',
                        }}>
                            <Box sx={{
                                p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                                borderBottom: '1px solid rgba(239,68,68,0.15)',
                                background: 'rgba(239,68,68,0.06)',
                            }}>
                                <WarningIcon sx={{ color: '#f87171', fontSize: 20 }} />
                                <Typography variant="subtitle1" fontWeight="700" sx={{ color: '#f87171' }}>Unpaid Charges</Typography>
                            </Box>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        {['Date', 'Particulars', 'Amount (₹)'].map(h => (
                                            <TableCell key={h} sx={{ bgcolor: 'rgba(239,68,68,0.04)', fontWeight: 700, fontSize: '0.73rem', color: 'text.secondary', borderBottom: '1px solid rgba(239,68,68,0.1)' }}>
                                                {h}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {penaltyHistory.map((p, i) => (
                                        <TableRow key={i} sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)' } }}>
                                            <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{dayjs(p.date).format('DD MMM YYYY')}</TableCell>
                                            <TableCell sx={{ fontSize: '0.82rem' }}>Late Payment Charges</TableCell>
                                            <TableCell sx={{ fontWeight: 700, color: '#f87171', fontSize: '0.82rem' }}>
                                                {parseFloat(p.amount).toLocaleString('en-IN')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Grid>
                )}
            </Grid>

            {/* ── Add / Edit Dialog ──────────────────────────────────────── */}
            <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', backgroundImage: 'linear-gradient(135deg, rgba(30,30,46,1) 0%, rgba(22,22,35,1) 100%)', border: '1px solid rgba(99,102,241,0.2)' } }}>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Typography fontWeight="700">{editIndex !== null ? 'Edit Entry' : 'Add Statement Entry'}</Typography>
                    <IconButton size="small" onClick={handleCloseDialog} sx={{ color: 'text.disabled' }}><CloseIcon fontSize="small" /></IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, borderColor: 'rgba(255,255,255,0.08)' }}>
                    <TextField label="Date" name="date" type="date" value={entryForm.date} onChange={handleFormChange} fullWidth size="small" InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                    <TextField label="Particulars" name="particulars" select value={entryForm.particulars} onChange={handleFormChange} fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                        {PARTICULARS_OPTIONS.map(opt => <MenuItem key={opt} value={opt}>{opt}</MenuItem>)}
                    </TextField>
                    <TextField label="Type" name="type" select value={entryForm.type} onChange={handleFormChange} fullWidth size="small"
                        helperText={entryForm.type === 'debit' ? '✓ Reduces outstanding balance (payment)' : '↑ Increases outstanding balance (charge/fee)'}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}>
                        <MenuItem value="debit">Debit — Payment / Reduces Balance</MenuItem>
                        <MenuItem value="credit">Credit — Charge / Increases Balance</MenuItem>
                    </TextField>
                    <TextField label="Amount" name="amount" type="number" value={entryForm.amount} onChange={handleFormChange} fullWidth size="small"
                        inputProps={{ min: 1, step: 'any' }}
                        InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={handleCloseDialog} color="inherit" sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={handleSaveEntry} variant="contained" disabled={!entryForm.amount || parseFloat(entryForm.amount) <= 0 || saving}
                        sx={{ borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 4px 14px rgba(99,102,241,0.4)', fontWeight: 700 }}>
                        {saving ? 'Saving…' : editIndex !== null ? 'Save Changes' : 'Add Entry'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Delete Confirm Dialog ──────────────────────────────────── */}
            <Dialog open={deleteConfirmIndex !== null} onClose={() => setDeleteConfirmIndex(null)} maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px', backgroundImage: 'linear-gradient(135deg, rgba(30,30,46,1) 0%, rgba(22,22,35,1) 100%)', border: '1px solid rgba(239,68,68,0.2)' } }}>
                <DialogTitle fontWeight="700" sx={{ color: '#f87171' }}>Delete Entry?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary">
                        This entry will be removed and all running balances will be recalculated. This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2.5 }}>
                    <Button onClick={() => setDeleteConfirmIndex(null)} color="inherit" sx={{ borderRadius: '10px' }}>Cancel</Button>
                    <Button onClick={() => handleDeleteEntry(deleteConfirmIndex)} variant="contained" color="error" disabled={saving}
                        sx={{ borderRadius: '10px', fontWeight: 700 }}>
                        {saving ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Toast ─────────────────────────────────────────────────── */}
            <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={toast.severity} onClose={() => setToast(t => ({ ...t, open: false }))} variant="filled" sx={{ borderRadius: '10px' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LoanDetailPage;
