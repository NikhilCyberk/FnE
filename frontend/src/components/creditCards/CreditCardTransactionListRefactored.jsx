import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Add as AddIcon } from '@mui/icons-material';
import {
  fetchCreditCardTransactions,
  deleteCreditCardTransaction,
  getCreditCardTransactionSummary
} from '../../store/features/creditCards/creditCardTransactionsSlice';
import { CreditCardRepository } from '../../repositories';
import { useDialog, useForm } from '../../hooks';
import { formatAmount, formatDate } from '../../utils';
import { TRANSACTION_TYPES } from '../../constants';
import { 
  ListPageTemplate, 
  DashboardCard, 
  StatsGrid 
} from '../templates';
import { DataTableColumn } from '../common/Table';
import AddCreditCardTransactionDialog from './AddCreditCardTransactionDialog';

const TRANSACTION_TYPE_ICONS = {
  [TRANSACTION_TYPES.PURCHASE]: '🛒',
  [TRANSACTION_TYPES.PAYMENT]: '💳',
  [TRANSACTION_TYPES.CASH_ADVANCE]: '💵',
  [TRANSACTION_TYPES.BALANCE_TRANSFER]: '🔄',
  [TRANSACTION_TYPES.FEE]: '📋',
  [TRANSACTION_TYPES.INTEREST]: '📈'
};

