import React from 'react';
import {
    Paper, Box, Typography, TableContainer, Table, TableHead, TableRow, TableCell,
    TableBody, Avatar, Chip, IconButton, Button
} from '@mui/material';
import {
    LocalOffer, CalendarToday, Edit, Delete, AccountBalanceWallet
} from '@mui/icons-material';

const TransactionTable = ({
    filteredTransactions,
    getTransactionIcon,
    getStatusColor,
    setShowAddModal
}) => {
    return (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }} elevation={1}>
            <Box p={2} borderBottom={1} borderColor="divider">
                <Typography variant="subtitle1" fontWeight="bold">
                    Transactions ({filteredTransactions.length})
                </Typography>
            </Box>
            <TableContainer>
                <Table sx={{ minWidth: 700 }} aria-label="transactions table">
                    <TableHead sx={{ bgcolor: 'action.hover' }}>
                        <TableRow>
                            <TableCell>Transaction</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Account</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                    <AccountBalanceWallet sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="h6" color="text.primary" gutterBottom>No transactions found</Typography>
                                    <Typography variant="body2" color="text.secondary" mb={2}>Try adjusting your search or filters</Typography>
                                    <Button variant="contained" onClick={() => setShowAddModal(true)} sx={{ borderRadius: 2 }}>
                                        Add Transaction
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <TableRow key={transaction.id} hover>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={2}>
                                            <Avatar sx={{ bgcolor: 'background.default', width: 32, height: 32 }}>
                                                {getTransactionIcon(transaction.type)}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {transaction.description || 'Transaction'}
                                                </Typography>
                                                {transaction.merchant && (
                                                    <Typography variant="caption" color="text.secondary">{transaction.merchant}</Typography>
                                                )}
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <LocalOffer fontSize="small" color="action" />
                                            <Typography variant="body2">{transaction.categoryName || 'Uncategorized'}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{transaction.accountName || 'Unknown'}</Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <CalendarToday fontSize="small" color="action" />
                                            <Typography variant="body2">{new Date(transaction.transactionDate).toLocaleDateString()}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={transaction.status}
                                            size="small"
                                            color={getStatusColor(transaction.status)}
                                            sx={{ height: 24, fontSize: '0.75rem', fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Typography
                                            variant="body2"
                                            fontWeight="bold"
                                            color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                                        >
                                            {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(Number(transaction.amount) || 0).toLocaleString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton size="small" color="primary"><Edit fontSize="small" /></IconButton>
                                        <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
};

export default TransactionTable;
