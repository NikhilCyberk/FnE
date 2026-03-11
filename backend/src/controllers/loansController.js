const pool = require('../db');
const logger = require('../logger');

// Helper to generate loan installment schedule
function generateSchedule(loan_amount, interest_rate, emi_amount, start_date) {
    const schedule = [];
    if (!emi_amount || !loan_amount || !start_date) return schedule;

    const totalEMI = parseFloat(emi_amount);
    const principal = parseFloat(loan_amount);
    const rate = parseFloat(interest_rate) / 100 / 12;

    let balance = principal;
    let due = new Date(start_date);
    due.setMonth(due.getMonth() + 1); // First EMI is 1 month after start

    let installmentNum = 1;
    while (balance > 0.5 && installmentNum <= 360) { // max 30 years
        const interestPart = rate > 0 ? balance * rate : 0;
        const principalPart = Math.min(totalEMI - interestPart, balance);
        balance = Math.max(balance - principalPart, 0);

        schedule.push({
            installment: installmentNum,
            due_date: due.toISOString().split('T')[0],
            amount: totalEMI.toFixed(2),
            status: 'Unpaid'
        });

        due = new Date(due);
        due.setMonth(due.getMonth() + 1);
        installmentNum++;

        if (balance < 0.5) break;
    }
    return schedule;
}

/**
 * Recalculate all running balances in a transaction array from scratch.
 * Uses the REDUCING BALANCE interest formula for EMI-type payments.
 * Charge entries (Late Payment Charges etc.) are credits that INCREASE the balance.
 * Rows flagged `_info: true` carry the previous balance (informational only).
 *
 * @param {Array}  txs          - Transactions array, will be sorted by date
 * @param {number} loanAmount   - The loan's principal amount
 * @param {number} interestRate - Annual interest rate (e.g. 30 for 30%)
 * Returns { repairedTxs, finalBalance }
 */
const EMI_TYPES = new Set(['EMI Payment Received', 'Principal Payment', 'Part Payment', 'Prepayment']);
const CHARGE_TYPES = new Set(['Late Payment Charges', 'NACH Bounce Charges', 'Processing Fee', 'Other Charge', 'Penal Charges']);

function recalcTransactionBalances(txs, loanAmount, interestRate = 0) {
    // Sort by date before recalculating
    const sorted = [...txs].sort((a, b) => new Date(a.date) - new Date(b.date));

    const monthlyRate = parseFloat(interestRate) / 12 / 100;
    let running = parseFloat(loanAmount);

    const repaired = sorted.map((t, idx) => {
        const debit = parseFloat(t.debit || 0);
        const credit = parseFloat(t.credit || 0);

        // First pure-credit = disbursement → resets opening balance
        if (idx === 0 && credit > 0 && debit === 0) {
            running = credit;
            return { ...t, balance: running };
        }

        // _info rows (e.g. "Interest Charged" side-by-side with EMI) carry prior balance
        if (t._info) {
            return { ...t, balance: running };
        }

        // EMI-type payment: reducing balance — only principal reduces outstanding
        if (EMI_TYPES.has(t.particulars) && debit > 0) {
            const interest = Math.round(running * monthlyRate * 100) / 100;
            const principalRepaid = Math.max(debit - interest, 0);
            running = Math.max(running - principalRepaid, 0);
            return { ...t, balance: running };
        }

        // Charge-type entries (credit in our model) → outstanding balance INCREASES
        if (CHARGE_TYPES.has(t.particulars) && credit > 0) {
            running = running + credit;
            return { ...t, balance: running };
        }

        // Generic debit → reduces balance
        if (debit > 0) {
            running = Math.max(running - debit, 0);
            return { ...t, balance: running };
        }

        // Generic credit → increases balance
        if (credit > 0) {
            running = running + credit;
            return { ...t, balance: running };
        }

        return { ...t, balance: running };
    });

    return { repairedTxs: repaired, finalBalance: running };
}

/**
 * Sync the loan_schedule Paid/Unpaid status to match the actual EMI transactions
 * in the ledger. Counts EMI-type debit entries (not _info rows) and marks that
 * many installments as Paid in order, resetting the rest to Unpaid.
 */
