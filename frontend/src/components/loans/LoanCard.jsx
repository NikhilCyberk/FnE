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
    TrendingDown as BalanceIcon,
    Percent as RateIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';

const LoanCard = ({ loan, onEdit, onRecordPayment, onAddPenalty, onDelete }) => {
    const navigate = useNavigate();
    const [menuAnchor, setMenuAnchor] = useState(null);

    const { lender_name, loan_type, loan_amount, remaining_balance, emi_amount, interest_rate, status, penalty_amount, next_emi_due_date, penalty_history } = loan;

    const amountFloat = parseFloat(loan_amount);
    const balanceFloat = parseFloat(remaining_balance);
    const penaltyFloat = parseFloat(penalty_amount || 0);
    const totalOwed = amountFloat + penaltyFloat;
    const amountPaid = Math.max(totalOwed - balanceFloat, 0);
    const progress = Math.min((amountPaid / totalOwed) * 100, 100);

    let parsedHistory = [];
    try {
        parsedHistory = typeof penalty_history === 'string' ? JSON.parse(penalty_history) : (penalty_history || []);
    } catch (e) { parsedHistory = []; }

    const isActive = status === 'Active';
    const isClosed = status === 'Closed';

    const statusColorMap = {
        'Active': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)' },
        'Closed': { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', border: 'rgba(148,163,184,0.3)' },
        'Overdue': { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
    };
    const statusStyle = statusColorMap[status] || statusColorMap['Closed'];

    const progressColor = progress >= 90 ? '#22c55e' : progress >= 50 ? '#3b82f6' : '#8b5cf6';

    return (
        <Box sx={{
            borderRadius: '16px',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'divider',
            background: theme => theme.palette.mode === 'dark'
                ? 'linear-gradient(145deg, rgba(30,30,46,1) 0%, rgba(22,22,35,1) 100%)'
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            transition: 'box-shadow 0.25s, transform 0.25s',
            '&:hover': {
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                transform: 'translateY(-2px)',
            },
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
        }}>
            {/* Card Header */}
            <Box sx={{
                p: 2,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider',
            }}>
                {/* Left: Icon + Name */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        width: 44, height: 44,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                    }}>
                        <InstitutionIcon sx={{ color: 'white', fontSize: 22 }} />
                    </Box>
                    <Box>
                        <Typography variant="subtitle1" fontWeight="700" letterSpacing={0.3} lineHeight={1.2}>
                            {lender_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>
                            {loan_type} Loan
                        </Typography>
                    </Box>
                </Box>

                {/* Right: Status + Menu */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{
                        px: 1.25, py: 0.35,
                        borderRadius: '20px',
                        border: `1px solid ${statusStyle.border}`,
                        background: statusStyle.bg,
                        display: 'flex', alignItems: 'center', gap: 0.5
                    }}>
                        <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: statusStyle.color }} />
                        <Typography variant="caption" fontWeight={700} sx={{ color: statusStyle.color, fontSize: '0.7rem' }}>
                            {status}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        sx={{ ml: 0.5, borderRadius: '8px', '&:hover': { bgcolor: 'action.hover' } }}
                    >
                        <MoreIcon fontSize="small" />
                    </IconButton>
                    <Menu
                        anchorEl={menuAnchor}
                        open={Boolean(menuAnchor)}
                        onClose={() => setMenuAnchor(null)}
                        PaperProps={{ sx: { borderRadius: 2, minWidth: 150, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' } }}
                    >
                        <MenuItem onClick={() => { onEdit(loan); setMenuAnchor(null); }}>
                            <ListItemIcon><EditIcon fontSize="small" color="primary" /></ListItemIcon>
                            <ListItemText>Edit Loan</ListItemText>
                        </MenuItem>
                        <Divider />
                        <MenuItem
                            onClick={() => { onDelete(loan); setMenuAnchor(null); }}
                            sx={{ color: 'error.main' }}
                        >
                            <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                            <ListItemText>Delete Loan</ListItemText>
                        </MenuItem>
                    </Menu>
                </Box>
            </Box>

            {/* Body */}
            <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Balance + Progress */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75, alignItems: 'baseline' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={500}>Outstanding Balance</Typography>
                        <Typography variant="h6" fontWeight="800"
                            sx={{ color: penaltyFloat > 0 ? 'error.main' : 'text.primary', letterSpacing: -0.5 }}
                        >
                            ₹{balanceFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                    </Box>

                    {penaltyFloat > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.75 }}>
                            <Tooltip title={parsedHistory.length > 0
                                ? parsedHistory.map(p => `${dayjs(p.date).format('MMM D')}: ₹${parseFloat(p.amount).toLocaleString('en-IN')}`).join(' • ')
                                : 'Late fees applied'}>
                                <Chip
                                    size="small"
                                    label={`⚠ ₹${penaltyFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })} late fees`}
                                    sx={{ fontSize: '0.65rem', height: 20, bgcolor: 'rgba(239,68,68,0.12)', color: 'error.main', border: '1px solid rgba(239,68,68,0.25)' }}
                                />
                            </Tooltip>
                        </Box>
                    )}

                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 6, borderRadius: 3,
                            bgcolor: 'rgba(255,255,255,0.06)',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 3,
                                background: `linear-gradient(90deg, ${progressColor}, ${progressColor}aa)`,
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.disabled">
                            ₹{amountPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })} paid
                        </Typography>
                        <Typography variant="caption" color="text.disabled">
                            of ₹{amountFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                    </Box>
                </Box>

                {/* EMI + Rate chips */}
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Box sx={{
                        flex: 1, p: 1.5,
                        borderRadius: '12px',
                        bgcolor: 'rgba(99,102,241,0.08)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        display: 'flex', flexDirection: 'column', gap: 0.25
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PaymentIcon sx={{ fontSize: 12 }} />Monthly EMI
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="700" color="primary.light">
                            ₹{parseFloat(emi_amount).toLocaleString('en-IN')}
                        </Typography>
                    </Box>
                    <Box sx={{
                        flex: 1, p: 1.5,
                        borderRadius: '12px',
                        bgcolor: 'rgba(139,92,246,0.08)',
                        border: '1px solid rgba(139,92,246,0.15)',
                        display: 'flex', flexDirection: 'column', gap: 0.25
                    }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <RateIcon sx={{ fontSize: 12 }} />Interest Rate
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="700" sx={{ color: '#a78bfa' }}>
                            {parseFloat(interest_rate)}% p.a.
                        </Typography>
                    </Box>
                </Box>

                {/* Next EMI Due */}
                {next_emi_due_date && (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 1,
                        p: 1.25, borderRadius: '10px',
                        bgcolor: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.2)',
                    }}>
                        <CalendarIcon sx={{ fontSize: 15, color: '#60a5fa' }} />
                        <Typography variant="caption" fontWeight={600} sx={{ color: '#60a5fa' }}>
                            Next EMI: {dayjs(next_emi_due_date).format('DD MMM YYYY')}
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Footer Actions */}
            <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* View Statement */}
                <Box
                    component="button"
                    onClick={() => navigate(`/loans/${loan.id}`)}
                    sx={{
                        width: '100%', py: 0.85,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                        bgcolor: 'transparent', border: '1px solid', borderColor: 'divider',
                        borderRadius: '10px', color: 'text.secondary',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': { bgcolor: 'rgba(99,102,241,0.08)', color: 'primary.light', borderColor: 'rgba(99,102,241,0.4)' }
                    }}
                >
                    <DetailIcon sx={{ fontSize: 15 }} />
                    View Statement & Schedule
                </Box>

                {/* Record EMI + Penalty */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Box
                        component="button"
                        onClick={() => onRecordPayment(loan)}
                        disabled={!isActive}
                        sx={{
                            flex: 2, py: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75,
                            background: isActive
                                ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                : 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '10px',
                            color: isActive ? 'white' : 'text.disabled',
                            fontWeight: 700, fontSize: '0.82rem',
                            cursor: isActive ? 'pointer' : 'not-allowed',
                            boxShadow: isActive ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
                            transition: 'all 0.2s',
                            '&:hover': isActive ? { opacity: 0.9, boxShadow: '0 6px 20px rgba(99,102,241,0.5)' } : {},
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
                            flex: 1, py: 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                            background: isActive ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isActive ? 'rgba(239,68,68,0.35)' : 'transparent'}`,
                            borderRadius: '10px',
                            color: isActive ? '#f87171' : 'text.disabled',
                            fontWeight: 700, fontSize: '0.82rem',
                            cursor: isActive ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s',
                            '&:hover': isActive ? { background: 'rgba(239,68,68,0.22)', borderColor: 'rgba(239,68,68,0.6)' } : {},
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
