import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardCashFlowChart = ({ data }) => {
    const theme = useTheme();

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title="Cash Flow"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                action={
                    <Box display="flex" gap={2} alignItems="center" mt={1} mr={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box width={10} height={10} borderRadius="50%" bgcolor="#10B981" />
                            <Typography variant="body2" color="text.secondary">Income</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box width={10} height={10} borderRadius="50%" bgcolor="#EF4444" />
                            <Typography variant="body2" color="text.secondary">Expenses</Typography>
                        </Box>
                    </Box>
                }
            />
            <CardContent sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                        <XAxis dataKey="month" stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} />
                        <YAxis stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px',
                                color: theme.palette.text.primary
                            }}
                        />
                        <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default DashboardCashFlowChart;
