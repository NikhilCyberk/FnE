import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

const DashboardSummaryCard = ({ title, value, icon, iconConfig, trend }) => {
    return (
        <Card>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={iconConfig}>
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
