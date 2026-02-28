import React from 'react';
import { Card, Box, Typography, useTheme } from '@mui/material';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MonthlyComparisonChart = ({ data, tooltipStyle }) => {
    const theme = useTheme();
    return (
        <Card sx={{ borderRadius: 3, height: '100%', p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight="bold">Monthly Comparison</Typography>
                <BarChartIcon color="action" />
            </Box>
            <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                        <XAxis dataKey="month" stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} />
                        <YAxis stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: theme.palette.action.hover }} />
                        <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" fill="#EF4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Card>
    );
};

export default MonthlyComparisonChart;
