import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchCreditCardById } from '../slices/creditCardsSlice';
import { 
  FaArrowLeft, 
  FaEdit, 
  FaTrash, 
  FaCreditCard,
  FaCalendarAlt,
  FaExclamationTriangle,
  FaChartPie,
  FaDownload,
  FaEye,
  FaEyeSlash
} from 'react-icons/fa';

const CreditCardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedCard, loading } = useSelector((state) => state.creditCards);
  const [showBalances, setShowBalances] = useState(true);

  useEffect(() => {
    if (id) {
      dispatch(fetchCreditCardById(id));
    }
  }, [dispatch, id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedCard) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Card not found</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The credit card you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/credit-cards')}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Back to Credit Cards
        </button>
      </div>
    );
  }

  const utilization = selectedCard.creditLimit > 0 ? (selectedCard.currentBalance / selectedCard.creditLimit) * 100 : 0;
  const isOverLimit = selectedCard.currentBalance > selectedCard.creditLimit;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/credit-cards')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCard.cardName}</h1>
            <p className="text-gray-600 dark:text-gray-400">Credit card details and transactions</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <FaDownload className="w-4 h-4" />
            Export Statement
          </button>
          <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <FaEdit className="w-5 h-5" />
          </button>
          <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <FaTrash className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Credit Card Display */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-8">
              <div className="text-sm opacity-80">VISA</div>
              <button
                onClick={() => setShowBalances(!showBalances)}
                className="p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                {showBalances ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
              </button>
            </div>
            
            <div className="mb-4">
              <div className="text-sm opacity-80 mb-1">Card Number</div>
              <div className="text-lg font-mono">
                {showBalances ? selectedCard.cardNumber?.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-80 mb-1">Cardholder</div>
                <div className="font-medium">{selectedCard.cardName}</div>
              </div>
              <div>
                <div className="text-sm opacity-80 mb-1">Bank</div>
                <div className="font-medium">{selectedCard.bankName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Credit Limit</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ₹{selectedCard.creditLimit?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <FaCreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Balance</p>
                  <p className={`text-xl font-bold ${isOverLimit ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    ₹{selectedCard.currentBalance?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                  <FaExclamationTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Available Credit</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    ₹{Math.max(0, (selectedCard.creditLimit || 0) - (selectedCard.currentBalance || 0)).toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <FaChartPie className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Utilization */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Credit Utilization</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Utilization Rate</span>
                <span className={`text-lg font-bold ${utilization > 30 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {utilization.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    utilization > 30 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {utilization > 30 ? 'High utilization - consider paying down balance' : 'Good utilization rate'}
              </div>
            </div>
          </div>

          {/* Payment Information */}
          {(selectedCard.dueDate || selectedCard.minimumPayment) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedCard.dueDate && (
                  <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <FaCalendarAlt className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    <div>
                      <div className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Payment Due Date</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-300">
                        {new Date(selectedCard.dueDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
                {selectedCard.minimumPayment && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <FaCreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-400">Minimum Payment</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">
                        ₹{selectedCard.minimumPayment.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
            <div className="text-center py-8">
              <FaCreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No transactions yet</h4>
              <p className="text-gray-500 dark:text-gray-400">Transactions will appear here once you import a statement</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardDetailPage;