import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Button, Divider } from '@mui/material';

const AddAccountDialog = ({ open, onClose }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="bold">Add New Account</DialogTitle>
            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                <TextField
                    fullWidth
                    label="Account Name"
                    placeholder="Enter account name"
                    variant="outlined"
                />
                <TextField
                    select
                    fullWidth
                    label="Account Type"
                    defaultValue="Checking"
                >
                    <MenuItem value="Checking">Checking</MenuItem>
                    <MenuItem value="Savings">Savings</MenuItem>
                    <MenuItem value="Credit Card">Credit Card</MenuItem>
                    <MenuItem value="Investment">Investment</MenuItem>
                </TextField>
                <TextField
                    fullWidth
                    label="Balance"
                    type="number"
                    placeholder="0.00"
                    variant="outlined"
                />
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} color="inherit">
                    Cancel
                </Button>
                <Button variant="contained" color="primary" sx={{ borderRadius: 2 }}>
                    Add Account
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddAccountDialog;
