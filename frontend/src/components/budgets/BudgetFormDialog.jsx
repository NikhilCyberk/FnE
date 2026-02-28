import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, Button, Divider } from '@mui/material';

const BudgetFormDialog = ({ showAddModal, setShowAddModal }) => {
    return (
        <Dialog open={showAddModal} onClose={() => setShowAddModal(false)} maxWidth="sm" fullWidth>
            <DialogTitle fontWeight="bold">Create New Budget</DialogTitle>
            <Divider />
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
                <TextField
                    fullWidth
                    label="Budget Name"
                    placeholder="Enter budget name"
                    variant="outlined"
                />
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Description"
                    placeholder="Enter budget description"
                    variant="outlined"
                />
                <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    placeholder="0.00"
                    variant="outlined"
                />
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            label="Start Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField
                            fullWidth
                            label="End Date"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            variant="outlined"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={() => setShowAddModal(false)} color="inherit">
                    Cancel
                </Button>
                <Button variant="contained" color="primary" sx={{ borderRadius: 2 }}>
                    Create Budget
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BudgetFormDialog;
