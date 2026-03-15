// import React, { useEffect } from 'react';
// import { useDispatch } from 'react-redux';
// import {
//     Dialog, DialogContent, 
//     TextField, MenuItem, Button, Divider, Box, Typography,
//     Grid, Alert, CircularProgress, Autocomplete, createFilterOptions
// } from '@mui/material';
// import { 
//     KeyboardArrowDown, KeyboardArrowUp, 
//     TrendingDown, TrendingUp, SwapHoriz,
//     Handshake, Payments
// } from '@mui/icons-material';
// import { createTransaction, updateTransaction, fetchTransactions } from '../../slices/transactionsSlice';
// import { fetchCashSources } from '../../slices/cashSourcesSlice';
// import { accountsAPI, categoriesAPI, loansAPI, creditCardsAPI, contactsAPI } from '../../api';
// import { useForm, useAsyncState } from '../../hooks';
// import { getToday } from '../../utils';
// import { DEFAULT_CURRENCY, TRANSACTION_STATUS } from '../../constants';

// const filter = createFilterOptions();

// const DEFAULTS = {
//     description: '', type: 'expense', amount: '', transactionDate: getToday(),
//     accountId: '', cashSource: '', categoryId: '', transferAccountId: '', status: TRANSACTION_STATUS.COMPLETED,
//     merchant: '', notes: '', postedDate: '', referenceNumber: '',
//     contactId: '', debtType: '', dueDate: '', debtGroupId: '',
// };

// const AddTransactionDialog = ({ open, onClose, onSuccess, transaction }) => {
//     const dispatch = useDispatch();
//     const isEdit = !!(transaction && transaction.id);

//     const { form, set, reset, updateForm } = useForm(DEFAULTS);
//     const { data: accounts, setData: setAccounts } = useAsyncState([]);
//     const { data: categories, setData: setCategories } = useAsyncState([]);
//     const { data: creditCards, setData: setCreditCards } = useAsyncState([]);
//     const { data: contacts, setData: setContacts } = useAsyncState([]);
//     const { loading, error, setError, setLoading } = useAsyncState(null);

//     useEffect(() => {
//         if (!open) return;
//         setError(null);

//         if (isEdit && transaction) {
//             updateForm({
//                 description: transaction.description || '',
//                 type: transaction.type || 'expense',
//                 amount: Math.abs(Number(transaction.amount)) || '',
//                 transactionDate: (transaction.transaction_date || transaction.transactionDate || getToday()).slice(0, 10),
//                 accountId: transaction.is_cash || transaction.isCash ? 'CASH' : (transaction.account_id || transaction.accountId || ''),
//                 cashSource: transaction.cash_source || transaction.cashSource || '',
//                 categoryId: transaction.category_id || transaction.categoryId || '',
//                 transferAccountId: transaction.transfer_account_id || transaction.transferAccountId || '',
//                 status: transaction.status || TRANSACTION_STATUS.COMPLETED,
//                 merchant: transaction.merchant || '',
//                 notes: transaction.notes || '',
//                 postedDate: (transaction.posted_date || transaction.postedDate || '').slice(0, 10),
//                 referenceNumber: transaction.reference_number || transaction.referenceNumber || '',
//                 contactId: transaction.contact_id || transaction.contactId || '',
//                 debtType: transaction.debt_type || transaction.debtType || '',
//                 dueDate: (transaction.due_date || transaction.dueDate || '').slice(0, 10),
//                 debtGroupId: transaction.debt_group_id || transaction.debtGroupId || '',
//             });
//         } else {
//             reset();
//             if (transaction && (transaction.accountId || transaction.account_id)) {
//                 const acctId = transaction.accountId || transaction.account_id;
//                 updateForm({ accountId: acctId.startsWith('LOAN_') ? '' : acctId });
//             }
//         }

//         const loadData = async () => {
//             try {
//                 const [accRes, catRes, cashRes, ccRes, loansRes] = await Promise.all([
//                     accountsAPI.getAll({ includeLiabilities: 'true', limit: 100 }),
//                     categoriesAPI.getAll(),
//                     fetchCashSources(),
//                     creditCardsAPI.getAll(),
//                     loansAPI.getAll()
//                 ]);
//                 setAccounts((accRes.data?.accounts || accRes.data || []).filter(a => 
//                     !(a.account_name || a.accountName)?.toLowerCase().startsWith('credit card - ') &&
//                     (a.account_type_category || a.accountTypeCategory) !== 'liability'
//                 ));
//                 setCategories(catRes.data?.categories || catRes.data || []);
//                 setCreditCards(ccRes.data?.creditCards || ccRes.data || []);

//                 const contRes = await contactsAPI.getAll();
//                 setContacts(contRes.data?.contacts || []);
//             } catch (err) { console.error(err); }
//         };
//         loadData();
//     }, [open, isEdit, transaction, reset, updateForm, setError, setAccounts, setCategories, setCreditCards, setContacts]);