function syncScheduleToTransactions(schedule, transactions) {
    const emiCount = transactions.filter(
        t => EMI_TYPES.has(t.particulars) && parseFloat(t.debit || 0) > 0 && !t._info
    ).length;
    return schedule.map((inst, idx) => {
        if (idx < emiCount) {
            return { ...inst, status: 'Paid' };
        }
        // Reset to Unpaid and remove paid_date
        const { paid_date, ...rest } = inst;
        return { ...rest, status: 'Unpaid' };
    });
}


// Get all loans for current user
exports.getLoans = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
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

// Get single loan by ID
exports.getLoan = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const loanId = req.params.id;
        const result = await pool.query(
            'SELECT * FROM loans WHERE id = $1 AND user_id = $2',
            [loanId, userId]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });
        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error fetching loan', err);
        res.status(500).json({ error: 'Server error' });
    }
};

// Create a new loan
exports.createLoan = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const { lender_name, loan_type, loan_amount, interest_rate, start_date, end_date, emi_amount, remaining_balance, penalty_amount, status, next_emi_due_date } = req.body;

        // Auto-generate installment schedule
        const schedule = generateSchedule(loan_amount, interest_rate, emi_amount, start_date);

        // Initial transaction: disbursement
        const initialTransactions = [{
            date: start_date || new Date().toISOString().split('T')[0],
            particulars: 'Loan Disbursement',
            debit: 0,
            credit: parseFloat(loan_amount),
            balance: parseFloat(loan_amount)
        }];

        const result = await pool.query(
            `INSERT INTO loans 
             (user_id, lender_name, loan_type, loan_amount, interest_rate, start_date, end_date, emi_amount, remaining_balance, penalty_amount, status, next_emi_due_date, penalty_history, loan_schedule, transactions) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, 0.00), COALESCE($11, 'Active'), $12, '[]'::jsonb, $13, $14) 
             RETURNING *`,
            [
                userId, lender_name, loan_type || 'Personal', loan_amount, interest_rate,
                start_date, end_date, emi_amount, remaining_balance || loan_amount,
                penalty_amount || 0.00, status, next_emi_due_date || null,
                JSON.stringify(schedule), JSON.stringify(initialTransactions)
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        logger.error('Error creating loan', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Update an existing loan
exports.updateLoan = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const loanId = req.params.id;
        const {
            lender_name, loan_type, loan_amount, interest_rate, start_date, end_date,
            emi_amount, remaining_balance, penalty_amount, status, next_emi_due_date,
            penalty_history, loan_schedule, transactions,
            // Special action fields
            _action, _payment_amount, _penalty_amount_new, _penalty_date
        } = req.body;

        const check = await pool.query('SELECT * FROM loans WHERE id = $1 AND user_id = $2', [loanId, userId]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

        const existing = check.rows[0];

        // Parse existing json arrays
        let currentTransactions = [];
        let currentSchedule = [];
        let currentPenaltyHistory = [];
        try { currentTransactions = existing.transactions || []; } catch (e) { }
        try { currentSchedule = existing.loan_schedule || []; } catch (e) { }
        try { currentPenaltyHistory = existing.penalty_history || []; } catch (e) { }

        // ALWAYS start from DB values — never trust client-sent JSONB arrays.
        // Individual _action handlers below will update these as needed.
        let finalTransactions = currentTransactions;
        let finalSchedule = currentSchedule;
        let finalPenaltyHistory = currentPenaltyHistory;
        let finalRemaining = remaining_balance !== undefined ? parseFloat(remaining_balance) : parseFloat(existing.remaining_balance);

        // Plain loan edit (no _action): regenerate schedule from new params,
        // preserving Paid status of already-paid installments by installment number.
        if (!_action) {
            const newLoanAmount = loan_amount || existing.loan_amount;
            const newRate = interest_rate || existing.interest_rate;
            const newEmi = emi_amount || existing.emi_amount;
            const newStart = start_date || existing.start_date;
            const freshSchedule = generateSchedule(newLoanAmount, newRate, newEmi, newStart);

            // Build a map of existing paid installments
            const paidMap = {};
            currentSchedule.forEach(inst => {
                if (inst.status === 'Paid') paidMap[inst.installment] = inst;
            });

            // Merge: preserve Paid status from existing data
            finalSchedule = freshSchedule.map(inst => {
                if (paidMap[inst.installment]) {
                    return { ...inst, status: 'Paid', paid_date: paidMap[inst.installment].paid_date };
                }
                return inst;
            });
        }

        // Handle automatic transaction logging for payments
        if (_action === 'payment' && _payment_amount) {
            const paymentAmt = parseFloat(_payment_amount);
            const newBalance = Math.max(parseFloat(existing.remaining_balance) - paymentAmt, 0);
            finalRemaining = newBalance;

            finalTransactions = [...currentTransactions, {
                date: new Date().toISOString().split('T')[0],
                particulars: 'EMI Payment Received',
                debit: paymentAmt,
                credit: 0,
                balance: newBalance
            }];

            // Mark the first Unpaid installment as Paid
            finalSchedule = currentSchedule.map((inst, idx) => {
                if (inst.status === 'Unpaid' && !finalSchedule._marked) {
                    finalSchedule._marked = true;
                    return { ...inst, status: 'Paid', paid_date: new Date().toISOString().split('T')[0] };
                }
                return inst;
            });
            // Remove internal marker
            finalSchedule = finalSchedule.filter(x => !x._marked);
        }

        // Handle automatic transaction logging for penalties
        if (_action === 'penalty' && _penalty_amount_new) {
            const penaltyAmt = parseFloat(_penalty_amount_new);
            const newBalance = parseFloat(existing.remaining_balance) + penaltyAmt;
            finalRemaining = newBalance;

            finalTransactions = [...currentTransactions, {
                date: _penalty_date || new Date().toISOString().split('T')[0],
                particulars: 'Late Payment Charges',
                debit: penaltyAmt,
                credit: 0,
                balance: newBalance
            }];

            finalPenaltyHistory = [...currentPenaltyHistory, {
                date: _penalty_date || new Date().toISOString().split('T')[0],
                amount: penaltyAmt,
                timestamp: new Date().toISOString()
            }];
        }

        // Handle manually-added statement entries (e.g. from LoanDetailPage)
        if (_action === 'manual_entry' && req.body._entry) {
            const entry = req.body._entry;
            const entryAmount = parseFloat(entry.amount);
            const isDebit = entry.type === 'debit';

            // Derive current outstanding principal balance from the last ledger row
            let currentBalance;
            if (currentTransactions.length > 0) {
                const lastTx = currentTransactions[currentTransactions.length - 1];
                currentBalance = parseFloat(lastTx.balance ?? existing.remaining_balance ?? existing.loan_amount);
            } else {
                currentBalance = parseFloat(existing.loan_amount);
            }

            // EMI-type payments use REDUCING BALANCE interest formula:
            //   monthly_interest = outstanding_balance × (annual_rate / 12 / 100)
            //   principal_repaid  = EMI − monthly_interest
            //   new_balance       = outstanding_balance − principal_repaid
            // All other entries (charges, credits) use simple debit/credit arithmetic.
            const emiParticulars = ['EMI Payment Received', 'Principal Payment', 'Part Payment', 'Prepayment'];
            const isEmiPayment = isDebit && emiParticulars.includes(entry.particulars);

            let newBalance;
            let newTxRows = [];

            if (isEmiPayment) {
                const annualRate = parseFloat(existing.interest_rate || 0);
                const monthlyRate = annualRate / 12 / 100;
                const monthlyInterest = Math.round(currentBalance * monthlyRate * 100) / 100; // round to 2dp
                const principalRepaid = Math.max(entryAmount - monthlyInterest, 0);
                newBalance = Math.max(currentBalance - principalRepaid, 0);

                // Insert "Interest Accrued" line for visibility (this is what the bank debits each month)
                if (monthlyInterest > 0) {
                    const balanceAfterInterest = currentBalance; // interest is rolled into the EMI; balance unchanged here
                    newTxRows.push({
                        date: entry.date,
                        particulars: `Interest Charged (${annualRate}% p.a.)`,
                        debit: monthlyInterest,
                        credit: 0,
                        balance: balanceAfterInterest, // shown for info; EMI row will reflect real reduction
                        _info: true // flag so recalc helper can handle correctly
                    });
                }

                // Main EMI row — balance = new outstanding principal
                newTxRows.push({
                    date: entry.date,
                    particulars: entry.particulars,
                    debit: entryAmount,
                    credit: 0,
                    balance: newBalance
                });
            } else if (isDebit) {
                newBalance = Math.max(currentBalance - entryAmount, 0);
                newTxRows.push({
                    date: entry.date,
                    particulars: entry.particulars,
                    debit: entryAmount,
                    credit: 0,
                    balance: newBalance
                });
            } else {
                // Credit entry (disbursement, reversal, etc.)
                newBalance = currentBalance + entryAmount;
                newTxRows.push({
                    date: entry.date,
                    particulars: entry.particulars,
                    debit: 0,
                    credit: entryAmount,
                    balance: newBalance
                });
            }

            finalRemaining = newBalance;
            finalTransactions = [...currentTransactions, ...newTxRows];

            // Mark the first Unpaid installment as Paid for EMI-type debits
            if (isEmiPayment) {
                let marked = false;
                finalSchedule = currentSchedule.map(inst => {
                    if (!marked && inst.status === 'Unpaid') {
                        marked = true;
                        return { ...inst, status: 'Paid', paid_date: entry.date };
                    }
                    return inst;
                });
            } else {
                finalSchedule = currentSchedule;
            }
        }

        // Edit an existing transaction entry by index, then recalc all balances
        if (_action === 'edit_entry' && req.body._entry_index !== undefined && req.body._entry) {
            const idx = req.body._entry_index ? req.body._entry_index : null;
            const updatedEntry = req.body._entry;
            if (idx >= 0 && idx < currentTransactions.length) {
                const modified = [...currentTransactions];
                modified[idx] = {
                    ...modified[idx],
                    date: updatedEntry.date,
                    particulars: updatedEntry.particulars,
                    debit: updatedEntry.type === 'debit' ? parseFloat(updatedEntry.amount) : 0,
                    credit: updatedEntry.type === 'credit' ? parseFloat(updatedEntry.amount) : 0,
                };
                const { repairedTxs, finalBalance } = recalcTransactionBalances(modified, existing.loan_amount, existing.interest_rate);
                finalTransactions = repairedTxs;
                finalRemaining = finalBalance;
                finalSchedule = syncScheduleToTransactions(currentSchedule, repairedTxs);
            }
        }

        // Delete an existing transaction entry by index, then recalc all balances
        if (_action === 'delete_entry' && req.body._entry_index !== undefined) {
            const idx = req.body._entry_index ? req.body._entry_index : null;
            if (idx >= 0 && idx < currentTransactions.length) {
                const modified = currentTransactions.filter((_, i) => i !== idx);
                const { repairedTxs, finalBalance } = recalcTransactionBalances(modified, existing.loan_amount, existing.interest_rate);
                finalTransactions = repairedTxs;
                finalRemaining = finalBalance;
                finalSchedule = syncScheduleToTransactions(currentSchedule, repairedTxs);
            }
        }

        const result = await pool.query(
            `UPDATE loans 
             SET lender_name=$1, loan_type=$2, loan_amount=$3, interest_rate=$4, start_date=$5, end_date=$6, 
                 emi_amount=$7, remaining_balance=$8, penalty_amount=$9, status=$10, next_emi_due_date=$11, 
                 penalty_history=$12, loan_schedule=$13, transactions=$14
             WHERE id=$15 AND user_id=$16 
             RETURNING *`,
            [
                lender_name || existing.lender_name,
                loan_type || existing.loan_type,
                loan_amount || existing.loan_amount,
                interest_rate || existing.interest_rate,
                start_date || existing.start_date,
                end_date || existing.end_date,
                emi_amount || existing.emi_amount,
                finalRemaining,
                penalty_amount !== undefined ? penalty_amount : existing.penalty_amount,
                status || existing.status,
                next_emi_due_date !== undefined ? next_emi_due_date : existing.next_emi_due_date,
                JSON.stringify(finalPenaltyHistory),
                JSON.stringify(finalSchedule),
                JSON.stringify(finalTransactions),
                loanId, userId
            ]
        );

        res.json(result.rows[0]);
    } catch (err) {
        logger.error('Error updating loan', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// Delete a loan
exports.deleteLoan = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id;
        const loanId = req.params.id;

        const check = await pool.query('SELECT * FROM loans WHERE id = $1 AND user_id = $2', [loanId, userId]);
        if (check.rows.length === 0) return res.status(404).json({ error: 'Loan not found' });

        await pool.query('DELETE FROM loans WHERE id = $1 AND user_id = $2', [loanId, userId]);
        res.status(204).end();
    } catch (err) {
        logger.error('Error deleting loan', err);
        res.status(500).json({ error: 'Server error' });
    }
};
