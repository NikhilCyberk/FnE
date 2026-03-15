import React from 'react';
import { Paper, Grid, TextField, InputAdornment, MenuItem, Button } from '@mui/material';
import { Search, Download } from '@mui/icons-material';

const TransactionFilters = ({
    searchTerm, setSearchTerm,
    selectedType, setSelectedType,
    selectedStatus, setSelectedStatus,
    selectedAccount, setSelectedAccount,
    selectedCategory, setSelectedCategory,
    accounts = [], creditCards = [], categories = []
}) => {
    return (
        <Paper sx={{ p: 1.5, borderRadius: 3 }} elevation={1}>
            <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: 3 }}>
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
                <Grid size={{ xs: 6, md: 2.25 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        label="Account / Card"
                    >
                        <MenuItem value="all">All Accounts</MenuItem>
                        <MenuItem value="CASH">💵 Cash</MenuItem>
                        {creditCards.map((cc) => (
                            <MenuItem key={cc.id} value={`CC_${cc.id}`}>
                                💳 {cc.cardName}
                            </MenuItem>
                        ))}
                        {accounts.map((a) => (
                            <MenuItem key={a.id} value={a.id}>
                                🏦 {a.account_name || a.accountName}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 6, md: 2 }}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        label="Category"
                    >
                        <MenuItem value="all">All Categories</MenuItem>
                        {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>
                                {cat.name}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>
                <Grid size={{ xs: 6, md: 1.5 }}>
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
                <Grid size={{ xs: 6, md: 1.5 }}>
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
                <Grid size={{ xs: 12, md: 1.75 }} display="flex" justifyContent="flex-end">
                    <Button variant="outlined" startIcon={<Download />} fullWidth>
                        Export
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default TransactionFilters;
