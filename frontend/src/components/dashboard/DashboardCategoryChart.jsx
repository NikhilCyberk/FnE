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
                titleTypographyProps={{ variant: 'h6', fontWeight: '800', letterSpacing: '-0.025em' }}
                action={<ShowChart color="disabled" />}
            />
            <CardContent sx={{ height: 350, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
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
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default DashboardCategoryChart;
