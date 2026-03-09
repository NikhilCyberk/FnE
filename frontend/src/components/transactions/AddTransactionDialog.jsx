import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Button, Divider, Box, Typography,
    Grid, Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import { createTransaction, updateTransaction, fetchTransactions } from '../../slices/transactionsSlice';
import { accountsAPI, categoriesAPI } from '../../api';

const TODAY = new Date().toISOString().slice(0, 10);

const DEFAULTS = {
    description: '', type: 'expense', amount: '', transactionDate: TODAY,
    accountId: '', cashSource: '', categoryId: '', transferAccountId: '', status: 'completed',
    merchant: '', notes: '', postedDate: '', referenceNumber: '',
};

const CURRENCIES_SIGN = '₹';

const AddTransactionDialog = ({ open, onClose, onSuccess, transaction }) => {
    const dispatch = useDispatch();
    const isEdit = !!transaction;

    const [form, setForm] = useState(DEFAULTS);
    const [accounts, setAccounts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Load accounts + categories when dialog opens
    useEffect(() => {
        if (!open) return;
        setError('');

        // Pre-fill if editing
        if (isEdit && transaction) {
            setForm({
                description: transaction.description || '',
                type: transaction.type || 'expense',
                amount: Math.abs(Number(transaction.amount)) || '',
                transactionDate: (transaction.transaction_date || transaction.transactionDate || TODAY).slice(0, 10),
                accountId: transaction.is_cash || transaction.isCash ? 'CASH' : (transaction.account_id || transaction.accountId || ''),
                cashSource: transaction.cash_source || transaction.cashSource || '',
                categoryId: transaction.category_id || transaction.categoryId || '',
                transferAccountId: transaction.transfer_account_id || transaction.transferAccountId || '',
                status: transaction.status || 'completed',
                merchant: transaction.merchant || '',
                notes: transaction.notes || '',
                postedDate: (transaction.posted_date || transaction.postedDate || '').slice(0, 10),
                referenceNumber: transaction.reference_number || transaction.referenceNumber || '',
            });
        } else {
            setForm(DEFAULTS);
        }

        // Fetch reference data
        const load = async () => {
            try {
                const [accRes, catRes] = await Promise.all([
                    accountsAPI.getAll(),
                    categoriesAPI.getAll(),
                ]);
                setAccounts(accRes.data?.accounts || accRes.data || []);
                setCategories(catRes.data?.categories || catRes.data || []);
            } catch {
                // non-fatal — user can still type
            }
        };
        load();
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async () => {
        if (!form.amount || !form.type || !form.transactionDate) {
            return setError('Amount, type, and date are required.');
        }
        if (form.type === 'transfer' && !form.transferAccountId) {
            return setError('Transfer type requires a destination account.');
        }
        if (form.type === 'transfer' && form.transferAccountId === form.accountId) {
            return setError('Source and destination accounts must differ.');
        }

        setLoading(true);
        setError('');

        const isCash = form.accountId === 'CASH';

        const payload = {
            description: form.description,
            type: form.type,
            amount: parseFloat(form.amount),
            transactionDate: form.transactionDate,
            accountId: isCash ? undefined : (form.accountId || undefined),
            isCash,
            cashSource: isCash ? form.cashSource : undefined,
            categoryId: form.categoryId || undefined,
            transferAccountId: form.type === 'transfer' ? form.transferAccountId : undefined,
            status: form.status,
            merchant: form.merchant || undefined,
            notes: form.notes || undefined,
            postedDate: form.postedDate || undefined,
            referenceNumber: form.referenceNumber || undefined,
        };

        try {
            let result;
            if (isEdit) {
                result = await dispatch(updateTransaction({ id: transaction.id, transaction: payload }));
                if (updateTransaction.rejected.match(result)) throw new Error(result.payload);
            } else {
                result = await dispatch(createTransaction(payload));
                if (createTransaction.rejected.match(result)) throw new Error(result.payload);
            }
            dispatch(fetchTransactions()); // refresh to get joined fields (accountName, categoryName)
            onSuccess?.(`Transaction ${isEdit ? 'updated' : 'added'} successfully!`);
            onClose();
        } catch (err) {
            setError(err.message || `Failed to ${isEdit ? 'update' : 'add'} transaction.`);
        } finally {
            setLoading(false);
        }
    };

    const incomeCategories = categories.filter((c) => c.type === 'income' || !c.type);
    const expenseCategories = categories.filter((c) => c.type === 'expense' || !c.type);
    const filteredCategories = form.type === 'income' ? incomeCategories
        : form.type === 'expense' ? expenseCategories
            : categories;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: '20px' } }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
                    {isEdit ? 'Edit Transaction' : 'New Transaction'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {isEdit ? 'Update the transaction details below.' : 'Fill in the details for your transaction.'}
                </Typography>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ pt: 2.5 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
                )}

                <Box display="flex" flexDirection="column" gap={2}>
                    {/* Row 1 — Type + Amount */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                                select fullWidth size="small" label="Type"
                                value={form.type} onChange={set('type')}
                            >
                                <MenuItem value="expense">💸 Expense</MenuItem>
                                <MenuItem value="income">💰 Income</MenuItem>
                                <MenuItem value="transfer">🔄 Transfer</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 7 }}>
                            <TextField
                                fullWidth size="small" label="Amount" type="number"
                                placeholder="0.00"
                                value={form.amount} onChange={set('amount')}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">{CURRENCIES_SIGN}</InputAdornment>,
                                }}
                            />
                        </Grid>
                    </Grid>

                    {/* Description */}
                    <TextField
                        fullWidth size="small" label="Description"
                        placeholder="e.g. Grocery shopping at BigBasket"
                        value={form.description} onChange={set('description')}
                    />

                    {/* Date + Status */}
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth size="small" label="Date" type="date"
                                InputLabelProps={{ shrink: true }}
                                value={form.transactionDate} onChange={set('transactionDate')}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                select fullWidth size="small" label="Status"
                                value={form.status} onChange={set('status')}
                            >
                                <MenuItem value="completed">✅ Completed</MenuItem>
                                <MenuItem value="pending">⏳ Pending</MenuItem>
                                <MenuItem value="cancelled">❌ Cancelled</MenuItem>
                                <MenuItem value="failed">⚠️ Failed</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>

                    <TextField
                        select fullWidth size="small"
                        label={form.type === 'transfer' ? 'From Account' : 'Account'}
                        value={form.accountId} onChange={set('accountId')}
                    >
                        <MenuItem value=""><em>— None —</em></MenuItem>
                        {form.type !== 'transfer' && <MenuItem value="CASH">💵 Cash</MenuItem>}
                        {accounts.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                                {a.account_name || a.accountName}
                                {(a.account_number_masked || a.accountNumberMasked) ? ` · ${a.account_number_masked || a.accountNumberMasked}` : ''}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* Cash Source */}
                    {form.accountId === 'CASH' && (
                        <TextField
                            fullWidth size="small" label="Cash Source (optional)"
                            placeholder="e.g. ATM Withdrawal, Friend, etc."
                            value={form.cashSource} onChange={set('cashSource')}
                        />
                    )}

                    {/* Transfer — destination account */}
                    {form.type === 'transfer' && (
                        <TextField
                            select fullWidth size="small" label="To Account"
                            value={form.transferAccountId} onChange={set('transferAccountId')}
                        >
                            <MenuItem value=""><em>— Select —</em></MenuItem>
                            {accounts
                                .filter((a) => a.id !== form.accountId)
                                .map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                        {a.account_name || a.accountName}
                                    </MenuItem>
                                ))}
                        </TextField>
                    )}

                    {/* Category */}
                    {form.type !== 'transfer' && (
                        <TextField
                            select fullWidth size="small" label="Category"
                            value={form.categoryId} onChange={set('categoryId')}
                        >
                            <MenuItem value=""><em>— Uncategorized —</em></MenuItem>
                            {filteredCategories.map((c) => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </TextField>
                    )}

                    {/* Merchant */}
                    <TextField
                        fullWidth size="small" label="Merchant (optional)"
                        placeholder="e.g. Amazon, Swiggy"
                        value={form.merchant} onChange={set('merchant')}
                    />

                    {/* Notes */}
                    <TextField
                        fullWidth size="small" multiline rows={2} label="Notes (optional)"
                        value={form.notes} onChange={set('notes')}
                    />
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

export default AddTransactionDialog;
