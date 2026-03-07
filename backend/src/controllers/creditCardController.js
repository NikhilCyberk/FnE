// const multer = require('multer');
// const pdfParse = require('pdf-parse');
// const fs = require('fs');

// const upload = multer({ dest: 'uploads/' });

// exports.extractCreditCardInfo = [
//   upload.fields([
//     { name: 'file', maxCount: 1 },
//     { name: 'password', maxCount: 1 }
//   ]),
//   async (req, res) => {
//     try {
//       console.log('req.body:', req.body);
//       console.log('req.files:', req.files);
//       // Get file and password
//       const fileObj = req.files && req.files.file && req.files.file[0];
//       const filePath = fileObj ? fileObj.path : undefined;
//       console.log('password raw:', req.body.password);
//       let password = req.body.password;
//       if (Array.isArray(password)) password = password[0];
//       const options = password ? { password: String(password) } : {};
//       console.log('pdf-parse options:', options);
//       if (!filePath) {
//         console.error('No file uploaded:', req.files);
//         return res.status(400).json({ error: 'No file uploaded', files: req.files, body: req.body });
//       }
//       const dataBuffer = fs.readFileSync(filePath);
//       const data = await pdfParse(dataBuffer, options);
//       const text = data.text;

//       // Extract fields using regex tailored to Axis Bank statement
//       const nameMatch = text.match(/([A-Z ]+)\n\d{4}/) || text.match(/([A-Z ]+)\n\d{1,4} [A-Z ]+/);
//       const name = nameMatch ? nameMatch[1].trim() : '';
//       const addressMatch = text.match(/([A-Z0-9 ,]+),\nJAIPUR \d{6}/);
//       const address = addressMatch ? addressMatch[1].trim() : '';
//       const cardNumberMatch = text.match(/Credit Card Number\s*([\d*]+)\s/);
//       const cardNumber = cardNumberMatch ? cardNumberMatch[1] : '';
//       const creditLimitMatch = text.match(/Credit Limit\s*([\d,]+\.\d{2})/);
//       const creditLimit = creditLimitMatch ? creditLimitMatch[1] : '';
//       const availableCreditLimitMatch = text.match(/Available Credit Limit\s*([\d,]+\.\d{2})/);
//       const availableCreditLimit = availableCreditLimitMatch ? availableCreditLimitMatch[1] : '';
//       const availableCashLimitMatch = text.match(/Available Cash Limit\s*([\d,]+\.\d{2})/);
//       const availableCashLimit = availableCashLimitMatch ? availableCashLimitMatch[1] : '';
//       const totalPaymentDueMatch = text.match(/Total Payment Due\s*([\d,]+\.\d{2})/);
//       const totalPaymentDue = totalPaymentDueMatch ? totalPaymentDueMatch[1] : '';
//       const minPaymentDueMatch = text.match(/Minimum Payment Due\s*([\d,]+\.\d{2})/);
//       const minPaymentDue = minPaymentDueMatch ? minPaymentDueMatch[1] : '';
//       const statementPeriodMatch = text.match(/Statement Period\s*(\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4})/);
//       const statementPeriod = statementPeriodMatch ? statementPeriodMatch[1] : '';
//       const paymentDueDateMatch = text.match(/Payment Due Date\s*(\d{2}\/\d{2}\/\d{4})/);
//       const paymentDueDate = paymentDueDateMatch ? paymentDueDateMatch[1] : '';
//       const statementGenDateMatch = text.match(/Statement Generation Date\s*(\d{2}\/\d{2}\/\d{4})/);
//       const statementGenDate = statementGenDateMatch ? statementGenDateMatch[1] : '';

//       // Transaction extraction
//       const transactionRegex = /(\d{2}\/\d{2}\/\d{4})\s+([A-Z0-9_\/@]+)\s+([A-Z ]+)\s+([A-Z ]+)\s+([\d,]+\.\d{2} Dr)/g;
//       let transactions = [];
//       let match;
//       while ((match = transactionRegex.exec(text)) !== null) {
//         transactions.push({
//           date: match[1],
//           details: match[2],
//           name: match[3],
//           category: match[4],
//           amount: match[5],
//         });
//       }

//       // Clean up uploaded file
//       fs.unlinkSync(filePath);

