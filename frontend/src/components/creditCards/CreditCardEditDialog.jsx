import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControl, InputLabel, Select, MenuItem, RadioGroup, FormControlLabel, Radio, Typography, Box, Snackbar, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Paper
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon, Add as AddIcon } from '@mui/icons-material';
import api from '../../api';

// Bank colors and information
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

const bankNames = Object.keys(BANK_COLORS);

const emptyTxn = { date: '', details: '', name: '', category: '', amount: '' };

const CreditCardEditDialog = ({ open, onClose, card, onSave, loading: externalLoading }) => {
  const [form, setForm] = useState({
    name: '', bank: '', balance: '', cardNumber: '', expiry: '', cvv: '', issuer: '', pdfPassword: '',
    address: '', cardName: '', creditLimit: '', availableCreditLimit: '', availableCashLimit: '', totalPaymentDue: '', minPaymentDue: '', statementPeriodStart: '', statementPeriodEnd: '', paymentDueDate: '', statementGenDate: '', transactions: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [creditCardEntryMode, setCreditCardEntryMode] = useState('manual');
  const [extracting, setExtracting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editTxnIdx, setEditTxnIdx] = useState(null);
  const [txnDraft, setTxnDraft] = useState(emptyTxn);
  const [cardNamesByBank, setCardNamesByBank] = useState({});

  useEffect(() => {
    if (card) {
      setForm(prev => ({ ...prev, ...card }));
    } else {
      setForm({
        name: '', bank: '', balance: '', cardNumber: '', expiry: '', cvv: '', issuer: '', pdfPassword: '',
        address: '', cardName: '', creditLimit: '', availableCreditLimit: '', availableCashLimit: '', totalPaymentDue: '', minPaymentDue: '', statementPeriodStart: '', statementPeriodEnd: '', paymentDueDate: '', statementGenDate: '', transactions: []
      });
    }
    setCreditCardEntryMode('manual');
    setShowPreview(false);
    setFormErrors({});
    setSelectedFile(null);
    setExtracting(false);
    setEditTxnIdx(null);
    setTxnDraft(emptyTxn);
  }, [card, open]);

  useEffect(() => {
    if (open) {
      // Fetch card name options from backend
      api.get('/api/credit-cards/card-names').then(res => {
        setCardNamesByBank(res.data || {});
      });
    }
  }, [open]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.name && !form.cardName) errors.name = 'Name is required.';
    if (!form.bank) errors.bank = 'Bank is required.';
    if (form.balance === '' || isNaN(form.balance)) errors.balance = 'Balance must be a number.';
    if (!form.cardNumber) errors.cardNumber = 'Card Number is required.';
    if (!form.expiry) errors.expiry = 'Expiry Date is required.';
    if (!form.cvv) errors.cvv = 'CVV is required.';
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
    const txns = [...form.transactions];
    txns[idx] = txnDraft;
    setForm({ ...form, transactions: txns });
    setEditTxnIdx(null);
    setTxnDraft(emptyTxn);
  };
  const handleTxnDelete = (idx) => {
    const txns = [...form.transactions];
    txns.splice(idx, 1);
    setForm({ ...form, transactions: txns });
    setEditTxnIdx(null);
    setTxnDraft(emptyTxn);
  };
  const handleTxnAdd = () => {
    setForm({ ...form, transactions: [...(form.transactions || []), txnDraft] });
    setTxnDraft(emptyTxn);
  };

  // PDF extraction logic
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
        const numFields = ['creditLimit', 'availableCreditLimit', 'availableCashLimit', 'totalPaymentDue', 'minPaymentDue'];
        numFields.forEach(f => {
          if (newForm[f] !== undefined && newForm[f] !== null && newForm[f] !== '') {
            const n = String(newForm[f]).replace(/,/g, '');
            newForm[f] = isNaN(Number(n)) ? '' : n;
          }
        });
        // Auto-fill bank from issuer if bank is empty and issuer is present
        if (!newForm.bank && newForm.issuer) {
          newForm.bank = newForm.issuer;
        }
        return newForm;
      });
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
    if (onSave) await onSave(form);
  };
  const handleCancelPreview = () => {
    setShowPreview(false);
    setForm({ ...form, transactions: [] });
    setSelectedFile(null);
    setExtracting(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (onSave) await onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{card ? 'Edit Credit Card' : 'Add Credit Card'}</DialogTitle>
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
              <TextField label="Name" name="name" value={form.name} onChange={handleChange} fullWidth margin="normal" error={!!formErrors.name} helperText={formErrors.name} />
              <FormControl fullWidth margin="normal" error={!!formErrors.bank}>
                <InputLabel>Bank</InputLabel>
                <Select label="Bank" name="bank" value={form.bank || ""} onChange={handleChange}>
                  {bankNames.map((bank) => (
                    <MenuItem key={bank} value={bank}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: BANK_COLORS[bank].color,
                            flexShrink: 0
                          }}
                        />
                        <Typography sx={{ color: BANK_COLORS[bank].color, fontWeight: 500 }}>
                          {bank}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.bank && <Typography color="error" variant="caption">{formErrors.bank}</Typography>}
              </FormControl>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <TextField label="Card Number" name="cardNumber" value={form.cardNumber} onChange={handleChange} fullWidth margin="normal" error={!!formErrors.cardNumber} helperText={formErrors.cardNumber} InputProps={{ readOnly: !!card }} />
                <TextField label="Expiry" name="expiry" value={form.expiry} onChange={handleChange} fullWidth margin="normal" error={!!formErrors.expiry} helperText={formErrors.expiry} />
                <TextField label="CVV" name="cvv" value={form.cvv} onChange={handleChange} fullWidth margin="normal" error={!!formErrors.cvv} helperText={formErrors.cvv} />
              </Box>
              <TextField label="Balance" name="balance" type="number" value={form.balance} onChange={handleChange} fullWidth margin="normal" error={!!formErrors.balance} helperText={formErrors.balance} />
              <Box sx={{ my: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Issuer</Typography>
                <FormControl fullWidth error={!!formErrors.issuer}>
                  <InputLabel>Issuer</InputLabel>
                  <Select label="Issuer" name="issuer" value={form.issuer || ""} onChange={handleChange} renderValue={selected => selected ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: BANK_COLORS[selected]?.color || '#757575', flexShrink: 0 }} />
                      <Typography sx={{ color: BANK_COLORS[selected]?.color || '#757575', fontWeight: 500 }}>{selected}</Typography>
                    </Box>
                  ) : <em>Select a bank</em>}>
                    <MenuItem value="">
                      <em>Select a bank</em>
                    </MenuItem>
                    {bankNames.map((bank) => (
                      <MenuItem key={bank} value={bank}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: BANK_COLORS[bank].color, flexShrink: 0 }} />
                          <Typography sx={{ color: BANK_COLORS[bank].color, fontWeight: 500 }}>{bank}</Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.issuer && <Typography color="error" variant="caption">{formErrors.issuer}</Typography>}
                </FormControl>
              </Box>
            </>
          )}
          {creditCardEntryMode === 'pdf' && !showPreview && (
            <>
              <FormControl fullWidth margin="normal">
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
              </FormControl>
              {form.bank && cardNamesByBank[form.bank] ? (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Card Name</InputLabel>
                  <Select
                    label="Card Name"
                    name="cardName"
                    value={form.cardName || ''}
                    onChange={handleChange}
                  >
                    {cardNamesByBank[form.bank].map((name) => (
                      <MenuItem key={name} value={name}>{name}</MenuItem>
                    ))}
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              ) : null}
              {(!form.bank || !cardNamesByBank[form.bank] || form.cardName === 'other') && (
                <TextField
                  label="Card Name"
                  name="cardName"
                  value={form.cardName === 'other' ? '' : (form.cardName || '')}
                  onChange={handleChange}
                  fullWidth
                  margin="normal"
                />
              )}
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
              <TableContainer component={Paper} sx={{ maxHeight: 300, mb: 2 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Details</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(form.transactions || []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No transactions found</TableCell>
                      </TableRow>
                    )}
                    {(form.transactions || []).map((txn, idx) => (
                      <TableRow key={idx}>
                        {editTxnIdx === idx ? (
                          <>
                            <TableCell><TextField type="date" name="date" size="small" value={txnDraft.date} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                            <TableCell><TextField type="text" name="details" size="small" value={txnDraft.details} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                            <TableCell><TextField type="text" name="name" size="small" value={txnDraft.name} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                            <TableCell><TextField type="text" name="category" size="small" value={txnDraft.category} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                            <TableCell><TextField type="number" name="amount" size="small" value={txnDraft.amount} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                            <TableCell>
                              <IconButton onClick={() => handleTxnSave(idx)} color="primary" size="small"><SaveIcon fontSize="small" /></IconButton>
                              <IconButton onClick={() => setEditTxnIdx(null)} color="error" size="small"><CancelIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>{txn.date}</TableCell>
                            <TableCell>{txn.details}</TableCell>
                            <TableCell>{txn.name}</TableCell>
                            <TableCell>{txn.category}</TableCell>
                            <TableCell>{txn.amount}</TableCell>
                            <TableCell>
                              <IconButton onClick={() => handleTxnEdit(idx)} color="primary" size="small"><EditIcon fontSize="small" /></IconButton>
                              <IconButton onClick={() => handleTxnDelete(idx)} color="error" size="small"><DeleteIcon fontSize="small" /></IconButton>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                    {/* Add new transaction row */}
                    <TableRow>
                      <TableCell><TextField type="date" name="date" size="small" value={txnDraft.date} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                      <TableCell><TextField type="text" name="details" size="small" value={txnDraft.details} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                      <TableCell><TextField type="text" name="name" size="small" value={txnDraft.name} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                      <TableCell><TextField type="text" name="category" size="small" value={txnDraft.category} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                      <TableCell><TextField type="number" name="amount" size="small" value={txnDraft.amount} onChange={handleTxnDraftChange} variant="standard" /></TableCell>
                      <TableCell>
                        <IconButton onClick={handleTxnAdd} color="success" size="small"><AddIcon fontSize="small" /></IconButton>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button onClick={handleCancelPreview}>Cancel</Button>
                <Button variant="contained" onClick={handleAddAfterPreview}>Save</Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {creditCardEntryMode === 'manual' && (
            <Box sx={{ mt: 2, width: '100%', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={externalLoading}>{card ? 'Update' : 'Create'}</Button>
            </Box>
          )}
        </DialogActions>
      </form>
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default CreditCardEditDialog; 