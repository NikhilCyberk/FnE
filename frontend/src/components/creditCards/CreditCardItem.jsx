import React from 'react';
import {
    Box, Typography, IconButton, LinearProgress, Menu, MenuItem, ListItemIcon, Divider, Stack
} from '@mui/material';
import {
    MoreVert, Edit, Delete, OpenInNew, CalendarToday, Visibility, VisibilityOff,
    AccountBalanceWallet, CreditCard as CreditCardIcon, Assignment, TrendingUp, WarningAmber
} from '@mui/icons-material';
import CreditCardVisual from './CreditCardVisual';

const UTIL_COLOR = (u) => u > 75 ? 'error' : u > 40 ? 'warning' : 'success';

const fmt = (val, show) =>
    show
        ? `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '••••••';

const CreditCardItem = ({
    card, showBalances, setShowBalances,
    onEdit, onDelete, onViewDetail,
}) => {
    const [menuAnchor, setMenuAnchor] = React.useState(null);

    const limit = Number(card.creditLimit) || 0;
    const balance = Number(card.currentBalance) || 0;
    const stmtBalance = Number(card.statementBalance) || 0;
    const available = Number(card.availableCredit) || Math.max(0, limit - balance);
    const minDue = Number(card.minimumPayment) || 0;
    const utilisation = limit > 0 ? Math.min((balance / limit) * 100, 100) : 0;
    const dueDate = card.paymentDueDate;

    return (
        <Box
            sx={{
                borderRadius: '24px',
                overflow: 'hidden',
                border: '1px solid',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                background: (theme) =>
                    theme.palette.mode === 'dark'
                        ? 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.9))'
                        : 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(248,250,252,0.9))',
                backdropFilter: 'blur(20px)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 20px 40px -10px rgba(0,0,0,0.5)'
                    : '0 20px 40px -10px rgba(0,0,0,0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 30px 50px -15px rgba(0,0,0,0.6)'
                        : '0 30px 50px -15px rgba(0,0,0,0.12)'
                },
            }}
        >
            {/* ── Card Visual (Top Area) ── */}
            <Box p={1.5} pb={0}>
                <CreditCardVisual
                    card={card}
                    showBalances={showBalances}
                    setShowBalances={setShowBalances}
                    height={210}
                />
            </Box>

            {/* ── Details Area ── */}
            <Box p={3} pt={2.5}>
                {/* Header Row */}
                <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2.5}>
                    <Box>
                        <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: -0.5, lineHeight: 1.2 }}>
                            {card.name || card.cardName || 'Credit Card'}
                        </Typography>
                        {(card.issuer || card.bankName) && (
                            <Typography variant="caption" color="text.secondary" fontWeight="600" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                {card.issuer || card.bankName}
                            </Typography>
                        )}
                    </Box>
                    <IconButton
                        size="small"
                        onClick={(e) => setMenuAnchor(e.currentTarget)}
                        sx={{
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            '&:hover': { bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }
                        }}
                    >
                        <MoreVert fontSize="small" />
                    </IconButton>
                </Box>

                {/* Grid Stats */}
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2} mb={3}>
                    <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} fontWeight="600">
                            <CreditCardIcon sx={{ fontSize: 14 }} /> Limit
                        </Typography>
                        <Typography variant="body1" fontWeight="800" mt={0.5}>
                            {fmt(limit, showBalances)}
                        </Typography>
                    </Box>
                    <Box sx={{ p: 1.5, borderRadius: '16px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" display="flex" alignItems="center" gap={0.5} fontWeight="600">
                            <AccountBalanceWallet sx={{ fontSize: 14 }} color="success" /> Available
                        </Typography>
                        <Typography variant="body1" fontWeight="800" color="success.main" mt={0.5}>
                            {fmt(available, showBalances)}
                        </Typography>
                    </Box>
                </Box>

                {/* List Stats */}
                <Stack spacing={2} mb={3}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1} fontWeight="500">
                            <WarningAmber sx={{ fontSize: 18, color: 'error.light' }} /> Current Balance
                        </Typography>
                        <Typography variant="body2" fontWeight="700" color="error.main">
                            {fmt(balance, showBalances)}
                        </Typography>
                    </Box>
                    <Divider sx={{ borderStyle: 'dashed', opacity: 0.5 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1} fontWeight="500">
                            <Assignment sx={{ fontSize: 18, color: 'warning.light' }} /> Statement Balance
                        </Typography>
                        <Typography variant="body2" fontWeight="700" color="warning.main">
                            {fmt(stmtBalance, showBalances)}
                        </Typography>
                    </Box>
                    {minDue > 0 && (
                        <>
                            <Divider sx={{ borderStyle: 'dashed', opacity: 0.5 }} />
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={1} fontWeight="500">
                                    <TrendingUp sx={{ fontSize: 18, color: 'error.main' }} /> Min Payment Due
                                </Typography>
                                <Typography variant="body2" fontWeight="700" color="error.main">
                                    {fmt(minDue, showBalances)}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Stack>

                {/* Utilisation */}
                <Box mb={minDue > 0 || !dueDate ? 0 : 3} mt={-1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Utilisation
                        </Typography>
                        <Typography variant="caption" fontWeight={800} color={`${UTIL_COLOR(utilisation)}.main`}>
                            {utilisation.toFixed(1)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={utilisation}
                        color={UTIL_COLOR(utilisation)}
                        sx={{
                            height: 6,
                            borderRadius: 4,
                            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            '& .MuiLinearProgress-bar': { borderRadius: 4 }
                        }}
                    />
                </Box>

                {/* Due Date */}
                {dueDate && (
                    <Box
                        display="flex" alignItems="center" justifyContent="space-between"
                        sx={{
                            mt: 3, p: 2, borderRadius: '16px',
                            background: (theme) => theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))'
                                : 'linear-gradient(135deg, rgba(254,240,138,0.3), rgba(254,240,138,0.1))',
                            border: '1px solid',
                            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(234,179,8,0.3)' : 'rgba(234,179,8,0.4)',
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: 'rgba(234,179,8,0.2)' }}>
                                <CalendarToday sx={{ color: 'warning.main', fontSize: 20 }} />
                            </Box>
                            <Box>
                                <Typography variant="caption" fontWeight={800} color="warning.dark" display="block" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Payment Due
                                </Typography>
                                <Typography variant="body2" fontWeight="700" color="warning.dark">
                                    {new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                    sx: {
                        borderRadius: '16px',
                        minWidth: 160,
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                        mt: 1
                    },
                }}
            >
                <MenuItem onClick={() => { setMenuAnchor(null); onViewDetail?.(card); }} sx={{ py: 1.5, my: 0.5, mx: 1, borderRadius: '8px' }}>
                    <ListItemIcon><OpenInNew fontSize="small" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>View Details</Typography>
                </MenuItem>
                <MenuItem onClick={() => { setMenuAnchor(null); onEdit?.(card); }} sx={{ py: 1.5, mb: 0.5, mx: 1, borderRadius: '8px' }}>
                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>Edit Card</Typography>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem
                    onClick={() => { setMenuAnchor(null); onDelete?.(card); }}
                    sx={{ py: 1.5, my: 0.5, mx: 1, borderRadius: '8px', color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' }, '&:hover': { bgcolor: 'error.light', color: 'error.contrastText', '& .MuiListItemIcon-root': { color: 'error.contrastText' } } }}
                >
                    <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>Delete Card</Typography>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default CreditCardItem;
