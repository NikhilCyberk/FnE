// Consolidated validation helpers used across controllers

function isValidEmail(email) {
  return typeof email === 'string' &&
    email.includes('@') &&
    email.length <= 255 &&
    /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 6;
}

function isValidName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 100;
}

function isValidAmount(amount) {
  return typeof amount === 'number' && !isNaN(amount) && isFinite(amount) && amount !== 0;
}

function isValidBalance(balance) {
  return typeof balance === 'number' && !isNaN(balance) && isFinite(balance);
}

function isValidCurrency(currency) {
  return typeof currency === 'string' && /^[A-Z]{3}$/.test(currency);
}

function isValidColor(color) {
  return !color || (typeof color === 'string' && /^#[0-9A-Fa-f]{6}$/.test(color));
}

function isValidTransactionType(type) {
  return typeof type === 'string' && ['income', 'expense', 'transfer'].includes(type);
}

function isValidTransactionStatus(status) {
  return typeof status === 'string' && ['pending', 'completed', 'cancelled', 'failed'].includes(status);
}

function isValidBudgetPeriod(period) {
  return typeof period === 'string' && ['monthly', 'quarterly', 'yearly'].includes(period);
}

function isValidAccountName(name) {
  return typeof name === 'string' && name.length > 0 && name.length <= 100;
}

function isValidAccountType(typeId) {
  return typeof typeId === 'string' && typeId.length > 0;
}

module.exports = {
  isValidEmail,
  isValidPassword,
  isValidName,
  isValidAmount,
  isValidBalance,
  isValidCurrency,
  isValidColor,
  isValidTransactionType,
  isValidTransactionStatus,
  isValidBudgetPeriod,
  isValidAccountName,
  isValidAccountType,
};
