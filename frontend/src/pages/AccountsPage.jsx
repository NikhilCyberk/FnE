import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts, createAccount, updateAccount, deleteAccount } from '../slices/accountsSlice';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, TablePagination, Grid, Card, CardContent, Fab, Tooltip, Avatar, FormControl, InputLabel, Select, MenuItem, ListSubheader, Tabs, Tab, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { FaUniversity, FaMoneyBillWave, FaCreditCard, FaWallet } from 'react-icons/fa';
import AddIcon from '@mui/icons-material/Add';
import api from '../api';

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
      {loading ? <CircularProgress /> : (
        <Grid container spacing={3}>
          {Array.isArray(accounts) && accounts.map((account) => (
            <Grid item xs={12} sm={6} md={4} key={account.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 0, background: 'background.paper', transition: 'background 0.5s' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: 'background.default', width: 56, height: 56, mb: 1, boxShadow: 2 }}>
                    {getAccountIcon(account.type)}
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} mb={0.5}>{account.name}</Typography>
                  <Typography variant="subtitle2" color="text.secondary" mb={1}>{account.type}</Typography>
                  <Typography variant="body1" fontWeight={500} color="primary.main">₹{account.balance}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <IconButton onClick={() => handleOpen(account)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(account.id)} color="error"><DeleteIcon /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
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