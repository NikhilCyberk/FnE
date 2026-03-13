import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, MenuItem, Button, Divider, Box, Typography,
    Grid, Alert, CircularProgress, InputAdornment,
} from '@mui/material';
import { createTransaction, updateTransaction, fetchTransactions } from '../../slices/transactionsSlice';
import { fetchCashSources } from '../../slices/cashSourcesSlice';
import { accountsAPI, categoriesAPI, loansAPI, creditCardsAPI } from '../../api';
import { useForm, useDialog, useAsyncState } from '../../hooks';
import { getToday } from '../../utils';
import { DEFAULT_CURRENCY, ACCOUNT_TYPES, TRANSACTION_STATUS } from '../../constants';

const DEFAULTS = {
    description: '', type: 'expense', amount: '', transactionDate: getToday(),
    accountId: '', cashSource: '', categoryId: '', transferAccountId: '', status: TRANSACTION_STATUS.COMPLETED,
    merchant: '', notes: '', postedDate: '', referenceNumber: '',
};

const AddTransactionDialog = ({ open, onClose, onSuccess, transaction }) => {
    const dispatch = useDispatch();
    const isEdit = !!(transaction && transaction.id);

    const { form, set, reset, updateForm } = useForm(DEFAULTS);
    const { data: accounts, setData: setAccounts, execute: loadAccounts } = useAsyncState([]);
    const { data: categories, setData: setCategories, execute: loadCategories } = useAsyncState([]);
    const { data: cashSources, setData: setCashSources, execute: loadCashSources } = useAsyncState([]);
    const { data: creditCards, setData: setCreditCards, execute: loadCreditCards } = useAsyncState([]);
    const { data: loans, setData: setLoans } = useAsyncState([]);
    const { loading, error, setError, setLoading } = useAsyncState(null);

    // Load accounts + categories when dialog opens
    useEffect(() => {
        if (!open) return;
        setError(null);

        // Pre-fill if editing
        if (isEdit && transaction) {
            updateForm({
                description: transaction.description || '',
                type: transaction.type || 'expense',
                amount: Math.abs(Number(transaction.amount)) || '',
                transactionDate: (transaction.transaction_date || transaction.transactionDate || getToday()).slice(0, 10),
                accountId: transaction.is_cash || transaction.isCash ? 'CASH' : (transaction.account_id || transaction.accountId || ''),
                cashSource: transaction.cash_source || transaction.cashSource || '',
                categoryId: transaction.category_id || transaction.categoryId || '',
                transferAccountId: transaction.transfer_account_id || transaction.transferAccountId || '',
                status: transaction.status || TRANSACTION_STATUS.COMPLETED,
                merchant: transaction.merchant || '',
                notes: transaction.notes || '',
                postedDate: (transaction.posted_date || transaction.postedDate || '').slice(0, 10),
                referenceNumber: transaction.reference_number || transaction.referenceNumber || '',
            });
        } else {
            reset();
            if (transaction && (transaction.accountId || transaction.account_id)) {
                const accountId = transaction.accountId || transaction.account_id;
                updateForm({ 
                    accountId: accountId.startsWith('LOAN_') ? '' : accountId,
                    transferAccountId: accountId.startsWith('LOAN_') ? accountId : ''
                });
            }
        }

        // Fetch reference data
        const loadData = async () => {
            try {
                const [accRes, catRes, cashRes, ccRes, loansRes] = await Promise.all([
                    accountsAPI.getAll({ includeLiabilities: 'true', limit: 100 }),
                    categoriesAPI.getAll(),
                    fetchCashSources(),
                    creditCardsAPI.getAll(),
                    loansAPI.getAll()
                ]);
                setAccounts(accRes.data?.accounts || accRes.data || []);
                setCategories(catRes.data?.categories || catRes.data || []);
                setCashSources(cashRes.payload || []);
                setCreditCards(ccRes.data?.creditCards || ccRes.data || []);
                setLoans(loansRes.data?.loans || loansRes.data || []);
            } catch {
                // non-fatal — user can still type
            }
        };
        loadData();
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps


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

        // Check if this is a credit card transaction
        const isCreditCard = form.accountId && form.accountId.startsWith('CC_');
        const creditCardId = isCreditCard ? form.accountId.replace('CC_', '') : null;
        
        const isCash = form.accountId === 'CASH';

        if (isCreditCard && creditCardId) {
            // Handle credit card transaction through credit card API
            try {
                const creditCardPayload = {
                    transactionDate: form.transactionDate,
                    postedDate: form.postedDate || undefined,
                    description: form.description,
                    merchant: form.merchant || undefined,
                    category: form.categoryId || undefined,
                    amount: parseFloat(form.amount),
                    transactionType: 'purchase', // Default to purchase
                    referenceNumber: form.referenceNumber || undefined,
                    isPayment: form.type === 'expense' && form.description.toLowerCase().includes('payment'),
                    paymentMethod: 'credit_card'
                };

                const response = await fetch(`/api/credit-cards/${creditCardId}/transactions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(creditCardPayload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to create credit card transaction');
                }

                const result = await response.json();
                onSuccess?.('Credit card transaction added successfully!');
                onClose();
            } catch (err) {
                setError(err.message || 'Failed to add credit card transaction.');
            } finally {
                setLoading(false);
            }
        } else {
            // Handle regular transaction through existing API
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
                } else if (form.type === 'transfer' && form.transferAccountId.startsWith('LOAN_')) {
            // Handle loan payment via transfer
            const loanId = form.transferAccountId.replace('LOAN_', '');
            try {
                const loanPayload = {
                    _action: 'payment',
                    _payment_amount: parseFloat(form.amount),
                    notes: form.notes || `Transfer from ${accounts.find(a => a.id === form.accountId)?.account_name || 'Account'}`,
                };

                const response = await fetch(`/api/loans/${loanId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(loanPayload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to process loan payment');
                }

                // Also create a regular transaction to record the outflow from the source account
                const emiCategory = categories.find(c => c.name === 'EMI');
                const outflowPayload = {
                    description: `Loan Payment: ${form.description || 'Transfer to Loan'}`,
                    type: 'expense',
                    amount: parseFloat(form.amount),
                    transactionDate: form.transactionDate,
                    accountId: form.accountId,
                    categoryId: emiCategory ? emiCategory.id : (form.categoryId || undefined),
                    status: form.status,
                    notes: form.notes,
                };
                await dispatch(createTransaction(outflowPayload));

                onSuccess?.('Loan payment processed successfully!');
                onClose();
            } catch (err) {
                setError(err.message || 'Failed to process loan payment.');
            } finally {
                setLoading(false);
            }
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
            <DialogTitle sx={{ pb: 1 }} component="div">
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
                                    startAdornment: <InputAdornment position="start">{DEFAULT_CURRENCY.symbol}</InputAdornment>,
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
                        value={form.accountId || ''} onChange={set('accountId')}
                    >
                        <MenuItem value=""><em>— None —</em></MenuItem>
                        {/* Fallback for pre-filled value before accounts load */}
                        {form.accountId && form.accountId !== 'CASH' && !form.accountId.startsWith('CC_') && 
                         !accounts.some(a => a.id === form.accountId) && (
                            <MenuItem value={form.accountId} sx={{ display: 'none' }}>Loading account...</MenuItem>
                        )}
                        {form.type !== 'transfer' && <MenuItem value="CASH">💵 Cash</MenuItem>}
                        {form.type !== 'transfer' && creditCards.map((cc) => (
                            <MenuItem key={cc.id} value={`CC_${cc.id}`}>
                                💳 {cc.cardName} · ****{cc.cardNumberLastFour}
                            </MenuItem>
                        ))}
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
                            select fullWidth size="small" label="Cash Source (optional)"
                            value={form.cashSource} onChange={set('cashSource')}
                        >
                            <MenuItem value=""><em>— Select Source —</em></MenuItem>
                            {cashSources.map((cs) => (
                                <MenuItem key={cs.id} value={cs.name}>
                                    {cs.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}

                    {/* Transfer — destination account */}
                    {form.type === 'transfer' && (
                        <TextField
                            select fullWidth size="small" label="To Account"
                            value={form.transferAccountId} onChange={set('transferAccountId')}
                        >
                        <MenuItem value=""><em>— Select —</em></MenuItem>
                            
                            <Typography variant="overline" sx={{ px: 2, py: 0.5, display: 'block', fontWeight: 700, bgcolor: 'action.hover' }}>
                                Bank Accounts
                            </Typography>
                            {accounts
                                .filter((a) => a.id !== form.accountId && a.account_type_category === 'asset')
                                .map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                        🏦 {a.account_name || a.accountName}
                                    </MenuItem>
                                ))}

                            <Typography variant="overline" sx={{ px: 2, py: 0.5, display: 'block', fontWeight: 700, bgcolor: 'action.hover' }}>
                                Credit Cards
                            </Typography>
                            {accounts
                                .filter((a) => a.id !== form.accountId && a.account_type_category === 'liability')
                                .map((a) => (
                                    <MenuItem key={a.id} value={a.id}>
                                        💳 {a.account_name || a.accountName}
                                    </MenuItem>
                                ))}
                            {creditCards.map((cc) => (
                                <MenuItem key={cc.id} value={`CC_${cc.id}`}>
                                    💳 {cc.cardName} · ****{cc.cardNumberLastFour}
                                </MenuItem>
                            ))}

                            <Typography variant="overline" sx={{ px: 2, py: 0.5, display: 'block', fontWeight: 700, bgcolor: 'action.hover' }}>
                                Loans
                            </Typography>
                            {loans.map((loan) => (
                                <MenuItem key={loan.id} value={`LOAN_${loan.id}`}>
                                    📉 {loan.loan_type} · {loan.lender_name}
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
