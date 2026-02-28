import React from 'react';
import { Card, Box, Typography, useTheme } from '@mui/material';
import { Timeline } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CashFlowChart = ({ data, tooltipStyle }) => {
    const theme = useTheme();
    return (
        <Card sx={{ borderRadius: 3, height: '100%', p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h6" fontWeight="bold">Cash Flow</Typography>
                <Timeline color="action" />
            </Box>
            <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                        <XAxis dataKey="month" stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} />
                        <YAxis stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={tooltipStyle} />
                        <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="net" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </Card>
    );
};

export default CashFlowChart;
