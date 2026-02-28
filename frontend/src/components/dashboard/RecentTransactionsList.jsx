import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography, Avatar, Divider } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const RecentTransactionsList = ({ transactions }) => {
    return (
        <Card>
            <CardHeader
                title="Recent Transactions"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
            />
            <Divider />
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                {transactions?.slice(0, 5).map((transaction, index) => (
                    <React.Fragment key={transaction.id || index}>
                        <Box px={3} py={2} display="flex" justifyContent="space-between" alignItems="center">
                            <Box display="flex" alignItems="center" gap={2}>
                                <Avatar sx={{
                                    bgcolor: transaction.type === 'income' ? 'success.light' : 'error.light',
                                    color: transaction.type === 'income' ? 'success.dark' : 'error.dark'
                                }}>
                                    {transaction.type === 'income' ? <TrendingUp /> : <TrendingDown />}
                                </Avatar>
                                <Box>
                                    <Typography variant="body1" fontWeight="medium">
                                        {transaction.description || 'Transaction'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {transaction.categoryName || 'Uncategorized'}
                                    </Typography>
                                </Box>
                            </Box>
                            <Box textAlign="right">
                                <Typography
                                    variant="body1"
                                    fontWeight="bold"
                                    color={transaction.type === 'income' ? 'success.main' : 'error.main'}
                                >
                                    {transaction.type === 'income' ? '+' : '-'}₹{Math.abs(Number(transaction.amount) || 0).toLocaleString()}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {new Date(transaction.transactionDate).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>
                        {index < Math.min(transactions.length, 5) - 1 && <Divider />}
                    </React.Fragment>
                ))}
                {(!transactions || transactions.length === 0) && (
                    <Box p={3} textAlign="center">
                        <Typography color="text.secondary">No recent transactions found.</Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default RecentTransactionsList;
