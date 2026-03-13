import React, { useState } from 'react';
import {
    Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, Chip, IconButton, Button, Menu, MenuItem, ListItemIcon, Avatar,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material';
import {
    MoreVert, Edit, Delete, TrendingUp, TrendingDown, SwapHoriz,
    AccountBalanceWallet,
} from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { deleteTransaction, fetchTransactions } from '../../slices/transactionsSlice';

const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const fmt = (val) =>
    `₹${(Number(val) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TYPE_GRADIENT = {
    income: 'linear-gradient(135deg,#10b981,#34d399)',
    expense: 'linear-gradient(135deg,#ef4444,#f97316)',
    transfer: 'linear-gradient(135deg,#3b82f6,#60a5fa)',
};
const TYPE_ICONS = {
    income: <TrendingUp fontSize="small" />,
    expense: <TrendingDown fontSize="small" />,
    transfer: <SwapHoriz fontSize="small" />,
};
const STATUS_COLORS = { completed: 'success', pending: 'warning', failed: 'error', cancelled: 'default' };

const TransactionTable = ({ filteredTransactions, setShowAddModal, onEdit, onSuccess }) => {
    const dispatch = useDispatch();
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuTx, setMenuTx] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const openMenu = (e, tx) => { setMenuAnchor(e.currentTarget); setMenuTx(tx); };
    const closeMenu = () => { setMenuAnchor(null); setMenuTx(null); };

    const handleEdit = () => { closeMenu(); onEdit?.(menuTx); };
    const handleDeleteClick = () => { setDeleteTarget(menuTx); closeMenu(); };

    const handleDeleteConfirm = async () => {
        setDeleting(true);
        const result = await dispatch(deleteTransaction(deleteTarget.id));
        if (deleteTransaction.fulfilled.match(result)) {
            dispatch(fetchTransactions());
            onSuccess?.('Transaction deleted.');
        }
        setDeleting(false);
        setDeleteTarget(null);
    };

    /* ── Empty State ── */
    if (!filteredTransactions || filteredTransactions.length === 0) {
        return (
            <Box
                sx={{
                    textAlign: 'center', py: 10,
                    borderRadius: '20px', border: '1px dashed', borderColor: 'divider',
                    bgcolor: 'background.paper',
                }}
            >
                <AccountBalanceWallet sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" color="text.secondary" fontWeight={600}>No transactions found</Typography>
                <Typography variant="body2" color="text.disabled" mb={3}>
                    Try adjusting your filters or add a new transaction
                </Typography>
                <Button
                    variant="contained"
                    onClick={() => setShowAddModal(true)}
                    sx={{
                        borderRadius: '12px', px: 3,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                    }}
                >
                    Add Transaction
                </Button>
            </Box>
        );
    }

    return (
        <>
            <Box
                sx={{
                    borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: 'divider',
                    background: (theme) =>
                        theme.palette.mode === 'dark'
                            ? 'linear-gradient(145deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))'
                            : 'linear-gradient(145deg,#ffffff,#f8fafc)',
                }}
            >
                {/* Header */}
                <Box
                    px={3} py={2}
                    display="flex" alignItems="center" justifyContent="space-between"
                    sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
                >
                    <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{ width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }} />
                        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>
                            Transactions
                        </Typography>
                        <Typography variant="caption" color="text.disabled" fontWeight={600}>
                            ({filteredTransactions.length})
                        </Typography>
                    </Box>
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table size="small" sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{
                                '& th': {
                                    fontWeight: 700, fontSize: '0.68rem', letterSpacing: 0.8,
                                    textTransform: 'uppercase', color: 'text.disabled', py: 1.5,
                                }
                            }}>
                                <TableCell>Transaction</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Account</TableCell>
                                <TableCell>Date</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell align="right" padding="checkbox" />
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredTransactions.map((tx) => (
                                <TableRow
                                    key={tx.id}
                                    sx={{
                                        '&:hover': { bgcolor: 'action.hover' },
                                        '& td': { py: 1.5, borderColor: 'divider' },
                                    }}
                                >
                                    {/* Transaction name + type icon */}
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1.5}>
                                            <Box sx={{
                                                width: 36, height: 36, borderRadius: '10px', flexShrink: 0,
                                                background: TYPE_GRADIENT[tx.type] || TYPE_GRADIENT.expense,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                '& svg': { color: 'white', fontSize: 18 },
                                            }}>
                                                {TYPE_ICONS[tx.type] || <AccountBalanceWallet fontSize="small" />}
                                            </Box>
                                            <Box>
                                                <Typography variant="body2" fontWeight={700} letterSpacing={-0.1}>
                                                    {tx.description || tx.merchant || 'Transaction'}
                                                </Typography>
                                                {tx.merchant && tx.description && (
                                                    <Typography variant="caption" color="text.secondary">{tx.merchant}</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>

                                    {/* Category */}
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {tx.category_name || tx.categoryName || '—'}
                                        </Typography>
                                    </TableCell>

                                    {/* Account */}
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {tx.type === 'transfer' ? (
                                                <>
                                                    <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                        {tx.account_name || tx.accountName || '—'}
                                                    </Box>
                                                    <SwapHoriz sx={{ fontSize: 14, opacity: 0.5 }} />
                                                    <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                                                        {tx.transfer_account_name || tx.transferAccountName || '—'}
                                                    </Box>
                                                </>
                                            ) : (
                                                tx.is_cash || tx.isCash
                                                    ? (tx.cash_source || tx.cashSource ? `💵 Cash (${tx.cash_source || tx.cashSource})` : '💵 Cash')
                                                    : (tx.account_name || tx.accountName || '—')
                                            )}
                                        </Typography>
                                    </TableCell>

                                    {/* Date */}
                                    <TableCell>
                                        <Typography variant="body2" color="text.secondary">
                                            {fmtDate(tx.transaction_date || tx.transactionDate)}
                                        </Typography>
                                    </TableCell>

                                    {/* Status chip */}
                                    <TableCell>
                                        <Chip
                                            label={tx.status}
                                            size="small"
                                            color={STATUS_COLORS[tx.status] || 'default'}
                                            sx={{ fontSize: '0.68rem', height: 22, fontWeight: 700 }}
                                        />
                                    </TableCell>

                                    {/* Amount */}
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            fontWeight={800}
                                            sx={{
                                                color: tx.type === 'income' ? 'success.main'
                                                    : tx.type === 'expense' ? 'error.main' : 'info.main',
                                            }}
                                        >
                                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '−' : ''}
                                            {fmt(Math.abs(tx.amount))}
                                        </Typography>
                                    </TableCell>

                                    {/* Menu */}
                                    <TableCell align="right" padding="checkbox">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => openMenu(e, tx)}
                                            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                                        >
                                            <MoreVert fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Context Menu */}
            <Menu
                anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}
                PaperProps={{ sx: { borderRadius: '12px', minWidth: 140, border: '1px solid', borderColor: 'divider' } }}
            >
                <MenuItem onClick={handleEdit} sx={{ py: 1 }}>
                    <ListItemIcon><Edit fontSize="small" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>Edit</Typography>
                </MenuItem>
                <MenuItem
                    onClick={handleDeleteClick}
                    sx={{ py: 1, color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}
                >
                    <ListItemIcon><Delete fontSize="small" /></ListItemIcon>
                    <Typography variant="body2" fontWeight={600}>Delete</Typography>
                </MenuItem>
            </Menu>

            {/* Delete Confirm */}
            <Dialog
                open={Boolean(deleteTarget)}
                onClose={() => !deleting && setDeleteTarget(null)}
                maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Delete Transaction?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete{' '}
                        <strong>{deleteTarget?.description || deleteTarget?.merchant || 'this transaction'}</strong>?
                        This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setDeleteTarget(null)} color="inherit" disabled={deleting}>Cancel</Button>
                    <Button
                        onClick={handleDeleteConfirm} variant="contained" color="error" disabled={deleting}
                        sx={{ borderRadius: '10px', fontWeight: 700 }}
                    >
                        {deleting ? 'Deleting…' : 'Yes, Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TransactionTable;
