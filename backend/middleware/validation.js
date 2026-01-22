/**
 * Input Validation Schemas
 * Centralized validation rules using Joi
 */
import Joi from 'joi';

// Authentication Schemas
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'any.required': 'Password is required'
    })
});

export const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  access_level: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional()
    .messages({
      'number.min': 'Access level must be between 1 and 5',
      'number.max': 'Access level must be between 1 and 5'
    })
});

export const changePasswordSchema = Joi.object({
  current_password: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    })
});

export const resetPasswordRequestSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    })
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    })
});

// Admin password reset (no token required, only new password)
export const adminResetPasswordSchema = Joi.object({
  new_password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'New password is required'
    })
});

// User Management Schemas
export const createUserSchema = Joi.object({
  email: Joi.string()
    .email()
    .required(),
  password: Joi.string()
    .min(8)
    .required(),
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  access_level: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .required()
});

export const updateUserSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),
  access_level: Joi.number()
    .integer()
    .min(1)
    .max(5)
    .optional(),
  is_active: Joi.boolean()
    .optional()
});

// Quote Schemas
export const createQuoteSchema = Joi.object({
  calculator_type: Joi.string()
    .valid('btl', 'bridging')
    .required()
    .messages({
      'any.only': 'Calculator type must be either "btl" or "bridging"',
      'any.required': 'Calculator type is required'
    }),
  reference_number: Joi.string()
    .optional(),
  loan_amount: Joi.number()
    .positive()
    .optional(),
  property_value: Joi.number()
    .positive()
    .optional(),
  ltv_ratio: Joi.number()
    .min(0)
    .max(100)
    .optional(),
  term_months: Joi.number()
    .integer()
    .positive()
    .optional(),
  client_name: Joi.string()
    .max(200)
    .optional(),
  client_email: Joi.string()
    .email()
    .optional(),
  client_phone: Joi.string()
    .max(50)
    .optional(),
  broker_company_name: Joi.string()
    .max(200)
    .optional(),
  criteria_answers: Joi.alternatives()
    .try(Joi.object(), Joi.string())
    .optional(),
  results: Joi.array()
    .items(Joi.object())
    .optional(),
  created_by: Joi.string()
    .max(200)
    .optional()
}).unknown(true); // Allow additional fields for flexibility

export const updateQuoteSchema = Joi.object({
  reference_number: Joi.string()
    .optional(),
  loan_amount: Joi.number()
    .positive()
    .optional(),
  property_value: Joi.number()
    .positive()
    .optional(),
  ltv_ratio: Joi.number()
    .min(0)
    .max(100)
    .optional(),
  term_months: Joi.number()
    .integer()
    .positive()
    .optional(),
  client_name: Joi.string()
    .max(200)
    .optional(),
  client_email: Joi.string()
    .email()
    .optional(),
  client_phone: Joi.string()
    .max(50)
    .optional(),
  broker_company_name: Joi.string()
    .max(200)
    .optional(),
  criteria_answers: Joi.alternatives()
    .try(Joi.object(), Joi.string())
    .optional(),
  results: Joi.array()
    .items(Joi.object())
    .optional()
}).unknown(true);

// Validation middleware factory
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: false // Keep unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: errors
        }
      });
    }

    // Replace req.body with validated and sanitized data
    req.body = value;
    next();
  };
};
