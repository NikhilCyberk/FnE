export const ValidationRules = {
  required: (value) => {
    if (!value || value.toString().trim() === '') {
      return 'This field is required';
    }
    return null;
  },

  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  },

  phone: (value) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = value.replace(/\D/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return 'Please enter a valid 10-digit phone number';
    }
    return null;
  },

  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Minimum ${min} characters required`;
    }
    return null;
  },

  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `Maximum ${max} characters allowed`;
    }
    return null;
  },

  numeric: (value) => {
    if (value && isNaN(value)) {
      return 'Please enter a valid number';
    }
    return null;
  },

  positive: (value) => {
    const num = parseFloat(value);
    if (value && num <= 0) {
      return 'Value must be positive';
    }
    return null;
  },

  min: (min) => (value) => {
    const num = parseFloat(value);
    if (value && num < min) {
      return `Value must be at least ${min}`;
    }
    return null;
  },

  max: (max) => (value) => {
    const num = parseFloat(value);
    if (value && num > max) {
      return `Value must be at most ${max}`;
    }
    return null;
  },

  futureDate: (value) => {
    if (value && new Date(value) > new Date()) {
      return 'Date cannot be in the future';
    }
    return null;
  },

  pastDate: (value) => {
    if (value && new Date(value) < new Date()) {
      return 'Date cannot be in the past';
    }
    return null;
  },

  url: (value) => {
    try {
      if (value) new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },

  pattern: (regex, message) => (value) => {
    if (value && !regex.test(value)) {
      return message || 'Invalid format';
    }
    return null;
  }
};

export const createValidator = (rules) => {
  return (value) => {
    for (const rule of rules) {
      const error = rule(value);
      if (error) return error;
    }
    return null;
  };
};

export const validateForm = (formData, validationSchema) => {
  const errors = {};
  
  for (const field in validationSchema) {
    const validator = validationSchema[field];
    const value = formData[field];
    const error = validator(value);
    
    if (error) {
      errors[field] = error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Predefined validation schemas
export const ValidationSchemas = {
  account: {
    name: createValidator([
      ValidationRules.required,
      ValidationRules.minLength(2),
      ValidationRules.maxLength(100)
    ]),
    type: createValidator([ValidationRules.required]),
    balance: createValidator([
      ValidationRules.numeric
    ])
  },

  transaction: {
    description: createValidator([
      ValidationRules.required,
      ValidationRules.minLength(3),
      ValidationRules.maxLength(500)
    ]),
    amount: createValidator([
      ValidationRules.required,
      ValidationRules.numeric,
      ValidationRules.positive
    ]),
    type: createValidator([ValidationRules.required]),
    date: createValidator([
      ValidationRules.required,
      ValidationRules.futureDate
    ]),
    categoryId: createValidator([ValidationRules.required])
  },

  creditCard: {
    cardName: createValidator([
      ValidationRules.required,
      ValidationRules.minLength(2),
      ValidationRules.maxLength(100)
    ]),
    cardNumber: createValidator([
      ValidationRules.required,
      ValidationRules.pattern(/^\d{16}$/, 'Card number must be 16 digits')
    ]),
    expiryDate: createValidator([
      ValidationRules.required,
      ValidationRules.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Format: MM/YY')
    ]),
    cvv: createValidator([
      ValidationRules.required,
      ValidationRules.pattern(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
    ]),
    limit: createValidator([
      ValidationRules.required,
      ValidationRules.numeric,
      ValidationRules.positive
    ])
  },

  user: {
    name: createValidator([
      ValidationRules.required,
      ValidationRules.minLength(2),
      ValidationRules.maxLength(100)
    ]),
    email: createValidator([
      ValidationRules.required,
      ValidationRules.email
    ]),
    phone: createValidator([
      ValidationRules.phone
    ]),
    password: createValidator([
      ValidationRules.required,
      ValidationRules.minLength(8),
      ValidationRules.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number')
    ])
  },

  budget: {
    name: createValidator([
      ValidationRules.required,
      ValidationRules.minLength(2),
      ValidationRules.maxLength(100)
    ]),
    amount: createValidator([
      ValidationRules.required,
      ValidationRules.numeric,
      ValidationRules.positive
    ]),
    categoryId: createValidator([ValidationRules.required]),
    period: createValidator([ValidationRules.required])
  }
};
