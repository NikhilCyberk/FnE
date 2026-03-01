import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLoans, createLoan, updateLoan, deleteLoan } from '../slices/loansSlice';
import {
    Box, Typography, Button, Grid, CircularProgress,
    Alert, Snackbar, Dialog, DialogTitle, DialogContent,
    DialogContentText, DialogActions, TextField, InputAdornment
} from '@mui/material';
import { Add as AddIcon, Calculate as CalculateIcon, AccountBalance as AccountBalanceIcon, MoneyOff as MoneyOffIcon } from '@mui/icons-material';

import LoanCard from '../components/loans/LoanCard';
import LoanFormDialog from '../components/loans/LoanFormDialog';
import SummaryCard from '../components/common/SummaryCard'; // Assuming this exists based on previous refactors

const LoansPage = () => {
    const dispatch = useDispatch();
    const { loans, status, error } = useSelector(state => state.loans);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedLoan, setSelectedLoan] = useState(null);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [penaltyDialogOpen, setPenaltyDialogOpen] = useState(false);
    const [deleteConfirmLoan, setDeleteConfirmLoan] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [penaltyAmountInput, setPenaltyAmountInput] = useState('');
    const [penaltyDateInput, setPenaltyDateInput] = useState('');
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchLoans());
        }
    }, [status, dispatch]);

    const handleOpenForm = (loan = null) => {
        setSelectedLoan(loan);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedLoan(null);
    };

    const handleSaveLoan = async (loanData) => {
        try {
            if (selectedLoan) {
                await dispatch(updateLoan({ id: selectedLoan.id, data: loanData })).unwrap();
                showToast('Loan updated successfully', 'success');
            } else {
                await dispatch(createLoan(loanData)).unwrap();
                showToast('Loan added successfully', 'success');
            }
            handleCloseForm();
        } catch (err) {
            showToast(err || 'Failed to save loan', 'error');
        }
    };

    const handleOpenPayment = (loan) => {
        setSelectedLoan(loan);
        setPaymentAmount(loan.emi_amount); // Default to EMI
        setPaymentDialogOpen(true);
    };

    const handleClosePayment = () => {
        setPaymentDialogOpen(false);
        setSelectedLoan(null);
        setPaymentAmount('');
    };

    const handleOpenPenalty = (loan) => {
        setSelectedLoan(loan);
        setPenaltyAmountInput('');
        setPenaltyDateInput(loan.next_emi_due_date ? loan.next_emi_due_date.substring(0, 10) : new Date().toISOString().substring(0, 10));
        setPenaltyDialogOpen(true);
    };

    const handleClosePenalty = () => {
        setPenaltyDialogOpen(false);
        setSelectedLoan(null);
        setPenaltyAmountInput('');
        setPenaltyDateInput('');
    };

    const handleRecordPayment = async () => {
        if (!selectedLoan || !paymentAmount) return;
        const payment = parseFloat(paymentAmount);
        const newBalance = Math.max(parseFloat(selectedLoan.remaining_balance) - payment, 0);
        const newStatus = newBalance === 0 ? 'Closed' : selectedLoan.status;

        try {
            await dispatch(updateLoan({
                id: selectedLoan.id,
                data: {
                    ...selectedLoan,
                    _action: 'payment',
                    _payment_amount: payment,
                    status: newStatus,
                    remaining_balance: newBalance,
                }
            })).unwrap();
            // Refresh loans list so summary stats update
            dispatch(fetchLoans());
            showToast(`Recorded payment of ₹${payment}. New balance: ₹${newBalance}`, 'success');
            handleClosePayment();
        } catch (err) {
            showToast(err || 'Failed to record payment', 'error');
        }
    };

    const handleRecordPenalty = async () => {
        if (!selectedLoan || !penaltyAmountInput || !penaltyDateInput) return;

        const penaltyValue = parseFloat(penaltyAmountInput);
        const currentPenaltyTotal = parseFloat(selectedLoan.penalty_amount || 0);
        const newPenaltyTotal = currentPenaltyTotal + penaltyValue;

        try {
            await dispatch(updateLoan({
                id: selectedLoan.id,
                data: {
                    ...selectedLoan,
                    _action: 'penalty',
                    _penalty_amount_new: penaltyValue,
                    _penalty_date: penaltyDateInput,
                    penalty_amount: newPenaltyTotal,
                }
            })).unwrap();
            // Refresh loans list so summary stats update
            dispatch(fetchLoans());
            showToast(`Added penalty of ₹${penaltyValue} for EMI on ${penaltyDateInput}.`, 'warning');
            handleClosePenalty();
        } catch (err) {
            showToast(err || 'Failed to add penalty', 'error');
        }
    };

    const showToast = (message, severity = 'success') => {
        setToast({ open: true, message, severity });
    };

    const handleConfirmDelete = async () => {
        if (!deleteConfirmLoan) return;
        setDeleting(true);
        try {
            await dispatch(deleteLoan(deleteConfirmLoan.id)).unwrap();
            showToast(`"${deleteConfirmLoan.lender_name}" loan deleted`, 'success');
            setDeleteConfirmLoan(null);
        } catch (err) {
            showToast(err || 'Failed to delete loan', 'error');
        } finally {
            setDeleting(false);
        }
    };

    // Calculate Summary Metrics
    const activeLoans = loans.filter(l => l.status === 'Active');
    const totalDebt = activeLoans.reduce((sum, l) => sum + parseFloat(l.remaining_balance), 0);
    const totalMonthlyEMI = activeLoans.reduce((sum, l) => sum + parseFloat(l.emi_amount), 0);

    return (
        <Box>
            {/* ── Page Header ── */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography
                        variant="h4"
                        fontWeight={800}
                        letterSpacing={-0.5}
                        gutterBottom
                        sx={{
                            background: theme =>
                                theme.palette.mode === 'dark'
                                    ? 'linear-gradient(135deg, #fff 30%, #a78bfa 100%)'
                                    : 'linear-gradient(135deg, #1e1b4b 30%, #7c3aed 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Loans
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 0.2 }}>
                        Manage your debts and track EMI payments
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm()}
                    sx={{
                        borderRadius: '12px',
                        px: 3,
                        py: 1.1,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                        '&:hover': { boxShadow: '0 6px 20px rgba(99,102,241,0.55)', opacity: 0.93 },
                    }}
                >
                    Add Loan
                </Button>
            </Box>

            {status === 'loading' && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 4 }} />}

            {status === 'failed' && (
                <Alert severity="error" sx={{ mb: 4 }}>
                    {error || "Failed to load loans"}
                </Alert>
            )}

            {status === 'succeeded' && (
                <>
                    {/* ── Summary Stats ── */}
                    <Grid container spacing={2.5} sx={{ mb: 5 }}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SummaryCard
                                title="Active Loans"
                                value={activeLoans.length.toString()}
                                icon={<AccountBalanceIcon />}
                                gradient="linear-gradient(135deg, #6366f1 0%, #818cf8 100%)"
                                glowColor="rgba(99,102,241,0.4)"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SummaryCard
                                title="Total Outstanding Debt"
                                value={`₹${totalDebt.toLocaleString('en-IN')}`}
                                icon={<MoneyOffIcon />}
                                gradient="linear-gradient(135deg, #ef4444 0%, #f97316 100%)"
                                glowColor="rgba(239,68,68,0.4)"
                                subtitle="Across all active loans"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <SummaryCard
                                title="Total Monthly EMI"
                                value={`₹${totalMonthlyEMI.toLocaleString('en-IN')}`}
                                icon={<CalculateIcon />}
                                gradient="linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)"
                                glowColor="rgba(245,158,11,0.4)"
                                subtitle="Estimated minimum payments"
                            />
                        </Grid>
                    </Grid>

                    {/* ── Section Label ── */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                        <Typography variant="h6" fontWeight={700} letterSpacing={-0.3}>All Loans</Typography>
                        <Box sx={{ flex: 1, height: '1px', bgcolor: 'divider' }} />
                        <Typography variant="caption" color="text.disabled" fontWeight={600}>{loans.length} total</Typography>
                    </Box>

                    {loans.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                            <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" color="text.secondary">No loans found</Typography>
                            <Typography variant="body2" color="text.disabled" mb={3}>Click "Add Loan" to start tracking your debt.</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {loans.map(loan => (
                                <Grid size={{ xs: 12, md: 6, lg: 4 }} key={loan.id}>
                                    <LoanCard
                                        loan={loan}
                                        onEdit={handleOpenForm}
                                        onRecordPayment={handleOpenPayment}
                                        onAddPenalty={handleOpenPenalty}
                                        onDelete={(l) => setDeleteConfirmLoan(l)}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </>
            )}

            <LoanFormDialog
                open={isFormOpen}
                onClose={handleCloseForm}
                onSave={handleSaveLoan}
                loan={selectedLoan}
            />

            {/* Record EMI Payment Dialog */}
            <Dialog open={paymentDialogOpen} onClose={handleClosePayment}>
                <DialogTitle>Record EMI Payment</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={2}>
                        Enter the amount paid towards your {selectedLoan?.lender_name} loan.
                        This will reduce the remaining balance directly.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Payment Amount"
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePayment} color="inherit">Cancel</Button>
                    <Button onClick={handleRecordPayment} variant="contained" disabled={!paymentAmount || paymentAmount <= 0}>
                        Confirm Payment
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Record Penalty Dialog */}
            <Dialog open={penaltyDialogOpen} onClose={handleClosePenalty}>
                <DialogTitle>Add Late Penalty</DialogTitle>
                <DialogContent>
                    <DialogContentText mb={2}>
                        Enter the penalty/late fee applied to your {selectedLoan?.lender_name} loan.
                        This will increase your remaining balance.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Penalty Amount"
                        type="number"
                        value={penaltyAmountInput}
                        onChange={(e) => setPenaltyAmountInput(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="EMI Due Date"
                        type="date"
                        value={penaltyDateInput}
                        onChange={(e) => setPenaltyDateInput(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        helperText="The specific EMI date this penalty applies to."
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClosePenalty} color="inherit">Cancel</Button>
                    <Button onClick={handleRecordPenalty} variant="contained" color="error" disabled={!penaltyAmountInput || penaltyAmountInput <= 0 || !penaltyDateInput}>
                        Add Penalty
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirm Dialog */}
            <Dialog open={Boolean(deleteConfirmLoan)} onClose={() => setDeleteConfirmLoan(null)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                    Delete Loan?
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to permanently delete the <strong>{deleteConfirmLoan?.lender_name}</strong> loan?
                        This will remove all associated transactions and cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmLoan(null)} color="inherit">Cancel</Button>
                    <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deleting}>
                        {deleting ? 'Deleting…' : 'Yes, Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast({ ...toast, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={toast.severity} sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LoansPage;
