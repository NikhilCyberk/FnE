import React from 'react';
import { Box, Typography, Button, IconButton, Chip, Avatar, Paper } from '@mui/material';
import {
    Edit, Delete, Visibility, VisibilityOff,
    AccountBalance, CreditCard, Savings, BusinessCenter
} from '@mui/icons-material';

const AccountList = ({ accounts, showBalances, setShowBalances, setShowAddModal }) => {
    const getAccountIcon = (accountType) => {
        switch (accountType?.toLowerCase()) {
            case 'credit':
                return <CreditCard />;
            case 'investment':
                return <Savings />;
            case 'business':
                return <BusinessCenter />;
            default:
                return <AccountBalance />;
        }
    };

    const getAccountColor = (accountType) => {
        switch (accountType?.toLowerCase()) {
            case 'credit':
                return { bg: 'error.light', text: 'error.dark' };
            case 'investment':
                return { bg: 'success.light', text: 'success.dark' };
            case 'business':
                return { bg: 'secondary.light', text: 'secondary.dark' };
            default:
                return { bg: 'primary.light', text: 'primary.dark' };
        }
    };

    return (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={1}>
            <Box p={3} borderBottom={1} borderColor="divider" display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6" fontWeight="bold">All Accounts</Typography>
                <Button
                    startIcon={showBalances ? <VisibilityOff /> : <Visibility />}
                    onClick={() => setShowBalances(!showBalances)}
                    color="inherit"
                    size="small"
                >
                    {showBalances ? 'Hide' : 'Show'} Balances
                </Button>
            </Box>

            <Box p={3}>
                {!accounts || accounts.length === 0 ? (
                    <Box textAlign="center" py={6}>
                        <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'action.hover' }}>
                            <AccountBalance fontSize="large" color="action" />
                        </Avatar>
                        <Typography variant="h6" fontWeight="medium" gutterBottom>No accounts yet</Typography>
                        <Typography color="text.secondary" mb={3}>Get started by adding your first account</Typography>
                        <Button variant="contained" onClick={() => setShowAddModal(true)} sx={{ borderRadius: 2 }}>
                            Add Account
                        </Button>
                    </Box>
                ) : (
                    <Box display="flex" flexDirection="column" gap={2}>
                        {accounts.map((account) => {
                            const colorConfig = getAccountColor(account.accountTypeName);
                            return (
                                <Paper
                                    key={account.id}
                                    variant="outlined"
                                    sx={{ p: 2, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', '&:hover': { bgcolor: 'action.hover' } }}
                                >
                                    <Box display="flex" alignItems="center" gap={2}>
                                        <Avatar sx={{ bgcolor: colorConfig.bg, color: colorConfig.text, width: 50, height: 50 }}>
                                            {getAccountIcon(account.accountTypeName)}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle1" fontWeight="bold">{account.accountName}</Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {account.institutionName} • {account.accountNumberMasked}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                                                <Chip
                                                    label={account.accountStatus}
                                                    size="small"
                                                    color={account.accountStatus === 'active' ? 'success' : 'default'}
                                                    sx={{ height: 20, fontSize: '0.7rem' }}
                                                />
                                                <Typography variant="caption" color="text.secondary">{account.accountTypeName}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={3}>
                                        <Box textAlign="right">
                                            <Typography variant="subtitle1" fontWeight="bold">
                                                {showBalances ? `₹${(Number(account.balance) || 0).toLocaleString()}` : '••••••'}
                                            </Typography>
                                            {account.availableBalance !== undefined && (
                                                <Typography variant="body2" color="text.secondary">
                                                    Available: {showBalances ? `₹${Number(account.availableBalance).toLocaleString()}` : '••••••'}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Box display="flex" gap={1}>
                                            <IconButton size="small" color="primary">
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" color="error">
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </Paper>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Paper>
    );
};

export default AccountList;
