import React from 'react';
import { Card, CardContent, Box, Typography, Avatar } from '@mui/material';

const SummaryCard = ({ title, value, icon, colorConfig }) => {
    return (
        <Card sx={{ borderRadius: 3 }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                        <Typography color="text.secondary" variant="body2" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color={colorConfig?.valueColor || "inherit"}>
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: colorConfig?.bg || 'primary.light', color: colorConfig?.iconColor || 'primary.dark', width: 56, height: 56 }}>
                        {icon}
                    </Avatar>
                </Box>
            </CardContent>
        </Card>
    );
};

export default SummaryCard;
