import React from 'react';
import { Box, Typography } from '@mui/material';

/**
 * StatRow
 *
 * A compact label / value row separated by a bottom border.
 * Used inside WidgetCard bodies across dashboard widgets.
 *
 * Props:
 *   label  – string
 *   value  – string | number
 *   accent – optional color override for the value text
 */
const StatRow = ({ label, value, accent }) => (
    <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        py: 0.9, borderBottom: '1px solid', borderColor: 'divider',
    }}>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {label}
        </Typography>
        <Typography variant="body2" fontWeight={700} sx={{ color: accent || 'text.primary' }}>
            {value}
        </Typography>
    </Box>
);

export default StatRow;
