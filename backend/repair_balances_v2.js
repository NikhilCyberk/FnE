/**
 * Smart Repair Script: Recalculates transaction balances using the REDUCING BALANCE
 * interest formula for EMI payments, and sorts transactions by date before recalculating.
 *
 * Logic:
 *  - Disbursement (first credit): sets opening balance = credit amount
 *  - EMI / payment debits: balance = balance - (EMI - monthly_interest)
 *  - Charge credits (Late Payment Charges etc): balance = balance + amount
 *  - Other debits (one-time charges): balance = balance - amount
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

const EMI_PARTICULARS = ['EMI Payment Received', 'Principal Payment', 'Part Payment', 'Prepayment'];
const CHARGE_PARTICULARS = ['Late Payment Charges', 'NACH Bounce Charges', 'Processing Fee', 'Other Charge', 'Penal Charges'];

async function repair() {
    const { rows: loans } = await pool.query('SELECT id, loan_amount, interest_rate, transactions FROM loans');

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

        // Sort by date ascending (fix out-of-order entries)
        const sorted = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date));

        const annualRate = parseFloat(loan.interest_rate || 0);
        const monthlyRate = annualRate / 12 / 100;
        const loanAmount = parseFloat(loan.loan_amount);

        let running = loanAmount;
        const repaired = sorted.map((t, idx) => {
            const debit = parseFloat(t.debit || 0);
            const credit = parseFloat(t.credit || 0);

            // First pure-credit entry = disbursement → sets opening balance
            if (idx === 0 && credit > 0 && debit === 0) {
                running = credit;
                return { ...t, balance: running };
            }

            // Info-only rows (interest charged side-by-side with EMI) — carry previous balance
            if (t._info) {
                return { ...t, balance: running };
            }

            // EMI payment: use reducing balance formula
            if (EMI_PARTICULARS.includes(t.particulars) && debit > 0) {
                const interest = Math.round(running * monthlyRate * 100) / 100;
                const principalRepaid = Math.max(debit - interest, 0);
                running = Math.max(running - principalRepaid, 0);
                return { ...t, balance: running };
            }

            // Charge entries (credit in our model = increases outstanding balance)
            if (CHARGE_PARTICULARS.includes(t.particulars) && credit > 0) {
                running = running + credit;
                return { ...t, balance: running };
            }

            // Generic debit = reduces balance
            if (debit > 0) {
                running = Math.max(running - debit, 0);
                return { ...t, balance: running };
            }

            // Generic credit = increases balance
            if (credit > 0) {
                running = running + credit;
                return { ...t, balance: running };
            }

            return { ...t, balance: running };
        });

        const finalBalance = running;

        await pool.query(
            'UPDATE loans SET transactions = $1, remaining_balance = $2 WHERE id = $3',
            [JSON.stringify(repaired), finalBalance, loan.id]
        );

        console.log(`Loan ${loan.id}: repaired ${repaired.length} transactions. Final balance: ₹${finalBalance.toFixed(2)}`);
        repaired.forEach(t => {
            console.log(`  ${t.date} | ${t.particulars} | Dr:${t.debit || 0} Cr:${t.credit || 0} | Bal:₹${t.balance?.toFixed?.(2) ?? t.balance}`);
        });
    }

    pool.end();
    console.log('\nDone! Run: node repair_balances_v2.js');
}

repair().catch(err => {
    console.error(err);
    pool.end();
});
