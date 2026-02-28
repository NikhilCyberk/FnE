import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, LinearProgress, Chip } from '@mui/material';
import { Edit as EditIcon, AccountBalance as InstitutionIcon, RequestQuote as PaymentIcon } from '@mui/icons-material';

const LoanCard = ({ loan, onEdit, onRecordPayment }) => {
    const { lender_name, loan_type, loan_amount, remaining_balance, emi_amount, interest_rate, status } = loan;

    const amountFloat = parseFloat(loan_amount);
    const balanceFloat = parseFloat(remaining_balance);
    const amountPaid = amountFloat - balanceFloat;
    const progress = Math.min((amountPaid / amountFloat) * 100, 100);

    return (
        <Card sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 3,
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
            <Box sx={{
                p: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.default'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                        p: 1,
                        borderRadius: 2,
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <InstitutionIcon />
                    </Box>
                    <Box>
                        <Typography variant="h6" fontWeight="600" lineHeight={1.2}>
                            {lender_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {loan_type} Loan
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Chip
                        label={status}
                        size="small"
                        color={status === 'Active' ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: '500' }}
                    />
                    <IconButton size="small" onClick={() => onEdit(loan)}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Box>
            </Box>

            <CardContent sx={{ flexGrow: 1, p: 2 }}>
                <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                            Remaining Balance
                        </Typography>
                        <Typography variant="body1" fontWeight="600">
                            ₹{balanceFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{
                            height: 8,
                            borderRadius: 4,
                            bgcolor: 'action.hover',
                            '& .MuiLinearProgress-bar': {
                                borderRadius: 4,
                            }
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                            ₹{amountPaid.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Paid
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            of ₹{amountFloat.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Monthly EMI
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="600">
                            ₹{parseFloat(emi_amount).toLocaleString('en-IN')}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Interest Rate
                        </Typography>
                        <Typography variant="subtitle2" fontWeight="600">
                            {parseFloat(interest_rate)}% p.a.
                        </Typography>
                    </Box>
                </Box>
            </CardContent>

            <Box sx={{ p: 2, pt: 0 }}>
                <Box
                    component="button"
                    onClick={() => onRecordPayment(loan)}
                    disabled={status !== 'Active'}
                    sx={{
                        width: '100%',
                        py: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        bgcolor: 'background.default',
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        color: status === 'Active' ? 'primary.main' : 'text.disabled',
                        fontWeight: '600',
                        cursor: status === 'Active' ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s',
                        '&:hover': status === 'Active' ? {
                            bgcolor: 'action.hover',
                        } : {}
                    }}
                >
                    <PaymentIcon fontSize="small" />
                    Record EMI Payment
                </Box>
            </Box>
        </Card>
    );
};

export default LoanCard;
