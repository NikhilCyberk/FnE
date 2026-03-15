import React, { useMemo } from 'react';
import { Box, Typography, Paper, Grid, IconButton, Tooltip, Button } from '@mui/material';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CalendarMonth } from '@mui/icons-material';
import dayjs from 'dayjs';

const TransactionCalendar = ({ transactions, currentMonth, onMonthChange }) => {
    // Generate dates for the month
    const calendarDays = useMemo(() => {
        const startOfMonth = currentMonth.startOf('month');
        const endOfMonth = currentMonth.endOf('month');
        const startDate = startOfMonth.startOf('week');
        const endDate = endOfMonth.endOf('week');

        const days = [];
        let day = startDate;
        while (day.isBefore(endDate) || day.isSame(endDate, 'day')) {
            days.push(day);
            day = day.add(1, 'day');
        }
        return days;
    }, [currentMonth]);

    // Aggregate transactions by date
    const dailyStats = useMemo(() => {
        const stats = {};
        transactions.forEach(tx => {
            const dateStr = dayjs(tx.transactionDate || tx.date || tx.transaction_date).format('YYYY-MM-DD');
            if (!stats[dateStr]) {
                stats[dateStr] = { income: 0, expense: 0, count: 0 };
            }
            const amount = Number(tx.amount || 0);
            if (tx.type === 'income') {
                stats[dateStr].income += amount;
            } else if (tx.type === 'expense') {
                stats[dateStr].expense += amount;
            }
            stats[dateStr].count += 1;
        });
        return stats;
    }, [transactions]);

    const handlePrevMonth = () => onMonthChange(currentMonth.subtract(1, 'month'));
    const handleNextMonth = () => onMonthChange(currentMonth.add(1, 'month'));

    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'hidden',
                background: (theme) => theme.palette.mode === 'dark' ? 'rgba(30,30,46,0.4)' : '#fff',
            }}
        >
            {/* Calendar Header */}
            <Box sx={{ 
                p: 2, borderBottom: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.05) 0%, transparent 100%)'
            }}>
                <Box>
                    <Typography variant="h6" fontWeight={800} letterSpacing={-0.3}>
                        {currentMonth.format('MMMM YYYY')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Showing monthly spending patterns
                    </Typography>
                </Box>
                <Box display="flex" gap={1}>
                    <IconButton size="small" onClick={handlePrevMonth} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <ChevronLeft fontSize="small" />
                    </IconButton>
                    <Button 
                        size="small" 
                        onClick={() => onMonthChange(dayjs())}
                        sx={{ fontSize: '0.7rem', fontWeight: 700, px: 1.5 }}
                    >
                        Today
                    </Button>
                    <IconButton size="small" onClick={handleNextMonth} sx={{ border: '1px solid', borderColor: 'divider' }}>
                        <ChevronRight fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            {/* Day Labels */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Box key={day} sx={{ py: 1, textAlign: 'center' }}>
                        <Typography variant="caption" fontWeight={700} color="text.disabled" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                            {day}
                        </Typography>
                    </Box>
                ))}
            </Box>

            {/* Calendar Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {calendarDays.map((day, idx) => {
                    const isCurrentMonth = day.isSame(currentMonth, 'month');
                    const isToday = day.isSame(dayjs(), 'day');
                    const dateStr = day.format('YYYY-MM-DD');
                    const stats = dailyStats[dateStr];

                    return (
                        <Box
                            key={idx}
                            sx={{
                                minHeight: { xs: 80, md: 100 },
                                p: 1,
                                borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid',
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                opacity: isCurrentMonth ? 1 : 0.4,
                                bgcolor: isToday ? 'action.selected' : 'transparent',
                                transition: 'background 0.2s',
                                '&:hover': { bgcolor: 'action.hover' },
                                position: 'relative'
                            }}
                        >
                            <Typography 
                                variant="caption" 
                                fontWeight={isToday ? 900 : 700}
                                sx={{ 
                                    color: isToday ? 'primary.main' : 'text.primary',
                                    fontSize: '0.75rem',
                                    mb: 0.5,
                                    display: 'block'
                                }}
                            >
                                {day.format('D')}
                            </Typography>

                            {stats && (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                                    {stats.income > 0 && (
                                        <Box sx={{ 
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                            bgcolor: 'rgba(16,185,129,0.1)', px: 0.75, py: 0.1, borderRadius: '4px'
                                        }}>
                                            <TrendingUp sx={{ fontSize: 10, color: '#10b981' }} />
                                            <Typography variant="caption" fontWeight={700} sx={{ color: '#10b981', fontSize: '0.65rem' }}>
                                                ₹{stats.income.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    )}
                                    {stats.expense > 0 && (
                                        <Box sx={{ 
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                            bgcolor: 'rgba(239,68,68,0.1)', px: 0.75, py: 0.1, borderRadius: '4px'
                                        }}>
                                            <TrendingDown sx={{ fontSize: 10, color: '#ef4444' }} />
                                            <Typography variant="caption" fontWeight={700} sx={{ color: '#ef4444', fontSize: '0.65rem' }}>
                                                ₹{stats.expense.toLocaleString()}
                                            </Typography>
                                        </Box>
                                    )}
                                    {stats.count > 0 && (
                                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', mt: 0.5 }}>
                                            {stats.count} transactions
                                        </Typography>
                                    )}
                                </Box>
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};

export default TransactionCalendar;
