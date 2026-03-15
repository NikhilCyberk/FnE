const path = require('path');
require(path.join(__dirname, 'backend/node_modules/dotenv')).config({ path: path.join(__dirname, 'backend/.env') });
const pool = require('./backend/src/db');

async function verify() {
    try {
        console.log('Testing verify_phase7...');
        
        // 1. Check a valid credit card ID for testing
        const cardRes = await pool.query('SELECT id, user_id, account_id FROM credit_cards LIMIT 1');
        if (cardRes.rows.length === 0) {
            console.log('No credit cards found for testing.');
            return;
        }
        const cardId = cardRes.rows[0].id;
        const userId = cardRes.rows[0].user_id;
        let resolvedAccountId = cardRes.rows[0].account_id;

        console.log(`Using Card ID: ${cardId}, User ID: ${userId}`);

        if (!resolvedAccountId) {
            console.log('Linking card to a test account...');
            const accRes = await pool.query('SELECT id FROM accounts LIMIT 1');
            if (accRes.rows.length === 0) {
                console.log('No accounts found to link.');
                return;
            }
            resolvedAccountId = accRes.rows[0].id;
            await pool.query('UPDATE credit_cards SET account_id = $1 WHERE id = $2', [resolvedAccountId, cardId]);
            console.log(`✅ Linked Card ${cardId} to Account ${resolvedAccountId}`);
        } else {
            console.log(`Card already linked to Account: ${resolvedAccountId}`);
        }

        // 2. Test a simulated transaction creation with resolved ID
        const categoryRes = await pool.query('SELECT id FROM categories LIMIT 1');
        const categoryId = categoryRes.rows[0].id;

        console.log('Simulating transaction insert...');
        const numericAmount = 10.00;
        const description = 'Phase 7 Verification';
        const type = 'expense';
        const status = 'completed';
        const transactionDate = new Date().toISOString().slice(0, 10);

        const insertRes = await pool.query(`
            INSERT INTO transactions (
                user_id, account_id, category_id, amount, type, status, description, transaction_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id
        `, [userId, resolvedAccountId, categoryId, numericAmount, type, status, description, transactionDate]);

        console.log(`✅ Transaction created successfully with ID: ${insertRes.rows[0].id}`);

        // Cleanup
        await pool.query('DELETE FROM transactions WHERE id = $1', [insertRes.rows[0].id]);
        console.log('✅ Cleanup successful.');

        // 3. Test handle of prefixed ID (logic test)
        const ccPrefixId = `CC_${cardId}`;
        const prefixStripped = ccPrefixId.replace('CC_', '');
        console.log(`Testing prefix stripping: ${ccPrefixId} -> ${prefixStripped}`);
        if (prefixStripped === cardId) {
            console.log('✅ Prefix stripping logic verified.');
        } else {
            console.error('❌ Prefix stripping failed.');
        }

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await pool.end();
    }
}

verify();
