import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, LinearProgress, Chip, Tooltip,
    IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';
import {
    AccountBalance as InstitutionIcon,
    RequestQuote as PaymentIcon,
    PriorityHigh as PenaltyIcon,
    CalendarToday as CalendarIcon,
    OpenInNew as DetailIcon,
    MoreVert as MoreIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Percent as RateIcon,
    ArrowForward as ArrowIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';

const LoanCard = ({ loan, onEdit, onRecordPayment, onAddPenalty, onDelete }) => {
    const navigate = useNavigate();
    const [menuAnchor, setMenuAnchor] = useState(null);

    const {
        lender_name, loan_type, loan_amount, remaining_balance,
        emi_amount, interest_rate, status, penalty_amount,
        next_emi_due_date, penalty_history,
    } = loan;

    const amountFloat = parseFloat(loan_amount);
    const balanceFloat = parseFloat(remaining_balance);
    const penaltyFloat = parseFloat(penalty_amount || 0);
    const totalOwed = amountFloat + penaltyFloat;
    const amountPaid = Math.max(totalOwed - balanceFloat, 0);
    const progress = Math.min((amountPaid / totalOwed) * 100, 100);

    let parsedHistory = [];
    try {
        parsedHistory = typeof penalty_history === 'string'
            ? JSON.parse(penalty_history)
            : (penalty_history || []);
    } catch (e) { parsedHistory = []; }

    const isActive = status === 'Active';

    const statusStyles = {
        'Active': { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)' },
        'Closed': { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
        'Overdue': { color: '#f87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.3)' },
    };
    const ss = statusStyles[status] || statusStyles['Closed'];

    // Progress gradient colour
    const barColor =
        progress >= 90 ? '#4ade80' :
            progress >= 50 ? '#60a5fa' : '#a78bfa';

    // Loan type to accent gradient
    const loanGradients = {
        'Home': 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
        'Personal': 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
        'Car': 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)',
        'Education': 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
        'Business': 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
    };
    const headerGrad = loanGradients[loan_type] || loanGradients['Personal'];

    return (
        <Box sx={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            background: theme =>
                theme.palette.mode === 'dark'
                    ? 'linear-gradient(160deg, rgba(28,28,44,1) 0%, rgba(18,18,30,1) 100%)'
                    : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            transition: 'box-shadow 0.25s, transform 0.25s',
            '&:hover': {
                boxShadow: '0 10px 36px rgba(0,0,0,0.2)',
                transform: 'translateY(-3px)',
            },
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            {/* ── Coloured accent strip ── */}
            <Box sx={{ height: 4, background: headerGrad }} />

            {/* ── Header ── */}
            <Box sx={{
                px: 2.5, pt: 2.5, pb: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
            }}>
                {/* Left: icon + names */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 46, height: 46,
                        borderRadius: '14px',
                        background: headerGrad,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                        flexShrink: 0,
                    }}>
                        <InstitutionIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.1} lineHeight={1.2}>
                            {lender_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.3 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    px: 1, py: 0.2,
                                    borderRadius: '6px',
                                    bgcolor: 'rgba(99,102,241,0.1)',
                                    color: 'primary.light',
                                    fontWeight: 600,
                                    fontSize: '0.62rem',
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                }}
                            >
                                {loan_type}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* Right: status pill + menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                        px: 1.25, py: 0.4,
                        borderRadius: '20px',
                        border: `1px solid ${ss.border}`,
                        background: ss.bg,
                        display: 'flex', alignItems: 'center', gap: 0.5,
                    }}>
                        <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: ss.color }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: ss.color, fontSize: '0.67rem' }}>
                            {status}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={e => setMenuAnchor(e.currentTarget)}
                        sx={{ borderRadius: '8px', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                        <MoreIcon fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                        PaperProps={{ sx: { borderRadius: '12px', minWidth: 160, boxShadow: '0 10px 32px rgba(0,0,0,0.2)' } }}
                    >
                        <MenuItem onClick={() => { onEdit(loan); setMenuAnchor(null); }}>
                            <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
                            <ListItemText>Edit Loan</ListItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem onClick={() => { onDelete(loan); setMenuAnchor(null); }} sx={{ color: 'error.main' }}>
                            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                            <ListItemText>Delete Loan</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* ── Divider ── */}
            <Box sx={{ mx: 2.5, height: '1px', bgcolor: 'divider' }} />

            {/* ── Body ── */}
            <Box sx={{ px: 2.5, py: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Outstanding Balance + Progress */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            Outstanding Balance
                        </Typography>
                        <Typography
                            variant="h5"
                            fontWeight={800}
                            letterSpacing={-0.5}
                            sx={{ color: penaltyFloat > 0 ? 'error.light' : 'text.primary' }}
                        >
                            ₹{balanceFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                    </Box>

                    {penaltyFloat > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.75 }}>
                            <Tooltip title={
                                parsedHistory.length > 0
                                    ? parsedHistory.map(p => `${dayjs(p.date).format('MMM D')}: ₹${parseFloat(p.amount).toLocaleString('en-IN')}`).join(' · ')
                                    : 'Late fees applied'
                            }>
                                <Chip
                                    size="small"
                                    label={`⚠ ₹${penaltyFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })} late fees`}
                                    sx={{
                                        fontSize: '0.63rem', height: 20,
                                        bgcolor: 'rgba(248,113,113,0.1)',
                                        color: 'error.light',
                                        border: '1px solid rgba(248,113,113,0.25)',
                                    }}
                                />
                            </Tooltip>
                        </Box>
                    )}

                    {/* Progress bar */}
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 7, borderRadius: 4,
                            bgcolor: 'rgba(255,255,255,0.07)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                                background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
                            },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.disabled" fontSize="0.67rem">
                            ₹{amountPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })} paid
                        </Typography>
                        <Typography variant="caption" color="text.disabled" fontSize="0.67rem" fontWeight={600} sx={{ color: barColor }}>
                            {progress.toFixed(0)}%
                        </Typography>
                        <Typography variant="caption" color="text.disabled" fontSize="0.67rem">
                            of ₹{amountFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                    </Box>
                </Box>

                {/* EMI + Rate metric tiles */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                    {/* Monthly EMI */}
                    <Box sx={{
                        p: 1.5, borderRadius: '12px',
                        bgcolor: 'rgba(99,102,241,0.07)',
                        border: '1px solid rgba(99,102,241,0.14)',
                    }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <PaymentIcon sx={{ fontSize: 11 }} /> EMI / mo
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#818cf8', mt: 0.25 }}>
                            ₹{parseFloat(emi_amount).toLocaleString('en-IN')}
                        </Typography>
                    </Box>
                    {/* Interest Rate */}
                    <Box sx={{
                        p: 1.5, borderRadius: '12px',
                        bgcolor: 'rgba(139,92,246,0.07)',
                        border: '1px solid rgba(139,92,246,0.14)',
                    }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.4, fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            <RateIcon sx={{ fontSize: 11 }} /> Interest
                        </Typography>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#a78bfa', mt: 0.25 }}>
                            {parseFloat(interest_rate)}% p.a.
                        </Typography>
                    </Box>
                </Box>

                {/* Next EMI due date */}
                {next_emi_due_date && (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        px: 1.5, py: 1, borderRadius: '10px',
                        bgcolor: 'rgba(59,130,246,0.07)',
                        border: '1px solid rgba(59,130,246,0.18)',
                    }}>
                        <CalendarIcon sx={{ fontSize: 14, color: '#60a5fa' }} />
                        <Typography variant="caption" fontWeight={600} sx={{ color: '#60a5fa' }}>
                            Next EMI: {dayjs(next_emi_due_date).format('DD MMM YYYY')}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* ── Footer Actions ── */}
            <Box sx={{ px: 2.5, pb: 2.5, display: 'flex', flexDirection: 'column', gap: 1 }}>

                {/* View Statement */}
                <Box
                    component="button"
                    onClick={() => navigate(`/loans/${loan.id}`)}
                    sx={{
                        width: '100%', py: 0.9,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                        bgcolor: 'transparent',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: '10px',
                        color: 'text.secondary',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                            bgcolor: 'rgba(99,102,241,0.08)',
                            color: 'primary.light',
                            borderColor: 'rgba(99,102,241,0.4)',
                            '& .arrow-icon': { transform: 'translateX(3px)' },
                        },
                    }}
                >
                    <DetailIcon sx={{ fontSize: 14 }} />
                    View Statement & Schedule
                    <ArrowIcon className="arrow-icon" sx={{ fontSize: 14, transition: 'transform 0.2s' }} />
                </Box>

                {/* Record EMI + Penalty */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box
                        component="button"
                        onClick={() => onRecordPayment(loan)}
                        disabled={!isActive}
                        sx={{
                            flex: 2, py: 1.1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                            background: isActive
                                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                : 'rgba(255,255,255,0.04)',
                            border: 'none',
                            borderRadius: '10px',
                            color: isActive ? 'white' : 'text.disabled',
                            fontWeight: 700, fontSize: '0.82rem',
                            cursor: isActive ? 'pointer' : 'not-allowed',
                            boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.38)' : 'none',
                            transition: 'all 0.2s',
                            '&:hover': isActive ? { opacity: 0.88, boxShadow: '0 6px 20px rgba(99,102,241,0.5)' } : {},
                        }}
                    >
                        <PaymentIcon sx={{ fontSize: 16 }} />
                        Record EMI
                    </Box>
                    <Box
                        component="button"
                        onClick={() => onAddPenalty(loan)}
                        disabled={!isActive}
                        sx={{
                            flex: 1, py: 1.1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                            background: isActive ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isActive ? 'rgba(248,113,113,0.3)' : 'transparent'}`,
                            borderRadius: '10px',
                            color: isActive ? '#f87171' : 'text.disabled',
                            fontWeight: 700, fontSize: '0.82rem',
                            cursor: isActive ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            '&:hover': isActive
                                ? { background: 'rgba(248,113,113,0.2)', borderColor: 'rgba(248,113,113,0.55)' }
                                : {},
                        }}
                    >
                        <PenaltyIcon sx={{ fontSize: 16 }} />
                        Penalty
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default LoanCard;
