import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, LinearProgress, Divider } from '@mui/material';
import { CalendarToday, Edit, Delete } from '@mui/icons-material';

const BudgetCard = ({ budget, getBudgetStatus }) => {
    const status = getBudgetStatus(budget);
    const StatusIcon = status.icon;
    const spent = Number(budget.spent) || 0;
    const amount = Number(budget.amount) || 0;
    const percentage = amount > 0 ? Math.min((spent / amount) * 100, 100) : 0;
    const remaining = amount - spent;

    return (
        <Card sx={{ borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Box>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>{budget.name}</Typography>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                            {budget.description || 'No description'}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} color="text.secondary">
                            <CalendarToday fontSize="small" />
                            <Typography variant="caption" fontWeight="medium">
                                {new Date(budget.startDate).toLocaleDateString()} - {new Date(budget.endDate).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                    <Box display="flex">
                        <IconButton size="small" color="primary"><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                    </Box>
                </Box>

                {/* Progress Bar */}
                <Box mb={2} mt={3}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight="medium">Progress</Typography>
                        <Typography variant="body2" fontWeight="medium">{percentage.toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={percentage}
                        color={status.color}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

                {/* Budget Details */}
                <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Budget Amount</Typography>
                        <Typography variant="body2" fontWeight="bold">₹{amount.toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Spent</Typography>
                        <Typography variant="body2" fontWeight="bold">₹{spent.toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Remaining</Typography>
                        <Typography
                            variant="body2"
                            fontWeight="bold"
                            color={remaining >= 0 ? 'success.main' : 'error.main'}
                        >
                            ₹{Math.abs(remaining).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>

            <Divider />

            {/* Status Indicator */}
            <Box p={2} display="flex" alignItems="center" gap={1}>
                <StatusIcon color={status.color} fontSize="small" />
                <Typography variant="body2" fontWeight="bold" color={`${status.color}.main`}>
                    {status.text}
                </Typography>
            </Box>
        </Card>
    );
};

export default BudgetCard;
