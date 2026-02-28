import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Button, Divider } from '@mui/material';

const AddTransactionDialog = ({ showAddModal, setShowAddModal }) => {
    return (
        <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="bold">Add New Transaction</DialogTitle>
            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                <TextField
                    fullWidth
                    label="Description"
                    placeholder="Enter transaction description"
                    variant="outlined"
                />
                <TextField
                    select
                    fullWidth
                    label="Type"
                    defaultValue="expense"
                >
                    <MenuItem value="expense">Expense</MenuItem>
                    <MenuItem value="income">Income</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                </TextField>
                <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    placeholder="0.00"
                    variant="outlined"
                />
                <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    variant="outlined"
                />
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setShowAddModal(false)} color="inherit">
                    Cancel
                </Button>
                <Button variant="contained" color="primary" sx={{ borderRadius: 2 }}>
                    Add Transaction
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddTransactionDialog;
