const pool = require('../db');
const logger = require('../logger');
const asyncHandler = require('../middleware/asyncHandler');

// GET /api/contacts
exports.getContacts = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { page = 1, limit = 100, search = '' } = req.query;
    
    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM contacts WHERE user_id = $1 AND is_active = true';
    const params = [userId];
    
    if (search) {
        query += ' AND name ILIKE $2';
        params.push(`%${search}%`);
    }
    
    query += ' ORDER BY name ASC';
    
    // Count total
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_q`;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Add pagination
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    res.json({
        contacts: result.rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total
    });
});

// POST /api/contacts
exports.createContact = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { name, phone, email, notes } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }
    
    try {
        const result = await pool.query(
            `INSERT INTO contacts (user_id, name, phone, email, notes) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING *`,
            [userId, name, phone, email, notes]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') { // Unique constraint violation
            return res.status(409).json({ error: `A contact with the name "${name}" already exists.` });
        }
        throw err;
    }
});

// GET /api/contacts/:id
exports.getContactById = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const contactResult = await pool.query(
        'SELECT * FROM contacts WHERE id = $1 AND user_id = $2',
        [id, userId]
    );
    
    if (contactResult.rows.length === 0) {
        return res.status(404).json({ error: 'Contact not found' });
    }
    
    // Get debt history
    const transactionsResult = await pool.query(
        `SELECT t.*, a.account_name, c.name as category_name 
         FROM transactions t
         LEFT JOIN accounts a ON t.account_id = a.id
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.contact_id = $1 AND t.user_id = $2
         ORDER BY t.transaction_date DESC`,
        [id, userId]
    );
    
    res.json({
        ...contactResult.rows[0],
        transactions: transactionsResult.rows
    });
});

// PUT /api/contacts/:id
exports.updateContact = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    const { name, phone, email, notes, is_active } = req.body;
    
    const result = await pool.query(
        `UPDATE contacts 
         SET name = COALESCE($1, name), 
             phone = COALESCE($2, phone), 
             email = COALESCE($3, email), 
             notes = COALESCE($4, notes),
             is_active = COALESCE($5, is_active),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [name, phone, email, notes, is_active, id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json(result.rows[0]);
});

// DELETE /api/contacts/:id (Soft-delete)
exports.deleteContact = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { id } = req.params;
    
    const result = await pool.query(
        `UPDATE contacts SET is_active = false, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1 AND user_id = $2 RETURNING id`,
        [id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Contact not found' });
    }
    
    res.json({ message: 'Contact deactivated successfully' });
});
