import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

export const validateLogin = [
  body('username')
    .notEmpty()
    .withMessage('Username is required'),
  body('emojiPattern')
    .notEmpty()
    .withMessage('Security signature is required'),
  handleValidationErrors
];

export const validateRegister = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-50 characters long and contain only letters, numbers, and underscores'),
  body('emojiPattern')
    .notEmpty()
    .withMessage('Security signature is required'),
  handleValidationErrors
];

export const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Message must be between 1 and 500 characters'),
  handleValidationErrors
];
