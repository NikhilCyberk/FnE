import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  TableContainer, 
  Table, 
  TableHead,
  TableBody, 
  TableRow, 
  TableCell, 
  Paper, 
  CircularProgress, 
  Button, 
  Card, 
  Grid, 
  Avatar, 
  Chip, 
  Breadcrumbs, 
  Link, 
  Divider,
  Stack,
  useTheme,
  useMediaQuery,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  LinearProgress
} from '@mui/material';
import { FaCreditCard } from 'react-icons/fa';
import PrintIcon from '@mui/icons-material/Print';
import EditIcon from '@mui/icons-material/Edit';
import DownloadIcon from '@mui/icons-material/Download';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import TextField from '@mui/material/TextField';
import api from '../api';
import CreditCardEditDialog from './CreditCardEditDialog';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

// Bank colors and information
const BANK_COLORS = {
  'Axis Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'HDFC Bank': { color: '#FF6F00', bgColor: '#FFF8E1' },
  'ICICI Bank': { color: '#FF5722', bgColor: '#FBE9E7' },
  'State Bank of India (SBI)': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Kotak Mahindra Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Punjab National Bank (PNB)': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Bank of Baroda': { color: '#FF5722', bgColor: '#FBE9E7' },
  'Canara Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Union Bank of India': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Bank of India': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Central Bank of India': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Indian Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'UCO Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Punjab & Sind Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'IDBI Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Yes Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Federal Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Karnataka Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'South Indian Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Tamilnad Mercantile Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'City Union Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'DCB Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'RBL Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Bandhan Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'IDFC First Bank': { color: '#FF5722', bgColor: '#FBE9E7' },
  'AU Small Finance Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Equitas Small Finance Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Ujjivan Small Finance Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Jammu & Kashmir Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Vijaya Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Dena Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Corporation Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'Andhra Bank': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Oriental Bank of Commerce': { color: '#1976D2', bgColor: '#E3F2FD' },
  'Allahabad Bank': { color: '#FF6B35', bgColor: '#FFF3E0' },
  'United Bank of India': { color: '#FF9800', bgColor: '#FFF3E0' },
  'Syndicate Bank': { color: '#1976D2', bgColor: '#E3F2FD' },
  'IndusInd Bank': { color: '#4CAF50', bgColor: '#E8F5E8' },
  'Other': { color: '#757575', bgColor: '#F5F5F5' }
};

// List of major Indian banks
const INDIAN_BANKS = Object.keys(BANK_COLORS);

function formatCurrency(val) {
  if (val === undefined || val === null || val === '') return '-';
  const num = Number(String(val).replace(/,/g, ''));
  if (isNaN(num)) return '-';
  return num.toLocaleString('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 2 
  });
}

