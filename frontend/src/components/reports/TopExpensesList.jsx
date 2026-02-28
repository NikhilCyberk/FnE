import React from 'react';
import { Card, Box, Typography, Paper, Avatar } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';

const TopExpensesList = ({ topExpenses }) => {
    return (
        <Card sx={{ borderRadius: 3, height: '100%', p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight="bold">Top Expenses by Category</Typography>
                <BarChartIcon color="action" />
            </Box>
            <Box display="flex" flexDirection="column" gap={2}>
                {topExpenses.map((expense, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 32, height: 32, fontWeight: 'bold' }}>
                                {index + 1}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle2" fontWeight="bold">{expense.category}</Typography>
                                <Typography variant="caption" color="text.secondary">{expense.percentage}% of total</Typography>
                            </Box>
                        </Box>
                        <Box textAlign="right">
                            <Typography variant="subtitle2" fontWeight="bold">₹{expense.amount.toLocaleString()}</Typography>
                            <Box mt={0.5} width={100} height={6} bgcolor="divider" borderRadius={3} overflow="hidden">
                                <Box height="100%" bgcolor="primary.main" width={`${expense.percentage}%`} />
                            </Box>
                        </Box>
                    </Paper>
                ))}
            </Box>
        </Card>
    );
};

export default TopExpensesList;
