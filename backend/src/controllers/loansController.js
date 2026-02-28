const pool = require('../db');
const logger = require('../logger');

// Get all loans for current user
exports.getLoans = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            'SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        res.json(result.rows);
    } catch (err) {
        logger.error('Error fetching loans', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create a new loan
exports.createLoan = async (req, res) => {
    try {
        const userId = req.user.id;
        const { lender_name, loan_type, loan_amount, interest_rate, start_date, end_date, emi_amount, remaining_balance, status } = req.body;

        const result = await pool.query(
            `INSERT INTO loans 
             (user_id, lender_name, loan_type, loan_amount, interest_rate, start_date, end_date, emi_amount, remaining_balance, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 'Active')) 
             RETURNING *`,
            [userId, lender_name, loan_type || 'Personal', loan_amount, interest_rate, start_date, end_date, emi_amount, remaining_balance || loan_amount, status]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        logger.error('Error creating loan', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update an existing loan
exports.updateLoan = async (req, res) => {
    try {
        const userId = req.user.id;
        const loanId = req.params.id;
        const { lender_name, loan_type, loan_amount, interest_rate, start_date, end_date, emi_amount, remaining_balance, status } = req.body;

        // Verify the loan belongs to the user
        const check = await pool.query('SELECT * FROM loans WHERE id = $1 AND user_id = $2', [loanId, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        const result = await pool.query(
            `UPDATE loans 
             SET lender_name=$1, loan_type=$2, loan_amount=$3, interest_rate=$4, start_date=$5, end_date=$6, emi_amount=$7, remaining_balance=$8, status=$9
             WHERE id=$10 AND user_id=$11 
             RETURNING *`,
            [lender_name, loan_type, loan_amount, interest_rate, start_date, end_date, emi_amount, remaining_balance, status, loanId, userId]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error updating loan', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete a loan
exports.deleteLoan = async (req, res) => {
    try {
        const userId = req.user.id;
        const loanId = req.params.id;

        const check = await pool.query('SELECT * FROM loans WHERE id = $1 AND user_id = $2', [loanId, userId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ error: 'Loan not found' });
        }

        await pool.query('DELETE FROM loans WHERE id = $1 AND user_id = $2', [loanId, userId]);
        res.status(204).end();
    } catch (err) {
        logger.error('Error deleting loan', err);
        res.status(500).json({ error: 'Server error' });
    }
};
