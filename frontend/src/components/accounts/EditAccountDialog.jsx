import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Button, Divider, Grid, CircularProgress,
    InputAdornment, Alert,
} from '@mui/material';
import { updateAccount, fetchAccountTypes, fetchFinancialInstitutions } from '../../slices/accountsSlice';

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED', 'SGD'];

const EditAccountDialog = ({ open, account, onClose, onSuccess }) => {
    const dispatch = useDispatch();
    const { accountTypes, financialInstitutions } = useSelector((state) => state.accounts);
    const [form, setForm] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && account) {
            setForm({
                accountName: account.account_name || account.accountName || '',
                accountTypeId: account.account_type_id || account.accountTypeId || '',
                institutionId: account.institution_id || account.institutionId || '',
                accountNumber: '',  // never pre-fill for security
                balance: account.balance ?? '',
                availableBalance: account.available_balance ?? account.availableBalance ?? '',
                currency: account.currency || 'INR',
                creditLimit: account.credit_limit ?? account.creditLimit ?? '',
                minimumBalance: account.minimum_balance ?? account.minimumBalance ?? '',
                notes: account.notes || '',
            });
            setError('');
            if (!accountTypes.length) dispatch(fetchAccountTypes());
            if (!financialInstitutions.length) dispatch(fetchFinancialInstitutions());
        }
    }, [open, account, dispatch]);

    const selectedType = accountTypes.find((t) => t.id === form.accountTypeId);
    const isLiability = selectedType?.category === 'liability';

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!form.accountName?.trim()) return setError('Account name is required.');
        if (!form.accountTypeId) return setError('Please select an account type.');
        setError('');
        setSubmitting(true);

        const payload = {
            accountName: form.accountName.trim(),
            accountTypeId: form.accountTypeId,
            institutionId: form.institutionId || undefined,
            accountNumber: form.accountNumber || undefined,
            balance: form.balance !== '' ? Number(form.balance) : 0,
            availableBalance: form.availableBalance !== '' ? Number(form.availableBalance) : undefined,
            currency: form.currency,
            creditLimit: form.creditLimit !== '' ? Number(form.creditLimit) : undefined,
            minimumBalance: form.minimumBalance !== '' ? Number(form.minimumBalance) : undefined,
            notes: form.notes || undefined,
        };

        const result = await dispatch(updateAccount({ id: account.id, accountData: payload }));
        setSubmitting(false);
        if (updateAccount.fulfilled.match(result)) {
            onSuccess?.();
            onClose();
        } else {
            setError(result.payload || 'Failed to update account.');
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="bold">Edit Account</DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 3 }}>
                <Grid container spacing={2}>
                    {error && (
                        <Grid size={12}>
                            <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                        </Grid>
                    )}

                    <Grid size={12}>
                        <TextField
                            fullWidth label="Account Name *" name="accountName"
                            value={form.accountName || ''} onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select fullWidth label="Account Type *" name="accountTypeId"
                            value={form.accountTypeId || ''} onChange={handleChange}
                        >
                            {accountTypes.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select fullWidth label="Institution" name="institutionId"
                            value={form.institutionId || ''} onChange={handleChange}
                        >
                            <MenuItem value="">None</MenuItem>
                            {financialInstitutions.map((fi) => (
                                <MenuItem key={fi.id} value={fi.id}>{fi.name}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth label="New Account Number" name="accountNumber"
                            value={form.accountNumber || ''} onChange={handleChange}
                            placeholder="Leave blank to keep current"
                            helperText="Only fill to change account number"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            select fullWidth label="Currency" name="currency"
                            value={form.currency || 'INR'} onChange={handleChange}
                        >
                            {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth label="Current Balance" name="balance" type="number"
                            value={form.balance ?? ''} onChange={handleChange}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                            fullWidth label="Available Balance" name="availableBalance" type="number"
                            value={form.availableBalance ?? ''} onChange={handleChange}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                    </Grid>

                    {isLiability && (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField
                                fullWidth label="Credit Limit" name="creditLimit" type="number"
                                value={form.creditLimit ?? ''} onChange={handleChange}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                        </Grid>
                    )}

                    <Grid size={{ xs: 12, sm: isLiability ? 6 : 12 }}>
                        <TextField
                            fullWidth label="Minimum Balance" name="minimumBalance" type="number"
                            value={form.minimumBalance ?? ''} onChange={handleChange}
                            InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                    </Grid>

                    <Grid size={12}>
                        <TextField
                            fullWidth label="Notes" name="notes" multiline rows={2}
                            value={form.notes || ''} onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2, gap: 1 }}>
                <Button onClick={onClose} color="inherit" disabled={submitting}>Cancel</Button>
                <Button
                    variant="contained" color="primary" onClick={handleSubmit}
                    disabled={submitting} sx={{ borderRadius: 2, minWidth: 120 }}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
                >
                    {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditAccountDialog;
