import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Button, Divider, Box, Typography,
    Grid, Alert, CircularProgress, InputAdornment,
    FormControlLabel, Switch, Chip
} from '@mui/material';
import { createCreditCardTransaction, updateCreditCardTransaction } from '../../slices/creditCardTransactionsSlice';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULTS = {
    transactionDate: TODAY,
    postedDate: '',
    description: '',
    merchant: '',
    category: '',
    amount: '',
    transactionType: 'purchase',
    referenceNumber: '',
    rewardsEarned: '',
    foreignTransaction: false,
    statementDate: '',
    isPayment: false,
    paymentMethod: 'credit_card'
};

const TRANSACTION_TYPES = [
    { value: 'purchase', label: '💳 Purchase', icon: <ShoppingCartIcon /> },
    { value: 'cash_advance', label: '💰 Cash Advance', icon: <PaymentIcon /> },
    { value: 'balance_transfer', label: '🔄 Balance Transfer', icon: <CreditCardIcon /> },
    { value: 'payment', label: '💸 Payment', icon: <PaymentIcon /> },
    { value: 'fee', label: '📋 Fee', icon: <CreditCardIcon /> },
    { value: 'interest', label: '📈 Interest', icon: <CreditCardIcon /> }
];

const CATEGORIES = [
    'Food & Dining', 'Shopping', 'Transportation', 'Entertainment',
    'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
    'Groceries', 'Gas & Fuel', 'Home Improvement', 'Insurance',
    'Personal Care', 'Taxes', 'Gifts & Donations', 'Other'
];

