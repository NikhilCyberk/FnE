import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, Grid, Card, CardContent, Fab, Tooltip, Avatar, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, TableSortLabel, InputAdornment, TablePagination } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FaCreditCard } from 'react-icons/fa';
import api from '../api';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import log from 'loglevel';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

// Placeholder for Redux slice (to be implemented)
const useCreditCards = () => {
  // Replace with real Redux logic
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  return { items, loading, error, setItems, setLoading, setError };
};

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

const CreditCardsPage = () => {
  const { items: creditCards, loading, error, setItems, setLoading, setError } = useCreditCards();
  const [open, setOpen] = useState(false);
  const [editCard, setEditCard] = useState(null);
  const [form, setForm] = useState({
    name: '',
    bank: '',
    balance: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    issuer: '',
    pdfPassword: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [creditCardEntryMode, setCreditCardEntryMode] = useState('manual');
  const [extracting, setExtracting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [detailCard, setDetailCard] = useState(null);

  // Transaction editing helpers
  const emptyTxn = { date: '', details: '', name: '', category: '', amount: '' };
  const [editTxnIdx, setEditTxnIdx] = useState(null);
  const [txnDraft, setTxnDraft] = useState(emptyTxn);

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch credit cards from backend
    const fetchCards = async () => {
      setLoading(true);
      try {
        const res = await api.get('/api/credit-cards');
        setItems(res.data);
      } catch (err) {
        setError('Failed to fetch credit cards');
      } finally {
        setLoading(false);
      }
    };
    fetchCards();
  }, [setItems, setLoading, setError]);

  const handleOpen = (card = null) => {
    setEditCard(card);
    setForm(card ? {
      ...card,
      bank: card.bank || '',
      cardNumber: card.cardNumber || '',
      expiry: card.expiry || '',
      cvv: card.cvv || '',
      issuer: card.issuer || '',
      pdfPassword: card.pdfPassword || ''
    } : {
      name: '',
      bank: '',
      balance: '',
      cardNumber: '',
      expiry: '',
      cvv: '',
      issuer: '',
      pdfPassword: ''
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditCard(null);
    setForm({ name: '', bank: '', balance: '', cardNumber: '', expiry: '', cvv: '', issuer: '', pdfPassword: '' });
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name) errors.name = 'Name is required.';
    if (!form.bank) errors.bank = 'Bank is required.';
    if (form.balance === '' || isNaN(form.balance)) errors.balance = 'Balance must be a number.';
    if (!form.cardNumber) errors.cardNumber = 'Card Number is required.';
    if (!form.expiry) errors.expiry = 'Expiry Date is required.';
    if (!form.cvv) errors.cvv = 'CVV is required.';
    return errors;
  };

  // Helper to clean numbers
  const cleanNumber = str => str ? Number(String(str).replace(/,/g, '')) : null;

  const toISODate = (str) => {
    if (!str) return null;
    // Handles DD/MM/YYYY or DD-MM-YYYY
    const match = str.match(/^([0-9]{2})[\/\-]([0-9]{2})[\/\-]([0-9]{4})$/);
    if (match) {
      return `${match[3]}-${match[2]}-${match[1]}`;
    }
    // If already in ISO or unrecognized, return as is
    return str;
  };

  const buildCardPayload = (form) => {
    const token = localStorage.getItem('token');
    let userId = null;
    if (token) {
      try {
        const decoded = jwtDecode(token);
        userId = decoded.userId || decoded.id || decoded.user_id || null;
      } catch (e) {
        log.error('Failed to decode token', e);
      }
    }
    const safeNumber = (val, fallback = 0) => {
      const n = cleanNumber(val);
      return (n !== null && !isNaN(n)) ? n : fallback;
    };
    return {
      cardName: form.cardName || form.name || '',
      cardNumber: form.cardNumber || '',
      creditLimit: safeNumber(form.creditLimit, 0),
      availableCreditLimit: safeNumber(form.availableCreditLimit, 0),
      availableCashLimit: safeNumber(form.availableCashLimit, 0),
      totalPaymentDue: safeNumber(form.totalPaymentDue, 0),
      minPaymentDue: safeNumber(form.minPaymentDue, 0),
      statementPeriod: form.statementPeriod || null,
      statementPeriodStart: form.statementPeriodStart || null,
      statementPeriodEnd: form.statementPeriodEnd || null,
      paymentDueDate: toISODate(form.paymentDueDate),
      statementGenDate: toISODate(form.statementGenDate),
      address: form.address || '',
      issuer: form.issuer || '',
      bank: form.bank || '',
      status: form.status || 'Active',
      transactions: (form.transactions || []).map(tx => ({
        ...tx,
        date: toISODate(tx.date)
      })),
      user_id: userId
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const payload = buildCardPayload(form);
      const res = await api.post('/api/credit-cards', payload);
      setItems((prev) => [...prev, res.data]);
      setSnackbar({ open: true, message: 'Credit card saved successfully!', severity: 'success' });
      handleClose();
      log.info('Submitting credit card form', payload);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save credit card', severity: 'error' });
      log.error('API error', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      setLoading(true);
      await api.delete(`/api/credit-cards/${id}`);
      setItems((prev) => prev.filter(card => card.id !== id));
      setSnackbar({ open: true, message: 'Credit card deleted successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to delete credit card', severity: 'error' });
      log.error('API error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBillUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    if (form.pdfPassword) {
      formData.append('password', form.pdfPassword);
    }
    setExtracting(true);
    try {
      const res = await api.post('/api/credit-cards/extract-credit-card-info', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm((prev) => {
        let newForm = { ...prev, ...res.data };
        // Auto-parse statementPeriod into start/end date fields
        if (res.data.statementPeriod) {
          const match = res.data.statementPeriod.match(/(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{2}\/\d{2}\/\d{4})/);
          if (match) {
            // Convert DD/MM/YYYY to YYYY-MM-DD for input type="date"
            const toISO = (d) => {
              const [day, month, year] = d.split('/');
              return `${year}-${month}-${day}`;
            };
            newForm.statementPeriodStart = toISO(match[1]);
            newForm.statementPeriodEnd = toISO(match[2]);
          }
        }
        // Convert all date fields to YYYY-MM-DD for input type='date'
        const dateFields = ['paymentDueDate', 'statementGenDate'];
        dateFields.forEach(f => {
          if (newForm[f] && /\d{2}\/\d{2}\/\d{4}/.test(newForm[f])) {
            const [day, month, year] = newForm[f].split('/');
            newForm[f] = `${year}-${month}-${day}`;
          }
        });
        // Parse number fields as numbers or empty string
        const numFields = ['creditLimit','availableCreditLimit','availableCashLimit','totalPaymentDue','minPaymentDue'];
        numFields.forEach(f => {
          if (newForm[f] !== undefined && newForm[f] !== null && newForm[f] !== '') {
            const n = String(newForm[f]).replace(/,/g, '');
            newForm[f] = isNaN(Number(n)) ? '' : n;
          }
        });
        return newForm;
      });
      setShowPreview(true);
      setSnackbar({ open: true, message: 'Credit card info extracted successfully!', severity: 'success' });
      log.info('Extracted credit card info', res.data);
    } catch (err) {
      let msg = 'Failed to extract credit card info from PDF.';
      if (err.response && err.response.data) {
        msg += ' ' + (err.response.data.error || '');
        if (err.response.data.details) msg += ' Details: ' + err.response.data.details;
        if (err.response.data.stack) msg += ' (See console for stack)';
        console.error('Backend error:', err.response.data);
      } else {
        console.error('Unknown error:', err);
      }
      setSnackbar({ open: true, message: msg, severity: 'error' });
      log.error('API error', err);
    } finally {
      setExtracting(false);
    }
  };

  const handleAddAfterPreview = async () => {
    try {
      const payload = buildCardPayload(form);
      const res = await api.post('/api/credit-cards', payload);
      setItems((prev) => [...prev, res.data]);
      setSnackbar({ open: true, message: 'Credit card saved successfully!', severity: 'success' });
      handleClose();
      setShowPreview(false);
      log.info('Added credit card', res.data);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save credit card', severity: 'error' });
      log.error('API error', err);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    handleClose();
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
      filtered = filtered.filter((card) =>
        card.name?.toLowerCase().includes(filter.toLowerCase()) ||
        card.bank?.toLowerCase().includes(filter.toLowerCase())
      );
    }
    return filtered;
  }

  const sortedFilteredCards = applySortFilter(creditCards, getComparator(order, orderBy), filter);
  const paginatedCards = sortedFilteredCards.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Validation for PDF extraction form
  const validateExtractedForm = () => {
    const errors = {};
    if (!form.name) errors.name = 'Name is required.';
    if (!form.cardNumber) errors.cardNumber = 'Card Number is required.';
    if (!form.creditLimit || isNaN(Number(form.creditLimit))) errors.creditLimit = 'Credit Limit is required and must be a number.';
    if (!form.statementPeriodStart) errors.statementPeriodStart = 'Statement Start Date is required.';
    if (!form.statementPeriodEnd) errors.statementPeriodEnd = 'Statement End Date is required.';
    if (!form.paymentDueDate) errors.paymentDueDate = 'Payment Due Date is required.';
    // Optionally: check date format
    const isValidDate = (d) => !isNaN(Date.parse(d));
    if (form.statementPeriodStart && !isValidDate(form.statementPeriodStart)) errors.statementPeriodStart = 'Invalid start date.';
    if (form.statementPeriodEnd && !isValidDate(form.statementPeriodEnd)) errors.statementPeriodEnd = 'Invalid end date.';
    if (form.paymentDueDate && !isValidDate(form.paymentDueDate)) errors.paymentDueDate = 'Invalid payment due date.';
    // Numeric fields
    ['availableCreditLimit','availableCashLimit','totalPaymentDue','minPaymentDue'].forEach(f => {
      if (form[f] && isNaN(Number(form[f]))) errors[f] = 'Must be a number.';
    });
    return errors;
  };

  // Transaction editing helpers
  const handleTxnEdit = (idx) => {
    setEditTxnIdx(idx);
    setTxnDraft(form.transactions[idx]);
  };
  const handleTxnDraftChange = (e) => {
    setTxnDraft({ ...txnDraft, [e.target.name]: e.target.value });
  };
  const handleTxnSave = (idx) => {
    const updated = [...form.transactions];
    updated[idx] = txnDraft;
    setForm(f => ({ ...f, transactions: updated }));
    setEditTxnIdx(null);
    setTxnDraft(emptyTxn);
  };
  const handleTxnDelete = (idx) => {
    const updated = [...form.transactions];
    updated.splice(idx, 1);
    setForm(f => ({ ...f, transactions: updated }));
    setEditTxnIdx(null);
  };
  const handleTxnAdd = () => {
    if (!txnDraft.date && !txnDraft.details && !txnDraft.name && !txnDraft.category && !txnDraft.amount) return;
    setForm(f => ({ ...f, transactions: [...(f.transactions || []), txnDraft] }));
    setTxnDraft(emptyTxn);
  };

  const handleRowClick = (card) => navigate(`/credit-cards/${card.id}`);

  return (
    <Box>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Credit Cards</Typography>
      <Tooltip title="Add Credit Card">
        <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ mb: 3, position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
          <AddIcon />
        </Fab>
      </Tooltip>
      <Box mb={2} display="flex" gap={2} alignItems="center">
        <TextField
          label="Filter by Name or Bank"
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
                <TableCell sortDirection={orderBy === 'cardNumber' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'cardNumber'}
                    direction={orderBy === 'cardNumber' ? order : 'asc'}
                    onClick={() => handleRequestSort('cardNumber')}
                  >
                    Card Number
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'bank' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'bank'}
                    direction={orderBy === 'bank' ? order : 'asc'}
                    onClick={() => handleRequestSort('bank')}
                  >
                    Bank
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'balance' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'balance'}
                    direction={orderBy === 'balance' ? order : 'asc'}
                    onClick={() => handleRequestSort('balance')}
                  >
                    Balance
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={orderBy === 'creditLimit' ? order : false}>
                  <TableSortLabel
                    active={orderBy === 'creditLimit'}
                    direction={orderBy === 'creditLimit' ? order : 'asc'}
                    onClick={() => handleRequestSort('creditLimit')}
                  >
                    Credit Limit
                  </TableSortLabel>
                </TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedCards.map((card, idx) => (
                <TableRow key={card.id} hover sx={{ backgroundColor: idx % 2 === 0 ? 'background.default' : 'action.hover', transition: 'background 0.3s', cursor: 'pointer' }} onClick={() => handleRowClick(card)}>
                  <TableCell><Avatar sx={{ bgcolor: 'background.default', width: 32, height: 32, mx: 'auto' }}><FaCreditCard size={18} color="#d32f2f" /></Avatar></TableCell>
                  <TableCell>{card.cardName || card.name || '-'}</TableCell>
                  <TableCell>{card.cardNumber || '-'}</TableCell>
                  <TableCell>{card.bank || '-'}</TableCell>
                  <TableCell>₹{card.totalPaymentDue !== undefined && card.totalPaymentDue !== null && card.totalPaymentDue !== '' ? card.totalPaymentDue : '-'}</TableCell>
                  <TableCell>{card.creditLimit !== undefined && card.creditLimit !== null && card.creditLimit !== '' ? card.creditLimit : '-'}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(card)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(card.id)} color="error"><DeleteIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedCards.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center">No credit cards found</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <TablePagination
        component="div"
        count={sortedFilteredCards.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[5, 10, 25, 50]}
        sx={{ mt: 1 }}
      />
      {error && <Typography color="error">{error}</Typography>}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editCard ? 'Edit Credit Card' : 'Add Credit Card'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <RadioGroup
              row
              value={creditCardEntryMode}
              onChange={e => setCreditCardEntryMode(e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="manual" control={<Radio />} label="Enter Manually" />
              <FormControlLabel value="pdf" control={<Radio />} label="Extract from PDF" />
            </RadioGroup>
            {creditCardEntryMode === 'manual' && (
              <>
                <TextField
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
                <FormControl fullWidth margin="normal" error={!!formErrors.bank}>
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
                <TextField
                  label="Balance"
                  name="balance"
                  type="number"
                  value={form.balance}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.balance}
                  helperText={formErrors.balance}
                />
                <TextField
                  label="Card Number"
                  name="cardNumber"
                  value={form.cardNumber}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.cardNumber}
                  helperText={formErrors.cardNumber}
                />
                <TextField
                  label="Expiry"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.expiry}
                  helperText={formErrors.expiry}
                />
                <TextField
                  label="CVV"
                  name="cvv"
                  value={form.cvv}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.cvv}
                  helperText={formErrors.cvv}
                />
                <TextField
                  label="Issuer"
                  name="issuer"
                  value={form.issuer}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.issuer}
                  helperText={formErrors.issuer}
                />
              </>
            )}
            {creditCardEntryMode === 'pdf' && !showPreview && (
              <>
                <TextField
                  label="Upload Bill Statement (PDF)"
                  type="file"
                  inputProps={{ accept: 'application/pdf' }}
                  fullWidth
                  margin="normal"
                  onChange={e => setSelectedFile(e.target.files[0])}
                  disabled={extracting}
                />
                <TextField
                  label="PDF Password (if any)"
                  name="pdfPassword"
                  type="password"
                  value={form.pdfPassword || ''}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  disabled={extracting}
                />
                <Button
                  variant="contained"
                  onClick={handleBillUpload}
                  disabled={extracting || !selectedFile}
                  sx={{ mt: 2 }}
                >
                  Extract
                </Button>
                {extracting && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}
              </>
            )}
            {creditCardEntryMode === 'pdf' && showPreview && (
              <Box sx={{ my: 2 }}>
                <Typography variant="h6" gutterBottom>Extracted Credit Card Info</Typography>
                <Box sx={{ mb: 2, display: 'grid', gap: 2 }}>
                  <TextField label="Name" name="name" value={form.name || ''} onChange={handleChange} fullWidth margin="dense" type="text" error={!!formErrors.name} helperText={formErrors.name} />
                  <TextField label="Address" name="address" value={form.address || ''} onChange={handleChange} fullWidth margin="dense" type="text" />
                  <TextField label="Card Name" name="cardName" value={form.cardName || ''} onChange={handleChange} fullWidth margin="dense" type="text" />
                  <TextField label="Card Number" name="cardNumber" value={form.cardNumber || ''} onChange={handleChange} fullWidth margin="dense" type="text" error={!!formErrors.cardNumber} helperText={formErrors.cardNumber} />
                  <TextField label="Credit Limit" name="creditLimit" value={form.creditLimit || ''} onChange={handleChange} fullWidth margin="dense" type="number" error={!!formErrors.creditLimit} helperText={formErrors.creditLimit} />
                  <TextField label="Available Credit Limit" name="availableCreditLimit" value={form.availableCreditLimit || ''} onChange={handleChange} fullWidth margin="dense" type="number" error={!!formErrors.availableCreditLimit} helperText={formErrors.availableCreditLimit} />
                  <TextField label="Available Cash Limit" name="availableCashLimit" value={form.availableCashLimit || ''} onChange={handleChange} fullWidth margin="dense" type="number" error={!!formErrors.availableCashLimit} helperText={formErrors.availableCashLimit} />
                  <TextField label="Total Payment Due" name="totalPaymentDue" value={form.totalPaymentDue || ''} onChange={handleChange} fullWidth margin="dense" type="number" error={!!formErrors.totalPaymentDue} helperText={formErrors.totalPaymentDue} />
                  <TextField label="Minimum Payment Due" name="minPaymentDue" value={form.minPaymentDue || ''} onChange={handleChange} fullWidth margin="dense" type="number" error={!!formErrors.minPaymentDue} helperText={formErrors.minPaymentDue} />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Statement Start Date"
                      name="statementPeriodStart"
                      type="date"
                      value={form.statementPeriodStart || ''}
                      onChange={handleChange}
                      margin="dense"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      error={!!formErrors.statementPeriodStart}
                      helperText={formErrors.statementPeriodStart}
                    />
                    <TextField
                      label="Statement End Date"
                      name="statementPeriodEnd"
                      type="date"
                      value={form.statementPeriodEnd || ''}
                      onChange={handleChange}
                      margin="dense"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      error={!!formErrors.statementPeriodEnd}
                      helperText={formErrors.statementPeriodEnd}
                    />
                  </Box>
                  <TextField label="Payment Due Date" name="paymentDueDate" value={form.paymentDueDate || ''} onChange={handleChange} fullWidth margin="dense" type="date" InputLabelProps={{ shrink: true }} error={!!formErrors.paymentDueDate} helperText={formErrors.paymentDueDate} />
                  <TextField label="Statement Generation Date" name="statementGenDate" value={form.statementGenDate || ''} onChange={handleChange} fullWidth margin="dense" type="date" InputLabelProps={{ shrink: true }} />
                </Box>
                <Typography variant="subtitle1" gutterBottom>Transactions</Typography>
                <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Date</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Details</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Name</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Category</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Amount</th>
                        <th style={{ border: '1px solid #ccc', padding: 4 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(form.transactions || []).length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center' }}>No transactions found</td></tr>
                      )}
                      {(form.transactions || []).map((txn, idx) => (
                        <tr key={idx}>
                          {editTxnIdx === idx ? (
                            <>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="date" name="date" value={txnDraft.date} onChange={handleTxnDraftChange} /></td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="text" name="details" value={txnDraft.details} onChange={handleTxnDraftChange} /></td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="text" name="name" value={txnDraft.name} onChange={handleTxnDraftChange} /></td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="text" name="category" value={txnDraft.category} onChange={handleTxnDraftChange} /></td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="number" name="amount" value={txnDraft.amount} onChange={handleTxnDraftChange} /></td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}>
                                <button type="button" onClick={() => handleTxnSave(idx)}>Save</button>
                                <button type="button" onClick={() => setEditTxnIdx(null)}>Cancel</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.date}</td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.details}</td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.name}</td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.category}</td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.amount}</td>
                              <td style={{ border: '1px solid #ccc', padding: 4 }}>
                                <button type="button" onClick={() => handleTxnEdit(idx)}>Edit</button>
                                <button type="button" onClick={() => handleTxnDelete(idx)}>Delete</button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {/* Add new transaction row */}
                      <tr>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="date" name="date" value={txnDraft.date} onChange={handleTxnDraftChange} /></td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="text" name="details" value={txnDraft.details} onChange={handleTxnDraftChange} /></td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="text" name="name" value={txnDraft.name} onChange={handleTxnDraftChange} /></td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="text" name="category" value={txnDraft.category} onChange={handleTxnDraftChange} /></td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}><input type="number" name="amount" value={txnDraft.amount} onChange={handleTxnDraftChange} /></td>
                        <td style={{ border: '1px solid #ccc', padding: 4 }}><button type="button" onClick={handleTxnAdd}>Add</button></td>
                      </tr>
                    </tbody>
                  </table>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button onClick={handleCancelPreview}>Cancel</Button>
                  <Button variant="contained" onClick={() => {
                    const errors = validateExtractedForm();
                    setFormErrors(errors);
                    if (Object.keys(errors).length > 0) return;
                    handleAddAfterPreview();
                  }}>Save</Button>
                </Box>
              </Box>
            )}
          </DialogContent>
          {creditCardEntryMode === 'manual' && (
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">{editCard ? 'Update' : 'Create'}</Button>
            </DialogActions>
          )}
        </form>
        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Dialog>
    </Box>
  );
};

export default CreditCardsPage; 