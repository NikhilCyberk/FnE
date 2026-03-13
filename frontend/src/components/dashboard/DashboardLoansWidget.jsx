import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import { AccountBalance as LoanIcon } from '@mui/icons-material';
import WidgetCard from './WidgetCard';
import StatRow from './StatRow';

/**
 * DashboardLoansWidget
 *
 * Props:
 *   activeLoans  – array of loan objects with status === 'Active'
 *   totalDebt    – number
 *   totalEMI     – number
 */
const DashboardLoansWidget = ({ activeLoans, totalDebt, totalEMI }) => (
    <WidgetCard title="Loans Overview" icon={<LoanIcon />} accent="#6366f1" linkTo="/loans">
        {activeLoans.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
                <LoanIcon sx={{ fontSize: 36, color: 'text.disabled', opacity: 0.4, mb: 1 }} />
                <Typography variant="body2" color="text.secondary">No active loans</Typography>
            </Box>
        ) : (
            <Box>
                <StatRow
                    label="Active Loans"
                    value={`${activeLoans.length} loan${activeLoans.length !== 1 ? 's' : ''}`}
                />
                <StatRow
                    label="Total Outstanding"
                    value={`₹${totalDebt.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    accent="#f87171"
                />
                <StatRow
                    label="Monthly EMI Burden"
                    value={`₹${totalEMI.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    accent="#a78bfa"
                />

                {/* Per-loan repayment progress */}
                <Box sx={{ mt: 2 }}>
                    {activeLoans.slice(0, 3).map((loan) => {
                        const loanAmt = parseFloat(loan.loan_amount || loan.loanAmount || 0);
                        const remBal = parseFloat(loan.remaining_balance || loan.remainingBalance || 0);
                        const paid = Math.max(loanAmt - remBal, 0);
                        const pct = loanAmt > 0 ? Math.min((paid / loanAmt) * 100, 100) : 0;
                        return (
                            <Box key={loan.id} sx={{ mb: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                                    <Typography variant="caption" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                                        {loan.lender_name || loan.lenderName || 'Lender'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                        {pct.toFixed(0)}% paid
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={pct}
                                    sx={{
                                        height: 5, borderRadius: 3,
                                        bgcolor: 'rgba(99,102,241,0.12)',
                                        '& .MuiLinearProgress-bar': {
                                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                        },
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Box>
            </Box>
        )}
    </WidgetCard>
);

export default DashboardLoansWidget;
