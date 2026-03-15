import React, { useEffect } from 'react';
import {
  Box, Typography, Button, Chip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Pagination, Alert, CircularProgress, Menu, MenuItem, ListItemIcon,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet, SwapHoriz, TrendingUp, TrendingDown
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCreditCardTransactions,
  deleteCreditCardTransaction,
  getCreditCardTransactionSummary
} from '../../slices/creditCardTransactionsSlice';
import AddCreditCardTransactionDialog from './AddCreditCardTransactionDialog';
import { useDialog, useForm } from '../../hooks';
import { formatAmount, formatDate } from '../../utils';
import { TRANSACTION_TYPES } from '../../constants';

const TYPE_GRADIENT = {
  [TRANSACTION_TYPES.PURCHASE]: 'linear-gradient(135deg,#ef4444,#f97316)',
  [TRANSACTION_TYPES.PAYMENT]: 'linear-gradient(135deg,#10b981,#34d399)',
  [TRANSACTION_TYPES.CASH_ADVANCE]: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
  [TRANSACTION_TYPES.BALANCE_TRANSFER]: 'linear-gradient(135deg,#3b82f6,#60a5fa)',
  [TRANSACTION_TYPES.FEE]: 'linear-gradient(135deg,#ef4444,#dc2626)',
  [TRANSACTION_TYPES.INTEREST]: 'linear-gradient(135deg,#ef4444,#dc2626)',
};

const TYPE_ICONS = {
  [TRANSACTION_TYPES.PURCHASE]: <ShoppingCartIcon fontSize="small" />,
  [TRANSACTION_TYPES.PAYMENT]: <PaymentIcon fontSize="small" />,
  [TRANSACTION_TYPES.CASH_ADVANCE]: <AccountBalanceIcon fontSize="small" />,
  [TRANSACTION_TYPES.BALANCE_TRANSFER]: <SwapHoriz fontSize="small" />,
  [TRANSACTION_TYPES.FEE]: <TrendingDown fontSize="small" />,
  [TRANSACTION_TYPES.INTEREST]: <TrendingDown fontSize="small" />,
};

