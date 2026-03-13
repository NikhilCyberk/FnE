import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Divider, Box, Typography,
  Grid, Alert, CircularProgress, InputAdornment
} from '@mui/material';
import { Description } from '@mui/icons-material';

const DEFAULTS = {
  statementDate: '',
  statementPeriodStart: '',
  statementPeriodEnd: '',
  totalAmountDue: '',
  minimumAmountDue: '',
  paymentDueDate: '',
  availableCredit: '',
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

const AddStatementDialog = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setForm(DEFAULTS);
      setError('');
    }
  }, [open]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.statementDate || !form.totalAmountDue || !form.paymentDueDate) {
      return setError('Statement date, total amount due, and payment due date are required.');
    }
    setLoading(true); setError('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save statement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: '20px' } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Description sx={{ color: 'white', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
              Add Card Statement
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Record a new statement to track history.
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        <Box display="flex" flexDirection="column" gap={2}>
          <Section title="Statement Period" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Statement Date *" type="date"
                value={form.statementDate} onChange={set('statementDate')} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth size="small" label="Period Start" type="date"
                value={form.statementPeriodStart} onChange={set('statementPeriodStart')} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth size="small" label="Period End" type="date"
                value={form.statementPeriodEnd} onChange={set('statementPeriodEnd')} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>

          <Section title="Amounts & Due Dates" />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Total Amount Due *" type="number"
                value={form.totalAmountDue} onChange={set('totalAmountDue')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Minimum Amount Due *" type="number"
                value={form.minimumAmountDue} onChange={set('minimumAmountDue')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Payment Due Date *" type="date"
                value={form.paymentDueDate} onChange={set('paymentDueDate')} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth size="small" label="Available Credit (Optional)" type="number"
                value={form.availableCredit} onChange={set('availableCredit')}
                InputProps={{ startAdornment: Rupee }} />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            borderRadius: '10px', px: 3, fontWeight: 700,
            background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)',
            boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
          }}>
          {loading ? 'Saving…' : 'Add Statement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddStatementDialog;
