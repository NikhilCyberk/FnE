import React from 'react';
import { Card, CardHeader, CardContent, useTheme } from '@mui/material';
import { ShowChart } from '@mui/icons-material';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const DashboardCategoryChart = ({ data }) => {
    const theme = useTheme();

    return (
        <Card sx={{ height: '100%' }}>
            <CardHeader
                title="Expense Categories"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
                action={<ShowChart color="action" />}
            />
            <CardContent sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme.palette.background.paper,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: '8px',
                                color: theme.palette.text.primary
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default DashboardCategoryChart;
