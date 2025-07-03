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
  console.log('--- RAW EXTRACTED TEXT START ---');
  console.log(text);
  console.log('--- RAW EXTRACTED TEXT END ---');

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
  // 1. Extract dates block
  let dateLineIdx = lines.findIndex(l => /^DATE$/i.test(l));
  let dates = [];
  if (dateLineIdx !== -1) {
    // Collect all lines until a non-date line or empty line
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
  // Find the section after 'Name NIKHIL KUMAR' and before '**** End of Statement ****' or 'AMOUNT (Rs.)'
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
    // Collect all lines until a non-amount line or empty line
    let amountBlock = [];
    for (let i = amountLineIdx + 1; i < lines.length; i++) {
      // Match amounts like 1,990.00 Dr
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
  let transactions = [];
  for (let i = 0; i < n; i++) {
    transactions.push({
      date: dates[i] || '-',
      details: details[i] || '-',
      name: name || '-',
      category: categories[i] || '-',
      amount: amounts[i] || '-',
    });
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

// In-memory storage for credit cards (replace with DB in production)
const creditCards = [];

// Save a new credit card
exports.saveCreditCard = async (req, res) => {
  try {
    const card = req.body;
    card.id = Date.now().toString(); // Simple unique ID
    creditCards.push(card);
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save credit card', details: err.message });
  }
};

// Get all credit cards
exports.getCreditCards = async (req, res) => {
  res.json(creditCards);
};