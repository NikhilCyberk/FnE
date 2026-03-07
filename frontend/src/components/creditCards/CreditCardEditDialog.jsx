import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Divider, Box, Typography,
  Grid, Alert, CircularProgress, RadioGroup, FormControlLabel, Radio,
  InputAdornment,
} from '@mui/material';
import { CreditCard, Upload } from '@mui/icons-material';
import api from '../../api';

/* ─── Bank list ─────────────────────────────────────────────────────────── */
const BANKS = [
  'Axis Bank', 'HDFC Bank', 'ICICI Bank', 'State Bank of India (SBI)',
  'Kotak Mahindra Bank', 'Punjab National Bank (PNB)', 'Bank of Baroda',
  'Canara Bank', 'Union Bank of India', 'Bank of India', 'IDBI Bank',
  'Yes Bank', 'Federal Bank', 'IndusInd Bank', 'RBL Bank', 'Bandhan Bank',
  'IDFC First Bank', 'AU Small Finance Bank', 'Other',
];
const CARD_TYPES = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'amex', label: 'American Express' },
  { value: 'discover', label: 'Discover' },
  { value: 'rupay', label: 'RuPay' },
];
const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'frozen', label: 'Frozen' },
  { value: 'closed', label: 'Closed' },
];

const DEFAULTS = {
  cardName: '', cardType: '', cardNumberLastFour: '',
  creditLimit: '', availableCredit: '', cashAdvanceLimit: '',
  currentBalance: '', statementBalance: '', minimumPayment: '',
  paymentDueDate: '', statementDate: '',
  lastPaymentAmount: '', lastPaymentDate: '',
  apr: '', annualFee: '', rewardsProgram: '',
  expiryDate: '', status: 'active',
};