//     const handleSubmit = async () => {
//         if (!form.amount || !form.type || !form.transactionDate) {
//             return setError('Amount, type, and date are required.');
//         }

//         setLoading(true);
//         setError('');

//         const isCreditCard = form.accountId && form.accountId.startsWith('CC_');
//         const creditCardId = isCreditCard ? form.accountId.replace('CC_', '') : null;
//         const isCash = form.accountId === 'CASH';

//         if (isCreditCard && creditCardId) {
//             try {
//                 const payload = {
//                     transactionDate: form.transactionDate,
//                     postedDate: form.postedDate || undefined,
//                     description: form.description,
//                     merchant: form.merchant || undefined,
//                     category: form.categoryId || undefined,
//                     amount: parseFloat(form.amount),
//                     transactionType: 'purchase',
//                     referenceNumber: form.referenceNumber || undefined,
//                     paymentMethod: 'credit_card'
//                 };

//                 const response = await fetch(`/api/credit-cards/${creditCardId}/transactions`, {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//                     body: JSON.stringify(payload)
//                 });

//                 if (!response.ok) throw new Error((await response.json()).error || 'Failed to add credit card transaction');
//                 onSuccess?.('Credit card transaction added successfully!');
//                 onClose();
//             } catch (err) {
//                 setError(err.message);
//             } finally { setLoading(false); }
//         } else {
//             const payload = {
//                 description: form.description,
//                 type: form.type,
//                 amount: parseFloat(form.amount),
//                 transactionDate: form.transactionDate,
//                 accountId: isCash ? undefined : (form.accountId || undefined),
//                 isCash,
//                 cashSource: isCash ? form.cashSource : undefined,
//                 categoryId: form.categoryId || undefined,
//                 transferAccountId: form.type === 'transfer' ? form.transferAccountId : undefined,
//                 status: form.status,
//                 merchant: form.merchant || undefined,
//                 notes: form.notes || undefined,
//                 postedDate: form.postedDate || undefined,
//                 referenceNumber: form.referenceNumber || undefined,
//                 contact_id: form.contactId || undefined,
//                 debt_type: form.debtType || undefined,
//                 due_date: form.dueDate || undefined,
//             };

//             try {
//                 if (isEdit) {
//                     const res = await dispatch(updateTransaction({ id: transaction.id, transaction: payload }));
//                     if (updateTransaction.rejected.match(res)) throw new Error(res.payload);
//                 } else if (form.type === 'transfer' && form.transferAccountId?.startsWith('LOAN_')) {
//                     const loanId = form.transferAccountId.replace('LOAN_', '');
//                     const loanRes = await fetch(`/api/loans/${loanId}`, {
//                         method: 'PUT',
//                         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
//                         body: JSON.stringify({ _action: 'payment', _payment_amount: parseFloat(form.amount) })
//                     });
//                     if (!loanRes.ok) throw new Error((await loanRes.json()).error || 'Failed to process loan payment');
//                 } else {
//                     const res = await dispatch(createTransaction(payload));
//                     if (createTransaction.rejected.match(res)) throw new Error(res.payload);
//                 }
//                 dispatch(fetchTransactions());
//                 onSuccess?.(`Transaction ${isEdit ? 'updated' : 'added'} successfully!`);
//                 onClose();
//             } catch (err) {
//                 setError(err.message);
//             } finally { setLoading(false); }
//         }
//     };

//     const handleUiTypeSet = (uiType) => {
//         if (uiType === 'expense') updateForm({ type: 'expense', debtType: '' });
//         else if (uiType === 'income') updateForm({ type: 'income', debtType: '' });
//         else if (uiType === 'transfer') updateForm({ type: 'transfer', debtType: '' });
//         else if (uiType === 'borrowed') updateForm({ type: 'income', debtType: 'borrowed' });
//         else if (uiType === 'lent') updateForm({ type: 'expense', debtType: 'lent' });
//         else if (uiType === 'repayment') updateForm({ type: 'expense', debtType: 'repayment' });
//     };

//     const currentUiType = form.debtType === 'borrowed' ? 'borrowed' : (form.debtType === 'lent' ? 'lent' : (form.debtType === 'repayment' ? 'repayment' : form.type));

//     const hints = {
//         expense: "Money you spent or paid out.",
//         income: "Money received into your account.",
//         transfer: "Move funds between your accounts.",
//         borrowed: "You received money — you owe this person.",
//         lent: "You gave money — they owe you.",
//         repayment: "Recording a repayment for existing debt."
//     };

//     return (
//         <Dialog 
//             open={open} onClose={onClose} 
//             maxWidth="xs" fullWidth 
//             PaperProps={{ sx: { borderRadius: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' } }}
//         >
//             <DialogContent sx={{ p: '20px 24px', overflowX: 'hidden', '&::-webkit-scrollbar': { display: 'none' } }}>
//                 <Typography variant="h6" fontWeight={800} sx={{ color: '#111827', mb: 0.2, letterSpacing: '-0.02em' }}>
//                     {isEdit ? 'Edit transaction' : 'New transaction'}
//                 </Typography>
//                 <Typography variant="body2" sx={{ color: '#6B7280', mb: 2, fontSize: '13px' }}>
//                     Update the transaction details below.
//                 </Typography>

//                 {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px', fontSize: '12px' }}>{error}</Alert>}

//                 <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 1, letterSpacing: '0.06em' }}>
//                     Transaction type
//                 </Typography>

//                 <Box 
//                     display="flex" gap={0.5} mb={1} pb={0.5}
//                     sx={{ 
//                         overflowX: 'auto', flexWrap: 'nowrap',
//                         '&::-webkit-scrollbar': { display: 'none' },
//                         msOverflowStyle: 'none', scrollbarWidth: 'none'
//                     }}
//                 >
//                     {[
//                         { id: 'expense', label: 'Expense', icon: <TrendingDown />, color: '#B91C1C', bg: '#FEF2F2', border: '#FCA5A5' },
//                         { id: 'income', label: 'Income', icon: <TrendingUp />, color: '#15803D', bg: '#F0FDF4', border: '#86EFAC' },
//                         { id: 'transfer', label: 'Transfer', icon: <SwapHoriz />, color: '#1D4ED8', bg: '#EFF6FF', border: '#93C5FD' },
//                         { id: 'borrowed', label: 'Borrowed', icon: <Handshake />, color: '#B45309', bg: '#FFFBEB', border: '#FCD34D' },
//                         { id: 'lent', label: 'Lent', icon: <Payments />, color: '#4338CA', bg: '#EEF2FF', border: '#AFA9EC' },
//                         { id: 'repayment', label: 'Repay', icon: <Payments />, color: '#374151', bg: '#F9FAFB', border: '#D1D5DB' }
//                     ].map(t => {
//                         const isActive = currentUiType === t.id;
//                         return (
//                             <Button
//                                 key={t.id} onClick={() => handleUiTypeSet(t.id)}
//                                 sx={{
//                                     height: 42, minWidth: '64px', flexShrink: 0, px: 0.5, borderRadius: '10px',
//                                     border: `1.5px solid ${isActive ? t.border : '#F3F4F6'}`,
//                                     bgcolor: isActive ? t.bg : '#fff',
//                                     color: isActive ? t.color : '#6B7280',
//                                     display: 'flex', flexDirection: 'column', gap: 0,
//                                     '&:hover': { bgcolor: isActive ? t.bg : '#F9FAFB', borderColor: isActive ? t.border : '#E5E7EB' },
//                                     fontSize: '9px', fontWeight: 800, textTransform: 'none',
//                                     transition: 'all 0.15s ease-in-out'
//                                 }}
//                             >
//                                 <Box sx={{ fontSize: 16, opacity: isActive ? 1 : 0.4, mb: -0.3 }}>{t.icon}</Box>
//                                 {t.label}
//                             </Button>
//                         );
//                     })}
//                 </Box>
//                 <Typography variant="caption" sx={{ color: '#9CA3AF', fontStyle: 'italic', display: 'block', mb: 2, fontSize: '11px' }}>
//                     {hints[currentUiType]}
//                 </Typography>

//                 <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1.5}>
//                     <Box gridColumn="span 1">
//                         <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Amount (₹)</Typography>
//                         <TextField fullWidth size="small" type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }} />
//                     </Box>
//                     <Box gridColumn="span 1">
//                         <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Date</Typography>
//                         <TextField fullWidth size="small" type="date" value={form.transactionDate} onChange={set('transactionDate')} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }} />
//                     </Box>

//                     <Box gridColumn="span 2">
//                         <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Description</Typography>
//                         <TextField fullWidth size="small" value={form.description} onChange={set('description')} placeholder="What was this for?" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }} />
//                     </Box>

//                     <Box gridColumn="span 1">
//                         <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Account</Typography>
//                         <TextField select fullWidth size="small" value={form.accountId || ''} onChange={set('accountId')} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }}>
//                             <MenuItem value=""><em>— None —</em></MenuItem>
//                             {form.type !== 'transfer' && <MenuItem value="CASH">💵 Cash</MenuItem>}
//                             {form.type !== 'transfer' && creditCards.map((cc) => <MenuItem key={cc.id} value={`CC_${cc.id}`}>💳 {cc.cardName}</MenuItem>)}
//                             {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.account_name}</MenuItem>)}
//                         </TextField>
//                     </Box>
//                     <Box gridColumn="span 1">
//                         <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Category</Typography>
//                         <TextField select fullWidth size="small" value={form.categoryId || ''} onChange={set('categoryId')} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }}>
//                             <MenuItem value=""><em>— select —</em></MenuItem>
//                             {categories.filter(c => c.type === form.type || !c.type).map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
//                         </TextField>
//                     </Box>

