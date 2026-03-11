import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel,
  Select, MenuItem, Box, Typography, Alert
} from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts } from '../../slices/accountsSlice';
import { formatAmount } from '../../utils';

const CreditCardPaymentDialog = ({ 
  open, 
  onClose, 
  creditCard, 
  onPaymentComplete 
}) => {
  const [paymentData, setPaymentData] = useState({
    paymentAmount: creditCard?.minimumPayment || 0,
    paymentMethod: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
    isMinimumPayment: (creditCard?.minimumPayment || 0) < (creditCard?.statementBalance || creditCard?.currentBalance || 0),
    accountId: '',
    isCash: false,
    cashSource: ''
  });

  const dispatch = useDispatch();
  const { items: accounts, status: accountsStatus } = useSelector((state) => state.accounts || { items: [], status: 'idle' });

  React.useEffect(() => {
    if (accountsStatus === 'idle') {
      dispatch(fetchAccounts());
    }
  }, [accountsStatus, dispatch]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field) => (event) => {
    setPaymentData(prev => {
      const newState = { ...prev, [field]: event.target.value };
      
      if (field === 'accountId') {
        if (event.target.value === 'cash') {
           newState.isCash = true;
           newState.accountId = '';
        } else {
           newState.isCash = false;
           newState.cashSource = '';
        }
      }
      
      return newState;
    });
  };

  const handlePaymentTypeChange = (isMinimum) => {
    setPaymentData(prev => ({
      ...prev,
      paymentAmount: isMinimum ? creditCard.minimumPayment : (creditCard.statementBalance || creditCard.currentBalance || 0),
      isMinimumPayment: isMinimum
    }));
  };

  const handleSubmit = async () => {
    if (paymentData.paymentAmount <= 0) {
      setError('Payment amount must be greater than 0');
      return;
    }

    if (paymentData.paymentAmount > (creditCard?.statementBalance || creditCard?.currentBalance || 0)) {
      setError('Payment amount cannot exceed total due');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // This would make an API call to your payment endpoint
      const response = await fetch(`/api/credit-cards/${creditCard.id}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      const result = await response.json();

      if (result.success) {
        onPaymentComplete(result.data);
        onClose();
        // Reset form
        setPaymentData({
          paymentAmount: creditCard?.minimumPayment || 0,
          paymentMethod: 'bank_transfer',
          paymentDate: new Date().toISOString().split('T')[0],
          notes: '',
          isMinimumPayment: (creditCard?.minimumPayment || 0) < (creditCard?.statementBalance || creditCard?.currentBalance || 0),
          accountId: '',
          isCash: false,
          cashSource: ''
        });
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '16px' }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1, 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        fontWeight: 700
      }}>
        <PaymentIcon color="primary" />
        Make Payment
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}

        {/* Payment Amount Selection */}
        <Box mb={3}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select Payment Amount
          </Typography>
          
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant={paymentData.isMinimumPayment ? "contained" : "outlined"}
              onClick={() => handlePaymentTypeChange(true)}
              sx={{ 
                flex: 1, 
                borderRadius: '10px',
                py: 1.5,
                fontWeight: 600
              }}
            >
              Minimum Payment
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {formatAmount(creditCard?.minimumPayment || 0)}
              </Typography>
            </Button>
            
            <Button
              variant={!paymentData.isMinimumPayment ? "contained" : "outlined"}
              onClick={() => handlePaymentTypeChange(false)}
              sx={{ 
                flex: 1, 
                borderRadius: '10px',
                py: 1.5,
                fontWeight: 600
              }}
            >
              Full Payment
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                {formatAmount(creditCard?.statementBalance || creditCard?.currentBalance || 0)}
              </Typography>
            </Button>
          </Box>

          <TextField
            fullWidth
            label="Payment Amount"
            type="number"
            value={paymentData.paymentAmount}
            onChange={handleInputChange('paymentAmount')}
            inputProps={{ 
              min: 0.01, 
              max: creditCard?.statementBalance || creditCard?.currentBalance || 0,
              step: 0.01
            }}
            sx={{ mb: 2 }}
          />
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Payment Method</InputLabel>
          <Select
            value={paymentData.paymentMethod}
            onChange={handleInputChange('paymentMethod')}
            label="Payment Method"
          >
            <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
            <MenuItem value="check">Check</MenuItem>
            <MenuItem value="online">Online Payment</MenuItem>
            <MenuItem value="auto">Auto Payment</MenuItem>
          </Select>
        </FormControl>

        {/* Funding Source */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Funding Source (Optional)</InputLabel>
          <Select
            value={paymentData.isCash ? 'cash' : paymentData.accountId}
            onChange={handleInputChange('accountId')}
            label="Funding Source (Optional)"
          >
            <MenuItem value=""><em>None (Don't deduct from balance)</em></MenuItem>
            <MenuItem value="cash">Cash</MenuItem>
            {accounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.account_name} ({formatAmount(account.balance)})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {paymentData.isCash && (
           <TextField
             fullWidth
             label="Cash Source / Details (Optional)"
             value={paymentData.cashSource}
             onChange={handleInputChange('cashSource')}
             sx={{ mb: 2 }}
           />
        )}

        {/* Payment Date */}
        <TextField
          fullWidth
          label="Payment Date"
          type="date"
          value={paymentData.paymentDate}
          onChange={handleInputChange('paymentDate')}
          sx={{ mb: 2 }}
        />

        {/* Notes */}
        <TextField
          fullWidth
          label="Notes (Optional)"
          multiline
          rows={3}
          value={paymentData.notes}
          onChange={handleInputChange('notes')}
          placeholder="Add any notes about this payment..."
          sx={{ mb: 2 }}
        />

        {/* Payment Summary */}
        <Box 
          sx={{ 
            p: 2, 
            backgroundColor: 'grey.50', 
            borderRadius: '10px',
            border: '1px solid',
            borderColor: 'grey.200'
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Payment Summary
          </Typography>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Total Due:</Typography>
            <Typography variant="body2" fontWeight={600}>
              {formatAmount(creditCard?.statementBalance || creditCard?.currentBalance || 0)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between" mb={1}>
            <Typography variant="body2">Payment Amount:</Typography>
            <Typography variant="body2" fontWeight={600} color="primary.main">
              {formatAmount(paymentData.paymentAmount)}
            </Typography>
          </Box>
          <Box display="flex" justifyContent="space-between">
            <Typography variant="body2">Remaining Due:</Typography>
            <Typography variant="body2" fontWeight={700} color="success.main">
              {formatAmount(Math.max(0, (creditCard?.statementBalance || creditCard?.currentBalance || 0) - paymentData.paymentAmount))}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={handleClose}
          disabled={isProcessing}
          sx={{ borderRadius: '10px' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isProcessing || !paymentData.paymentAmount || paymentData.paymentAmount <= 0}
          startIcon={<PaymentIcon />}
          sx={{ 
            borderRadius: '10px',
            fontWeight: 700,
            px: 3
          }}
        >
          {isProcessing ? 'Processing...' : `Pay ${formatAmount(paymentData.paymentAmount)}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreditCardPaymentDialog;
