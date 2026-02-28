import React, { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const initialForm = {
    lender_name: '',
    loan_type: 'Personal',
    loan_amount: '',
    interest_rate: '',
    start_date: '',
    end_date: '',
    emi_amount: '',
    remaining_balance: '',
    status: 'Active'
};

const LOAN_TYPES = ['Personal', 'Home', 'Auto', 'Education', 'Business'];

const LoanFormDialog = ({ open, onClose, onSave, loan = null }) => {
    const [form, setForm] = useState(initialForm);

    useEffect(() => {
        if (loan) {
            // Format dates for input type="date"
            const formatForInput = (dateStr) => {
                if (!dateStr) return '';
                const d = new Date(dateStr);
                return d.toISOString().split('T')[0];
            };

            setForm({
                ...loan,
                start_date: formatForInput(loan.start_date),
                end_date: formatForInput(loan.end_date),
            });
        } else {
            setForm(initialForm);
        }
    }, [loan, open]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    const isEditMode = Boolean(loan);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {isEditMode ? 'Edit Loan Details' : 'Add New Loan'}
                <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Lender Name"
                                name="lender_name"
                                value={form.lender_name}
                                onChange={handleChange}
                                required
                                size="small"
                                placeholder="e.g. HDFC Bank"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                select
                                label="Loan Type"
                                name="loan_type"
                                value={form.loan_type}
                                onChange={handleChange}
                                size="small"
                            >
                                {LOAN_TYPES.map(type => (
                                    <MenuItem key={type} value={type}>{type}</MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Total Loan Amount (₹)"
                                name="loan_amount"
                                type="number"
                                value={form.loan_amount}
                                onChange={handleChange}
                                required
                                size="small"
                                inputProps={{ min: 0, step: "any" }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Remaining Balance (₹)"
                                name="remaining_balance"
                                type="number"
                                value={form.remaining_balance}
                                onChange={handleChange}
                                required
                                size="small"
                                inputProps={{ min: 0, step: "any" }}
                                helperText={!isEditMode && form.loan_amount && form.remaining_balance === '' ? 'Leave blank if same as total' : ''}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Interest Rate (% p.a.)"
                                name="interest_rate"
                                type="number"
                                value={form.interest_rate}
                                onChange={handleChange}
                                required
                                size="small"
                                inputProps={{ min: 0, step: "any" }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Monthly EMI (₹)"
                                name="emi_amount"
                                type="number"
                                value={form.emi_amount}
                                onChange={handleChange}
                                required
                                size="small"
                                inputProps={{ min: 0, step: "any" }}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Start Date"
                                name="start_date"
                                type="date"
                                value={form.start_date}
                                onChange={handleChange}
                                required
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="End Date"
                                name="end_date"
                                type="date"
                                value={form.end_date}
                                onChange={handleChange}
                                required
                                size="small"
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>

                        {isEditMode && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Status"
                                    name="status"
                                    value={form.status}
                                    onChange={handleChange}
                                    size="small"
                                >
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Closed">Closed</MenuItem>
                                </TextField>
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={onClose} color="inherit">Cancel</Button>
                    <Button type="submit" variant="contained" color="primary">
                        {isEditMode ? 'Save Changes' : 'Add Loan'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default LoanFormDialog;