//                     <Box gridColumn="span 1">
//                         <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Status</Typography>
//                         <TextField select fullWidth size="small" value={form.status} onChange={set('status')} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }}>
//                             <MenuItem value="completed">Completed</MenuItem>
//                             <MenuItem value="pending">Pending</MenuItem>
//                         </TextField>
//                     </Box>
//                     <Box gridColumn="span 1">
//                         <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Merchant (opt.)</Typography>
//                         <TextField fullWidth size="small" value={form.merchant} onChange={set('merchant')} placeholder="e.g. Amazon" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }} />
//                     </Box>

//                     {form.type === 'transfer' && (
//                         <Box gridColumn="span 2">
//                             <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Destination Account</Typography>
//                             <TextField select fullWidth size="small" value={form.transferAccountId} onChange={set('transferAccountId')} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }}>
//                                 <MenuItem value=""><em>— Select —</em></MenuItem>
//                                 {accounts.filter(a => a.id !== form.accountId).map(a => <MenuItem key={a.id} value={a.id}>{a.account_name}</MenuItem>)}
//                                 {creditCards.map(cc => <MenuItem key={cc.id} value={`CC_${cc.id}`}>💳 {cc.cardName}</MenuItem>)}
//                             </TextField>
//                         </Box>
//                     )}

//                     {['borrowed', 'lent', 'repayment'].includes(currentUiType) && (
//                         <Box gridColumn="span 2" display="grid" gridTemplateColumns="1fr 1fr" gap={1.5} mt={0.5}>
//                             <Box gridColumn="span 2" sx={{ my: 0.5 }}><Divider sx={{ borderStyle: 'dashed' }} /></Box>
//                             <Box gridColumn="span 1">
//                                 <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Person</Typography>
//                                 <Autocomplete
//                                     size="small" freeSolo options={contacts}
//                                     value={form.contactId ? (contacts.find(c => c.id === form.contactId) || { name: 'Unknown' }) : null}
//                                     getOptionLabel={(option) => option.name || (typeof option === 'string' ? option : '')}
//                                     onChange={async (e, v) => {
//                                         if (v && v.inputValue) {
//                                             const res = await contactsAPI.create({ name: v.inputValue });
//                                             setContacts([...contacts, res.data]);
//                                             set('contactId')({ target: { value: res.data.id } });
//                                         } else set('contactId')({ target: { value: v ? v.id : '' } });
//                                     }}
//                                     renderInput={(params) => <TextField {...params} placeholder="Name" sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', minHeight: '38px' } }} />}
//                                 />
//                             </Box>
//                             <Box gridColumn="span 1">
//                                 <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Due Date</Typography>
//                                 <TextField fullWidth size="small" type="date" value={form.dueDate} onChange={set('dueDate')} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }} />
//                             </Box>
//                             <Box gridColumn="span 2">
//                                 <Typography sx={{ fontSize: '10px', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', mb: 0.5, letterSpacing: '0.04em' }}>Notes (optional)</Typography>
//                                 <TextField fullWidth size="small" value={form.notes} onChange={set('notes')} placeholder="Extra info..." sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#F9FAFB', borderRadius: '10px', height: '38px' } }} />
//                             </Box>
//                         </Box>
//                     )}
//                 </Box>

//                 <Box display="flex" justifyContent="flex-end" gap={1.5} mt={3}>
//                     <Button 
//                         onClick={onClose} 
//                         sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'none', fontSize: '14px', '&:hover': { bgcolor: 'transparent', color: '#111827' } }}
//                     >
//                         Cancel
//                     </Button>
//                     <Button
//                         variant="contained" onClick={handleSubmit} disabled={loading}
//                         sx={{ 
//                             bgcolor: '#4F46E5', color: '#fff', fontWeight: 700, 
//                             textTransform: 'none', borderRadius: '12px', px: 4, py: 1,
//                             fontSize: '14px',
//                             '&:hover': { bgcolor: '#4338CA' }, 
//                             boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
//                             transition: 'all 0.2s'
//                         }}
//                     >
//                         {loading ? 'Saving…' : (isEdit ? 'Save changes' : 'Save transaction')}
//                     </Button>
//                 </Box>
//             </DialogContent>
//         </Dialog>
//     );
// };

// export default AddTransactionDialog;

import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import {
    Dialog, DialogContent,
    TextField, MenuItem, Button, Divider, Box, Typography,
    Alert, CircularProgress, Autocomplete
} from '@mui/material';
import {
    TrendingDown, TrendingUp, SwapHoriz,
    Handshake, Payments, Close
} from '@mui/icons-material';
import { createTransaction, updateTransaction, fetchTransactions } from '../../slices/transactionsSlice';
import { fetchCashSources } from '../../slices/cashSourcesSlice';
import { accountsAPI, categoriesAPI, loansAPI, creditCardsAPI, contactsAPI } from '../../api';
import { useForm, useAsyncState } from '../../hooks';
import { getToday } from '../../utils';
import { DEFAULT_CURRENCY, TRANSACTION_STATUS } from '../../constants';

