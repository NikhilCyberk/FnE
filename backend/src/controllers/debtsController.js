const pool = require('../db');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/debts/summary
exports.getDebtSummary = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // 1. Get total Lent (Net)
    // Lent - repayments of lent
    const lentResult = await pool.query(`
        SELECT 
            COALESCE(SUM(CASE WHEN t.debt_type = 'lent' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.debt_type = 'repayment' AND parent.debt_type = 'lent' THEN t.amount ELSE 0 END), 0) as net_lent
        FROM transactions t
        LEFT JOIN transactions parent ON t.debt_group_id = parent.id
        WHERE t.user_id = $1 AND t.status = 'completed' AND (t.debt_type = 'lent' OR t.debt_type = 'repayment')
    `, [userId]);

    // 2. Get total Borrowed (Net)
    // Borrowed - repayments of borrowed
    const borrowedResult = await pool.query(`
        SELECT 
            COALESCE(SUM(CASE WHEN t.debt_type = 'borrowed' THEN t.amount ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN t.debt_type = 'repayment' AND parent.debt_type = 'borrowed' THEN t.amount ELSE 0 END), 0) as net_borrowed
        FROM transactions t
        LEFT JOIN transactions parent ON t.debt_group_id = parent.id
        WHERE t.user_id = $1 AND t.status = 'completed' AND (t.debt_type = 'borrowed' OR t.debt_type = 'repayment')
    `, [userId]);

    // 3. Get breakdown by contact
    const byContactResult = await pool.query(`
        WITH contact_debts AS (
            SELECT 
                c.id as contact_id,
                c.name as contact_name,
                t.id as transaction_id,
                t.debt_type,
                t.amount as original_amount,
                t.due_date,
                t.debt_status as status,
                COALESCE((
                    SELECT SUM(r.amount) 
                    FROM transactions r 
                    WHERE r.debt_group_id = t.id AND r.status = 'completed'
                ), 0) as total_repaid
            FROM transactions t
            JOIN contacts c ON t.contact_id = c.id
            WHERE t.user_id = $1 AND t.debt_type IN ('borrowed', 'lent') AND t.status = 'completed'
        )
        SELECT 
            contact_id,
            contact_name as name,
            SUM(CASE WHEN debt_type = 'lent' THEN (original_amount - total_repaid) ELSE -(original_amount - total_repaid) END) as net_balance,
            JSON_AGG(JSON_BUILD_OBJECT(
                'transactionId', transaction_id,
                'debtType', debt_type,
                'originalAmount', original_amount,
                'remainingBalance', (original_amount - total_repaid),
                'dueDate', due_date,
                'status', status
            )) FILTER (WHERE (original_amount - total_repaid) > 0) as open_debts
        FROM contact_debts
        GROUP BY contact_id, contact_name
    `, [userId]);

    res.json({
        totalLent: parseFloat(lentResult.rows[0].net_lent),
        totalBorrowed: parseFloat(borrowedResult.rows[0].net_borrowed),
        byContact: byContactResult.rows.map(row => ({
            ...row,
            netBalance: parseFloat(row.net_balance),
            openDebts: row.open_debts || []
        }))
    });
});
