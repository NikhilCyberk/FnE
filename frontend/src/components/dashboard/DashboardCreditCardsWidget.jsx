import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { CreditCard as CardIcon } from '@mui/icons-material';
import WidgetCard from './WidgetCard';
import StatRow from './StatRow';

// Color of the combined utilisation bar — green / amber / red
const utilisationColor = (pct) => {
    if (pct > 80) return 'linear-gradient(90deg,#ef4444,#f87171)';
    if (pct > 40) return 'linear-gradient(90deg,#f59e0b,#fbbf24)';
    return 'linear-gradient(90deg,#0ea5e9,#38bdf8)';
};

const utilisationTextColor = (pct) => {
    if (pct > 80) return '#f87171';
    if (pct > 40) return '#f59e0b';
    return '#4ade80';
};

/**
 * DashboardCreditCardsWidget
 *
 * Props:
 *   creditCards   – array of credit card objects
 *   totalCCDebt   – number
 *   totalCCLimit  – number
 *   utilisation   – number (0–100)
 */
const DashboardCreditCardsWidget = ({ creditCards, totalCCDebt, totalCCLimit, utilisation }) => (
    <WidgetCard title="Credit Cards" icon={<CardIcon />} accent="#0ea5e9" linkTo="/credit-cards">
        {creditCards.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <CardIcon sx={{ fontSize: 36, color: 'text.disabled', opacity: 0.4, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No credit cards linked</Typography>
            </Box>
        ) : (
            <Box>
                <StatRow
                    label="Cards"
                    value={`${creditCards.length} card${creditCards.length !== 1 ? 's' : ''}`}
                />
                <StatRow
                    label="Total Outstanding"
                    value={`₹${totalCCDebt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    accent="#f87171"
                />
                <StatRow
                    label="Credit Limit"
                    value={`₹${totalCCLimit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                />

                <Box sx={{ mt: 2 }}>
                    {/* Combined utilisation bar */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>
                            Combined Utilisation
                        </Typography>
                        <Typography
                            variant="caption" fontWeight={700}
                            sx={{ color: utilisationTextColor(utilisation) }}
                        >
                            {utilisation.toFixed(1)}%
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={utilisation}
                        sx={{
                            height: 8, borderRadius: 4,
                            bgcolor: 'rgba(14,165,233,0.12)',
                            '& .MuiLinearProgress-bar': { background: utilisationColor(utilisation) },
                        }}
                    />

                    {/* Per-card utilisation */}
                    <Box sx={{ mt: 2 }}>
                        {creditCards.slice(0, 3).map((card) => {
                            const bal = parseFloat(card.current_balance || card.outstanding_balance || 0);
                            const lim = parseFloat(card.credit_limit || 0);
                            const u = lim > 0 ? Math.min((bal / lim) * 100, 100) : 0;
                            return (
                                <Box key={card.id} sx={{ mb: 1.25 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}>
                                        <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                                            {card.card_name || card.cardName || 'Card'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ₹{bal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} / ₹{lim.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={u}
                                        sx={{
                                            height: 4, borderRadius: 2,
                                            bgcolor: 'rgba(14,165,233,0.1)',
                                            '& .MuiLinearProgress-bar': {
                                                background: 'linear-gradient(90deg,#0ea5e9,#38bdf8)',
                                            },
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Box>
                </Box>
            </Box>
        )}
    </WidgetCard>
);

export default DashboardCreditCardsWidget;