const DEFAULTS = {
    description: '', type: 'expense', amount: '', transactionDate: getToday(),
    accountId: '', cashSource: '', categoryId: '', transferAccountId: '', status: TRANSACTION_STATUS.COMPLETED,
    merchant: '', notes: '', postedDate: '', referenceNumber: '',
    contactId: '', debtType: '', dueDate: '', debtGroupId: '',
};

const TRANSACTION_TYPES = [
    { id: 'expense', label: 'Expense', icon: <TrendingDown sx={{ fontSize: 15 }} />, color: '#DC2626', bg: '#FFF1F1', activeBg: '#FEE2E2', border: '#FCA5A5' },
    { id: 'income', label: 'Income', icon: <TrendingUp sx={{ fontSize: 15 }} />, color: '#16A34A', bg: '#F0FDF4', activeBg: '#DCFCE7', border: '#86EFAC' },
    { id: 'transfer', label: 'Transfer', icon: <SwapHoriz sx={{ fontSize: 15 }} />, color: '#2563EB', bg: '#EFF6FF', activeBg: '#DBEAFE', border: '#93C5FD' },
    { id: 'borrowed', label: 'Borrowed', icon: <Handshake sx={{ fontSize: 15 }} />, color: '#D97706', bg: '#FFFBEB', activeBg: '#FEF3C7', border: '#FCD34D' },
    { id: 'lent', label: 'Lent', icon: <Payments sx={{ fontSize: 15 }} />, color: '#7C3AED', bg: '#F5F3FF', activeBg: '#EDE9FE', border: '#C4B5FD' },
    { id: 'repayment', label: 'Repay', icon: <Payments sx={{ fontSize: 15 }} />, color: '#475569', bg: '#F8FAFC', activeBg: '#F1F5F9', border: '#CBD5E1' },
];

const HINTS = {
    expense: 'Money spent or paid out.',
    income: 'Money received into your account.',
    transfer: 'Move funds between accounts.',
    borrowed: 'You received money — you owe this person.',
    lent: 'You gave money — they owe you.',
    repayment: 'Recording a repayment for existing debt.',
};

/* ─── Shared field label ─────────────────────────────────────────────── */
const Label = ({ children }) => (
    <Typography sx={{
        fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: '#94A3B8', mb: '8px', display: 'block'
    }}>
        {children}
    </Typography>
);

/* ─── Shared input sx ────────────────────────────────────────────────── */
const inputSx = {
    '& .MuiOutlinedInput-root': {
        bgcolor: '#F8FAFC',
        borderRadius: '12px',
        height: '46px',
        fontSize: '14.5px',
        '& fieldset': { borderColor: '#E2E8F0' },
        '&:hover fieldset': { borderColor: '#CBD5E1' },
        '&.Mui-focused fieldset': { borderColor: '#6366F1', borderWidth: '2px' },
    },
};

