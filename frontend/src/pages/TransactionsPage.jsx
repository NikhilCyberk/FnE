import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from '../slices/transactionsSlice';
import { fetchAccounts } from '../slices/accountsSlice';
import { fetchCategories } from '../slices/categoriesSlice';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, MenuItem, Select, InputLabel, FormControl, TablePagination, Fab, Tooltip, Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FaArrowDown, FaArrowUp, FaExchangeAlt } from 'react-icons/fa';
import AddIcon from '@mui/icons-material/Add';

const TransactionsPage = () => {
  const dispatch = useDispatch();
  const { items: transactions, loading, error } = useSelector((state) => state.transactions);
  const accounts = useSelector((state) => Array.isArray(state.accounts.items) ? state.accounts.items : []);
  const categories = useSelector((state) => Array.isArray(state.categories?.items) ? state.categories.items : []);
  const [open, setOpen] = useState(false);
  const [editTransaction, setEditTransaction] = useState(null);
  const [form, setForm] = useState({
    accountId: '',
    categoryId: '',
    amount: '',
    type: '',
    description: '',
    merchant: '',
    transactionDate: '',
    tags: '',
    receiptUrl: ''
  });
  const [filters, setFilters] = useState({ accountId: '', categoryId: '', startDate: '', endDate: '' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const allowedTypes = ['income', 'expense', 'transfer'];
  const [formErrors, setFormErrors] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    dispatch(fetchTransactions({ ...filters, page: page + 1, limit: rowsPerPage }));
    dispatch(fetchAccounts());
    dispatch(fetchCategories && fetchCategories());
  }, [dispatch, filters, page, rowsPerPage]);

  const handleOpen = (transaction = null) => {
    setEditTransaction(transaction);
    setForm(transaction ? { ...transaction } : {
      accountId: '', categoryId: '', amount: '', type: '', description: '', merchant: '', transactionDate: '', tags: '', receiptUrl: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditTransaction(null);
    setForm({ accountId: '', categoryId: '', amount: '', type: '', description: '', merchant: '', transactionDate: '', tags: '', receiptUrl: '' });
    setReceiptFile(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.accountId) errors.accountId = 'Account is required.';
    if (!form.categoryId) errors.categoryId = 'Category is required.';
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) errors.amount = 'Amount must be a positive number.';
    if (!form.type || !allowedTypes.includes(form.type)) errors.type = 'Type is required and must be valid.';
    if (!form.transactionDate) errors.transactionDate = 'Date is required.';
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (editTransaction) {
      dispatch(updateTransaction({ id: editTransaction.id, transaction: form }));
    } else {
      dispatch(createTransaction(form));
    }
    handleClose();
  };

  const handleDelete = (id) => {
    dispatch(deleteTransaction(id));
  };

  const handleReceiptUpload = (e) => {
    setReceiptFile(e.target.files[0]);
    // Stub: In production, upload to server and get URL
  };

  const handleBulkUpload = (e) => {
    setCsvFile(e.target.files[0]);
    // Stub: In production, upload CSV to server for processing
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper to get icon by transaction type
  const getTypeIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'income': return <FaArrowDown size={18} color="#43a047" title="Income" />;
      case 'expense': return <FaArrowUp size={18} color="#d32f2f" title="Expense" />;
      case 'transfer': return <FaExchangeAlt size={18} color="#1976d2" title="Transfer" />;
      default: return null;
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Transactions</Typography>
      <Tooltip title="Add Transaction">
        <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ mb: 3, position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
          <AddIcon />
        </Fab>
      </Tooltip>
      <Box mb={2} display="flex" gap={2} flexWrap="wrap">
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Account</InputLabel>
          <Select name="accountId" value={filters.accountId} label="Account" onChange={handleFilterChange}>
            <MenuItem value="">All</MenuItem>
            {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Category</InputLabel>
          <Select name="categoryId" value={filters.categoryId} label="Category" onChange={handleFilterChange}>
            <MenuItem value="">All</MenuItem>
            {categories && categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField name="startDate" label="Start Date" type="date" value={filters.startDate} onChange={handleFilterChange} InputLabelProps={{ shrink: true }} />
        <TextField name="endDate" label="End Date" type="date" value={filters.endDate} onChange={handleFilterChange} InputLabelProps={{ shrink: true }} />
        <Button variant="outlined" component="label">
          Bulk Upload CSV
          <input type="file" accept=".csv" hidden onChange={handleBulkUpload} />
        </Button>
      </Box>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Account</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Merchant</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.transactionDate}</TableCell>
                  <TableCell>{accounts.find(a => a.id === tx.accountId)?.name || ''}</TableCell>
                  <TableCell>{categories && categories.find(c => c.id === tx.categoryId)?.name || ''}</TableCell>
                  <TableCell>{tx.amount}</TableCell>
                  <TableCell>
                    <Avatar sx={{ bgcolor: 'background.default', width: 32, height: 32, mx: 'auto' }}>
                      {getTypeIcon(tx.type)}
                    </Avatar>
                  </TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell>{tx.merchant}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(tx)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(tx.id)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        component="div"
        count={-1}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Rows per page:"
        nextIconButtonProps={{ disabled: transactions.length < rowsPerPage }}
        backIconButtonProps={{ disabled: page === 0 }}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <FormControl fullWidth margin="normal">
              <InputLabel>Account</InputLabel>
              <Select name="accountId" value={form.accountId} label="Account" onChange={handleChange} required error={!!formErrors.accountId}>
                {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
              </Select>
              {formErrors.accountId && <Typography color="error" variant="caption">{formErrors.accountId}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="normal">
              <InputLabel>Category</InputLabel>
              <Select name="categoryId" value={form.categoryId} label="Category" onChange={handleChange} required error={!!formErrors.categoryId}>
                {categories && categories.map(cat => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
              </Select>
              {formErrors.categoryId && <Typography color="error" variant="caption">{formErrors.categoryId}</Typography>}
            </FormControl>
            <TextField label="Amount" name="amount" type="number" value={form.amount} onChange={handleChange} fullWidth margin="normal" required error={!!formErrors.amount} helperText={formErrors.amount} />
            <TextField label="Type" name="type" value={form.type} onChange={handleChange} fullWidth margin="normal" required error={!!formErrors.type} helperText={formErrors.type} />
            <TextField label="Description" name="description" value={form.description} onChange={handleChange} fullWidth margin="normal" />
            <TextField label="Merchant" name="merchant" value={form.merchant} onChange={handleChange} fullWidth margin="normal" />
            <TextField label="Date" name="transactionDate" type="date" value={form.transactionDate} onChange={handleChange} fullWidth margin="normal" InputLabelProps={{ shrink: true }} required error={!!formErrors.transactionDate} helperText={formErrors.transactionDate} />
            <TextField label="Tags (comma separated)" name="tags" value={form.tags} onChange={handleChange} fullWidth margin="normal" />
            <Button variant="outlined" component="label" fullWidth sx={{ mt: 2 }}>
              Upload Receipt
              <input type="file" accept="image/*" hidden onChange={handleReceiptUpload} />
            </Button>
            {receiptFile && <Typography variant="body2">Selected: {receiptFile.name}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">{editTransaction ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default TransactionsPage; 