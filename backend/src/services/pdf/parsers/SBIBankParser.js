const GenericParser = require('./GenericParser');

/**
 * SBI Bank Specific Parser
 * Currently extends GenericParser, but allows for specific overrides
 * formatted to match exact SBI statement tables.
 */
class SBIBankParser extends GenericParser {
    constructor() {
        super();
        this.bankName = 'SBI Bank';
    }

    parse(text) {
        // Start with the generic logic as a baseline
        const baseData = super.parse(text);

        // Apply specific SBI overrides here if needed
        // Example: exact regex for SBI payment due
        const sbiMinDueMatch = text.match(/Min\.\s*Amount\s*Due\s*(?:Rs\.)?\s*([\d,]+\.\d{2})/i);
        if (sbiMinDueMatch) {
            baseData.minPaymentDue = sbiMinDueMatch[1];
        }

        // Add custom issuer
        baseData.issuer = 'SBI Bank';
        baseData.parserUsed = this.bankName;

        return baseData;
    }
}

module.exports = SBIBankParser;
