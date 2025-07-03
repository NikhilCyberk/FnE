import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, CircularProgress, Grid, Card, CardContent, Fab, Tooltip, Avatar, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { FaCreditCard } from 'react-icons/fa';
import api from '../api';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      const res = await api.post('/api/credit-cards', form);
      setItems((prev) => [...prev, res.data]);
      setSnackbar({ open: true, message: 'Credit card saved successfully!', severity: 'success' });
    handleClose();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save credit card', severity: 'error' });
    }
  };

  const handleDelete = (id) => {
    // Delete logic (to be implemented)
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
      setForm((prev) => ({
        ...prev,
        ...res.data
      }));
      setShowPreview(true);
      setSnackbar({ open: true, message: 'Credit card info extracted successfully!', severity: 'success' });
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
    } finally {
      setExtracting(false);
    }
  };

  const handleAddAfterPreview = async () => {
    try {
      const res = await api.post('/api/credit-cards', form);
      setItems((prev) => [...prev, res.data]);
      setSnackbar({ open: true, message: 'Credit card saved successfully!', severity: 'success' });
      handleClose();
      setShowPreview(false);
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save credit card', severity: 'error' });
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    handleClose();
  };

  return (
    <Box>
      <Typography variant="h4" mb={3} fontWeight={700} color="primary.main">Credit Cards</Typography>
      <Tooltip title="Add Credit Card">
        <Fab color="primary" aria-label="add" onClick={() => handleOpen()} sx={{ mb: 3, position: 'fixed', bottom: 32, right: 32, zIndex: 1000 }}>
          <AddIcon />
        </Fab>
      </Tooltip>
      {loading ? <CircularProgress /> : (
        <Grid container spacing={3}>
          {Array.isArray(creditCards) && creditCards.map((card) => (
            <Grid item xs={12} sm={6} md={4} key={card.id}>
              <Card sx={{ borderRadius: 3, boxShadow: 3, p: 0, background: 'background.paper', transition: 'background 0.5s' }}>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Avatar sx={{ bgcolor: 'background.default', width: 56, height: 56, mb: 1, boxShadow: 2 }}>
                    <FaCreditCard size={24} color="#d32f2f" />
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} mb={0.5}>{card.name}</Typography>
                  {card.cardName && <Typography variant="subtitle2" color="text.secondary" mb={0.5}>{card.cardName}</Typography>}
                  {card.cardNumber && <Typography variant="body2" color="text.secondary" mb={0.5}>Card No: {card.cardNumber}</Typography>}
                  <Typography variant="body1" fontWeight={500} color="primary.main">₹{card.balance || '-'}</Typography>
                  {card.creditLimit && <Typography variant="body2" color="text.secondary">Limit: {card.creditLimit}</Typography>}
                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <IconButton onClick={() => handleOpen(card)}><EditIcon /></IconButton>
                    <IconButton onClick={() => handleDelete(card.id)} color="error"><DeleteIcon /></IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
      {error && <Typography color="error">{error}</Typography>}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editCard ? 'Edit Credit Card' : 'Add Credit Card'}</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              label="Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!formErrors.name}
              helperText={formErrors.name}
              disabled={creditCardEntryMode === 'pdf' && !form.name}
            />
            <FormControl fullWidth margin="normal" error={!!formErrors.bank}>
              <InputLabel>Bank</InputLabel>
              <Select
                label="Bank"
                name="bank"
                value={form.bank || ""}
                onChange={handleChange}
                disabled={creditCardEntryMode === 'pdf' && !form.bank}
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
              disabled={creditCardEntryMode === 'pdf' && !form.balance}
            />
            {/* Entry mode toggle */}
            <RadioGroup
              row
              value={creditCardEntryMode}
              onChange={e => setCreditCardEntryMode(e.target.value)}
              sx={{ mb: 2 }}
            >
              <FormControlLabel value="manual" control={<Radio />} label="Enter Manually" />
              <FormControlLabel value="pdf" control={<Radio />} label="Extract from PDF" />
            </RadioGroup>
            {creditCardEntryMode === 'pdf' && !form.name && !form.cardNumber && !showPreview ? (
              // Only show PDF upload/password/extract before extraction
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
            ) : showPreview ? (
              // Show preview after extraction
              <Box sx={{ my: 2 }}>
                <Typography variant="h6" gutterBottom>Extracted Credit Card Info</Typography>
                <Box sx={{ mb: 2 }}>
                  <div><b>Name:</b> {form.name || '-'}</div>
                  <div><b>Address:</b> {form.address || '-'}</div>
                  <div><b>Card Name:</b> {form.cardName || '-'}</div>
                  <div><b>Card Number:</b> {form.cardNumber || '-'}</div>
                  <div><b>Credit Limit:</b> {form.creditLimit || '-'}</div>
                  <div><b>Available Credit Limit:</b> {form.availableCreditLimit || '-'}</div>
                  <div><b>Available Cash Limit:</b> {form.availableCashLimit || '-'}</div>
                  <div><b>Total Payment Due:</b> {form.totalPaymentDue || '-'}</div>
                  <div><b>Minimum Payment Due:</b> {form.minPaymentDue || '-'}</div>
                  <div><b>Statement Period:</b> {form.statementPeriod || '-'}</div>
                  <div><b>Payment Due Date:</b> {form.paymentDueDate || '-'}</div>
                  <div><b>Statement Generation Date:</b> {form.statementGenDate || '-'}</div>
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
                      </tr>
                    </thead>
                    <tbody>
                      {(form.transactions || []).length === 0 ? (
                        <tr><td colSpan={5} style={{ textAlign: 'center' }}>No transactions found</td></tr>
                      ) : (
                        form.transactions.map((txn, idx) => (
                          <tr key={idx}>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.date || '-'}</td>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.details || '-'}</td>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.name || '-'}</td>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.category || '-'}</td>
                            <td style={{ border: '1px solid #ccc', padding: 4 }}>{txn.amount || '-'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </Box>
                <DialogActions>
                  <Button onClick={handleCancelPreview}>Cancel</Button>
                  <Button variant="contained" onClick={handleAddAfterPreview}>Add</Button>
                </DialogActions>
              </Box>
            ) : (
              // Show the rest of the form after extraction or for manual entry
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
                  disabled={creditCardEntryMode === 'pdf' && !form.name}
                />
                <FormControl fullWidth margin="normal" error={!!formErrors.bank}>
                  <InputLabel>Bank</InputLabel>
                  <Select
                    label="Bank"
                    name="bank"
                    value={form.bank || ""}
                    onChange={handleChange}
                    disabled={creditCardEntryMode === 'pdf' && !form.bank}
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
                  disabled={creditCardEntryMode === 'pdf' && !form.balance}
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
                  disabled={creditCardEntryMode === 'pdf' && !form.cardNumber}
                />
                <TextField
                  label="Expiry Date (MM/YY)"
                  name="expiry"
                  value={form.expiry}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                  error={!!formErrors.expiry}
                  helperText={formErrors.expiry}
                  disabled={creditCardEntryMode === 'pdf' && !form.expiry}
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
                  disabled={creditCardEntryMode === 'pdf' && !form.cvv}
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
                  disabled={creditCardEntryMode === 'pdf' && !form.issuer}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={extracting}>{editCard ? 'Update' : 'Create'}</Button>
          </DialogActions>
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