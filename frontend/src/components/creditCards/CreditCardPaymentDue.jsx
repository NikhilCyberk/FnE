import React, { useState } from 'react';
import {
  Box, Typography, Chip, LinearProgress, Alert,
  Card, CardContent, IconButton, Tooltip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as PaidIcon
} from '@mui/icons-material';
import { formatAmount, formatDate } from '../../../utils';
import CreditCardPaymentDialog from './CreditCardPaymentDialog';

const CreditCardPaymentDue = ({ creditCard, onPaymentClick }) => {
  const { 
    total_payment_due, 
    min_payment_due, 
    payment_due_date, 
    statement_period,
    bill_paid,
    bill_paid_on 
  } = creditCard;

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // Calculate days until due
  const daysUntilDue = payment_due_date 
    ? Math.ceil((new Date(payment_due_date) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  // Determine urgency level
  const getUrgencyLevel = () => {
    if (bill_paid) return 'paid';
    if (!daysUntilDue) return 'normal';
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'urgent';
    if (daysUntilDue <= 7) return 'warning';
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();

  const urgencyColors = {
    paid: 'success',
    normal: 'info',
    warning: 'warning',
    urgent: 'error',
    overdue: 'error'
  };

  const getProgressColor = () => {
    if (urgencyLevel === 'overdue') return '#ef4444';
    if (urgencyLevel === 'urgent') return '#f97316';
    if (urgencyLevel === 'warning') return '#f59e0b';
    return '#10b981';
  };

  const handlePaymentComplete = (paymentResult) => {
    // Refresh credit card data or trigger parent update
    if (onPaymentClick) {
      onPaymentClick(paymentResult);
    }
  };

  const openPaymentDialog = () => {
    setPaymentDialogOpen(true);
  };

  return (
    <>
      <Card sx={{ mb: 2, borderRadius: '12px' }}>
        <CardContent sx={{ p: 2.5 }}>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight={700}>
              Payment Due
            </Typography>
            <Chip
              icon={urgencyLevel === 'paid' ? <PaidIcon /> : <WarningIcon />}
              label={urgencyLevel === 'paid' ? 'Paid' : urgencyLevel.toUpperCase()}
              color={urgencyColors[urgencyLevel]}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>

          {bill_paid ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Bill paid on {formatDate(bill_paid_on)}
                </Typography>
                <Typography variant="caption">
                  Amount: {formatAmount(total_payment_due)}
                </Typography>
              </Box>
            </Alert>
          ) : (
            <>
              {/* Amount Due */}
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Amount Due
                </Typography>
                <Typography variant="h5" fontWeight={800} color="error.main">
                  {formatAmount(total_payment_due || 0)}
                </Typography>
              </Box>

              {/* Minimum Payment */}
              {min_payment_due && min_payment_due !== total_payment_due && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Minimum Payment
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {formatAmount(min_payment_due)}
                  </Typography>
                </Box>
              )}

              {/* Progress Bar */}
              {daysUntilDue !== null && (
                <Box mb={2}>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Days Until Due
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` : `${daysUntilDue} days`}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.max(0, Math.min(100, daysUntilDue > 0 ? ((30 - daysUntilDue) / 30) * 100 : 100))}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: getProgressColor(),
                        borderRadius: 4,
                      }
                    }}
                  />
                </Box>
              )}

              {/* Due Date */}
              {payment_due_date && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Due Date
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CalendarIcon fontSize="small" color="action" />
                    <Typography variant="body1" fontWeight={600}>
                      {formatDate(payment_due_date)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Statement Period */}
              {statement_period && (
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Statement Period
                  </Typography>
                  <Typography variant="body1">
                    {statement_period}
                  </Typography>
                </Box>
              )}

              {/* Action Button */}
              <Box display="flex" gap={2}>
                <Tooltip title="Make a payment towards this credit card">
                  <IconButton
                    color="primary"
                    onClick={openPaymentDialog}
                    sx={{
                      backgroundColor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'primary.dark',
                      }
                    }}
                  >
                    <PaymentIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <CreditCardPaymentDialog
        open={paymentDialogOpen}
        onClose={() => setPaymentDialogOpen(false)}
        creditCard={creditCard}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
};

export default CreditCardPaymentDue;