const Section = ({ title }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
    <Box sx={{ width: 4, height: 18, borderRadius: 2, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', flexShrink: 0 }} />
    <Typography variant="subtitle2" fontWeight={700} color="text.secondary" letterSpacing={0.5}>
      {title}
    </Typography>
    <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
  </Box>
);

const Rupee = <InputAdornment position="start">₹</InputAdornment>;
const Pct = <InputAdornment position="end">%</InputAdornment>;

const CreditCardEditDialog = ({ open, onClose, card, onSave }) => {
  const isEdit = !!card;
  const [mode, setMode] = useState('manual');
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // PDF state
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfPassword, setPdfPassword] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [pdfError, setPdfError] = useState('');

  /* Pre-fill when editing */
  useEffect(() => {
    if (!open) return;
    setError(''); setPdfError(''); setPdfFile(null); setPdfPassword(''); setMode('manual');

    if (isEdit && card) {
      setForm({
        cardName: card.cardName || '',
        cardType: card.cardType || '',
        cardNumberLastFour: card.cardNumberLastFour || '',
        creditLimit: card.creditLimit || '',
        availableCredit: card.availableCredit || '',
        cashAdvanceLimit: card.cashAdvanceLimit || '',
        currentBalance: card.currentBalance || '',
        statementBalance: card.statementBalance || '',
        minimumPayment: card.minimumPayment || '',
        paymentDueDate: (card.paymentDueDate || '').slice(0, 10),
        statementDate: (card.statementDate || '').slice(0, 10),
        lastPaymentAmount: card.lastPaymentAmount || '',
        lastPaymentDate: (card.lastPaymentDate || '').slice(0, 10),
        apr: card.apr || '',
        annualFee: card.annualFee || '',
        rewardsProgram: card.rewardsProgram || '',
        expiryDate: (card.expiryDate || '').slice(0, 10),
        status: (card.status || 'active').toLowerCase(),
      });
    } else {
      setForm(DEFAULTS);
    }
  }, [open]); // eslint-disable-line

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  /* ── PDF Extract ── */
  const handleExtract = async () => {
    if (!pdfFile) return;
    setExtracting(true); setPdfError('');
    const fd = new FormData();
    fd.append('file', pdfFile);
    if (pdfPassword) fd.append('password', pdfPassword);

    try {
      const res = await api.post('/api/credit-cards/extract-credit-card-info', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const d = res.data;
      const toISO = (s) => {
        if (!s) return '';
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
          const [day, month, year] = s.split('/');
          return `${year}-${month}-${day}`;
        }
        return (s || '').slice(0, 10);
      };
      const parseNum = (v) => (v ? String(v).replace(/,/g, '') : '');

      setForm((f) => ({
        ...f,
        cardName: d.cardName || f.cardName,
        creditLimit: parseNum(d.creditLimit),
        availableCredit: parseNum(d.availableCreditLimit || d.availableCredit),
        cashAdvanceLimit: parseNum(d.availableCashLimit || d.cashAdvanceLimit),
        statementBalance: parseNum(d.totalPaymentDue || d.statementBalance),
        minimumPayment: parseNum(d.minPaymentDue || d.minimumPayment),
        paymentDueDate: toISO(d.paymentDueDate),
        statementDate: toISO(d.statementGenDate || d.statementDate),
      }));
      setMode('manual');
    } catch (err) {
      setPdfError(err.response?.data?.error || 'Failed to extract PDF. Check password or try manually.');
    } finally {
      setExtracting(false);
    }
  };

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!form.cardName && !form.cardType) return setError('Card name is required.');
    setLoading(true); setError('');
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message || 'Failed to save card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <CreditCard sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
              {isEdit ? 'Edit Credit Card' : 'Add Credit Card'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isEdit ? 'Update your card details.' : 'Enter card details manually or extract from a PDF statement.'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
        {pdfError && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>{pdfError}</Alert>}

        {/* Mode toggle */}
        {!isEdit && (
          <RadioGroup row value={mode} onChange={(e) => setMode(e.target.value)} sx={{ mb: 2 }}>
            <FormControlLabel value="manual" control={<Radio size="small" />} label="Enter Manually" />
            <FormControlLabel value="pdf" control={<Radio size="small" />} label="Extract from PDF" />
          </RadioGroup>
        )}

        {/* PDF panel */}
        {mode === 'pdf' && (
          <Box display="flex" flexDirection="column" gap={2} mb={2}>
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Upload your credit card statement PDF to auto-fill fields.
            </Alert>
            <TextField fullWidth size="small" label="Statement PDF" type="file"
              inputProps={{ accept: 'application/pdf' }} InputLabelProps={{ shrink: true }}
              onChange={(e) => setPdfFile(e.target.files[0])} disabled={extracting} />
            <TextField fullWidth size="small" label="PDF Password (if any)" type="password"
              value={pdfPassword} onChange={(e) => setPdfPassword(e.target.value)} disabled={extracting} />
            <Button variant="contained"
              startIcon={extracting ? <CircularProgress size={16} color="inherit" /> : <Upload />}
              onClick={handleExtract} disabled={!pdfFile || extracting}
              sx={{ borderRadius: '10px', fontWeight: 700, background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
              {extracting ? 'Extracting…' : 'Extract Info'}
            </Button>
            <Divider />
            <Typography variant="caption" color="text.disabled" textAlign="center">
              Review and edit extracted fields below
            </Typography>
          </Box>
        )}

        {/* ── Form fields ── */}
        <Box display="flex" flexDirection="column" gap={2}>

          <Section title="Card Identity" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 7 }}>
              <TextField fullWidth size="small" label="Card Name / Product *"
                placeholder="e.g. HDFC Regalia Gold" value={form.cardName} onChange={set('cardName')} />
            </Grid>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField select fullWidth size="small" label="Card Network"
                value={form.cardType} onChange={set('cardType')}>
                <MenuItem value=""><em>— Select —</em></MenuItem>
                {CARD_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 5 }}>
              <TextField fullWidth size="small" label="Last 4 Digits"
                placeholder="4276" inputProps={{ maxLength: 4 }}
                value={form.cardNumberLastFour} onChange={set('cardNumberLastFour')}
                InputProps={{ readOnly: isEdit }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Expiry Date" type="date"
                value={form.expiryDate} onChange={set('expiryDate')} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField select fullWidth size="small" label="Status"
                value={form.status} onChange={set('status')}>
                {STATUSES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>

          <Section title="Credit Limits" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Credit Limit" type="number"
                value={form.creditLimit} onChange={set('creditLimit')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Available Credit" type="number"
                value={form.availableCredit} onChange={set('availableCredit')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Cash Advance Limit" type="number"
                value={form.cashAdvanceLimit} onChange={set('cashAdvanceLimit')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
          </Grid>

          <Section title="Balance & Payments" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Current Balance" type="number"
                value={form.currentBalance} onChange={set('currentBalance')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Statement Balance" type="number"
                value={form.statementBalance} onChange={set('statementBalance')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Minimum Payment" type="number"
                value={form.minimumPayment} onChange={set('minimumPayment')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Last Payment" type="number"
                value={form.lastPaymentAmount} onChange={set('lastPaymentAmount')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Last Payment Date" type="date"
                value={form.lastPaymentDate} onChange={set('lastPaymentDate')}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Payment Due Date" type="date"
                value={form.paymentDueDate} onChange={set('paymentDueDate')}
                InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>

          <Section title="Statement & Fees" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Statement Date" type="date"
                value={form.statementDate} onChange={set('statementDate')}
                InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="APR" type="number"
                value={form.apr} onChange={set('apr')}
                InputProps={{ endAdornment: Pct }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" label="Annual Fee" type="number"
                value={form.annualFee} onChange={set('annualFee')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
          </Grid>
          <TextField fullWidth size="small" label="Rewards Program (optional)"
            placeholder="e.g. HDFC Rewards Points" value={form.rewardsProgram} onChange={set('rewardsProgram')} />
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            borderRadius: '10px', px: 3, fontWeight: 700,
            background: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
            boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
          }}>
          {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Card'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreditCardEditDialog;