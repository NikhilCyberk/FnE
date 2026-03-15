import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { TrendingUp, TrendingDown, SwapHoriz } from '@mui/icons-material';
import dayjs from 'dayjs';

const RecentTransactionsList = ({ transactions }) => {
    const recent = [...(transactions || [])]
        .sort((a, b) => new Date(b.transactionDate || b.date || b.transaction_date) - new Date(a.transactionDate || a.date || a.transaction_date))
        .slice(0, 6);

    return (
        <Box sx={{
            borderRadius: '20px',
            border: '1px solid', borderColor: 'divider',
            background: theme =>
                theme.palette.mode === 'dark'
                    ? 'linear-gradient(160deg, rgba(28,28,44,1) 0%, rgba(18,18,30,1) 100%)'
                    : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            height: '100%',
        }}>
            {/* Header */}
            <Box sx={{
                px: 1.5, py: 1.25,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderBottom: '1px solid', borderColor: 'divider',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                        width: 30, height: 30, borderRadius: '8px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        '& svg': { fontSize: 18, color: 'white' },
                    }}>
                        <SwapHoriz />
                    </Box>
                    <Typography variant="subtitle1" fontWeight={700} letterSpacing={-0.2}>Recent Transactions</Typography>
                </Box>
                {transactions?.length > 0 && (
                    <Box sx={{ px: 1.25, py: 0.3, borderRadius: '10px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        <Typography variant="caption" fontWeight={700} color="primary.light">{transactions.length} total</Typography>
                    </Box>
                )}
            </Box>

            {/* List */}
            {recent.length === 0 ? (
                <Box sx={{ p: 5, textAlign: 'center' }}>
                    <SwapHoriz sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.35, mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No transactions yet.</Typography>
                </Box>
            ) : (
                <Box>
                    {recent.map((t, i) => {
                        const isIncome = t.type === 'income';
                        const amount = Math.abs(Number(t.amount) || 0);
                        const date = t.transactionDate || t.date;
                        return (
                            <Box key={t.id || i} sx={{
                                px: 1.5, py: 1,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                borderBottom: i < recent.length - 1 ? '1px solid' : 'none',
                                borderColor: 'divider',
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                    <Box sx={{
                                        width: 32, height: 32, borderRadius: '8px',
                                        background: isIncome
                                            ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(16,185,129,0.05) 100%)'
                                            : 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.05) 100%)',
                                        border: `1px solid ${isIncome ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        {isIncome
                                            ? <TrendingUp sx={{ fontSize: 18, color: '#10b981' }} />
                                            : <TrendingDown sx={{ fontSize: 18, color: '#ef4444' }} />
                                        }
                                    </Box>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                                            {t.description || 'Transaction'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {t.type === 'transfer' ? (
                                                <>
                                                    {t.account_name || t.accountName} 
                                                    <SwapHoriz sx={{ fontSize: 12, opacity: 0.5 }} /> 
                                                    {t.transfer_account_name || t.transferAccountName}
                                                </>
                                            ) : (
                                                (t.categoryName || t.category_name || t.category || 'Uncategorized')
                                            )}
                                            {' · '}
                                            {date ? dayjs(date).format('D MMM') : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography
                                    variant="body2" fontWeight={800}
                                    sx={{ color: isIncome ? '#10b981' : '#f87171', letterSpacing: -0.3 }}
                                >
                                    {isIncome ? '+' : '-'}₹{amount.toLocaleString('en-IN')}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
};

export default RecentTransactionsList;