const CreditCardTransactionList = ({ creditCard }) => {
  const dispatch = useDispatch();
  const { transactions, loading, error, pagination, summary } = useSelector(
    (state) => state.creditCardTransactions
  );

  const { form: paginationForm, set: setPagination } = useForm({ page: 1 });
  const { open: dialogOpen, openDialog: openTransactionDialog, closeDialog: closeTransactionDialog } = useDialog();
  const { open: deleteDialogOpen, openDialog: openDeleteDialog, closeDialog: closeDeleteDialog } = useDialog();
  const { form: menuForm, setForm: setMenuForm } = useForm({ anchorEl: null, selectedTransaction: null });
  const { form: editForm, setForm: setEditForm } = useForm({ editingTransaction: null });
  const { form: deleteForm, setForm: setDeleteForm } = useForm({ deletingTransaction: null });

  const { page } = paginationForm;

  useEffect(() => {
    if (creditCard?.id) {
      dispatch(fetchCreditCardTransactions({
        creditCardId: creditCard.id,
        params: { page, limit: 25 }
      }));
      dispatch(getCreditCardTransactionSummary({
        creditCardId: creditCard.id
      }));
    }
  }, [dispatch, creditCard?.id, page]);

  const handlePageChange = (event, newPage) => {
    setPagination('page')(newPage);
  };

  const handleAddTransaction = () => {
    setEditForm({ editingTransaction: null });
    openTransactionDialog();
  };

  const handleEditTransaction = (transaction) => {
    setEditForm({ editingTransaction: transaction });
    openTransactionDialog();
  };

  const handleDeleteTransaction = (transaction) => {
    setDeleteForm({ deletingTransaction: transaction });
    openDeleteDialog();
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteCreditCardTransaction({
        creditCardId: creditCard.id,
        transactionId: deleteForm.deletingTransaction.id
      })).unwrap();

      closeDeleteDialog();
      setDeleteForm({ deletingTransaction: null });
      dispatch(fetchCreditCardTransactions({
        creditCardId: creditCard.id,
        params: { page: paginationForm.page, limit: 25 }
      }));
      dispatch(getCreditCardTransactionSummary({ creditCardId: creditCard.id }));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const handleMenuOpen = (event, transaction) => {
    setMenuForm({ anchorEl: event.currentTarget, selectedTransaction: transaction });
  };

  const handleMenuClose = () => {
    setMenuForm({ anchorEl: null, selectedTransaction: null });
  };

  if (!creditCard) {
    return (
      <Alert severity="info" sx={{ borderRadius: '12px' }}>
        Please select a credit card to view transactions
      </Alert>
    );
  }

  return (
    <Box>
      {/* Action Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>
            Transactions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddTransaction}
          sx={{
            borderRadius: '12px', px: 3, fontWeight: 700,
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
            '&:hover': { opacity: 0.9, boxShadow: '0 6px 20px rgba(79,70,229,0.5)' }
          }}
        >
          Add Transaction
        </Button>
      </Box>

      {/* Summary Box */}
      {summary?.summary && (
        <Box sx={{
          p: 2.5, mb: 3, borderRadius: '16px',
          border: '1px solid', borderColor: 'divider',
          display: 'flex', gap: 4, flexWrap: 'wrap',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(145deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))'
            : 'linear-gradient(145deg,#ffffff,#f8fafc)',
        }}>
          <Box>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Purchases</Typography>
            <Typography variant="h6" fontWeight={700} color="error.main">{formatAmount(summary.summary.total_purchases)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Payments</Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">{formatAmount(summary.summary.total_payments)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" mb={0.5}>Rewards Earned</Typography>
            <Typography variant="h6" fontWeight={700} color="primary.main">{formatAmount(summary.summary.total_rewards || 0)}</Typography>
          </Box>
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

      {/* Table Container */}
      <Box sx={{
        borderRadius: '20px', overflow: 'hidden', border: '1px solid', borderColor: 'divider',
        background: (theme) => theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg,rgba(30,41,59,0.9),rgba(15,23,42,0.9))'
          : 'linear-gradient(145deg,#ffffff,#f8fafc)',
      }}>
        <TableContainer>
          <Table size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{
                '& th': {
                  fontWeight: 700, fontSize: '0.66rem', letterSpacing: 0.5,
                  textTransform: 'uppercase', color: 'text.disabled', py: 0.75, px: 1,
                }
              }}>
                <TableCell>Transaction</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Merchant</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right" padding="checkbox" />
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <AccountBalanceWallet sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.3 }} />
                    <Typography variant="h6" color="text.secondary" fontWeight={600}>No transactions found</Typography>
                    <Typography variant="body2" color="text.disabled" mb={3}>
                      Your credit card transactions will appear here
                    </Typography>
                    <Button
                      variant="outlined" startIcon={<AddIcon />} onClick={handleAddTransaction}
                      sx={{ borderRadius: '10px' }}
                    >
                      Add Your First Transaction
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((tx) => (
                  <TableRow key={tx.id} sx={{ '&:hover': { bgcolor: 'action.hover' }, '& td': { py: 0.75, px: 1, borderColor: 'divider' } }}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{
                          width: 30, height: 30, borderRadius: '8px', flexShrink: 0,
                          background: TYPE_GRADIENT[tx.transactionType] || TYPE_GRADIENT[TRANSACTION_TYPES.PURCHASE],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          '& svg': { color: 'white', fontSize: 16 },
                        }}>
                          {TYPE_ICONS[tx.transactionType] || <AccountBalanceWallet sx={{ fontSize: 16 }} />}
                        </Box>
                        <Box>
                          <Typography variant="body2" fontWeight={700} letterSpacing={-0.1}>
                            {tx.description || tx.merchant || 'Transaction'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {(tx.transactionType || 'PURCHASE').replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(tx.transactionDate)}
                      </Typography>
                      {tx.postedDate && (
                        <Typography variant="caption" color="text.disabled" display="block">
                          Posted: {formatDate(tx.postedDate)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {tx.merchant || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {tx.category ? (
                        <Chip label={tx.category} size="small" variant="outlined" sx={{ fontSize: '0.68rem', height: 22 }} />
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2" fontWeight={800}
                        sx={{ color: tx.isPayment ? 'success.main' : 'error.main' }}
                      >
                        {tx.isPayment ? '+' : '-'}{formatAmount(tx.amount)}
                      </Typography>
                      {tx.rewardsEarned > 0 && (
                        <Typography variant="caption" color="primary.main" display="block">
                          🎯 +{tx.rewardsEarned}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" padding="checkbox">
                      <IconButton size="small" onClick={(e) => handleMenuOpen(e, tx)} sx={{ color: 'text.secondary' }}>
                        <MoreVertIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination count={pagination.totalPages} page={page} onChange={handlePageChange} color="primary" />
        </Box>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuForm.anchorEl} open={Boolean(menuForm.anchorEl)} onClose={handleMenuClose}
        PaperProps={{ sx: { borderRadius: '12px', minWidth: 140, border: '1px solid', borderColor: 'divider' } }}
      >
        <MenuItem onClick={() => { handleEditTransaction(menuForm.selectedTransaction); handleMenuClose(); }} sx={{ py: 1 }}>
          <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
          <Typography variant="body2" fontWeight={600}>Edit</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleDeleteTransaction(menuForm.selectedTransaction); handleMenuClose(); }} sx={{ py: 1, color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main' } }}>
          <ListItemIcon><DeleteIcon fontSize="small" /></ListItemIcon>
          <Typography variant="body2" fontWeight={600}>Delete</Typography>
        </MenuItem>
      </Menu>

      {/* Dialogs */}
      <AddCreditCardTransactionDialog
        open={dialogOpen} onClose={closeTransactionDialog}
        onSuccess={() => {
          dispatch(fetchCreditCardTransactions({ creditCardId: creditCard.id, params: { page: paginationForm.page, limit: 25 } }));
          dispatch(getCreditCardTransactionSummary({ creditCardId: creditCard.id }));
        }}
        creditCard={creditCard} transaction={editForm.editingTransaction}
      />

      <Dialog open={deleteDialogOpen} onClose={closeDeleteDialog} PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Delete Transaction?</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this transaction?</DialogContentText>
          {deleteForm.deletingTransaction && (
            <Box mt={2}>
              <Typography variant="body2" fontWeight={600}>{deleteForm.deletingTransaction.description}</Typography>
              <Typography variant="body2" color="text.secondary">Amount: {formatAmount(deleteForm.deletingTransaction.amount)}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDeleteDialog} color="inherit">Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained" sx={{ borderRadius: '10px', fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreditCardTransactionList;