//       res.json({
//         name,
//         address,
//         cardNumber,
//         creditLimit,
//         availableCreditLimit,
//         availableCashLimit,
//         totalPaymentDue,
//         minPaymentDue,
//         statementPeriod,
//         paymentDueDate,
//         statementGenDate,
//         transactions
//       });
//     } catch (err) {
//       console.error('PDF extraction error:', err);
//       res.status(400).json({ error: 'Failed to extract info from PDF.', details: err.message, stack: err.stack });
//     }
//   }
// ]; 




const multer = require('multer');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');
const { promisify } = require('util');
const pool = require('../db');
const logger = require('../logger');
const BankStatementParserFactory = require('../services/pdf/BankStatementParserFactory');

const execAsync = promisify(exec);
const upload = multer({ dest: 'uploads/' });

exports.extractCreditCardInfo = [
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'password', maxCount: 1 }
  ]),
  async (req, res) => {
    let filePath = null;
    let tempTextFile = null;

    try {
      console.log('req.body:', req.body);
      console.log('req.files:', req.files);

      // Get file and password
      const fileObj = req.files && req.files.file && req.files.file[0];
      filePath = fileObj ? fileObj.path : undefined;

      if (!filePath) {
        console.error('No file uploaded:', req.files);
        return res.status(400).json({ error: 'No file uploaded', files: req.files, body: req.body });
      }

      console.log('password raw:', req.body.password);
      let password = req.body.password;
      if (Array.isArray(password)) password = password[0];

      // Debug password
      if (password) {
        console.log('Password length:', password.length);
        console.log('Password chars:', password.split('').map(c => c.charCodeAt(0)));
        console.log('Password trimmed:', password.trim());
        password = password.trim(); // Remove any whitespace
      }

      // Method 1: Try using pdftotext (poppler-utils) - most reliable for password-protected PDFs
      try {
        const tempDir = path.dirname(filePath);
        const baseName = path.basename(filePath, path.extname(filePath));
        tempTextFile = path.join(tempDir, `${baseName}.txt`);

        // First, test if we can get PDF info (this helps verify password)
        if (password) {
          try {
            const infoCommand = `pdfinfo -upw "${password}" "${filePath}"`;
            console.log('Testing PDF info access...');
            const infoResult = await execAsync(infoCommand);
            console.log('PDF info accessible:', infoResult.stdout.substring(0, 200));
          } catch (infoError) {
            console.log('PDF info test failed:', infoError.message);
            // Continue anyway, as pdfinfo might not be available
          }
        }

        let command;
        let passwordAttempts = [];

        if (password) {
          // Try different password approaches
          passwordAttempts = [
            `pdftotext -upw "${password}" "${filePath}" "${tempTextFile}"`, // user password
            `pdftotext -opw "${password}" "${filePath}" "${tempTextFile}"`, // owner password
            `pdftotext -upw "${password}" -opw "${password}" "${filePath}" "${tempTextFile}"` // both passwords
          ];
        } else {
          passwordAttempts = [`pdftotext "${filePath}" "${tempTextFile}"`];
        }

        let lastError;
        let success = false;

        for (let i = 0; i < passwordAttempts.length; i++) {
          try {
            command = passwordAttempts[i];
            console.log(`Executing pdftotext command (attempt ${i + 1}):`, command.replace(password, '***'));
            await execAsync(command);
            success = true;
            console.log(`Password attempt ${i + 1} succeeded`);
            break;
          } catch (err) {
            console.log(`Password attempt ${i + 1} failed:`, err.message);
            lastError = err;

            // Clean up any partial text file
            if (fs.existsSync(tempTextFile)) {
              try {
                fs.unlinkSync(tempTextFile);
              } catch (cleanupErr) {
                // Ignore cleanup errors
              }
            }
          }
        }

        if (!success) {
          throw lastError;
        }

        // Read the extracted text
        const text = fs.readFileSync(tempTextFile, 'utf8');
        console.log('Successfully extracted text using pdftotext');

        // Process the extracted text using Strategy Pattern
        const parser = BankStatementParserFactory.getParser(text);
        const result = parser.parse(text);

        // Clean up files
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        if (fs.existsSync(tempTextFile)) fs.unlinkSync(tempTextFile);

        return res.json(result);

      } catch (pdftotextError) {
        console.log('pdftotext failed, trying alternative method...', pdftotextError.message);

        // Method 2: Try pdf-parse as fallback (for non-password protected PDFs)
        try {
          const pdfParse = require('pdf-parse');
          const dataBuffer = fs.readFileSync(filePath);

          // Only try pdf-parse without password since it doesn't handle passwords well
          const data = await pdfParse(dataBuffer);
          const text = data.text;
          console.log('Successfully extracted text using pdf-parse (fallback)');

          // Process the extracted text using Strategy Pattern
          const parser = BankStatementParserFactory.getParser(text);
          const result = parser.parse(text);

          // Clean up files
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          if (tempTextFile && fs.existsSync(tempTextFile)) fs.unlinkSync(tempTextFile);

          return res.json(result);

        } catch (pdfParseError) {
          console.error('Both pdftotext and pdf-parse failed:', {
            pdftotextError: pdftotextError.message,
            pdfParseError: pdfParseError.message
          });

          throw new Error(`Failed to extract PDF content. Please ensure: 
            1. The PDF is not corrupted
            2. The password is correct (if required)
            3. poppler-utils is installed (for password-protected PDFs)
            
            Errors: pdftotext: ${pdftotextError.message}, pdf-parse: ${pdfParseError.message}`);
        }
      }

    } catch (err) {
      console.error('PDF extraction error:', err);

      // Clean up files on error
      if (filePath && fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (cleanupErr) {
          console.error('Failed to cleanup main file:', cleanupErr);
        }
      }

      if (tempTextFile && fs.existsSync(tempTextFile)) {
        try {
          fs.unlinkSync(tempTextFile);
        } catch (cleanupErr) {
          console.error('Failed to cleanup temp file:', cleanupErr);
        }
      }

      res.status(400).json({
        error: 'Failed to extract info from PDF.',
        details: err.message,
        suggestions: [
          'Verify the PDF password is correct',
          'Ensure the PDF is not corrupted',
          'For password-protected PDFs, install poppler-utils: https://poppler.freedesktop.org/'
        ]
      });
    }
  }
];

