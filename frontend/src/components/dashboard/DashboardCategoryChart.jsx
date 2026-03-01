import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    return (
        <Box sx={{
            bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
            borderRadius: '10px', p: 1.25, boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
            <Typography variant="caption" fontWeight={700} display="block">{name}</Typography>
            <Typography variant="caption" color="text.secondary">₹{Number(value).toLocaleString('en-IN')}</Typography>
        </Box>
    );
};

const DashboardCategoryChart = ({ data }) => {
    const theme = useTheme();
    const total = data.reduce((s, d) => s + d.value, 0);
    const isEmpty = total === 0;

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
                borderBottom: '1px solid', borderColor: 'divider',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, transparent 100%)',
            }}>
                <Typography variant="subtitle1" fontWeight={700} letterSpacing={-0.2}>Expense Categories</Typography>
                <Typography variant="caption" color="text.secondary">
                    {isEmpty ? 'No expense data' : `₹${total.toLocaleString('en-IN')} total`}
                </Typography>
            </Box>

            {/* Donut chart */}
            <Box sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isEmpty ? (
                    <Typography variant="body2" color="text.disabled" sx={{ opacity: 0.5 }}>No data yet</Typography>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data} cx="50%" cy="50%"
                                innerRadius={55} outerRadius={80}
                                paddingAngle={4} dataKey="value"
                                stroke="none" labelLine={false}
                            >
                                {data.map((entry, i) => (
                                    <Cell key={i} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </Box>

            {/* Legend */}
            <Box sx={{ px: 2.5, pb: 2 }}>
                {data.map((d, i) => {
                    const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0';
                    return (
                        <Box key={i} sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            py: 0.6, borderBottom: i < data.length - 1 ? '1px solid' : 'none', borderColor: 'divider',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                                <Typography variant="caption" fontWeight={600}>{d.name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600}>{pct}%</Typography>
                                <Typography variant="caption" fontWeight={700}>₹{d.value.toLocaleString('en-IN')}</Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default DashboardCategoryChart;
