import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from '../slices/accountsSlice';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, TablePagination, Grid, Card, CardContent, Fab, Tooltip, Avatar, FormControl, InputLabel, Select, MenuItem, ListSubheader, Tabs, Tab, RadioGroup, FormControlLabel, Radio, TableSortLabel, InputAdornment } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FaUniversity, FaMoneyBillWave, FaCreditCard, FaWallet } from 'react-icons/fa';
import AddIcon from '@mui/icons-material/Add';
import api from '../api';
import log from 'loglevel';

const AccountsPage = () => {
  const dispatch = useDispatch();
  const accounts = useSelector((state) => Array.isArray(state.accounts.items) ? state.accounts.items : []);
  const loading = useSelector((state) => state.accounts.loading);
  const error = useSelector((state) => state.accounts.error);
  const [open, setOpen] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: '',
    bank: '',
    balance: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    issuer: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
    pdfPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [creditCardEntryMode, setCreditCardEntryMode] = useState('manual');
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [filter, setFilter] = useState('');

  const accountTypes = [
    "Savings",
    "Current",
    "Cash",
    "Other"
  ];
  const bankNames = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Kotak Mahindra Bank",
    "IndusInd Bank",
    "Yes Bank",
    "IDFC FIRST Bank"
  ];

  useEffect(() => {
    dispatch(fetchAccounts({ page: page + 1, limit: rowsPerPage }));
  }, [dispatch, page, rowsPerPage]);

  const handleOpen = (account = null) => {
    setEditAccount(account);
    setForm(account ? {
      ...account,
      bank: account.bank || '',
      cardNumber: account.cardNumber || '',
      expiry: account.expiry || '',
      cvv: account.cvv || '',
      issuer: account.issuer || '',
      accountNumber: account.accountNumber || '',
      ifsc: account.ifsc || '',
      branch: account.branch || '',
      pdfPassword: account.pdfPassword || ''
    } : {
      name: '',
      type: '',
      bank: '',
      balance: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
      issuer: '',
      accountNumber: '',
      ifsc: '',
      branch: '',
      pdfPassword: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditAccount(null);
    setForm({ name: '', type: '', bank: '', balance: '', cardNumber: '', expiry: '', cvv: '', issuer: '', accountNumber: '', ifsc: '', branch: '', pdfPassword: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name) errors.name = 'Name is required.';
    if (!form.type) errors.type = 'Type is required.';
    if (["Savings", "Current", "Credit Card"].includes(form.type) && !form.bank) errors.bank = 'Bank is required.';
    if (form.balance === '' || isNaN(form.balance)) errors.balance = 'Balance must be a number.';
    if (form.type === 'Credit Card') {
      if (!form.cardNumber) errors.cardNumber = 'Card Number is required.';
      if (!form.expiry) errors.expiry = 'Expiry Date is required.';
      if (!form.cvv) errors.cvv = 'CVV is required.';
    }
    if (["Savings", "Current"].includes(form.type)) {
      if (!form.accountNumber) errors.accountNumber = 'Account Number is required.';
      if (!form.ifsc) errors.ifsc = 'IFSC Code is required.';
    }
    return errors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (editAccount) {
      dispatch(updateAccount({ id: editAccount.id, account: form }));
    } else {
      dispatch(createAccount(form));
    }
    handleClose();
    log.info('Submitting account form', form);
  };

  const handleDelete = (id) => {
    dispatch(deleteAccount(id));
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
    setPage(0);
  };

  function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
  }
  function getComparator(order, orderBy) {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  }
  function applySortFilter(array, comparator, filter) {
    const stabilized = array.map((el, idx) => [el, idx]);
    stabilized.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    let filtered = stabilized.map((el) => el[0]);
    if (filter) {
      filtered = filtered.filter((acc) =>
        acc.name?.toLowerCase().includes(filter.toLowerCase()) ||
        acc.type?.toLowerCase().includes(filter.toLowerCase())
      );
    }
    return filtered;
  }
  const sortedFilteredAccounts = applySortFilter(accounts, getComparator(order, orderBy), filter);
  const paginatedAccounts = sortedFilteredAccounts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Helper to get icon by account type
  const getAccountIcon = (type) => {
    switch ((type || '').toLowerCase()) {
      case 'bank': return <FaUniversity size={24} color="#1976d2" />;
      case 'cash': return <FaMoneyBillWave size={24} color="#43a047" />;
      case 'credit': return <FaCreditCard size={24} color="#d32f2f" />;
      default: return <FaWallet size={24} color="#616161" />;
    }
  };

  // Handler for credit card bill upload
  const handleBillUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', form.pdfPassword || '');
    try {
      const res = await api.post('/api/extract-credit-card-info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm((prev) => ({
        ...prev,
        ...res.data // expects backend to return cardNumber, expiry, issuer, etc.
      }));
    } catch (err) {
      // Optionally show error to user
      alert('Failed to extract credit card info from PDF.');
      log.error('API error', err);
    }
  };

  return (
    <Box>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Accounts</Typography>
      <Tooltip title="Add Account">
        <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ mb: 3, position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
          <AddIcon />
        </Fab>
      </Tooltip>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          label="Filter by Name or Type"
          value={filter}
          onChange={handleFilterChange}
          InputProps={{
            startAdornment: <InputAdornment position="start">🔍</InputAdornment>,
          }}
          size="small"
          sx={{ width: 300 }}
        />
      </Box>
      {loading ? <CircularProgress /> : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3, maxHeight: 520 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Icon</TableCell>
                <TableCell sortDirection={orderBy === 'name' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'name'}
                    direction={orderBy === 'name' ? order : 'asc'}
                    onClick={() => handleRequestSort('name')}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'type' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'type'}
                    direction={orderBy === 'type' ? order : 'asc'}
                    onClick={() => handleRequestSort('type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>Bank</TableCell>
                <TableCell sortDirection={orderBy === 'balance' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'balance'}
                    direction={orderBy === 'balance' ? order : 'asc'}
                    onClick={() => handleRequestSort('balance')}
                  >
                    Balance
                  </TableSortLabel>
                </TableCell>
                <TableCell>Account Number</TableCell>
                <TableCell>IFSC</TableCell>
                <TableCell>Branch</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedAccounts.map((account, idx) => (
                <TableRow key={account.id} hover sx={{ backgroundColor: idx % 2 === 0 ? 'background.default' : 'action.hover', transition: 'background 0.3s' }}>
                  <TableCell>{getAccountIcon(account.type)}</TableCell>
                  <TableCell>{account.name}</TableCell>
                  <TableCell>{account.type}</TableCell>
                  <TableCell>{account.bank}</TableCell>
                  <TableCell>₹{account.balance}</TableCell>
                  <TableCell>{account.accountNumber || '-'}</TableCell>
                  <TableCell>{account.ifsc || '-'}</TableCell>
                  <TableCell>{account.branch || '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(account)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(account.id)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedAccounts.length === 0 && (
                <TableRow><TableCell colSpan={9} align="center">No accounts found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        component="div"
        count={sortedFilteredAccounts.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ mt: 1 }}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <FormControl fullWidth margin="normal" required error={!!formErrors.type}>
              <InputLabel>Account Type</InputLabel>
              <Select
                label="Account Type"
                name="type"
                value={form.type}
                onChange={handleChange}
              >
                {accountTypes.map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
              {formErrors.type && <Typography color="error" variant="caption">{formErrors.type}</Typography>}
            </FormControl>
            {["Savings", "Current", "Credit Card"].includes(form.type) && (
              <FormControl fullWidth margin="normal" required error={!!formErrors.bank}>
                <InputLabel>Bank</InputLabel>
                <Select
                  label="Bank"
                  name="bank"
                  value={form.bank || ""}
                  onChange={handleChange}
                >
                  {bankNames.map((bank) => (
                    <MenuItem key={bank} value={bank}>{bank}</MenuItem>
                  ))}
                </Select>
                {formErrors.bank && <Typography color="error" variant="caption">{formErrors.bank}</Typography>}
              </FormControl>
            )}
            <TextField
              label="Balance"
              name="balance"
              type="number"
              value={form.balance}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              error={!!formErrors.balance}
              helperText={formErrors.balance}
            />
            {["Savings", "Current"].includes(form.type) && (
              <>
                <TextField
                  label="Account Number"
                  name="accountNumber"
                  value={form.accountNumber}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  required
                  error={!!formErrors.accountNumber}
                  helperText={formErrors.accountNumber}
                />
                <TextField
                  label="IFSC Code"
                  name="ifsc"
                  value={form.ifsc}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  required
                  error={!!formErrors.ifsc}
                  helperText={formErrors.ifsc}
                />
                <TextField
                  label="Branch"
                  name="branch"
                  value={form.branch}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.branch}
                  helperText={formErrors.branch}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">{editAccount ? 'Update' : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AccountsPage; 