// Helper to safely parse dates
function parseDate(dateString) {
  if (!dateString || dateString === '') return null;
  if (typeof dateString === 'string' && dateString.includes('/')) {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts.map(Number);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? null : d;
      }
    }
  }
  const d = new Date(dateString);
  return isNaN(d.getTime()) ? null : d;
}

// Resolve user_id UUID from email (legacy: user_id may be sent as email string)
async function resolveUserId(client, userId) {
  if (!userId) return null;
  // Already a UUID
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) return userId;
  // It's an email — look up the UUID
  const result = await client.query('SELECT id FROM users WHERE email = $1', [userId]);
  return result.rows[0]?.id || null;
}

// Save a new credit card
exports.saveCreditCard = async (req, res) => {
  const client = await pool.connect();
  try {
    logger.info('Saving credit card', { body: req.body });
    const card = req.body;

    const resolvedUserId = await resolveUserId(client, card.user_id);

    const insertCardQuery = `
      INSERT INTO credit_cards (
        user_id, card_name, card_number_last_four, card_type,
        credit_limit, available_credit, cash_advance_limit,
        current_balance, statement_balance, minimum_payment,
        payment_due_date, statement_date,
        last_payment_amount, last_payment_date,
        apr, annual_fee, status, expiry_date, rewards_program
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      RETURNING id
    `;
    const cardValues = [
      resolvedUserId,
      card.cardName || null,
      card.cardNumberLastFour || card.cardNumber || null,  // accept either
      card.cardType || null,
      card.creditLimit ? parseFloat(card.creditLimit) : null,
      card.availableCredit ? parseFloat(card.availableCredit) : null,
      card.cashAdvanceLimit ? parseFloat(card.cashAdvanceLimit) : null,
      card.currentBalance ? parseFloat(card.currentBalance) : null,
      card.statementBalance ? parseFloat(card.statementBalance) : null,
      card.minimumPayment ? parseFloat(card.minimumPayment) : null,
      parseDate(card.paymentDueDate),
      parseDate(card.statementDate),
      card.lastPaymentAmount ? parseFloat(card.lastPaymentAmount) : null,
      parseDate(card.lastPaymentDate),
      card.apr ? parseFloat(card.apr) : null,
      card.annualFee ? parseFloat(card.annualFee) : null,
      card.status || 'active',
      parseDate(card.expiryDate),
      card.rewardsProgram || null,
    ];
    // Enforce constraints
    const cl = cardValues[4];  // credit_limit ($5)
    const ac = cardValues[5];  // available_credit ($6)
    if (cl !== null && ac !== null && ac > cl) cardValues[5] = cl; // clamp to credit_limit
    if (cl !== null && ac === null) cardValues[5] = cl;             // default available = limit
    const cardResult = await client.query(insertCardQuery, cardValues);
    const cardId = cardResult.rows[0].id;

    // Insert statement transactions if provided (from PDF extraction)
    if (Array.isArray(card.transactions) && card.transactions.length > 0) {
      const insertTxQuery = `
        INSERT INTO credit_card_transactions
          (credit_card_id, transaction_date, description, merchant, category, amount, transaction_type)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
      `;
      for (const tx of card.transactions) {
        await client.query(insertTxQuery, [
          cardId,
          parseDate(tx.date) || parseDate(tx.transactionDate),
          tx.details || tx.description || null,
          tx.name || tx.merchant || null,
          tx.category || null,
          tx.amount ? parseFloat(String(tx.amount).replace(/,/g, '')) : null,
          'purchase',
        ]);
      }
    }

    logger.info('Credit card saved', { cardId });
    const saved = await client.query('SELECT * FROM credit_cards WHERE id = $1', [cardId]);
    res.status(201).json(serializeCard(saved.rows[0]));
  } catch (err) {
    logger.error('Error in saveCreditCard:', err);
    res.status(500).json({ error: 'Failed to save credit card', details: err.message });
  } finally {
    client.release();
  }
};

// Helper to convert snake_case to camelCase
function toCamel(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toCamel);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
      toCamel(v)
    ])
  );
}

// Helper function to serialize date fields
function serializeCard(card) {
  return {
    ...toCamel(card),
    // Serialize all date fields to ISO strings
    paymentDueDate: card.payment_due_date instanceof Date
      ? card.payment_due_date.toISOString().slice(0, 10)
      : (typeof card.payment_due_date === 'string' ? card.payment_due_date : null),
    statementGenDate: card.statement_gen_date instanceof Date
      ? card.statement_gen_date.toISOString().slice(0, 10)
      : (typeof card.statement_gen_date === 'string' ? card.statement_gen_date : null),
    statementPeriodStart: card.statement_period_start instanceof Date
      ? card.statement_period_start.toISOString().slice(0, 10)
      : (typeof card.statement_period_start === 'string' ? card.statement_period_start : null),
    statementPeriodEnd: card.statement_period_end instanceof Date
      ? card.statement_period_end.toISOString().slice(0, 10)
      : (typeof card.statement_period_end === 'string' ? card.statement_period_end : null),
    createdAt: card.created_at instanceof Date
      ? card.created_at.toISOString()
      : (typeof card.created_at === 'string' ? card.created_at : null),
    updatedAt: card.updated_at instanceof Date
      ? card.updated_at.toISOString()
      : (typeof card.updated_at === 'string' ? card.updated_at : null)
  };
}

// Get all credit cards
exports.getCreditCards = async (req, res) => {
  const client = await pool.connect();
  try {
    // Fetch all cards
    const cardsResult = await client.query('SELECT * FROM credit_cards');
    const cards = cardsResult.rows;
    // Fetch all transactions
    const txResult = await client.query('SELECT * FROM credit_card_transactions');
    const transactions = txResult.rows;
    // Attach transactions to their cards, serialize dates, and convert to camelCase
    const cardsWithTx = cards.map(card => ({
      ...serializeCard(card),
      transactions: toCamel(
        transactions
          .filter(tx => tx.card_id === card.id)
          .map(tx => ({
            ...tx,
            date: tx.date instanceof Date
              ? tx.date.toISOString().slice(0, 10)
              : (typeof tx.date === 'string' ? tx.date : null)
          }))
      )
    }));
    res.json(cardsWithTx);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch credit cards', details: err.message });
  } finally {
    client.release();
  }
};

// Get a single credit card by ID
exports.getCreditCardById = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;

    // Fetch the card
    const cardResult = await client.query('SELECT * FROM credit_cards WHERE id = $1', [id]);
    if (cardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    const card = cardResult.rows[0];

    // Fetch transactions for this card
    const txResult = await client.query('SELECT * FROM credit_card_transactions WHERE card_id = $1', [id]);
    const transactions = txResult.rows;

    // Serialize the card with transactions
    const cardWithTx = {
      ...serializeCard(card),
      transactions: toCamel(
        transactions.map(tx => ({
          ...tx,
          date: tx.date instanceof Date
            ? tx.date.toISOString().slice(0, 10)
            : (typeof tx.date === 'string' ? tx.date : null)
        }))
      )
    };

    res.json(cardWithTx);
  } catch (err) {
    logger.error('Error in getCreditCardById:', err);
    res.status(500).json({ error: 'Failed to fetch credit card', details: err.message });
  } finally {
    client.release();
  }
};

