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
        
        // Process the extracted text
        const result = extractCreditCardData(text);
        
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
          
          const result = extractCreditCardData(text);
          
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

// Function to extract credit card data from text
function extractCreditCardData(text) {
  // console.log('--- RAW EXTRACTED TEXT START ---');
  // console.log(text);
  // console.log('--- RAW EXTRACTED TEXT END ---');

  // Name and Address: first line is name, second line is address
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  let name = '';
  let address = '';
  let cardName = '';
  if (lines.length > 0) {
    // Name is first line (all uppercase words)
    const nameMatch = lines[0].match(/^([A-Z ]+)\b/);
    name = nameMatch ? nameMatch[1].trim() : lines[0];
    // Address is the rest of the first line after name, or the next line
    address = lines[0].replace(name, '').trim();
    if (!address && lines.length > 1) address = lines[1];
  }
  // Card Name: first line ending with 'Credit Card Statement'
  const cardNameLine = lines.find(l => /Credit Card Statement$/i.test(l));
  if (cardNameLine) cardName = cardNameLine.trim();

  // Other fields (existing logic)
  const cardNumberMatch = text.match(/Credit Card Number\s*([\d*]+)/);
  const cardNumber = cardNumberMatch ? cardNumberMatch[1] : '';
  const creditLimitMatch = text.match(/Credit Limit\s*([\d,]+\.\d{2})/);
  const creditLimit = creditLimitMatch ? creditLimitMatch[1] : '';
  const availableCreditLimitMatch = text.match(/Available Credit Limit\s*([\d,]+\.\d{2})/);
  const availableCreditLimit = availableCreditLimitMatch ? availableCreditLimitMatch[1] : '';
  const availableCashLimitMatch = text.match(/Available Cash Limit\s*([\d,]+\.\d{2})/);
  const availableCashLimit = availableCashLimitMatch ? availableCashLimitMatch[1] : '';
  const totalPaymentDueMatch = text.match(/Total Payment Due\s*([\d,]+\.\d{2})/);
  const totalPaymentDue = totalPaymentDueMatch ? totalPaymentDueMatch[1] : '';
  const minPaymentDueMatch = text.match(/Minimum Payment Due\s*([\d,]+\.\d{2})/);
  const minPaymentDue = minPaymentDueMatch ? minPaymentDueMatch[1] : '';
  const statementPeriodMatch = text.match(/Statement Period\s*(\d{2}\/\d{2}\/\d{4} - \d{2}\/\d{2}\/\d{4})/);
  const statementPeriod = statementPeriodMatch ? statementPeriodMatch[1] : '';
  const paymentDueDateMatch = text.match(/Payment Due Date\s*(\d{2}\/\d{2}\/\d{4})/);
  const paymentDueDate = paymentDueDateMatch ? paymentDueDateMatch[1] : '';
  const statementGenDateMatch = text.match(/Statement Generation Date\s*(\d{2}\/\d{2}\/\d{4})/);
  const statementGenDate = statementGenDateMatch ? statementGenDateMatch[1] : '';

  // --- Improved Transaction Extraction ---
  // Try to extract transactions using a robust regex per line
  const transactionLineRegex = /^(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s+(.+?)\s+([A-Z ]+)\s+([A-Z ]+)\s+([\d,]+\.\d{2})/;
  let transactions = [];
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(transactionLineRegex);
    if (match) {
      transactions.push({
        date: match[1],
        details: match[2],
        name: match[3],
        category: match[4],
        amount: match[5].replace(/,/g, ''),
      });
    }
  }
  // Fallback to previous block-based logic if no matches found
  if (transactions.length === 0) {
    // 1. Extract dates block
    let dateLineIdx = lines.findIndex(l => /^DATE$/i.test(l));
    let dates = [];
    if (dateLineIdx !== -1) {
      let dateBlock = [];
      for (let i = dateLineIdx + 1; i < lines.length; i++) {
        if (/^\d{2}\/\d{2}\/\d{4}/.test(lines[i])) {
          dateBlock.push(...lines[i].split(/\s+/).filter(Boolean));
        } else if (lines[i] === '' || !/\d{2}\/\d{2}\/\d{4}/.test(lines[i])) {
          break;
        }
      }
      dates = dateBlock;
    }
    // 2. Extract details and categories block
    let detailsStartIdx = lines.findIndex(l => /^Name /i.test(l));
    let details = [];
    let categories = [];
    if (detailsStartIdx !== -1) {
      let i = detailsStartIdx + 1;
      while (i < lines.length && !/^\*\*\* End of Statement \*\*\*$/.test(lines[i]) && !/^AMOUNT \(Rs\.\)$/i.test(lines[i])) {
        if (lines[i]) {
          details.push(lines[i]);
          if (i + 1 < lines.length && lines[i + 1]) {
            categories.push(lines[i + 1]);
            i++;
          } else {
            categories.push('-');
          }
        }
        i++;
      }
    }
    // 3. Extract amounts block
    let amountLineIdx = lines.findIndex(l => /^AMOUNT \(Rs\.\)$/i.test(l));
    let amounts = [];
    if (amountLineIdx !== -1) {
      let amountBlock = [];
      for (let i = amountLineIdx + 1; i < lines.length; i++) {
        let matches = lines[i].match(/([\d,]+\.\d{2}) Dr/g);
        if (matches) {
          amountBlock.push(...matches.map(a => a.replace(/ Dr$/, '').replace(/,/g, '')));
        } else if (lines[i] === '' || !/\d+\.\d{2} Dr/.test(lines[i])) {
          break;
        }
      }
      amounts = amountBlock;
    }
    // 4. Align by index
    let n = Math.min(dates.length, details.length, categories.length, amounts.length);
    for (let i = 0; i < n; i++) {
      transactions.push({
        date: dates[i] || '-',
        details: details[i] || '-',
        name: name || '-',
        category: categories[i] || '-',
        amount: amounts[i] || '-',
      });
    }
  }

  return {
    name,
    address,
    cardName,
    cardNumber,
    creditLimit,
    availableCreditLimit,
    availableCashLimit,
    totalPaymentDue,
    minPaymentDue,
    statementPeriod,
    paymentDueDate,
    statementGenDate,
    transactions
  };
}

