import React, { useEffect } from 'react';
import { Box, Typography, Grid, Divider, Skeleton, Chip, Tooltip } from '@mui/material';
import { TrendingUp, TrendingDown, People, NorthEast, SouthWest } from '@mui/icons-material';
import { debtsAPI } from '../../api';
import WidgetCard from '../dashboard/WidgetCard';
import { useAsyncState } from '../../hooks';

const fmt = (val) => `₹${(Math.abs(val) || 0).toLocaleString('en-IN')}`;

const DebtSummaryWidget = () => {
    const { data: summary, loading, execute: fetchSummary } = useAsyncState(null);

    useEffect(() => {
        fetchSummary(() => debtsAPI.getSummary());
    }, []);

    if (loading) return <Skeleton variant="rectangular" height={160} sx={{ borderRadius: '20px' }} />;
    if (!summary) return null;

    const netPosition = summary.totalLent - summary.totalBorrowed;

    return (
        <WidgetCard title="Personal Debt" icon={<People />} accent="#f59e0b" linkTo="/contacts">
            <Grid container spacing={1.5}>
                <Grid item xs={6}>
                    <Box sx={{ 
                        p: 1.5, borderRadius: '15px', 
                        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(16,185,129,0.1)' : '#ecfdf5',
                        border: '1px solid', borderColor: 'success.light' 
                    }}>
                        <Typography variant="caption" color="success.dark" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>Owed to You</Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <NorthEast sx={{ fontSize: 16, color: 'success.main' }} />
                            <Typography variant="h6" fontWeight={800} color="success.main" sx={{ fontSize: '1.1rem' }}>{fmt(summary.totalLent)}</Typography>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={6}>
                    <Box sx={{ 
                        p: 1.5, borderRadius: '15px', 
                        bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                        border: '1px solid', borderColor: 'error.light' 
                    }}>
                        <Typography variant="caption" color="error.dark" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>You Owe</Typography>
                        <Box display="flex" alignItems="center" gap={0.5}>
                            <SouthWest sx={{ fontSize: 16, color: 'error.main' }} />
                            <Typography variant="h6" fontWeight={800} color="error.main" sx={{ fontSize: '1.1rem' }}>{fmt(summary.totalBorrowed)}</Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            {summary.byContact && summary.byContact.length > 0 && (
                <Box mt={1.5}>
                    <Box sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        {summary.byContact.slice(0, 2).map(contact => (
                            <Box key={contact.contact_id} display="flex" justifyContent="space-between" alignItems="center" sx={{ px: 0.5 }}>
                                <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.75rem' }}>{contact.name}</Typography>
                                <Typography variant="caption" fontWeight={800} color={contact.netBalance >= 0 ? "success.main" : "error.main"} sx={{ fontSize: '0.75rem' }}>
                                    {contact.netBalance >= 0 ? '+' : '−'} {fmt(contact.netBalance)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
            
            <Box mt={1.5} pt={1} sx={{ borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600 }}>
                    Net Position: <Box component="span" sx={{ color: netPosition >= 0 ? 'success.main' : 'error.main' }}>
                        {netPosition >= 0 ? 'SURPLUS' : 'DEFICIT'}
                    </Box> of {fmt(netPosition)}
                </Typography>
            </Box>
        </WidgetCard>
    );
};

export default DebtSummaryWidget;
