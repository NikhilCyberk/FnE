const pool = require('../db');
const logger = require('../logger');

exports.spendingSummary = async (req, res) => {
  logger.info('Spending summary request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { startDate, endDate, accountId } = req.query;

    let baseQuery = `FROM transactions WHERE user_id = $1`;
    const params = [userId];

    if (startDate) {
      baseQuery += ` AND transaction_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      baseQuery += ` AND transaction_date <= $${params.length + 1}`;
      params.push(endDate);
    }
    if (accountId) {
      baseQuery += ` AND account_id = $${params.length + 1}`;
      params.push(accountId);
    }

    const totalsQuery = `
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses
      ${baseQuery}
    `;

    const topCategoriesQuery = `
      SELECT 
        c.name as category_name,
        SUM(t.amount) as amount,
        c.color,
        c.icon
      ${baseQuery.replace('FROM transactions', 'FROM transactions t JOIN categories c ON t.category_id = c.id')}
      AND t.type = 'expense'
      GROUP BY c.name, c.color, c.icon
      ORDER BY amount DESC
      LIMIT 5
    `;

    const totalsResult = await pool.query(totalsQuery, params);
    const topCategoriesResult = await pool.query(topCategoriesQuery, params);

    const totals = totalsResult.rows[0] || { total_income: 0, total_expenses: 0 };
    const totalIncome = parseFloat(totals.total_income || 0);
    const totalExpenses = parseFloat(totals.total_expenses || 0);

    const result = {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses,
      topCategories: topCategoriesResult.rows.map(cat => ({
        ...cat,
        amount: parseFloat(cat.amount),
        percentage: totalExpenses > 0 ? (parseFloat(cat.amount) / totalExpenses) * 100 : 0
      }))
    };

    res.json(result);
  } catch (err) {
    logger.error('Spending summary error:', err);
    res.status(500).json({ error: 'Failed to generate spending summary.' });
  }
};

exports.categoryBreakdown = async (req, res) => {
  logger.info('Category breakdown request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { startDate, endDate, type = 'expense' } = req.query;

    let query = `
      SELECT 
        c.id as category_id,
        c.name as name, 
        c.color,
        c.icon,
        SUM(t.amount) as value,
        COUNT(t.id) as transaction_count
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id 
      WHERE t.user_id = $1 AND t.type = $2
    `;
    const params = [userId, type];

    if (startDate) {
      query += ` AND t.transaction_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND t.transaction_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ' GROUP BY c.id, c.name, c.color, c.icon ORDER BY value DESC';

    const result = await pool.query(query, params);

    const totalAmount = result.rows.reduce((sum, row) => sum + parseFloat(row.value), 0);

    const categories = result.rows.map(row => ({
      ...row,
      value: parseFloat(row.value),
      percentage: totalAmount > 0 ? (parseFloat(row.value) / totalAmount) * 100 : 0
    }));

    res.json({
      categories,
      totalAmount,
      period: { startDate, endDate }
    });
  } catch (err) {
    logger.error('Category breakdown error:', err);
    res.status(500).json({ error: 'Failed to generate category breakdown.' });
  }
};

exports.cashFlow = async (req, res) => {
  logger.info('Cash flow request', { userId: req.user && req.user.userId });
  try {
    const userId = req.user.userId;
    const { startDate, endDate, groupBy = 'month' } = req.query;

    let interval = 'month';
    if (groupBy === 'day') interval = 'day';
    else if (groupBy === 'week') interval = 'week';

    let query = `
      SELECT 
        TO_CHAR(DATE_TRUNC($1, transaction_date), 'Mon YYYY') as period,
        DATE_TRUNC($1, transaction_date) as sort_date,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
      FROM transactions 
      WHERE user_id = $2
    `;
    const params = [interval, userId];

    if (startDate) {
      query += ` AND transaction_date >= $${params.length + 1}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND transaction_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` GROUP BY sort_date, period ORDER BY sort_date ASC`;

    const result = await pool.query(query, params);

    const cashFlow = result.rows.map(row => {
      const income = parseFloat(row.income || 0);
      const expenses = parseFloat(row.expenses || 0);
      return {
        month: row.period, // kept as 'month' label for frontend chart compatibility
        income,
        expenses,
        net: income - expenses
      };
    });

    const totalIncome = cashFlow.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = cashFlow.reduce((sum, item) => sum + item.expenses, 0);

    res.json({
      cashFlow,
      summary: {
        totalIncome,
        totalExpenses,
        netCashFlow: totalIncome - totalExpenses,
        averageIncome: cashFlow.length > 0 ? totalIncome / cashFlow.length : 0,
        averageExpenses: cashFlow.length > 0 ? totalExpenses / cashFlow.length : 0
      }
    });
  } catch (err) {
    logger.error('Cash flow error:', err);
    res.status(500).json({ error: 'Failed to generate cash flow report.' });
  }
};