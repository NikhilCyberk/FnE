import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, Typography, TableContainer, Table, TableBody, TableRow, TableCell, Paper, CircularProgress, Button, Card, Grid, Avatar, Chip, Breadcrumbs, Link } from '@mui/material';
import { FaCreditCard } from 'react-icons/fa';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import api from '../api';

function formatCurrency(val) {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '-';
  return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}
function formatDate(val) {
  if (!val) return '-';
  // Accept YYYY-MM-DD or DD/MM/YYYY
  let d = val;
  if (/\d{2}\/\d{2}\/\d{4}/.test(val)) {
    const [day, month, year] = val.split('/');
    d = `${year}-${month}-${day}`;
  }
  const date = new Date(d);
  if (isNaN(date.getTime())) return val;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CreditCardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/credit-cards`);
        const found = Array.isArray(res.data) ? res.data.find(c => String(c.id) === String(id)) : null;
        setCard(found);
        setError(!found ? 'Credit card not found' : null);
      } catch (err) {
        setError('Failed to fetch credit card');
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [id]);

  const handleEdit = () => navigate(`/credit-cards/${card.id}?edit=1`);
  const handlePrint = () => window.print();
  const handleExportCSV = () => {
    if (!card.transactions || card.transactions.length === 0) return;
    setExporting(true);
    const headers = ['Date', 'Details', 'Name', 'Category', 'Amount'];
    const rows = card.transactions.map(txn => [txn.date, txn.details, txn.name, txn.category, txn.amount]);
    const csvContent = [headers, ...rows].map(r => r.map(x => `"${x || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `credit_card_${card.id}_transactions.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExporting(false);
    }, 100);
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 4 }}><Typography color="error">{error}</Typography><Button onClick={() => navigate(-1)}>Back</Button></Box>;
  if (!card) return null;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: { xs: 1, sm: 3 } }}>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/">Home</Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/credit-cards">Credit Cards</Link>
        <Typography color="text.primary">Details</Typography>
      </Breadcrumbs>
      <Card sx={{ p: { xs: 2, sm: 4 }, mb: 4, boxShadow: 4, position: 'relative' }}>
        <Box display="flex" alignItems="center" mb={3} gap={2}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}><FaCreditCard size={28} /></Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{card.cardName || card.name || '-'}</Typography>
            <Typography variant="subtitle2" color="text.secondary">{card.bank || '-'}</Typography>
          </Box>
          <Chip label={card.status || 'Active'} color={card.status === 'Inactive' ? 'default' : 'success'} sx={{ ml: 2 }} />
          <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEdit}>Edit</Button>
            <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCSV} disabled={exporting}>Export CSV</Button>
          </Box>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}><b>Card Number:</b> {card.cardNumber || '-'}</Grid>
          <Grid item xs={12} sm={6}><b>Credit Limit:</b> {formatCurrency(card.creditLimit)}</Grid>
          <Grid item xs={12} sm={6}><b>Available Credit Limit:</b> {formatCurrency(card.availableCreditLimit)}</Grid>
          <Grid item xs={12} sm={6}><b>Available Cash Limit:</b> {formatCurrency(card.availableCashLimit)}</Grid>
          <Grid item xs={12} sm={6}><b>Total Payment Due:</b> {formatCurrency(card.totalPaymentDue)}</Grid>
          <Grid item xs={12} sm={6}><b>Minimum Payment Due:</b> {formatCurrency(card.minPaymentDue)}</Grid>
          <Grid item xs={12} sm={6}><b>Statement Period:</b> {card.statementPeriod ? card.statementPeriod : (card.statementPeriodStart && card.statementPeriodEnd ? `${formatDate(card.statementPeriodStart)} to ${formatDate(card.statementPeriodEnd)}` : '-')}</Grid>
          <Grid item xs={12} sm={6}><b>Payment Due Date:</b> {formatDate(card.paymentDueDate)}</Grid>
          <Grid item xs={12} sm={6}><b>Statement Generation Date:</b> {formatDate(card.statementGenDate)}</Grid>
          <Grid item xs={12} sm={6}><b>Address:</b> {card.address || '-'}</Grid>
          <Grid item xs={12} sm={6}><b>Issuer:</b> {card.issuer || '-'}</Grid>
        </Grid>
      </Card>
      <Typography variant="h6" mb={1}>Transactions</Typography>
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableBody>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              <TableCell><b>Date</b></TableCell>
              <TableCell><b>Details</b></TableCell>
              <TableCell><b>Name</b></TableCell>
              <TableCell><b>Category</b></TableCell>
              <TableCell><b>Amount</b></TableCell>
            </TableRow>
            {(card.transactions || []).length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center">No transactions found</TableCell></TableRow>
            ) : (
              card.transactions.map((txn, idx) => (
                <TableRow key={idx} sx={{ bgcolor: idx % 2 === 0 ? 'background.default' : 'action.hover' }}>
                  <TableCell>{formatDate(txn.date)}</TableCell>
                  <TableCell>{txn.details || '-'}</TableCell>
                  <TableCell>{txn.name || '-'}</TableCell>
                  <TableCell>{txn.category || '-'}</TableCell>
                  <TableCell>{formatCurrency(txn.amount)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button sx={{ mt: 2 }} variant="outlined" onClick={() => navigate(-1)}>&larr; Back</Button>
    </Box>
  );
};

export default CreditCardDetailPage; 