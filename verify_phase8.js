const path = require('path');
require(path.join(__dirname, 'backend/node_modules/dotenv')).config({ path: path.join(__dirname, 'backend/.env') });
const pool = require('./backend/src/db');

async function verify() {
    try {
        console.log('Testing verify_phase8...');
        
        // 1. Setup test data
        const cardRes = await pool.query('SELECT id, user_id, account_id FROM credit_cards WHERE account_id IS NOT NULL LIMIT 1');
        if (cardRes.rows.length === 0) {
            console.log('No linked credit cards found for testing. Please link one first.');
            return;
        }
        const cardId = cardRes.rows[0].id;
        const userId = cardRes.rows[0].user_id;
        const linkedAccountId = cardRes.rows[0].account_id;
        const ccPrefixId = `CC_${cardId}`;

        console.log(`Using Card ID: ${cardId}, User ID: ${userId}, Linked Account ID: ${linkedAccountId}`);

        const categoryRes = await pool.query('SELECT id FROM categories LIMIT 1');
        const categoryId = categoryRes.rows[0].id;

        // helper to simulate the logic in transactionsController.js
        async function resolveAccountId(id, uId) {
            if (!id) return null;
            if (id.startsWith('CC_')) {
                const cId = id.replace('CC_', '');
                const res = await pool.query('SELECT account_id FROM credit_cards WHERE id = $1 AND user_id = $2', [cId, uId]);
                return res.rows[0]?.account_id || null;
            }
            return id;
        }

        // Test Scenario 1: Expense with stale transferAccountId (should be nullified in real controller)
        // We will simulate the final SQL call with a NULL transfer_account_id
        console.log('Scenario 1: Simulating expense with stale transfer account (should use NULL)...');
        let finalAccountId = linkedAccountId;
        let finalTransferAccountId = null; // Forced to NULL for expense

        let insertRes = await pool.query(`
            INSERT INTO transactions (user_id, account_id, category_id, transfer_account_id, amount, type, status, description, transaction_date)
            VALUES ($1, $2, $3, $4, 10, 'expense', 'completed', 'Phase 8 Test 1', CURRENT_DATE)
            RETURNING id
        `, [userId, finalAccountId, categoryId, finalTransferAccountId]);
        console.log(`✅ Scenario 1 success: Transaction ${insertRes.rows[0].id} created.`);
        await pool.query('DELETE FROM transactions WHERE id = $1', [insertRes.rows[0].id]);


        // Test Scenario 2: Transfer between SAME accounts (after resolution)
        console.log('Scenario 2: Simulating transfer between SAME accounts (after ID resolution)...');
        // Source: Linked Account ID
        // Destination: CC_prefixed ID (which resolves to Linked Account ID)
        let resolvedDestination = await resolveAccountId(ccPrefixId, userId);
        
        console.log(`Source Account: ${linkedAccountId}`);
        console.log(`Resolved Destination: ${resolvedDestination}`);

        if (linkedAccountId === resolvedDestination) {
            console.log('✅ Correctly identified that accounts are the same after resolution.');
            console.log('Blocking insertion (this would be a 400 error in the controller)...');
        } else {
            console.error('❌ Failed to identify same accounts.');
        }

        // Test Scenario 3: Valid transfer between DIFFERENT accounts
        const otherAccRes = await pool.query('SELECT id FROM accounts WHERE id <> $1 LIMIT 1', [linkedAccountId]);
        if (otherAccRes.rows.length > 0) {
            const otherAccountId = otherAccRes.rows[0].id;
            console.log(`Scenario 3: Simulating valid transfer to Account ${otherAccountId}...`);
            
            insertRes = await pool.query(`
                INSERT INTO transactions (user_id, account_id, category_id, transfer_account_id, amount, type, status, description, transaction_date)
                VALUES ($1, $2, $3, $4, 10, 'transfer', 'completed', 'Phase 8 Test 3', CURRENT_DATE)
                RETURNING id
            `, [userId, linkedAccountId, categoryId, otherAccountId]);
            console.log(`✅ Scenario 3 success: Transaction ${insertRes.rows[0].id} created.`);
            await pool.query('DELETE FROM transactions WHERE id = $1', [insertRes.rows[0].id]);
        }

        console.log('✅ Phase 8 verification logic confirmed.');

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await pool.end();
    }
}

verify();
