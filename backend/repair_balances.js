/**
 * Repair Script: Recalculate transaction running balances for all loans.
 * This fixes transactions whose balance was computed from a stale remaining_balance=0.
 * 
 * For each loan:
 *   - Start from loan_amount as the opening balance
 *   - Walk through transactions in order
 *   - Recompute balance after each debit/credit
 *   - Update remaining_balance = final transaction balance
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
});

async function recalculate() {
    const { rows: loans } = await pool.query('SELECT id, loan_amount, transactions FROM loans');

    for (const loan of loans) {
        let txs = [];
        try {
            txs = typeof loan.transactions === 'string' ? JSON.parse(loan.transactions) : (loan.transactions || []);
        } catch (e) {
            console.warn(`Loan ${loan.id}: couldn't parse transactions, skipping.`);
            continue;
        }

        if (txs.length === 0) {
            console.log(`Loan ${loan.id}: no transactions, skipping.`);
            continue;
        }

        // Find the disbursement (credit) to use as the opening balance
        // If no disbursement, fall back to loan_amount
        const firstCredit = txs.find(t => parseFloat(t.credit || 0) > 0);
        let runningBalance = firstCredit
            ? parseFloat(firstCredit.credit)
            : parseFloat(loan.loan_amount);

        const repaired = txs.map((t, idx) => {
            const debit = parseFloat(t.debit || 0);
            const credit = parseFloat(t.credit || 0);

            // Disbursement sets the opening balance — don't double-subtract it
            if (idx === 0 && credit > 0 && debit === 0) {
                runningBalance = credit;
                return { ...t, balance: runningBalance };
            }

            if (debit > 0) {
                runningBalance = Math.max(runningBalance - debit, 0);
            } else if (credit > 0) {
                runningBalance = runningBalance + credit;
            }
            return { ...t, balance: runningBalance };
        });

        await pool.query(
            'UPDATE loans SET transactions = $1, remaining_balance = $2 WHERE id = $3',
            [JSON.stringify(repaired), runningBalance, loan.id]
        );

        console.log(`Loan ${loan.id}: repaired ${repaired.length} transactions. Final balance: ₹${runningBalance}`);
    }

    pool.end();
    console.log('Done!');
}

recalculate().catch(err => {
    console.error(err);
    pool.end();
});