// Update a credit card
exports.updateCreditCard = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = req.params.id;
    const card = req.body;
    logger.info('Updating credit card', { id, body: req.body });

    // Check if card exists
    const checkResult = await client.query('SELECT id FROM credit_cards WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credit card not found' });
    }

    const updateCardQuery = `
      UPDATE credit_cards SET
        card_name            = $1,
        card_type            = $2,
        credit_limit         = $3,
        available_credit     = $4,
        cash_advance_limit   = $5,
        current_balance      = $6,
        statement_balance    = $7,
        minimum_payment      = $8,
        payment_due_date     = $9,
        statement_date       = $10,
        last_payment_amount  = $11,
        last_payment_date    = $12,
        apr                  = $13,
        annual_fee           = $14,
        status               = $15,
        expiry_date          = $16,
        rewards_program      = $17,
        updated_at           = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *
    `;
    const cardValues = [
      card.cardName || null,
      card.cardType || null,
      card.creditLimit ? parseFloat(card.creditLimit) : null,
      card.availableCredit ? parseFloat(card.availableCredit) : null,
      card.cashAdvanceLimit ? parseFloat(card.cashAdvanceLimit) : null,
      card.currentBalance ? parseFloat(card.currentBalance) : null,
      card.statementBalance ? parseFloat(card.statementBalance) : null,
      card.minimumPayment ? parseFloat(card.minimumPayment) : null,
      parseDate(card.paymentDueDate),
      parseDate(card.statementDate),
      card.lastPaymentAmount ? parseFloat(card.lastPaymentAmount) : null,
      parseDate(card.lastPaymentDate),
      card.apr ? parseFloat(card.apr) : null,
      card.annualFee ? parseFloat(card.annualFee) : null,
      card.status || 'Active',
      parseDate(card.expiryDate),
      card.rewardsProgram || null,
      id,
    ];
    await client.query(updateCardQuery, cardValues);

    // Fetch updated card
    const finalCardResult = await client.query('SELECT * FROM credit_cards WHERE id = $1', [id]);
    const txResult = await client.query(
      'SELECT * FROM credit_card_transactions WHERE credit_card_id = $1 ORDER BY transaction_date DESC', [id]
    );

    const finalCard = {
      ...serializeCard(finalCardResult.rows[0]),
      transactions: toCamel(
        txResult.rows.map(tx => ({
          ...tx,
          transactionDate: tx.transaction_date instanceof Date
            ? tx.transaction_date.toISOString().slice(0, 10)
            : (tx.transaction_date || null),
        }))
      ),
    };

    logger.info('Credit card updated successfully', { id });
    res.json(finalCard);
  } catch (err) {
    logger.error('Error in updateCreditCard:', err);
    res.status(500).json({ error: 'Failed to update credit card', details: err.message });
  } finally {
    client.release();
  }
};

exports.deleteCreditCard = async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query('DELETE FROM credit_cards WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Credit card not found' });
    }
    res.json({ success: true });
  } catch (err) {
    logger.error('Failed to delete credit card:', err);
    res.status(500).json({ error: 'Failed to delete credit card' });
  }
};

// Get all card name options grouped by bank
exports.getCardNameOptions = async (req, res) => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT bank_name, card_name FROM card_name_options');
    // Group by bank
    const grouped = {};
    result.rows.forEach(({ bank_name, card_name }) => {
      if (!grouped[bank_name]) grouped[bank_name] = [];
      grouped[bank_name].push(card_name);
    });
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch card name options', details: err.message });
  } finally {
    client.release();
  }
};

// Add a new card name option
exports.addCardNameOption = async (req, res) => {
  const { bank_name, card_name } = req.body;
  if (!bank_name || !card_name) {
    return res.status(400).json({ error: 'bank_name and card_name are required' });
  }
  const client = await pool.connect();
  try {
    await client.query('INSERT INTO card_name_options (bank_name, card_name) VALUES ($1, $2)', [bank_name, card_name]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add card name option', details: err.message });
  } finally {
    client.release();
  }
};