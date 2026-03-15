const path = require('path');
require(path.join(__dirname, 'backend/node_modules/dotenv')).config({ path: path.join(__dirname, 'backend/.env') });
const pool = require('./backend/src/db');

async function verify() {
    try {
        console.log('Testing verify_proactive_linkage...');
        
        // 1. Find the unlinked card from earlier: SIMPLY CLICK SBI CARD
        const cardRes = await pool.query('SELECT id, user_id, card_name FROM credit_cards WHERE card_name = \'SIMPLY CLICK SBI CARD\' LIMIT 1');
        if (cardRes.rows.length === 0) {
            console.log('Card not found for testing.');
            return;
        }
        const cardId = cardRes.rows[0].id;
        const userId = cardRes.rows[0].user_id;
        const cardName = cardRes.rows[0].card_name;
        const ccPrefixId = `CC_${cardId}`;

        console.log(`Using Card: ${cardName} (${cardId}), User ID: ${userId}`);

        // 2. Simulate the proactive linkage logic
        console.log('Resolving account ID proactively...');
        
        // --- Logic from transactionsController.js ---
        async function getOrCreateCardAccount(cId, uId) {
            const cRes = await pool.query('SELECT card_name, account_id FROM credit_cards WHERE id = $1 AND user_id = $2', [cId, uId]);
            const card = cRes.rows[0];
            if (card.account_id) return card.account_id;

            console.log('Card not linked. Creating account...');
            const accountName = `Credit Card - ${card.card_name}`;
            const typeRes = await pool.query('SELECT id FROM account_types WHERE name = \'Credit Card\'');
            const accountTypeId = typeRes.rows[0]?.id;

            const accRes = await pool.query(
                'INSERT INTO accounts (user_id, account_name, account_type_id, balance, available_balance) VALUES ($1, $2, $3, 0, 0) RETURNING id',
                [uId, accountName, accountTypeId]
            );

            const newId = accRes.rows[0].id;
            await pool.query('UPDATE credit_cards SET account_id = $1 WHERE id = $2', [newId, cId]);
            return newId;
        }
        // ------------------------------------------

        const resolvedAccountId = await getOrCreateCardAccount(cardId, userId);
        console.log(`✅ Resolved Account ID: ${resolvedAccountId}`);

        // 3. Verify it's linked in DB
        const checkRes = await pool.query('SELECT account_id FROM credit_cards WHERE id = $1', [cardId]);
        if (checkRes.rows[0].account_id === resolvedAccountId) {
            console.log('✅ DB linkage verified.');
        } else {
            console.error('❌ DB linkage failed.');
        }

        // 4. Test simulated transaction creation
        const categoryRes = await pool.query('SELECT id FROM categories LIMIT 1');
        const categoryId = categoryRes.rows[0].id;

        console.log('Simulating transfer insert...');
        const otherAccRes = await pool.query('SELECT id FROM accounts WHERE id <> $1 LIMIT 1', [resolvedAccountId]);
        const sourceAccountId = otherAccRes.rows[0].id;

        const insertRes = await pool.query(`
            INSERT INTO transactions (user_id, account_id, category_id, transfer_account_id, amount, type, status, description, transaction_date)
            VALUES ($1, $2, $3, $4, 949, 'transfer', 'completed', 'Proactive Linkage Test', CURRENT_DATE)
            RETURNING id
        `, [userId, sourceAccountId, categoryId, resolvedAccountId]);

        console.log(`✅ Transaction created successfully with ID: ${insertRes.rows[0].id}`);

        // Cleanup transaction
        await pool.query('DELETE FROM transactions WHERE id = $1', [insertRes.rows[0].id]);
        console.log('✅ Cleanup successful.');

    } catch (err) {
        console.error('❌ Verification failed:', err.message);
        if (err.stack) console.error(err.stack);
    } finally {
        await pool.end();
    }
}

verify();