function formatDate(val) {
  if (!val) return 'N/A';
  // If it's a Date object, format it directly
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return 'N/A';
    return val.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  // If it's a string, try to parse it
  if (typeof val === 'string') {
    // Accept YYYY-MM-DD, YYYY-MM-DD HH:mm:ss, DD/MM/YYYY, DD-MM-YYYY, or ISO
    if (/^\d{4}-\d{2}-\d{2}(?: .*)?$/.test(val)) {
      // Handles YYYY-MM-DD and YYYY-MM-DD HH:mm:ss
      const d = val.split(' ')[0];
      const date = new Date(d);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    let d = val;
    if (/\d{2}\/\d{2}\/\d{4}/.test(val)) {
      const [day, month, year] = val.split('/');
      d = `${year}-${month}-${day}`;
    } else if (/\d{2}-\d{2}-\d{4}/.test(val)) {
      const [day, month, year] = val.split('-');
      d = `${year}-${month}-${day}`;
    }
    const date = new Date(d);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  // If it's an object, try to handle { year, month, day } or { seconds }
  if (typeof val === 'object' && val !== null) {
    if ('year' in val && 'month' in val && 'day' in val) {
      const date = new Date(val.year, val.month - 1, val.day);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    if ('seconds' in val) {
      const date = new Date(val.seconds * 1000);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return 'N/A';
}

function safeString(val) {
  if (val === undefined || val === null) return '-';
  if (typeof val === 'object') {
    try {
      return Array.isArray(val) ? val.join(', ') : JSON.stringify(val);
    } catch {
      return '[Object]';
    }
  }
  return String(val);
}

const CreditCardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [statementEditMode, setStatementEditMode] = useState(false);
  const [statementForm, setStatementForm] = useState({
    statementPeriodStart: '',
    statementPeriodEnd: '',
    statementGenDate: '',
    address: '',
    issuer: ''
  });
  const [financialEditMode, setFinancialEditMode] = useState(false);
  const [financialForm, setFinancialForm] = useState({
    creditLimit: '',
    availableCreditLimit: '',
    availableCashLimit: ''
  });
  const [paymentEditMode, setPaymentEditMode] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    totalPaymentDue: '',
    minPaymentDue: '',
    paymentDueDate: ''
  });
  const [tab, setTab] = useState(0);
  const [cardNameEditMode, setCardNameEditMode] = useState(false);
  const [cardNameDraft, setCardNameDraft] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [fieldDraft, setFieldDraft] = useState('');

  useEffect(() => {
    const fetchCard = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/credit-cards/${id}`);
        setCard(res.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching credit card:', err);
        if (err.response?.status === 404) {
          setError('Credit card not found');
        } else {
          setError('Failed to fetch credit card');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [id]);

  useEffect(() => {
    if (card) {
      setStatementForm({
        statementPeriodStart: card.statementPeriodStart || '',
        statementPeriodEnd: card.statementPeriodEnd || '',
        statementGenDate: card.statementGenDate || '',
        address: card.address || '',
        issuer: card.issuer || ''
      });
      setFinancialForm({
        creditLimit: card.creditLimit || '',
        availableCreditLimit: card.availableCreditLimit || '',
        availableCashLimit: card.availableCashLimit || ''
      });
      setPaymentForm({
        totalPaymentDue: card.totalPaymentDue || '',
        minPaymentDue: card.minPaymentDue || '',
        paymentDueDate: card.paymentDueDate || ''
      });
    }
  }, [card]);

  const handleEdit = () => setEditOpen(true);
  const handleEditClose = () => setEditOpen(false);
  const handleEditSave = async (form) => {
    setEditLoading(true);
    try {
      const res = await api.put(`/api/credit-cards/${card.id}`, form);
      setCard(res.data);
      setEditOpen(false);
    } catch (err) {
      alert('Failed to update credit card');
    } finally {
      setEditLoading(false);
    }
  };
  const handlePrint = () => window.print();
  
  const handleExportCSV = () => {
    if (!card.transactions || card.transactions.length === 0) {
      alert('No transactions to export');
      return;
    }
    
    setExporting(true);
    try {
      const headers = ['Date', 'Details', 'Name', 'Category', 'Amount'];
      const rows = card.transactions.map(txn => [
        formatDate(txn.date),
        txn.details || '',
        txn.name || '',
        txn.category || '',
        txn.amount || ''
      ]);
      
      const csvContent = [headers, ...rows]
        .map(r => r.map(x => `"${String(x || '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
    } catch (err) {
      console.error('Error exporting CSV:', err);
      setExporting(false);
      alert('Failed to export CSV');
    }
  };

  const handleStatementEdit = () => setStatementEditMode(true);
  const handleStatementCancel = () => {
    setStatementForm({
      statementPeriodStart: card.statementPeriodStart || '',
      statementPeriodEnd: card.statementPeriodEnd || '',
      statementGenDate: card.statementGenDate || '',
      address: card.address || '',
      issuer: card.issuer || ''
    });
    setStatementEditMode(false);
  };
  const handleStatementChange = (e) => {
    setStatementForm({ ...statementForm, [e.target.name]: e.target.value });
  };
  const handleStatementSave = async () => {
    try {
      const res = await api.put(`/api/credit-cards/${card.id}`, {
        ...card,
        statementPeriodStart: statementForm.statementPeriodStart,
        statementPeriodEnd: statementForm.statementPeriodEnd,
        statementGenDate: statementForm.statementGenDate,
        address: statementForm.address,
        issuer: statementForm.issuer
      });
      // Update card with the response data
      setCard(res.data);
      setStatementEditMode(false);
    } catch (err) {
      alert('Failed to update statement information');
    }
  };

  const handleFinancialEdit = () => setFinancialEditMode(true);
  const handleFinancialCancel = () => {
    setFinancialForm({
      creditLimit: card.creditLimit || '',
      availableCreditLimit: card.availableCreditLimit || '',
      availableCashLimit: card.availableCashLimit || ''
    });
    setFinancialEditMode(false);
  };
  const handleFinancialChange = (e) => {
    setFinancialForm({ ...financialForm, [e.target.name]: e.target.value });
  };
  const handleFinancialSave = async () => {
    try {
      const res = await api.put(`/api/credit-cards/${card.id}`, {
        ...card,
        creditLimit: financialForm.creditLimit,
        availableCreditLimit: financialForm.availableCreditLimit,
        availableCashLimit: financialForm.availableCashLimit
      });
      setCard(res.data);
      setFinancialEditMode(false);
    } catch (err) {
      alert('Failed to update financial details');
    }
  };

  const handlePaymentEdit = () => setPaymentEditMode(true);
  const handlePaymentCancel = () => {
    setPaymentForm({
      totalPaymentDue: card.totalPaymentDue || '',
      minPaymentDue: card.minPaymentDue || '',
      paymentDueDate: card.paymentDueDate || ''
    });
    setPaymentEditMode(false);
  };
  const handlePaymentChange = (e) => {
    setPaymentForm({ ...paymentForm, [e.target.name]: e.target.value });
  };
  const handlePaymentSave = async () => {
    try {
      const res = await api.put(`/api/credit-cards/${card.id}`, {
        ...card,
        totalPaymentDue: paymentForm.totalPaymentDue,
        minPaymentDue: paymentForm.minPaymentDue,
        paymentDueDate: paymentForm.paymentDueDate
      });
      setCard(res.data);
      setPaymentEditMode(false);
    } catch (err) {
      alert('Failed to update payment information');
    }
  };

  const handleCardNameSave = async () => {
    try {
      const res = await api.put(`/api/credit-cards/${card.id}`, {
        ...card,
        cardName: cardNameDraft
      });
      setCard(res.data);
      setCardNameEditMode(false);
    } catch (err) {
      alert('Failed to update card name');
    }
  };

  const handleCardNameCancel = () => {
    setCardNameDraft(card.name || '');
    setCardNameEditMode(false);
  };

  const handleFieldEdit = (field, value) => {
    setEditingField(field);
    setFieldDraft(value);
  };
  const handleFieldSave = async (field) => {
    try {
      const res = await api.put(`/api/credit-cards/${card.id}`, {
        ...card,
        [field]: fieldDraft
      });
      setCard(res.data);
      setEditingField(null);
      setFieldDraft('');
    } catch (err) {
      alert('Failed to update field');
    }
  };
  const handleFieldCancel = () => {
    setEditingField(null);
    setFieldDraft('');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, maxWidth: 1000, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          &larr; Back
        </Button>
      </Box>
    );
  }

  if (!card) return null;

  // Debug: Log the card and transactions
  console.log('CARD OBJECT:', card);
  if (Array.isArray(card.transactions)) {
    card.transactions.forEach((txn, idx) => {
      console.log(`Transaction #${idx + 1}:`, txn);
      console.log('Transaction date raw:', txn.date, typeof txn.date, JSON.stringify(txn.date));
    });
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/">
          Home
        </Link>
        <Link component={RouterLink} underline="hover" color="inherit" to="/credit-cards">
          Credit Cards
        </Link>
        <Typography color="text.primary">Details</Typography>
      </Breadcrumbs>

      {/* Credit Card Display (Header) */}
      <Card
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          mb: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 'auto', md: 300 },
          transition: 'box-shadow 0.3s cubic-bezier(.25,.8,.25,1), transform 0.2s cubic-bezier(.25,.8,.25,1)',
          boxShadow: 4,
          '&:hover': {
            boxShadow: 10,
            transform: 'translateY(-2px) scale(1.01)'
          }
        }}
      >
        {/* Background Pattern */}
        <CreditCardIcon sx={{
          position: 'absolute',
          right: { xs: 10, md: 20 },
          top: { xs: 10, md: 20 },
          fontSize: { xs: 80, md: 120 },
          color: 'rgba(255,255,255,0.1)',
          zIndex: 0,
        }} />
        
        {/* Card Header */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Stack 
            direction={{ xs: 'column', md: 'row' }} 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', md: 'center' }}
            spacing={2}
            sx={{ mb: 3 }}
          >
            <Box display="flex" alignItems="center">
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white', 
                width: { xs: 48, md: 56 }, 
                height: { xs: 48, md: 56 }, 
                mr: 2 
              }}>
                <FaCreditCard size={isSmallScreen ? 20 : 24} />
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {cardNameEditMode ? (
                    <>
                      <TextField
                        value={cardNameDraft}
                        onChange={e => setCardNameDraft(e.target.value)}
                        size="small"
                        variant="outlined"
                        sx={{ bgcolor: 'white', borderRadius: 1, minWidth: 200 }}
                        inputProps={{ style: { fontWeight: 600, fontSize: isSmallScreen ? 20 : 24 } }}
                      />
                      <IconButton size="small" color="primary" onClick={handleCardNameSave}><SaveIcon /></IconButton>
                      <IconButton size="small" onClick={handleCardNameCancel}><CloseIcon /></IconButton>
                    </>
                  ) : (
                    <Typography
                      variant={isSmallScreen ? "h6" : "h5"}
                      fontWeight={600}
                      sx={{ mr: 1, cursor: 'pointer' }}
                      onClick={() => {
                        setCardNameDraft(card.cardName || card.name || 'Credit Card');
                        setCardNameEditMode(true);
                      }}
                    >
                      {safeString(card.cardName || card.name || 'Credit Card')}
                    </Typography>
                  )}
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: { xs: 14, md: 16 },
                    letterSpacing: 1,
                    mt: 0.5
                  }}
                >
                  {safeString(card.cardNumber)}
                </Typography>
              </Box>
            </Box>
            
            <Box>
              <Chip
                label={safeString(card.status) || 'Active'}
                color={card.status === 'Inactive' ? 'default' : 'success'}
                sx={{ 
                  fontWeight: 600, 
                  mb: 2,
                  bgcolor: card.status === 'Inactive' ? 'rgba(255,255,255,0.3)' : 'rgba(76,175,80,0.8)'
                }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<PrintIcon />} 
                  onClick={handlePrint}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)', color: '#1976d2', boxShadow: 4, transform: 'scale(1.05)' }
                  }}
                >
                  Print
                </Button>
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<DownloadIcon />} 
                  onClick={handleExportCSV} 
                  disabled={exporting}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    transition: 'background 0.2s, box-shadow 0.2s, transform 0.2s',
                    boxShadow: 1,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)', color: '#1976d2', boxShadow: 4, transform: 'scale(1.05)' }
                  }}
                >
                  {exporting ? 'Exporting...' : 'Export'}
                </Button>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', mb: 3 }} />

          {/* Card Details Grid */}
          <Grid container spacing={2}>
            {/* Financial Info */}
            <Grid xs={12} md={6}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 2, height: '100%', position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                    Financial Details
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Credit Limit
                    </Typography>
                    {editingField === 'creditLimit' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          name="creditLimit"
                          type="number"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          sx={{ bgcolor: 'white', borderRadius: 1, width: '100%' }}
                        />
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('creditLimit')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('creditLimit', card.creditLimit)}>
                        {formatCurrency(card.creditLimit)}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Available Credit
                    </Typography>
                    {editingField === 'availableCreditLimit' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          name="availableCreditLimit"
                          type="number"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          sx={{ bgcolor: 'white', borderRadius: 1, width: '100%' }}
                        />
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('availableCreditLimit')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('availableCreditLimit', card.availableCreditLimit)}>
                        {formatCurrency(card.availableCreditLimit)}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Available Cash
                    </Typography>
                    {editingField === 'availableCashLimit' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          name="availableCashLimit"
                          type="number"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          sx={{ bgcolor: 'white', borderRadius: 1, width: '100%' }}
                        />
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('availableCashLimit')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('availableCashLimit', card.availableCashLimit)}>
                        {formatCurrency(card.availableCashLimit)}
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Payment Info */}
            <Grid xs={12} md={6}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 2, height: '100%', position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                    Payment Information
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Total Payment Due
                    </Typography>
                    {editingField === 'totalPaymentDue' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          name="totalPaymentDue"
                          type="number"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          sx={{ bgcolor: 'white', borderRadius: 1, width: '100%' }}
                        />
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('totalPaymentDue')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('totalPaymentDue', card.totalPaymentDue)}>
                        {formatCurrency(card.totalPaymentDue)}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Minimum Payment Due
                    </Typography>
                    {editingField === 'minPaymentDue' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          name="minPaymentDue"
                          type="number"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          sx={{ bgcolor: 'white', borderRadius: 1, width: '100%' }}
                        />
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('minPaymentDue')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('minPaymentDue', card.minPaymentDue)}>
                        {formatCurrency(card.minPaymentDue)}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Payment Due Date
                    </Typography>
                    {editingField === 'paymentDueDate' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          name="paymentDueDate"
                          type="date"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: 'white', borderRadius: 1, width: '100%' }}
                        />
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('paymentDueDate')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('paymentDueDate', card.paymentDueDate)}>
                        {formatDate(card.paymentDueDate)}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    {card.bill_paid ? (
                      <Chip label="Paid" color="success" variant="filled" />
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                          const res = await api.put(`/api/credit-cards/${card.id}`, { ...card, bill_paid: true });
                          setCard(res.data);
                        }}
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </Box>
                </Stack>
              </Box>
            </Grid>

            {/* Statement Info */}
            <Grid xs={12}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 2, p: 2, position: 'relative' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1 }}>
                    Statement Information
                  </Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Statement Period
                    </Typography>
                    {editingField === 'statementPeriodStart' || editingField === 'statementPeriodEnd' ? (
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          name="statementPeriodStart"
                          type="date"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                        <Typography sx={{ mx: 1, alignSelf: 'center', color: 'white' }}>to</Typography>
                        <TextField
                          name="statementPeriodEnd"
                          type="date"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('statementPeriodStart', card.statementPeriodStart)}>
                        {card.statementPeriod && card.statementPeriod !== '-' 
                          ? card.statementPeriod
                          : (card.statementPeriodStart && card.statementPeriodEnd
                            ? `${formatDate(card.statementPeriodStart)} to ${formatDate(card.statementPeriodEnd)}`
                            : '-')}
                      </Typography>
                    )}
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Statement Generation Date
                    </Typography>
                    {editingField === 'statementGenDate' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          name="statementGenDate"
                          type="date"
                          value={fieldDraft}
                          onChange={e => setFieldDraft(e.target.value)}
                          size="small"
                          InputLabelProps={{ shrink: true }}
                          sx={{ bgcolor: 'white', borderRadius: 1 }}
                        />
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('statementGenDate')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('statementGenDate', card.statementGenDate)}>
                        {formatDate(card.statementGenDate)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid xs={12} sm={8}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Address
                    </Typography>
                    {editingField === 'address' ? (
                      <TextField
                        name="address"
                        value={fieldDraft}
                        onChange={e => setFieldDraft(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ bgcolor: 'white', borderRadius: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('address', card.address)}>
                        {safeString(card.address)}
                      </Typography>
                    )}
                  </Grid>
                  <Grid xs={12} sm={4}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Issuer
                    </Typography>
                    {editingField === 'issuer' ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControl size="small" fullWidth sx={{ bgcolor: 'white', borderRadius: 1 }}>
                          <Select
                            name="issuer"
                            value={fieldDraft}
                            onChange={e => setFieldDraft(e.target.value)}
                            displayEmpty
                            sx={{ minWidth: 120 }}
                            renderValue={selected => selected ? (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: BANK_COLORS[selected]?.color || '#757575', flexShrink: 0 }} />
                                <Typography sx={{ color: BANK_COLORS[selected]?.color || '#757575', fontWeight: 500 }}>{selected}</Typography>
                              </Box>
                            ) : <em>Select a bank</em>}
                          >
                            <MenuItem value="">
                              <em>Select a bank</em>
                            </MenuItem>
                            {INDIAN_BANKS.map((bank) => (
                              <MenuItem key={bank} value={bank}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: BANK_COLORS[bank].color, flexShrink: 0 }} />
                                  <Typography sx={{ color: BANK_COLORS[bank].color, fontWeight: 500 }}>{bank}</Typography>
                                </Box>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <IconButton size="small" color="primary" onClick={() => handleFieldSave('issuer')}><SaveIcon /></IconButton>
                        <IconButton size="small" onClick={handleFieldCancel}><CloseIcon /></IconButton>
                      </Box>
                    ) : (
                      card.issuer && BANK_COLORS[card.issuer] ? (
                        <Chip
                          label={card.issuer}
                          size="small"
                          sx={{
                            bgcolor: BANK_COLORS[card.issuer].bgColor,
                            color: BANK_COLORS[card.issuer].color,
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            '& .MuiChip-label': { px: 1.5 }
                          }}
                          onClick={() => handleFieldEdit('issuer', card.issuer)}
                        />
                      ) : (
                        <Typography variant="body1" fontWeight={600} sx={{ cursor: 'pointer' }} onClick={() => handleFieldEdit('issuer', card.issuer)}>
                          {safeString(card.issuer)}
                        </Typography>
                      )
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {/* Tabs */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Transactions" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      {tab === 0 && (
        <Box>
          {/* Overview Tab: Utilization and Trends only, no duplicate details */}
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            {card.creditLimit && card.availableCreditLimit ? (() => {
              const limit = Number(card.creditLimit);
              const available = Number(card.availableCreditLimit);
              const used = limit - available;
              const percent = limit > 0 ? Math.round((used / limit) * 100) : 0;
              return (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                    Credit Utilization: {percent}% ({formatCurrency(used)} / {formatCurrency(limit)})
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={percent}
                    sx={{ height: 12, borderRadius: 6, background: '#e3eafc', '& .MuiLinearProgress-bar': { background: percent > 90 ? '#d32f2f' : percent > 75 ? '#ffa000' : '#1976d2' } }}
                  />
                </Box>
              );
            })() : null}
            {card.transactions && card.transactions.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Spending Trends
                </Typography>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={(() => {
                      // Group transactions by month and sum positive amounts
                      const monthly = {};
                      card.transactions.forEach(txn => {
                        if (!txn.date || !txn.amount) return;
                        const date = new Date(txn.date);
                        if (isNaN(date.getTime())) return;
                        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                        const amt = Number(txn.amount);
                        if (amt > 0) {
                          monthly[key] = (monthly[key] || 0) + amt;
                        }
                      });
                      return Object.entries(monthly).map(([month, total]) => ({ month, total }));
                    })()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip formatter={formatCurrency} labelFormatter={m => `Month: ${m}`} />
                    <Line type="monotone" dataKey="total" stroke="#1976d2" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Box>
      )}
      {tab === 1 && (
        <Box>
          {/* Transactions Tab: transactions table */}
          <Card sx={{ p: 0, borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 3, pb: 0 }}>
              <Typography variant="h6" fontWeight={600}>
                Transactions
              </Typography>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell><Typography fontWeight={600}>Date</Typography></TableCell>
                    <TableCell><Typography fontWeight={600}>Details</Typography></TableCell>
                    <TableCell><Typography fontWeight={600}>Name</Typography></TableCell>
                    <TableCell><Typography fontWeight={600}>Category</Typography></TableCell>
                    <TableCell align="right"><Typography fontWeight={600}>Amount</Typography></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(!card.transactions || card.transactions.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    card.transactions.map((txn, idx) => (
                      <TableRow 
                        key={idx} 
                        sx={{ 
                          transition: 'background 0.2s, box-shadow 0.2s',
                          '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                          '&:hover': { bgcolor: 'primary.lighter', boxShadow: 2 }
                        }}
                      >
                        <TableCell>{formatDate(txn.date)}</TableCell>
                        <TableCell>{safeString(txn.details)}</TableCell>
                        <TableCell>{safeString(txn.name)}</TableCell>
                        <TableCell>
                          {txn.category && (
                            <Chip 
                              label={txn.category} 
                              size="small" 
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            fontWeight={600}
                            color={Number(txn.amount) < 0 ? 'error.main' : 'success.main'}
                          >
                            {formatCurrency(txn.amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        </Box>
      )}

      <CreditCardEditDialog
        open={editOpen}
        onClose={handleEditClose}
        card={card}
        onSave={handleEditSave}
        loading={editLoading}
      />
    </Box>
  );
};

export default CreditCardDetailPage;