import React from 'react';
import { Paper, Grid, TextField, InputAdornment, MenuItem, Button } from '@mui/material';
import { Search, Download } from '@mui/icons-material';

const TransactionFilters = ({
    searchTerm, setSearchTerm,
    selectedType, setSelectedType,
    selectedStatus, setSelectedStatus
}) => {
    return (
        <Paper sx={{ p: 2, borderRadius: 3 }} elevation={1}>
            <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                        }}
                    />
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        label="Type"
                    >
                        <MenuItem value="all">All Types</MenuItem>
                        <MenuItem value="income">Income</MenuItem>
                        <MenuItem value="expense">Expense</MenuItem>
                        <MenuItem value="transfer">Transfer</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={6} md={3}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        label="Status"
                    >
                        <MenuItem value="all">All Status</MenuItem>
                        <MenuItem value="completed">Completed</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="failed">Failed</MenuItem>
                    </TextField>
                </Grid>
                <Grid item xs={12} md={2} display="flex" justifyContent="flex-end">
                    <Button variant="outlined" startIcon={<Download />} fullWidth>
                        Export
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default TransactionFilters;