const AddTransactionDialog = ({ open, onClose, onSuccess, transaction }) => {
    const dispatch = useDispatch();
    const isEdit = !!(transaction && transaction.id);

    const { form, set, reset, updateForm } = useForm(DEFAULTS);
    const { data: accounts, setData: setAccounts } = useAsyncState([]);
    const { data: categories, setData: setCategories } = useAsyncState([]);
    const { data: creditCards, setData: setCreditCards } = useAsyncState([]);
    const { data: contacts, setData: setContacts } = useAsyncState([]);
    const { loading, error, setError, setLoading } = useAsyncState(null);

    useEffect(() => {
        if (!open) return;
        setError(null);

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
                contactId: transaction.contact_id || transaction.contactId || '',
                debtType: transaction.debt_type || transaction.debtType || '',
                dueDate: (transaction.due_date || transaction.dueDate || '').slice(0, 10),
                debtGroupId: transaction.debt_group_id || transaction.debtGroupId || '',
            });
        } else {
            reset();
            if (transaction && (transaction.accountId || transaction.account_id)) {
                const acctId = transaction.accountId || transaction.account_id;
                updateForm({ accountId: acctId.startsWith('LOAN_') ? '' : acctId });
            }
        }

        const loadData = async () => {
            try {
                const [accRes, catRes, cashRes, ccRes, loansRes] = await Promise.all([
                    accountsAPI.getAll({ includeLiabilities: 'true', limit: 100 }),
                    categoriesAPI.getAll(),
                    fetchCashSources(),
                    creditCardsAPI.getAll(),
                    loansAPI.getAll()
                ]);
                setAccounts((accRes.data?.accounts || accRes.data || []).filter(a =>
                    !(a.account_name || a.accountName)?.toLowerCase().startsWith('credit card - ') &&
                    (a.account_type_category || a.accountTypeCategory) !== 'liability'
                ));
                setCategories(catRes.data?.categories || catRes.data || []);
                setCreditCards(ccRes.data?.creditCards || ccRes.data || []);
                const contRes = await contactsAPI.getAll();
                setContacts(contRes.data?.contacts || []);
            } catch (err) { console.error(err); }
        };
        loadData();
    }, [open, isEdit, transaction, reset, updateForm, setError, setAccounts, setCategories, setCreditCards, setContacts]);

    const handleSubmit = async () => {
        if (!form.amount || !form.type || !form.transactionDate)
            return setError('Amount, type, and date are required.');

        setLoading(true); setError('');

        const isCreditCard = form.accountId?.startsWith('CC_');
        const creditCardId = isCreditCard ? form.accountId.replace('CC_', '') : null;
        const isCash = form.accountId === 'CASH';

        if (isCreditCard && creditCardId) {
            try {
                const res = await fetch(`/api/credit-cards/${creditCardId}/transactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                    body: JSON.stringify({
                        transactionDate: form.transactionDate, postedDate: form.postedDate || undefined,
                        description: form.description, merchant: form.merchant || undefined,
                        category: form.categoryId || undefined, amount: parseFloat(form.amount),
                        transactionType: 'purchase', referenceNumber: form.referenceNumber || undefined,
                        paymentMethod: 'credit_card'
                    })
                });
                if (!res.ok) throw new Error((await res.json()).error || 'Failed to add credit card transaction');
                onSuccess?.('Credit card transaction added successfully!'); onClose();
            } catch (err) { setError(err.message); } finally { setLoading(false); }
        } else {
            const payload = {
                description: form.description, type: form.type, amount: parseFloat(form.amount),
                transactionDate: form.transactionDate, accountId: isCash ? undefined : (form.accountId || undefined),
                isCash, cashSource: isCash ? form.cashSource : undefined,
                categoryId: form.categoryId || undefined,
                transferAccountId: form.type === 'transfer' ? form.transferAccountId : undefined,
                status: form.status, merchant: form.merchant || undefined, notes: form.notes || undefined,
                postedDate: form.postedDate || undefined, referenceNumber: form.referenceNumber || undefined,
                contact_id: form.contactId || undefined, debt_type: form.debtType || undefined,
                due_date: form.dueDate || undefined,
            };
            try {
                if (isEdit) {
                    const res = await dispatch(updateTransaction({ id: transaction.id, transaction: payload }));
                    if (updateTransaction.rejected.match(res)) throw new Error(res.payload);
                } else if (form.type === 'transfer' && form.transferAccountId?.startsWith('LOAN_')) {
                    const loanId = form.transferAccountId.replace('LOAN_', '');
                    const loanRes = await fetch(`/api/loans/${loanId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                        body: JSON.stringify({ _action: 'payment', _payment_amount: parseFloat(form.amount) })
                    });
                    if (!loanRes.ok) throw new Error((await loanRes.json()).error || 'Failed to process loan payment');
                } else {
                    const res = await dispatch(createTransaction(payload));
                    if (createTransaction.rejected.match(res)) throw new Error(res.payload);
                }
                dispatch(fetchTransactions());
                onSuccess?.(`Transaction ${isEdit ? 'updated' : 'added'} successfully!`); onClose();
            } catch (err) { setError(err.message); } finally { setLoading(false); }
        }
    };

    const handleUiTypeSet = (uiType) => {
        const map = {
            expense: { type: 'expense', debtType: '' }, income: { type: 'income', debtType: '' },
            transfer: { type: 'transfer', debtType: '' }, borrowed: { type: 'income', debtType: 'borrowed' },
            lent: { type: 'expense', debtType: 'lent' }, repayment: { type: 'expense', debtType: 'repayment' },
        };
        updateForm(map[uiType] || {});
    };

    const currentUiType = form.debtType === 'borrowed' ? 'borrowed'
        : form.debtType === 'lent' ? 'lent'
            : form.debtType === 'repayment' ? 'repayment'
                : form.type;

    const activeType = TRANSACTION_TYPES.find(t => t.id === currentUiType);
    const isDebt = ['borrowed', 'lent', 'repayment'].includes(currentUiType);

    return (
        <Dialog
            open={open} onClose={onClose} maxWidth="sm" fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '24px',
                    boxShadow: '0 32px 80px rgba(15,23,42,0.18), 0 8px 32px rgba(15,23,42,0.08)',
                    overflow: 'hidden',
                }
            }}
        >
            {/* ── Header ── */}
            <Box sx={{
                px: 4, pt: 3.5, pb: 3,
                borderBottom: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
            }}>
                <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '20px', color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                        {isEdit ? 'Edit transaction' : 'New transaction'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#94A3B8', mt: 0.6 }}>
                        {isEdit ? 'Update the details below' : 'Fill in the transaction details'}
                    </Typography>
                </Box>
                <Box
                    onClick={onClose}
                    sx={{
                        width: 32, height: 32, borderRadius: '10px', bgcolor: '#F1F5F9',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: '#64748B', mt: 0.2,
                        '&:hover': { bgcolor: '#E2E8F0', color: '#0F172A' },
                        transition: 'all 0.15s'
                    }}
                >
                    <Close sx={{ fontSize: 16 }} />
                </Box>
            </Box>

            <DialogContent sx={{
                p: '28px 32px 32px',
                overflowX: 'hidden',
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-track': { background: 'transparent' },
                '&::-webkit-scrollbar-thumb': { background: '#E2E8F0', borderRadius: '6px' },
            }}>
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 3, borderRadius: '12px', fontSize: '13px', py: 0.8, border: '1px solid #FEE2E2' }}
                    >
                        {error}
                    </Alert>
                )}

                {/* ── Type selector ── */}
                <Typography sx={{
                    fontSize: '11px', fontWeight: 800, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#94A3B8', mb: '10px', display: 'block'
                }}>Transaction type</Typography>
                <Box
                    display="flex" gap={1} mb={1.5}
                    sx={{
                        overflowX: 'auto', flexWrap: 'nowrap', pb: 0.8,
                        '&::-webkit-scrollbar': { display: 'none' },
                        scrollbarWidth: 'none',
                    }}
                >
                    {TRANSACTION_TYPES.map(t => {
                        const isActive = currentUiType === t.id;
                        return (
                            <Button
                                key={t.id} onClick={() => handleUiTypeSet(t.id)}
                                disableRipple
                                sx={{
                                    minWidth: '80px', height: '64px', flexShrink: 0,
                                    px: 1.5, py: 0,
                                    borderRadius: '14px',
                                    border: `1.5px solid ${isActive ? t.border : '#E8EDF2'}`,
                                    bgcolor: isActive ? t.activeBg : '#fff',
                                    color: isActive ? t.color : '#94A3B8',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                                    textTransform: 'none',
                                    fontSize: '11.5px', fontWeight: isActive ? 800 : 500,
                                    boxShadow: isActive ? `0 4px 12px ${t.border}44` : 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    '&:hover': {
                                        bgcolor: isActive ? t.activeBg : t.bg,
                                        borderColor: isActive ? t.border : '#CBD5E1',
                                        boxShadow: `0 4px 12px ${t.border}22`,
                                        transform: 'translateY(-1px)'
                                    },
                                    '&:active': { transform: 'translateY(0)' }
                                }}
                            >
                                <Box sx={{ opacity: isActive ? 1 : 0.6, display: 'flex', '& svg': { fontSize: 20 } }}>{t.icon}</Box>
                                {t.label}
                            </Button>
                        );
                    })}
                </Box>

                {activeType && (
                    <Box sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8,
                        mb: 2.5, px: 1.5, py: 1,
                        bgcolor: activeType.bg, borderRadius: '9px',
                        border: `1px dashed ${activeType.border}`,
                    }}>
                        <Box sx={{ color: activeType.color, display: 'flex', fontSize: 13, opacity: 0.7 }}>
                            {activeType.icon}
                        </Box>
                        <Typography sx={{ fontSize: '11.5px', color: activeType.color, fontWeight: 500, lineHeight: 1.3 }}>
                            {HINTS[currentUiType]}
                        </Typography>
                    </Box>
                )}

                {/* ── Main fields ── */}
                <Box display="grid" gridTemplateColumns="1fr 1fr" gap="14px">
                    {/* Amount */}
                    <Box>
                        <Label>Amount (₹)</Label>
                        <TextField fullWidth size="small" type="number" value={form.amount}
                            onChange={set('amount')} placeholder="0.00" sx={inputSx} />
                    </Box>

                    {/* Date */}
                    <Box>
                        <Label>Date</Label>
                        <TextField fullWidth size="small" type="date" value={form.transactionDate}
                            onChange={set('transactionDate')} sx={inputSx} />
                    </Box>

                    {/* Description */}
                    <Box sx={{ gridColumn: 'span 2' }}>
                        <Label>Description</Label>
                        <TextField fullWidth size="small" value={form.description}
                            onChange={set('description')} placeholder="What was this for?" sx={inputSx} />
                    </Box>

                    {/* Account */}
                    <Box>
                        <Label>Account</Label>
                        <TextField select fullWidth size="small" value={form.accountId || ''}
                            onChange={set('accountId')} sx={inputSx}>
                            <MenuItem value=""><em style={{ color: '#94A3B8', fontStyle: 'normal' }}>None</em></MenuItem>
                            {form.type !== 'transfer' && <MenuItem value="CASH">💵 Cash</MenuItem>}
                            {form.type !== 'transfer' && creditCards.map(cc =>
                                <MenuItem key={cc.id} value={`CC_${cc.id}`}>💳 {cc.cardName}</MenuItem>)}
                            {accounts.map(a =>
                                <MenuItem key={a.id} value={a.id}>{a.account_name}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* Category */}
                    <Box>
                        <Label>Category</Label>
                        <TextField select fullWidth size="small" value={form.categoryId || ''}
                            onChange={set('categoryId')} sx={inputSx}>
                            <MenuItem value=""><em style={{ color: '#94A3B8', fontStyle: 'normal' }}>None</em></MenuItem>
                            {categories.filter(c => c.type === form.type || !c.type).map(c =>
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                        </TextField>
                    </Box>

                    {/* Status */}
                    <Box>
                        <Label>Status</Label>
                        <TextField select fullWidth size="small" value={form.status}
                            onChange={set('status')} sx={inputSx}>
                            <MenuItem value="completed">✅ Completed</MenuItem>
                            <MenuItem value="pending">⏳ Pending</MenuItem>
                        </TextField>
                    </Box>

                    {/* Merchant */}
                    <Box>
                        <Label>Merchant</Label>
                        <TextField fullWidth size="small" value={form.merchant}
                            onChange={set('merchant')} placeholder="e.g. Amazon" sx={inputSx} />
                    </Box>

                    {/* Transfer destination */}
                    {form.type === 'transfer' && (
                        <Box sx={{ gridColumn: 'span 2' }}>
                            <Label>Destination Account</Label>
                            <TextField select fullWidth size="small" value={form.transferAccountId}
                                onChange={set('transferAccountId')} sx={inputSx}>
                                <MenuItem value=""><em style={{ color: '#94A3B8', fontStyle: 'normal' }}>Select account</em></MenuItem>
                                {accounts.filter(a => a.id !== form.accountId).map(a =>
                                    <MenuItem key={a.id} value={a.id}>{a.account_name}</MenuItem>)}
                                {creditCards.map(cc =>
                                    <MenuItem key={cc.id} value={`CC_${cc.id}`}>💳 {cc.cardName}</MenuItem>)}
                            </TextField>
                        </Box>
                    )}

                    {/* Debt fields */}
                    {isDebt && (
                        <Box sx={{ gridColumn: 'span 2' }}>
                            <Divider sx={{ my: 1.5, borderStyle: 'dashed', borderColor: '#E2E8F0' }} />
                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap="14px">
                                {/* Person */}
                                <Box>
                                    <Label>Person</Label>
                                    <Autocomplete
                                        size="small" freeSolo options={contacts}
                                        value={form.contactId ? (contacts.find(c => c.id === form.contactId) || { name: 'Unknown' }) : null}
                                        getOptionLabel={option => option.name || (typeof option === 'string' ? option : '')}
                                        onChange={async (e, v) => {
                                            if (v && v.inputValue) {
                                                const res = await contactsAPI.create({ name: v.inputValue });
                                                setContacts([...contacts, res.data]);
                                                set('contactId')({ target: { value: res.data.id } });
                                            } else set('contactId')({ target: { value: v ? v.id : '' } });
                                        }}
                                        renderInput={params =>
                                            <TextField {...params} placeholder="Name"
                                                sx={{
                                                    ...inputSx,
                                                    '& .MuiOutlinedInput-root': {
                                                        ...inputSx['& .MuiOutlinedInput-root'],
                                                        height: 'auto', minHeight: '40px',
                                                    }
                                                }} />}
                                    />
                                </Box>

                                {/* Due Date */}
                                <Box>
                                    <Label>Due Date</Label>
                                    <TextField fullWidth size="small" type="date" value={form.dueDate}
                                        onChange={set('dueDate')} sx={inputSx} />
                                </Box>

                                {/* Notes */}
                                <Box sx={{ gridColumn: 'span 2' }}>
                                    <Label>Notes</Label>
                                    <TextField fullWidth size="small" value={form.notes}
                                        onChange={set('notes')} placeholder="Extra info..." sx={inputSx} />
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                {/* ── Actions ── */}
                <Box display="flex" justifyContent="flex-end" alignItems="center" gap={2} mt={4} pt={3}
                    sx={{ borderTop: '1px solid #F1F5F9' }}>
                    <Button
                        onClick={onClose}
                        sx={{
                            color: '#64748B', fontWeight: 700, textTransform: 'none',
                            fontSize: '15px', borderRadius: '12px', px: 3.5, py: 1.2,
                            '&:hover': { bgcolor: '#F8FAFC', color: '#0F172A' },
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained" onClick={handleSubmit} disabled={loading}
                        startIcon={loading ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : null}
                        sx={{
                            bgcolor: '#4F46E5', color: '#fff', fontWeight: 800,
                            textTransform: 'none', borderRadius: '14px', px: 5, py: 1.5,
                            fontSize: '15px', letterSpacing: '-0.01em',
                            boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                            '&:hover': {
                                bgcolor: '#4338CA',
                                boxShadow: '0 6px 20px rgba(79,70,229,0.45)',
                                transform: 'translateY(-1px)'
                            },
                            '&:active': { transform: 'translateY(0)' },
                            '&:disabled': { bgcolor: '#A5B4FC', boxShadow: 'none', color: '#fff' },
                            transition: 'all 0.2s',
                        }}
                    >
                        {loading ? 'Saving…' : (isEdit ? 'Save changes' : 'Add transaction')}
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default AddTransactionDialog;