// Save a new credit card
exports.saveCreditCard = async (req, res) => {
  const client = await pool.connect();
  try {
    logger.info('Saving credit card', { body: req.body });
    const card = req.body;
    // Require user_id to be an email (user's email)
    if (!card.user_id || typeof card.user_id !== 'string' || !card.user_id.includes('@')) {
      return res.status(400).json({ error: 'user_id (email) is required' });
    }
    
    // Helper function to safely parse dates
    const parseDate = (dateString) => {
      if (!dateString || dateString === '') return null;
      
      // Handle DD/MM/YYYY format (common in credit card statements)
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
          }
        }
      }
      
      // Try standard date parsing
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };
    
    // Insert card info into credit_cards
    const insertCardQuery = `
      INSERT INTO credit_cards (
        user_id, card_name, card_number, credit_limit, available_credit_limit, available_cash_limit, total_payment_due, min_payment_due, statement_period, payment_due_date, statement_gen_date, address, issuer, status, statement_period_start, statement_period_end
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id
    `;
    const cardValues = [
      card.user_id || null,
      card.cardName || null,
      card.cardNumber || null,
      card.creditLimit || null,
      card.availableCreditLimit || null,
      card.availableCashLimit || null,
      card.totalPaymentDue || null,
      card.minPaymentDue || null,
      card.statementPeriod || null,
      parseDate(card.paymentDueDate),
      parseDate(card.statementGenDate),
      card.address || null,
      card.issuer || null,
      card.status || 'Active',
      parseDate(card.statementPeriodStart),
      parseDate(card.statementPeriodEnd)
    ];
    const cardResult = await client.query(insertCardQuery, cardValues);
    const cardId = cardResult.rows[0].id;

    // Insert transactions if present
    if (Array.isArray(card.transactions)) {
      const insertTxQuery = `
        INSERT INTO credit_card_transactions (card_id, date, details, name, category, amount)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      for (const tx of card.transactions) {
        await client.query(insertTxQuery, [
          cardId,
          parseDate(tx.date),
          tx.details || null,
          tx.name || null,
          tx.category || null,
          tx.amount ? parseFloat(tx.amount) : null
        ]);
      }
    }
    logger.info('Credit card saved', { cardId });
    res.status(201).json({ ...card, id: cardId });
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
    
    // Require user_id to be an email (user's email)
    if (!card.user_id || typeof card.user_id !== 'string' || !card.user_id.includes('@')) {
      return res.status(400).json({ error: 'user_id (email) is required' });
    }
    
    // Helper function to safely parse dates
    const parseDate = (dateString) => {
      if (!dateString || dateString === '') return null;
      
      // Handle DD/MM/YYYY format (common in credit card statements)
      if (typeof dateString === 'string' && dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
          const year = parseInt(parts[2], 10);
          
          if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
            const date = new Date(year, month, day);
            return isNaN(date.getTime()) ? null : date;
          }
        }
      }
      
      // Try standard date parsing
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    };
    
    // Check if card exists
    const checkResult = await client.query('SELECT id FROM credit_cards WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Credit card not found' });
    }
    
    // Update card info
    const updateCardQuery = `
      UPDATE credit_cards SET
        card_name = $1,
        card_number = $2,
        credit_limit = $3,
        available_credit_limit = $4,
        available_cash_limit = $5,
        total_payment_due = $6,
        min_payment_due = $7,
        statement_period = $8,
        payment_due_date = $9,
        statement_gen_date = $10,
        address = $11,
        issuer = $12,
        status = $13,
        statement_period_start = $14,
        statement_period_end = $15,
        bill_paid = $16,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *
    `;
    
    const cardValues = [
      card.cardName || null,
      card.cardNumber || null,
      card.creditLimit || null,
      card.availableCreditLimit || null,
      card.availableCashLimit || null,
      card.totalPaymentDue || null,
      card.minPaymentDue || null,
      card.statementPeriod || null,
      parseDate(card.paymentDueDate),
      parseDate(card.statementGenDate),
      card.address || null,
      card.issuer || null,
      card.status || 'Active',
      parseDate(card.statementPeriodStart),
      parseDate(card.statementPeriodEnd),
      typeof card.billPaid === 'boolean' ? card.billPaid : false,
      id
    ];
    
    const cardResult = await client.query(updateCardQuery, cardValues);
    const updatedCard = cardResult.rows[0];
    
    // Update transactions if present
    if (Array.isArray(card.transactions)) {
      // Delete existing transactions
      await client.query('DELETE FROM credit_card_transactions WHERE card_id = $1', [id]);
      
      // Insert new transactions
      const insertTxQuery = `
        INSERT INTO credit_card_transactions (card_id, date, details, name, category, amount)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      for (const tx of card.transactions) {
        await client.query(insertTxQuery, [
          id,
          parseDate(tx.date),
          tx.details || null,
          tx.name || null,
          tx.category || null,
          tx.amount ? parseFloat(tx.amount) : null
        ]);
      }
    }
    
    // Fetch the updated card with transactions
    const finalCardResult = await client.query('SELECT * FROM credit_cards WHERE id = $1', [id]);
    const txResult = await client.query('SELECT * FROM credit_card_transactions WHERE card_id = $1', [id]);
    
    const finalCard = {
      ...serializeCard(finalCardResult.rows[0]),
      transactions: toCamel(
        txResult.rows.map(tx => ({
          ...tx,
          date: tx.date instanceof Date
            ? tx.date.toISOString().slice(0, 10)
            : (typeof tx.date === 'string' ? tx.date : null)
        }))
      )
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