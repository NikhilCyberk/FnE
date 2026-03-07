const GenericParser = require('./parsers/GenericParser');
const SBIBankParser = require('./parsers/SBIBankParser');
const logger = require('../../logger');

class BankStatementParserFactory {
    /**
     * Identifies the bank from the text and returns the corresponding parser instance.
     * @param {string} text - The extracted raw text from the PDF.
     * @returns {Object} A parser instance with a `.parse(text)` method.
     */
    static getParser(text) {
        if (!text) {
            logger.warn('No text provided to BankStatementParserFactory');
            return new GenericParser();
        }

        // Simple heuristic: check for specific bank phrases
        const upperText = text.toUpperCase();

        if (upperText.includes('SBI CARD') || upperText.includes('STATE BANK OF INDIA')) {
            logger.info('Identified SBI Bank statement');
            return new SBIBankParser();
        }

        // Fallback
        logger.info('Could not specifically identify bank, falling back to GenericParser');
        return new GenericParser();
    }
}

module.exports = BankStatementParserFactory;
