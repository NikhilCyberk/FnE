/**
 * Generic Parser
 * Fallback parser that attempts to heuristically extract data from
 * an unknown credit card statement structure using regex patterns.
 */

class GenericParser {
    constructor() {
        this.bankName = 'Generic';
    }

    parse(text) {
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

        // Transaction Extraction
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

        // Fallback block-based logic
        if (transactions.length === 0) {
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
            transactions,
            parserUsed: this.bankName
        };
    }
}

module.exports = GenericParser;
