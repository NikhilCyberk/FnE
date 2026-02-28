import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, LinearProgress } from '@mui/material';
import { Edit, Delete, CalendarToday } from '@mui/icons-material';
import CreditCardVisual from './CreditCardVisual';

const CreditCardItem = ({ card, showBalances, setShowBalances }) => {
    const limit = Number(card.creditLimit) || 0;
    const balance = Number(card.currentBalance) || 0;
    const utilization = limit > 0 ? (balance / limit) * 100 : 0;
    const isOverLimit = balance > limit;

    return (
        <Card sx={{ borderRadius: 3, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Credit Card Design */}
            <CreditCardVisual
                card={card}
                showBalances={showBalances}
                setShowBalances={setShowBalances}
                height={190}
            />

            {/* Card Details */}
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', pt: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight="bold">{card.cardName}</Typography>
                    <Box>
                        <IconButton size="small" color="primary"><Edit fontSize="small" /></IconButton>
                        <IconButton size="small" color="error"><Delete fontSize="small" /></IconButton>
                    </Box>
                </Box>

                <Box display="flex" flexDirection="column" gap={1.5} mb={3}>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Credit Limit</Typography>
                        <Typography variant="body2" fontWeight="bold">₹{limit.toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Current Balance</Typography>
                        <Typography variant="body2" fontWeight="bold" color={isOverLimit ? 'error.main' : 'text.primary'}>
                            ₹{balance.toLocaleString()}
                        </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Available Credit</Typography>
                        <Typography variant="body2" fontWeight="bold" color="success.main">
                            ₹{Math.max(0, limit - balance).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>

                {/* Utilization Bar */}
                <Box mt="auto">
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2" fontWeight="medium">Utilization</Typography>
                        <Typography variant="body2" fontWeight="bold" color={utilization > 30 ? 'error.main' : 'success.main'}>
                            {utilization.toFixed(1)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={Math.min(utilization, 100)}
                        color={utilization > 30 ? 'error' : 'success'}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                </Box>

                {/* Due Date Warning */}
                {card.dueDate && (
                    <Box mt={3} p={1.5} bgcolor="warning.light" borderRadius={2} display="flex" alignItems="center" gap={1.5}>
                        <CalendarToday sx={{ color: 'warning.dark', fontSize: 20 }} />
                        <Box>
                            <Typography variant="caption" fontWeight="bold" sx={{ color: 'warning.dark' }}>Payment Due</Typography>
                            <Typography variant="body2" sx={{ color: 'warning.dark' }}>
                                {new Date(card.dueDate).toLocaleDateString()}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default CreditCardItem;
