import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

const DashboardSummaryCard = ({ title, value, icon, iconConfig, trend }) => {
    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                        <Typography color="text.secondary" variant="subtitle2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="800" className="text-gradient" sx={{ letterSpacing: '-0.025em' }}>
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={{ ...iconConfig, width: 48, height: 48, borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        {icon}
                    </Avatar>
                </Box>
                {trend && (
                    <Box display="flex" alignItems="center" mt={2}>
                        {trend.icon}
                        <Typography variant="body2" color={trend.color} fontWeight="medium" sx={{ ml: 0.5 }}>
                            {trend.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                            {trend.label}
                        </Typography>
                    </Box>
                )}
            </CardContent>
        </Card>
    );
};

export default DashboardSummaryCard;
