import React, { useState } from 'react';
import {
    Box, Typography, Button, IconButton, Chip, Grid, Paper,
    Menu, MenuItem, ListItemIcon, ListItemText, Tooltip, Avatar,
} from '@mui/material';
import {
    Visibility, VisibilityOff,
    AccountBalance, CreditCard, Savings, BusinessCenter,
    MoreVert, OpenInNew, Edit, Delete, Star,
    GridView, ViewList,
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
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'compact'

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
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box sx={{ display: 'flex', gap: 1, p: 0.5, bgcolor: 'action.hover', borderRadius: '10px' }}>
                    <IconButton 
                        size="small" 
                        onClick={() => setViewMode('grid')}
                        sx={{ 
                            borderRadius: '8px',
                            color: viewMode === 'grid' ? 'primary.main' : 'text.disabled',
                            bgcolor: viewMode === 'grid' ? 'background.paper' : 'transparent',
                            boxShadow: viewMode === 'grid' ? 1 : 0,
                            '&:hover': { bgcolor: viewMode === 'grid' ? 'background.paper' : 'action.selected' }
                        }}
                    >
                        <GridView fontSize="small" />
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={() => setViewMode('compact')}
                        sx={{ 
                            borderRadius: '8px',
                            color: viewMode === 'compact' ? 'primary.main' : 'text.disabled',
                            bgcolor: viewMode === 'compact' ? 'background.paper' : 'transparent',
                            boxShadow: viewMode === 'compact' ? 1 : 0,
                            '&:hover': { bgcolor: viewMode === 'compact' ? 'background.paper' : 'action.selected' }
                        }}
                    >
                        <ViewList fontSize="small" />
                    </IconButton>
                </Box>
                <Button
                    size="small"
                    startIcon={showBalances ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    onClick={() => setShowBalances(!showBalances)}
                    sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.75rem' }}
                >
                    {showBalances ? 'Hide Balances' : 'Show Balances'}
                </Button>
            </Box>

            {viewMode === 'compact' ? (
                <Paper
                    elevation={0}
                    sx={{
                        borderRadius: '16px',
                        border: '1px solid',
                        borderColor: 'divider',
                        overflow: 'hidden',
                        background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,30,46,0.6)' : '#fff',
                    }}
                >
                    <Box sx={{ overflowX: 'auto' }}>
                        <Box sx={{ minWidth: 800 }}>
                            {/* Header Row */}
                            <Box sx={{ 
                                display: 'flex', px: 2, py: 1, 
                                borderBottom: '1px solid', borderColor: 'divider', 
                                bgcolor: 'action.hover' 
                            }}>
                                <Typography sx={{ flex: 1.5, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'text.disabled' }}>Account</Typography>
                                <Typography sx={{ flex: 1, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'text.disabled' }}>Type</Typography>
                                <Typography sx={{ flex: 1, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'text.disabled' }}>Institution</Typography>
                                <Typography sx={{ flex: 1.2, textAlign: 'right', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: 'text.disabled' }}>Balance</Typography>
                                <Typography sx={{ width: 40 }} />
                            </Box>
                            
                            {/* Account Rows */}
                            {accounts
                            .filter(a => 
                                (a.account_type_category || a.accountTypeCategory) !== 'liability' && 
                                !(a.account_name || a.accountName)?.toLowerCase().startsWith('credit card - ')
                            )
                            .map((account, idx, filteredArr) => {
                                const category = account.account_type_category || account.accountTypeCategory || 'asset';
                                const typeName = account.account_type_name || account.accountTypeName || '';
                                const institution = account.institution_name || account.institutionName || '';
                                const gradient = CATEGORY_GRADIENT[category] || CATEGORY_GRADIENT.asset;
                                const name = account.account_name || account.accountName || 'Account';
                                
                                return (
                                    <Box 
                                        key={account.id}
                                        onClick={() => onViewDetail?.(account)}
                                        sx={{ 
                                            display: 'flex', alignItems: 'center', px: 2, py: 1, 
                                            borderBottom: idx < filteredArr.length - 1 ? '1px solid' : 'none', 
                                            borderColor: 'divider',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' }
                                        }}
                                    >
                                        <Box sx={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Box sx={{ 
                                                width: 32, height: 32, borderRadius: '8px', 
                                                background: gradient, display: 'flex', 
                                                alignItems: 'center', justifyContent: 'center',
                                                '& svg': { fontSize: 16, color: 'white' }
                                            }}>
                                                {getAccountIcon(typeName)}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} noWrap>
                                                    {name}
                                                    {account.is_primary || account.isPrimary ? <Star sx={{ ml: 0.5, fontSize: 12, color: 'warning.main' }} /> : null}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                                    {account.account_number_masked || account.accountNumberMasked || '••••'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        
                                        <Box sx={{ flex: 1 }}>
                                            <Chip 
                                                label={typeName} 
                                                size="small" 
                                                variant="outlined" 
                                                sx={{ height: 18, fontSize: '0.6rem', fontWeight: 600 }} 
                                            />
                                        </Box>
                                        
                                        <Typography variant="body2" color="text.secondary" sx={{ flex: 1, fontSize: '0.75rem' }}>
                                            {institution || '—'}
                                        </Typography>
                                        
                                        <Box sx={{ flex: 1.2, textAlign: 'right' }}>
                                            <Typography 
                                                variant="body2" 
                                                fontWeight={800}
                                                sx={{ 
                                                    background: gradient, 
                                                    WebkitBackgroundClip: 'text', 
                                                    WebkitTextFillColor: showBalances ? 'transparent' : 'inherit',
                                                    backgroundClip: 'text'
                                                }}
                                            >
                                                {fmtBalance(account.balance)}
                                            </Typography>
                                        </Box>
                                        
                                        <Box sx={{ width: 40, textAlign: 'right' }}>
                                            <IconButton size="small" onClick={(e) => openMenu(e, account)}>
                                                <MoreVert fontSize="inherit" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {accounts
                    .filter(a => 
                        (a.account_type_category || a.accountTypeCategory) !== 'liability' && 
                        !(a.account_name || a.accountName)?.toLowerCase().startsWith('credit card - ')
                    )
                    .map((account) => {
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
                                        borderRadius: '16px',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        background: (theme) =>
                                            theme.palette.mode === 'dark'
                                                ? CATEGORY_BG_DARK[category] || CATEGORY_BG_DARK.asset
                                                : CATEGORY_BG_LIGHT[category] || CATEGORY_BG_LIGHT.asset,
                                        backdropFilter: 'blur(12px)',
                                        transition: 'all 0.2s ease',
                                        position: 'relative',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                            borderColor: 'primary.main',
                                        },
                                    }}
                                >
                                    <Box sx={{ height: 3, background: gradient }} />
                                    <Box p={2}>
                                        <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                                            <Box
                                                sx={{
                                                    width: 44, height: 44, borderRadius: '12px',
                                                    background: gradient,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                                    '& svg': { fontSize: 22, color: 'white' },
                                                }}
                                            >
                                                {getAccountIcon(typeName)}
                                            </Box>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => openMenu(e, account)}
                                            >
                                                <MoreVert fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box display="flex" alignItems="center" gap={0.75} mb={0.25}>
                                            <Typography variant="body2" fontWeight={800} letterSpacing={-0.1} noWrap>
                                                {name}
                                            </Typography>
                                            {isPrimary && <Star sx={{ fontSize: 12, color: 'warning.main' }} />}
                                        </Box>

                                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5} sx={{ fontSize: '0.72rem' }} noWrap>
                                            {institution || '—'} {maskedNum ? ` · ${maskedNum}` : ''}
                                        </Typography>

                                        <Typography
                                            variant="h6"
                                            fontWeight={800}
                                            sx={{
                                                mb: 0.25,
                                                background: gradient,
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: showBalances ? 'transparent' : 'inherit',
                                                backgroundClip: 'text',
                                            }}
                                        >
                                            {fmtBalance(account.balance)}
                                        </Typography>

                                        <Box display="flex" alignItems="center" justifyContent="space-between">
                                            <Box display="flex" gap={0.5}>
                                                <Chip
                                                    label={status}
                                                    size="small"
                                                    color={CHIP_COLORS[status] || 'default'}
                                                    sx={{ height: 16, fontSize: '0.62rem', fontWeight: 700 }}
                                                />
                                                <Chip
                                                    label={typeName}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ height: 16, fontSize: '0.62rem', fontWeight: 600 }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

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
