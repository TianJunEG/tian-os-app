import { validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 * Returns 400 if there are validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }

  next();
};

/**
 * Common validation chains
 */
export const commonValidations = {
  email: (fieldName = 'email') => {
    return {
      in: 'body',
      isEmail: {
        errorMessage: 'Invalid email address'
      },
      trim: true,
      toLowerCase: true
    };
  },

  password: (fieldName = 'password', minLength = 6) => {
    return {
      in: 'body',
      isLength: {
        options: { min: minLength },
        errorMessage: `Password must be at least ${minLength} characters`
      },
      errorMessage: 'Password is required'
    };
  },

  phoneNumber: (fieldName = 'phone') => {
    return {
      in: 'body',
      isMobilePhone: {
        locale: 'en-US',
        errorMessage: 'Invalid phone number'
      },
      optional: true
    };
  },

  url: (fieldName = 'url') => {
    return {
      in: 'body',
      isURL: {
        errorMessage: 'Invalid URL'
      },
      optional: true
    };
  },

  positiveNumber: (fieldName = 'amount', min = 0.01) => {
    return {
      in: 'body',
      isFloat: {
        options: { min },
        errorMessage: `Must be a number greater than ${min}`
      }
    };
  },

  mongoId: (fieldName = 'id') => {
    return {
      in: 'params',
      isMongoId: {
        errorMessage: 'Invalid ID format'
      }
    };
  },

  stringLength: (fieldName, minLength = 1, maxLength = 500) => {
    return {
      in: 'body',
      trim: true,
      isLength: {
        options: { min: minLength, max: maxLength },
        errorMessage: `Must be between ${minLength} and ${maxLength} characters`
      }
    };
  }
};

/**
 * Input sanitizer middleware
 * Removes potential malicious content
 */
export const sanitizeInputs = (req, res, next) => {
  // Recursively sanitize object values
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove leading/trailing whitespace
      let sanitized = obj.trim();
      // Remove potential script tags
      sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
      // Remove onclick and other event handlers
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
      return sanitized;
    }
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitize(item));
      }
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  // In Express 5 `req.query` is a read-only getter — assigning to it throws.
  // Replace the value via defineProperty so downstream handlers see the
  // sanitized object. (Works on Express 4 as well.)
  Object.defineProperty(req, 'query', {
    value: sanitize(req.query),
    writable: true,
    configurable: true,
    enumerable: true,
  });
  req.params = sanitize(req.params);

  next();
};
