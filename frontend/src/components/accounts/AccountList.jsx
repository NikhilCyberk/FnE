import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton, Chip, Grid, Paper,
    Menu, MenuItem, ListItemIcon, ListItemText, Tooltip, Avatar,
} from '@mui/material';
import {
    Visibility, VisibilityOff,
    AccountBalance, CreditCard, Savings, BusinessCenter,
    MoreVert, OpenInNew, Edit, Delete, Star,
} from '@mui/icons-material';

const CATEGORY_GRADIENT = {
    liability: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
    equity: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    asset: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 100%)',
};

const CATEGORY_BG_DARK = {
    liability: 'linear-gradient(145deg, rgba(239,68,68,0.12), rgba(249,115,22,0.06))',
    equity: 'linear-gradient(145deg, rgba(16,185,129,0.12), rgba(52,211,153,0.06))',
    asset: 'linear-gradient(145deg, rgba(79,70,229,0.12), rgba(129,140,248,0.06))',
};
const CATEGORY_BG_LIGHT = {
    liability: 'linear-gradient(145deg, #fff5f5, #fff7ed)',
    equity: 'linear-gradient(145deg, #f0fdf4, #ecfdf5)',
    asset: 'linear-gradient(145deg, #eef2ff, #f5f3ff)',
};

const getAccountIcon = (typeName = '') => {
    const t = typeName.toLowerCase();
    if (t.includes('credit')) return <CreditCard />;
    if (t.includes('invest') || t.includes('saving')) return <Savings />;
    if (t.includes('business')) return <BusinessCenter />;
    return <AccountBalance />;
};

const CHIP_COLORS = { active: 'success', inactive: 'default', frozen: 'warning', closed: 'error' };

