import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label, theme }) => {
    if (!active || !payload?.length) return null;
    return (
        <Box sx={{
            bgcolor: 'background.paper',
            border: '1px solid', borderColor: 'divider',
            borderRadius: '12px',
            p: 1.5,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: 140,
        }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary" mb={0.75} display="block">{label}</Typography>
            {payload.map(p => (
                <Box key={p.dataKey} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="caption" sx={{ color: p.color }} fontWeight={600}>{p.name}</Typography>
                    <Typography variant="caption" fontWeight={700}>₹{Number(p.value).toLocaleString('en-IN')}</Typography>
                </Box>
            ))}
        </Box>
    );
};

const DashboardCashFlowChart = ({ data }) => {
    const theme = useTheme();
    const isEmpty = !data || data.every(d => d.income === 0 && d.expenses === 0);

    return (
        <Box sx={{
            borderRadius: '20px',
            border: '1px solid', borderColor: 'divider',
            background: theme.palette.mode === 'dark'
                ? 'linear-gradient(160deg, rgba(28,28,44,1) 0%, rgba(18,18,30,1) 100%)'
                : 'linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            overflow: 'hidden',
            height: '100%',
        }}>
            {/* Header */}
            <Box sx={{
                px: 2.5, py: 1.75,
                display: 'flex', alignItems: 'center', gap: 1.5,
                borderBottom: '1px solid', borderColor: 'divider',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
            }}>
                <Typography variant="subtitle1" fontWeight={700} letterSpacing={-0.2}>Cash Flow</Typography>
                <Box sx={{ px: 1, py: 0.2, borderRadius: '8px', bgcolor: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <Typography variant="caption" fontWeight={700} color="primary.light">Last 6 months</Typography>
                </Box>
            </Box>

            <Box sx={{ p: 2.5, height: 320 }}>
                {isEmpty ? (
                    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                        <Typography color="text.secondary" variant="body2">No transaction data yet</Typography>
                    </Box>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                            <XAxis dataKey="month" stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                            <YAxis
                                stroke={theme.palette.text.secondary}
                                axisLine={false} tickLine={false}
                                tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                                tick={{ fontSize: 11, fontWeight: 500 }}
                                width={44}
                            />
                            <Tooltip content={<CustomTooltip theme={theme} />} />
                            <Legend wrapperStyle={{ fontSize: '0.78rem', fontWeight: 600, paddingTop: 8 }} />
                            <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" strokeWidth={2.5} fill="url(#incomeGrad)" dot={{ r: 3, strokeWidth: 2, fill: '#10b981' }} activeDot={{ r: 5 }} />
                            <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2.5} fill="url(#expenseGrad)" dot={{ r: 3, strokeWidth: 2, fill: '#ef4444' }} activeDot={{ r: 5 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Box>
        </Box>
    );
};

export default DashboardCashFlowChart;
