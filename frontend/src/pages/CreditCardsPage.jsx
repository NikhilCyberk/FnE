import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, Grid, Card, CardContent, Fab, Tooltip, Avatar, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio, TableContainer, Table, TableHead, TableBody, TableRow, TableCell, Paper, TableSortLabel, InputAdornment, TablePagination, Chip } from '@mui/material';
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
import CreditCardEditDialog from './CreditCardEditDialog';

const BANK_COLORS = {
  'Axis Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'HDFC Bank': { color: '#FF6F00', bgColor: '#FFF8E1' },
  'ICICI Bank': { color: '#FF5722', bgColor: '#FBE9E7' },
  'State Bank of India (SBI)': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Kotak Mahindra Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Punjab National Bank (PNB)': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Bank of Baroda': { color: '#FF5722', bgColor: '#FBE9E7' },
  'Canara Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Union Bank of India': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Bank of India': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Central Bank of India': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Indian Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'UCO Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Punjab & Sind Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'IDBI Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Yes Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Federal Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Karnataka Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'South Indian Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Tamilnad Mercantile Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'City Union Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'DCB Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'RBL Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Bandhan Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'IDFC First Bank': { color: '#FF5722', bgColor: '#FBE9E7' },
  'AU Small Finance Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Equitas Small Finance Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Ujjivan Small Finance Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Jammu & Kashmir Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Vijaya Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Dena Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Corporation Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Andhra Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Oriental Bank of Commerce': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Allahabad Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'United Bank of India': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Syndicate Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'IndusInd Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Other': { color: '#757575', bgColor: '#F5F5F5' }
};

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
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditCard(null);
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
    let userEmail = 'default@example.com'; // Default email for testing
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Try to get email from token, fallback to default
        userEmail = decoded.email || decoded.userEmail || decoded.user_email || 'default@example.com';
        console.log('JWT decoded:', decoded);
        console.log('User email extracted:', userEmail);
      } catch (e) {
        log.error('Failed to decode token', e);
      }
    }
    const safeNumber = (val, fallback = 0) => {
      const n = cleanNumber(val);
      return (n !== null && !isNaN(n)) ? n : fallback;
    };
    const payload = {
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
      user_id: userEmail // Use email as user_id
    };
    console.log('Final payload:', payload);
    return payload;
  };

  const handleSave = async (form) => {
    setLoading(true);
    try {
      // Build the payload with user_id
      const payload = buildCardPayload(form);
      
      // If editing, update; else, add new
      if (editCard) {
        const res = await api.put(`/api/credit-cards/${editCard.id}`, payload);
        setItems((prev) => prev.map(c => c.id === editCard.id ? res.data : c));
      } else {
        const res = await api.post('/api/credit-cards', payload);
        setItems((prev) => [...prev, res.data]);
      }
      setSnackbar({ open: true, message: 'Credit card saved successfully!', severity: 'success' });
      handleClose();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save credit card', severity: 'error' });
    } finally {
      setLoading(false);
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
                  <TableCell>{card.bank ? (
                    <Chip
                      label={card.bank}
                      sx={{
                        bgcolor: BANK_COLORS[card.bank]?.bgColor,
                        color: BANK_COLORS[card.bank]?.color,
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        '& .MuiChip-label': { px: 1.5 }
                      }}
                      size="small"
                    />
                  ) : '-'}</TableCell>
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
      <CreditCardEditDialog
        open={open}
        onClose={handleClose}
        card={editCard}
        onSave={handleSave}
        loading={loading}
      />
    </Box>
  );
};

export default CreditCardsPage; 