const AccountList = ({
    accounts, showBalances, setShowBalances, setShowAddModal,
    onEdit, onDelete, onViewDetail,
}) => {
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuAccount, setMenuAccount] = useState(null);

    const openMenu = (e, account) => {
        e.stopPropagation();
        setMenuAnchor(e.currentTarget);
        setMenuAccount(account);
    };
    const closeMenu = () => { setMenuAnchor(null); setMenuAccount(null); };

    const handleMenuAction = (action) => {
        closeMenu();
        if (action === 'view') onViewDetail?.(menuAccount);
        if (action === 'edit') onEdit?.(menuAccount);
        if (action === 'delete') onDelete?.(menuAccount);
    };

    const fmtBalance = (val) =>
        showBalances
            ? `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '••••••';

    /* ── Empty State ────────────────────────────────────────────────── */
    if (!accounts || accounts.length === 0) {
        return (
            <Box sx={{
                textAlign: 'center', py: 10, bgcolor: 'background.paper',
                borderRadius: '20px', border: '1px dashed', borderColor: 'divider'
            }}>
                <AccountBalance sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={600}>No accounts yet</Typography>
                <Typography variant="body2" color="text.disabled" mb={3}>
                    Add your first account to start tracking your finances
                </Typography>
                <Button
                    variant="contained" onClick={() => setShowAddModal(true)}
                    sx={{
                        borderRadius: '12px', px: 3,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                    }}
                >
                    Add Account
                </Button>
            </Box>
        );
    }

    /* ── Card Grid ──────────────────────────────────────────────────── */
    return (
        <Box>
            {/* Toolbar */}
            <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                    size="small"
                    startIcon={showBalances ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    onClick={() => setShowBalances(!showBalances)}
                    sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem' }}
                >
                    {showBalances ? 'Hide Balances' : 'Show Balances'}
                </Button>
            </Box>

            <Grid container spacing={2.5}>
                {accounts.map((account) => {
                    const category = account.account_type_category || account.accountTypeCategory || 'asset';
                    const typeName = account.account_type_name || account.accountTypeName || '';
                    const institution = account.institution_name || account.institutionName || '';
                    const maskedNum = account.account_number_masked || account.accountNumberMasked || '';
                    const status = account.account_status || account.accountStatus || 'active';
                    const isPrimary = account.is_primary || account.isPrimary;
                    const gradient = CATEGORY_GRADIENT[category] || CATEGORY_GRADIENT.asset;
                    const name = account.account_name || account.accountName || 'Account';

                    return (
                        <Grid key={account.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                            <Paper
                                elevation={0}
                                onClick={() => onViewDetail?.(account)}
                                sx={{
                                    borderRadius: '20px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    background: (theme) =>
                                        theme.palette.mode === 'dark'
                                            ? CATEGORY_BG_DARK[category] || CATEGORY_BG_DARK.asset
                                            : CATEGORY_BG_LIGHT[category] || CATEGORY_BG_LIGHT.asset,
                                    backdropFilter: 'blur(12px)',
                                    transition: 'all 0.22s ease',
                                    position: 'relative',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: '0 16px 40px rgba(0,0,0,0.14)',
                                        borderColor: 'primary.main',
                                    },
                                }}
                            >
                                {/* Gradient top bar */}
                                <Box sx={{ height: 4, background: gradient }} />

                                {/* Card content */}
                                <Box p={2.5}>
                                    {/* Row 1: Icon + Menu */}
                                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={2}>
                                        <Box
                                            sx={{
                                                width: 52, height: 52, borderRadius: '14px',
                                                background: gradient,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                                                '& svg': { fontSize: 26, color: 'white' },
                                            }}
                                        >
                                            {getAccountIcon(typeName)}
                                        </Box>

                                        <IconButton
                                            size="small"
                                            onClick={(e) => openMenu(e, account)}
                                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </Box>

                                    {/* Row 2: Name + Primary star */}
                                    <Box display="flex" alignItems="center" gap={0.75} mb={0.4}>
                                        <Typography variant="subtitle1" fontWeight={800} letterSpacing={-0.2} noWrap>
                                            {name}
                                        </Typography>
                                        {isPrimary && (
                                            <Tooltip title="Primary Account">
                                                <Star sx={{ fontSize: 14, color: 'warning.main', flexShrink: 0 }} />
                                            </Tooltip>
                                        )}
                                    </Box>

                                    {/* Row 3: Institution / masked number */}
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.78rem' }} noWrap mb={1.5}>
                                        {institution || 'No institution'}
                                        {maskedNum ? ` · ${maskedNum}` : ''}
                                    </Typography>

                                    {/* Row 4: Balance */}
                                    <Typography
                                        variant="h5"
                                        fontWeight={800}
                                        letterSpacing={-0.5}
                                        sx={{
                                            mb: 0.5,
                                            background: gradient,
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: showBalances ? 'transparent' : 'inherit',
                                            backgroundClip: 'text',
                                        }}
                                    >
                                        {fmtBalance(account.balance)}
                                    </Typography>

                                    {(account.available_balance !== undefined || account.availableBalance !== undefined) && (
                                        <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                                            Available: {fmtBalance(account.available_balance ?? account.availableBalance)}
                                        </Typography>
                                    )}

                                    {/* Row 5: Chips */}
                                    <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                                        <Chip
                                            label={status}
                                            size="small"
                                            color={CHIP_COLORS[status] || 'default'}
                                            sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                                        />
                                        {typeName && (
                                            <Chip
                                                label={typeName}
                                                size="small"
                                                variant="outlined"
                                                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 500 }}
                                            />
                                        )}
                                    </Box>
                                </Box>
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={closeMenu}
                PaperProps={{
                    sx: {
                        borderRadius: '12px', minWidth: 160,
                        border: '1px solid', borderColor: 'divider',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    },
                }}
            >
                <MenuItem onClick={() => handleMenuAction('view')} sx={{ py: 1 }}>
                    <ListItemIcon><OpenInNew fontSize="small" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        View Details
                    </ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleMenuAction('edit')} sx={{ py: 1 }}>
                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        Edit
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => handleMenuAction('delete')}
                    sx={{ py: 1, color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}
                >
                    <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        Delete
                    </ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default AccountList;
