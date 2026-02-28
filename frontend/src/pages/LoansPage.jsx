import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLoans, createLoan, updateLoan } from '../slices/loansSlice';
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
    const [paymentAmount, setPaymentAmount] = useState('');
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

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

    const handleRecordPayment = async () => {
        if (!selectedLoan || !paymentAmount) return;

        const currentBalance = parseFloat(selectedLoan.remaining_balance);
        const payment = parseFloat(paymentAmount);

        let newBalance = currentBalance - payment;
        if (newBalance < 0) newBalance = 0;

        // If loan is fully paid, prompt or auto-close it
        const newStatus = newBalance === 0 ? 'Closed' : selectedLoan.status;

        try {
            await dispatch(updateLoan({
                id: selectedLoan.id,
                data: {
                    ...selectedLoan,
                    remaining_balance: newBalance,
                    status: newStatus
                }
            })).unwrap();
            showToast(`Recorded payment of ₹${payment}. New balance: ₹${newBalance}`, 'success');
            handleClosePayment();
        } catch (err) {
            showToast(err || 'Failed to record payment', 'error');
        }
    };

    const showToast = (message, severity = 'success') => {
        setToast({ open: true, message, severity });
    };

    // Calculate Summary Metrics
    const activeLoans = loans.filter(l => l.status === 'Active');
    const totalDebt = activeLoans.reduce((sum, l) => sum + parseFloat(l.remaining_balance), 0);
    const totalMonthlyEMI = activeLoans.reduce((sum, l) => sum + parseFloat(l.emi_amount), 0);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
                <Box>
                    <Typography variant="h4" fontWeight="600" gutterBottom>
                        Loans
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Manage your debts and track EMI payments
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenForm()}
                    sx={{ borderRadius: 2, px: 3 }}
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
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                            <SummaryCard
                                title="Active Loans"
                                value={activeLoans.length.toString()}
                                icon={<AccountBalanceIcon />}
                                color="primary.main"
                                bgColor="primary.light"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <SummaryCard
                                title="Total Outstanding Debt"
                                value={`₹${totalDebt.toLocaleString('en-IN')}`}
                                icon={<MoneyOffIcon />}
                                color="error.main"
                                bgColor="error.light"
                                subtitle="Across all active loans"
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <SummaryCard
                                title="Total Monthly EMI"
                                value={`₹${totalMonthlyEMI.toLocaleString('en-IN')}`}
                                icon={<CalculateIcon />}
                                color="warning.main"
                                bgColor="warning.light"
                                subtitle="Estimated minimum payments"
                            />
                        </Grid>
                    </Grid>

                    <Typography variant="h6" fontWeight="600" mb={2}>All Loans</Typography>

                    {loans.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8, bgcolor: 'background.paper', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
                            <AccountBalanceIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                            <Typography variant="h6" color="text.secondary">No loans found</Typography>
                            <Typography variant="body2" color="text.disabled" mb={3}>Click "Add Loan" to start tracking your debt.</Typography>
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {loans.map(loan => (
                                <Grid item xs={12} md={6} lg={4} key={loan.id}>
                                    <LoanCard
                                        loan={loan}
                                        onEdit={handleOpenForm}
                                        onRecordPayment={handleOpenPayment}
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