const CreditCardTransactionList = ({ creditCard }) => {
  const dispatch = useDispatch();
  const { transactions, loading, error, pagination, summary } = useSelector(
    (state) => state.creditCardTransactions
  );

  const { form: paginationForm, set: setPagination } = useForm({ page: 1 });
  const { open: dialogOpen, openDialog: openTransactionDialog, closeDialog: closeTransactionDialog } = useDialog();
  const { open: deleteDialogOpen, openDialog: openDeleteDialog, closeDialog: closeDeleteDialog } = useDialog();
  const { form: editForm, setForm: setEditForm } = useForm({ editingTransaction: null });
  const { form: deleteForm, setForm: setDeleteForm } = useForm({ deletingTransaction: null });

  const { page } = paginationForm;

  useEffect(() => {
    if (creditCard?.id) {
      dispatch(fetchCreditCardTransactions({
        creditCardId: creditCard.id,
        params: { page, limit: 10 }
      }));
      dispatch(getCreditCardTransactionSummary({
        creditCardId: creditCard.id
      }));
    }
  }, [dispatch, creditCard?.id, page]);

  const handlePageChange = (event, newPage) => {
    setPagination('page')(event);
  };

  const handleAddTransaction = () => {
    setEditForm('editingTransaction')(null);
    openTransactionDialog();
  };

  const handleEditTransaction = (transaction) => {
    setEditForm('editingTransaction')(transaction);
    openTransactionDialog();
  };

  const handleDeleteTransaction = (transaction) => {
    setDeleteForm('deletingTransaction')(transaction);
    openDeleteDialog();
  };

  const confirmDelete = async () => {
    try {
      await dispatch(deleteCreditCardTransaction({
        creditCardId: creditCard.id,
        transactionId: deleteForm.deletingTransaction.id
      })).unwrap();
      
      closeDeleteDialog();
      setDeleteForm('deletingTransaction')(null);
      
      // Refresh the list
      dispatch(fetchCreditCardTransactions({
        creditCardId: creditCard.id,
        params: { page: paginationForm.page, limit: 10 }
      }));
    } catch (error) {
      console.error('Failed to delete transaction:', error);
    }
  };

  const columns = [
    new DataTableColumn({
      id: 'transactionDate',
      label: 'Date',
      render: (value, row) => (
        <div>
          <div>{formatDate(value)}</div>
          {row.postedDate && (
            <small style={{ color: '#666' }}>
              Posted: {formatDate(row.postedDate)}
            </small>
          )}
        </div>
      )
    }),
    new DataTableColumn({
      id: 'description',
      label: 'Description',
      render: (value, row) => (
        <div>
          <div>{value}</div>
          {row.referenceNumber && (
            <small style={{ color: '#666' }}>
              Ref: {row.referenceNumber}
            </small>
          )}
        </div>
      )
    }),
    new DataTableColumn({
      id: 'merchant',
      label: 'Merchant',
      render: (value) => value || '-'
    }),
    new DataTableColumn({
      id: 'category',
      label: 'Category',
      render: (value) => value || <span style={{ color: '#666' }}>Uncategorized</span>
    }),
    new DataTableColumn({
      id: 'transactionType',
      label: 'Type',
      render: (value) => (
        <span>
          {TRANSACTION_TYPE_ICONS[value]} {value?.replace('_', ' ')}
        </span>
      )
    }),
    new DataTableColumn({
      id: 'amount',
      label: 'Amount',
      render: (value, row) => (
        <span style={{ 
          color: row.isPayment ? 'green' : 'red',
          fontWeight: 600 
        }}>
          {row.isPayment ? '+' : '-'}{formatAmount(value)}
        </span>
      )
    })
  ];

  const actions = [
    {
      label: 'Edit',
      onClick: handleEditTransaction
    },
    {
      label: 'Delete',
      onClick: handleDeleteTransaction,
      color: 'red'
    }
  ];

  if (!creditCard) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Please select a credit card to view transactions
      </div>
    );
  }

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <StatsGrid>
          <DashboardCard
            title="Total Transactions"
            value={summary.summary.total_transactions}
          />
          <DashboardCard
            title="Total Purchases"
            value={formatAmount(summary.summary.total_purchases)}
            color="error"
          />
          <DashboardCard
            title="Total Payments"
            value={formatAmount(summary.summary.total_payments)}
            color="success"
          />
          <DashboardCard
            title="Rewards Earned"
            value={formatAmount(summary.summary.total_rewards || 0)}
            color="primary"
          />
        </StatsGrid>
      )}

      <ListPageTemplate
        title={`${creditCard.cardName} Transactions`}
        subtitle={`****${creditCard.cardNumberLastFour}`}
        addAction={
          <button
            onClick={handleAddTransaction}
            style={{
              padding: '8px 16px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AddIcon /> Add Transaction
          </button>
        }
        columns={columns}
        data={transactions}
        loading={loading}
        error={error}
        emptyMessage="No transactions found"
        emptyAction={
          <button
            onClick={handleAddTransaction}
            style={{
              padding: '8px 16px',
              border: '1px solid #1976d2',
              backgroundColor: 'white',
              color: '#1976d2',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <AddIcon /> Add Your First Transaction
          </button>
        }
        actions={actions}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Add/Edit Transaction Dialog */}
      <AddCreditCardTransactionDialog
        open={dialogOpen}
        onClose={closeTransactionDialog}
        onSuccess={(message) => {
          // Refresh the list
          dispatch(fetchCreditCardTransactions({
            creditCardId: creditCard.id,
            params: { page: paginationForm.page, limit: 10 }
          }));
          dispatch(getCreditCardTransactionSummary({
            creditCardId: creditCard.id
          }));
        }}
        creditCard={creditCard}
        transaction={editForm.editingTransaction}
      />

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Delete Transaction</h3>
            <p>Are you sure you want to delete this transaction?</p>
            {deleteForm.deletingTransaction && (
              <div style={{ marginTop: '16px' }}>
                <p><strong>{deleteForm.deletingTransaction.description}</strong></p>
                <p style={{ color: '#666' }}>
                  Amount: {formatAmount(deleteForm.deletingTransaction.amount)}
                </p>
                <p style={{ color: '#666' }}>
                  Date: {formatDate(deleteForm.deletingTransaction.transactionDate)}
                </p>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={closeDeleteDialog}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ccc',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'red',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardTransactionList;
