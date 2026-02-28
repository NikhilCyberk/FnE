import React from 'react';
import { Card, CardHeader, CardContent, Box, Typography, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardCashFlowChart = ({ data }) => {
    const theme = useTheme();

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title="Cash Flow"
                titleTypographyProps={{ variant: 'h6', fontWeight: '800', letterSpacing: '-0.025em' }}
                action={
                    <Box display="flex" gap={2} alignItems="center" mt={1} mr={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box width={10} height={10} borderRadius="50%" bgcolor={theme.palette.secondary.main} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Income</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <Box width={10} height={10} borderRadius="50%" bgcolor={theme.palette.error.main} />
                            <Typography variant="body2" color="text.secondary" fontWeight={500}>Expenses</Typography>
                        </Box>
                    </Box>
                }
            />
            <CardContent sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} vertical={false} />
                        <XAxis dataKey="month" stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} tick={{ fontWeight: 500 }} />
                        <YAxis stroke={theme.palette.text.secondary} axisLine={false} tickLine={false} tickFormatter={(val) => `${val}`} tick={{ fontWeight: 500 }} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '12px',
                                color: theme.palette.text.primary,
                                boxShadow: theme.palette.mode === 'light' ? '0 10px 25px rgba(0,0,0,0.1)' : '0 10px 25px rgba(0,0,0,0.5)',
                            }}
                            itemStyle={{ fontWeight: 600 }}
                        />
                        <Line type="monotone" dataKey="income" stroke={theme.palette.secondary.main} strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        <Line type="monotone" dataKey="expenses" stroke={theme.palette.error.main} strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default DashboardCashFlowChart;
