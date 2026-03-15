import React, { useState } from 'react';
import {
    Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, Chip, IconButton, Button, Menu, MenuItem, ListItemIcon, Avatar,
    Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
    Checkbox, Tooltip, CircularProgress
} from '@mui/material';
import {
    MoreVert, Edit, Delete, TrendingUp, TrendingDown, SwapHoriz,
    AccountBalanceWallet, CheckCircle, ChangeCircle
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { 
    deleteTransaction, fetchTransactions, deleteBulkTransactions,
    updateBulkTransactionsCategory, updateBulkTransactionsStatus
} from '../../slices/transactionsSlice';
import { fetchCategories } from '../../slices/categoriesSlice';

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
    const categories = useSelector((state) => state.categories?.items || []);
    
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuTx, setMenuTx] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [selectedIds, setSelectedIds] = useState([]);
    const [statusMenuAnchor, setStatusMenuAnchor] = useState(null);
    const [categoryMenuAnchor, setCategoryMenuAnchor] = useState(null);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [bulkUpdating, setBulkUpdating] = useState(false);
    const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

    React.useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    const handleSelectAllClick = (event) => {
        if (event.target.checked) {
            setSelectedIds(filteredTransactions.map((tx) => tx.id));
            return;
        }
        setSelectedIds([]);
    };

    const handleSelectClick = (event, id) => {
        const selectedIndex = selectedIds.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedIds, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedIds.slice(1));
        } else if (selectedIndex === selectedIds.length - 1) {
            newSelected = newSelected.concat(selectedIds.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(
                selectedIds.slice(0, selectedIndex),
                selectedIds.slice(selectedIndex + 1)
            );
        }
        setSelectedIds(newSelected);
    };

    const isSelected = (id) => selectedIds.indexOf(id) !== -1;

    const handleBulkDelete = async () => {
        setBulkDeleting(true);
        const result = await dispatch(deleteBulkTransactions(selectedIds));
        if (deleteBulkTransactions.fulfilled.match(result)) {
            dispatch(fetchTransactions());
            onSuccess?.(`${selectedIds.length} transactions deleted.`);
            setSelectedIds([]);
        }
        setBulkDeleting(false);
        setConfirmBulkDelete(false);
    };

    const handleBulkStatus = async (status) => {
        setStatusMenuAnchor(null);
        setBulkUpdating(true);
        const result = await dispatch(updateBulkTransactionsStatus({ transactionIds: selectedIds, status }));
        if (updateBulkTransactionsStatus.fulfilled.match(result)) {
            dispatch(fetchTransactions());
            onSuccess?.(`${selectedIds.length} transactions updated.`);
            setSelectedIds([]);
        }
        setBulkUpdating(false);
    };

    const handleBulkCategory = async (categoryId) => {
        setCategoryMenuAnchor(null);
        setBulkUpdating(true);
        const result = await dispatch(updateBulkTransactionsCategory({ transactionIds: selectedIds, categoryId }));
        if (updateBulkTransactionsCategory.fulfilled.match(result)) {
            dispatch(fetchTransactions());
            onSuccess?.(`${selectedIds.length} transactions categorized.`);
            setSelectedIds([]);
        }
        setBulkUpdating(false);
    };

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
                    sx={{
                        borderBottom: '1px solid', borderColor: 'divider',
                        bgcolor: selectedIds.length > 0 ? 'action.selected' : 'transparent',
                        transition: 'background-color 0.2s',
                    }}
                >
                    {selectedIds.length > 0 ? (
                        <Box display="flex" alignItems="center" gap={2} width="100%">
                            <Typography color="inherit" variant="subtitle1" component="div" fontWeight={600}>
                                {selectedIds.length} selected
                            </Typography>
                            <Box flexGrow={1} />
                            
                            <Tooltip title="Categorize">
                                <IconButton onClick={(e) => setCategoryMenuAnchor(e.currentTarget)} disabled={bulkDeleting || bulkUpdating}>
                                    <ChangeCircle />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Change Status">
                                <IconButton onClick={(e) => setStatusMenuAnchor(e.currentTarget)} disabled={bulkDeleting || bulkUpdating}>
                                    <CheckCircle />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                                <IconButton onClick={() => setConfirmBulkDelete(true)} color="error" disabled={bulkDeleting || bulkUpdating}>
                                    <Delete />
                                </IconButton>
                            </Tooltip>
                            {(bulkDeleting || bulkUpdating) && <CircularProgress size={24} sx={{ ml: 2 }} />}
                        </Box>
                    ) : (
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ width: 4, height: 20, borderRadius: 2, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }} />
                            <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>
                                Transactions
                            </Typography>
                            <Typography variant="caption" color="text.disabled" fontWeight={600}>
                                ({filteredTransactions.length})
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Table */}
                <TableContainer>
                    <Table size="small" sx={{ minWidth: 700 }}>
                        <TableHead>
                            <TableRow sx={{
                                '& th': {
                                    fontWeight: 700, fontSize: '0.66rem', letterSpacing: 0.5,
                                    textTransform: 'uppercase', color: 'text.disabled', py: 0.75, px: 1,
                                }
                            }}>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        color="primary"
                                        indeterminate={selectedIds.length > 0 && selectedIds.length < filteredTransactions.length}
                                        checked={filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length}
                                        onChange={handleSelectAllClick}
                                    />
                                </TableCell>
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
                                        '& td': { py: 0.75, px: 1, borderColor: 'divider' },
                                    }}
                                >
                                    {/* Checkbox */}
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            color="primary"
                                            checked={isSelected(tx.id)}
                                            onChange={(event) => handleSelectClick(event, tx.id)}
                                        />
                                    </TableCell>

                                    {/* Transaction name + type icon */}
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box sx={{
                                                width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                                                background: TYPE_GRADIENT[tx.type] || TYPE_GRADIENT.expense,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                '& svg': { color: 'white', fontSize: 16 },
                                            }}>
                                                {TYPE_ICONS[tx.type] || <AccountBalanceWallet sx={{ fontSize: 16 }} />}
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
                                            {tx.type === 'transfer' 
                                                ? 'Transfer' 
                                                : (tx.category_name || tx.categoryName || 'Uncategorized')}
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

            {/* Bulk Actions Menus */}
            <Menu
                anchorEl={statusMenuAnchor}
                open={Boolean(statusMenuAnchor)}
                onClose={() => setStatusMenuAnchor(null)}
                PaperProps={{ sx: { borderRadius: '12px', minWidth: 140 } }}
            >
                <MenuItem onClick={() => handleBulkStatus('completed')}>Completed</MenuItem>
                <MenuItem onClick={() => handleBulkStatus('pending')}>Pending</MenuItem>
                <MenuItem onClick={() => handleBulkStatus('failed')}>Failed</MenuItem>
                <MenuItem onClick={() => handleBulkStatus('cancelled')}>Cancelled</MenuItem>
            </Menu>

            <Menu
                anchorEl={categoryMenuAnchor}
                open={Boolean(categoryMenuAnchor)}
                onClose={() => setCategoryMenuAnchor(null)}
                PaperProps={{ sx: { borderRadius: '12px', minWidth: 160, maxHeight: 300 } }}
            >
                {categories.map((cat) => (
                    <MenuItem key={cat.id} onClick={() => handleBulkCategory(cat.id)}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cat.color || '#ccc' }} />
                            <Typography variant="body2">{cat.name}</Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Menu>

            {/* Bulk Delete Confirm */}
            <Dialog
                open={confirmBulkDelete}
                onClose={() => !bulkDeleting && setConfirmBulkDelete(false)}
                maxWidth="xs" fullWidth
                PaperProps={{ sx: { borderRadius: '16px' } }}
            >
                <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Delete {selectedIds.length} Transactions?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete these {selectedIds.length} transactions? This cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setConfirmBulkDelete(false)} color="inherit" disabled={bulkDeleting}>Cancel</Button>
                    <Button
                        onClick={handleBulkDelete} variant="contained" color="error" disabled={bulkDeleting}
                        sx={{ borderRadius: '10px', fontWeight: 700 }}
                    >
                        {bulkDeleting ? 'Deleting…' : 'Yes, Delete All'}
                    </Button>
                </DialogActions>
            </Dialog>

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