const AddCreditCardTransactionDialog = ({ open, onClose, onSuccess, creditCard, transaction }) => {
    const dispatch = useDispatch();
    const isEdit = !!transaction;

    const [form, setForm] = useState(DEFAULTS);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load transaction data when editing
    useEffect(() => {
        if (!open) return;
        setError('');

        if (isEdit && transaction) {
            setForm({
                transactionDate: transaction.transactionDate || TODAY,
                postedDate: transaction.postedDate || '',
                description: transaction.description || '',
                merchant: transaction.merchant || '',
                category: transaction.category || '',
                amount: Math.abs(Number(transaction.amount)) || '',
                transactionType: transaction.transactionType || 'purchase',
                referenceNumber: transaction.referenceNumber || '',
                rewardsEarned: transaction.rewardsEarned || '',
                foreignTransaction: transaction.foreignTransaction || false,
                statementDate: transaction.statementDate || '',
                isPayment: transaction.isPayment || false,
                paymentMethod: transaction.paymentMethod || 'credit_card'
            });
        } else {
            setForm(DEFAULTS);
        }
    }, [open, isEdit, transaction]);

    const set = (field) => (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm((f) => ({ ...f, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!form.amount || !form.description || !form.transactionDate) {
            return setError('Amount, description, and date are required.');
        }

        if (parseFloat(form.amount) <= 0) {
            return setError('Amount must be greater than 0.');
        }

        setLoading(true);
        setError('');

        const payload = {
            transactionDate: form.transactionDate,
            postedDate: form.postedDate || undefined,
            description: form.description,
            merchant: form.merchant || undefined,
            category: form.category || undefined,
            amount: parseFloat(form.amount),
            transactionType: form.transactionType,
            referenceNumber: form.referenceNumber || undefined,
            rewardsEarned: form.rewardsEarned ? parseFloat(form.rewardsEarned) : undefined,
            foreignTransaction: form.foreignTransaction,
            statementDate: form.statementDate || undefined,
            isPayment: form.transactionType === 'payment' || form.isPayment,
            paymentMethod: form.paymentMethod
        };

        try {
            let result;
            if (isEdit) {
                result = await dispatch(updateCreditCardTransaction({
                    creditCardId: creditCard.id,
                    transactionId: transaction.id,
                    transaction: payload
                }));
                if (updateCreditCardTransaction.rejected.match(result)) throw new Error(result.payload);
            } else {
                result = await dispatch(createCreditCardTransaction({
                    creditCardId: creditCard.id,
                    transaction: payload
                }));
                if (createCreditCardTransaction.rejected.match(result)) throw new Error(result.payload);
            }
            
            onSuccess?.(`Credit card transaction ${isEdit ? 'updated' : 'added'} successfully!`);
            onClose();
        } catch (err) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'add'} credit card transaction.`);
        } finally {
            setLoading(false);
        }
    };

    const selectedType = TRANSACTION_TYPES.find(t => t.value === form.transactionType);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: '20px' } }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
                    {isEdit ? 'Edit Credit Card Transaction' : 'New Credit Card Transaction'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {creditCard?.cardName} • ****{creditCard?.cardNumberLastFour}
                </Typography>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ pt: 2.5 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
                )}

                <Box display="flex" flexDirection="column" gap={2}>
                    {/* Row 1 — Transaction Type + Amount */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select fullWidth size="small" label="Transaction Type"
                                value={form.transactionType} onChange={set('transactionType')}
                            >
                                {TRANSACTION_TYPES.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            {type.icon}
                                            {type.label}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Amount" type="number"
                                placeholder="0.00"
                                value={form.amount} onChange={set('amount')}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Description */}
                    <TextField
                        fullWidth size="small" label="Description"
                        placeholder="e.g. Grocery shopping at BigBasket"
                        value={form.description} onChange={set('description')}
                        required
                    />

                    {/* Merchant */}
                    <TextField
                        fullWidth size="small" label="Merchant"
                        placeholder="e.g. Amazon, Swiggy"
                        value={form.merchant} onChange={set('merchant')}
                    />

                    {/* Date + Posted Date */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Transaction Date" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.transactionDate} onChange={set('transactionDate')}
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Posted Date" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.postedDate} onChange={set('postedDate')}
                            />
                        </Grid>
                    </Grid>

                    {/* Category + Reference Number */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select fullWidth size="small" label="Category"
                                value={form.category} onChange={set('category')}
                            >
                                <MenuItem value=""><em>— Uncategorized —</em></MenuItem>
                                {CATEGORIES.map((category) => (
                                    <MenuItem key={category} value={category}>{category}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Reference Number"
                                placeholder="e.g. TXN123456"
                                value={form.referenceNumber} onChange={set('referenceNumber')}
                            />
                        </Grid>
                    </Grid>

                    {/* Additional Fields */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Rewards Earned" type="number"
                                placeholder="0.00"
                                value={form.rewardsEarned} onChange={set('rewardsEarned')}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">🎯</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Statement Date" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.statementDate} onChange={set('statementDate')}
                            />
                        </Grid>
                    </Grid>

                    {/* Switches */}
                    <Box display="flex" gap={2}>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={form.foreignTransaction}
                                    onChange={set('foreignTransaction')}
                                    size="small"
                                />
                            }
                            label="Foreign Transaction"
                        />
                        {selectedType?.value === 'payment' && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={form.isPayment}
                                        onChange={set('isPayment')}
                                        size="small"
                                    />
                                }
                                label="Payment Transaction"
                            />
                        )}
                    </Box>

                    {/* Transaction Type Info */}
                    {selectedType && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                bgcolor: 'grey.50',
                                border: '1px solid',
                                borderColor: 'grey.200'
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                <strong>{selectedType.label}</strong>
                                {selectedType.value === 'purchase' && ' - Regular credit card purchase'}
                                {selectedType.value === 'cash_advance' && ' - Cash withdrawal from credit card'}
                                {selectedType.value === 'balance_transfer' && ' - Transfer balance from another card'}
                                {selectedType.value === 'payment' && ' - Payment to reduce credit card balance'}
                                {selectedType.value === 'fee' && ' - Annual or other fees'}
                                {selectedType.value === 'interest' && ' - Interest charges'}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>

            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" disabled={loading}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
                    sx={{
                        borderRadius: '10px', px: 3, fontWeight: 700,
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        boxShadow: '0 4px 12px rgba(79,70,229,0.35)',
                    }}
                >
                    {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Transaction'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCreditCardTransactionDialog;
