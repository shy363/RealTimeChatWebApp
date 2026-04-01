"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMessage = exports.validateRegister = exports.validateLogin = exports.handleValidationErrors = void 0;
const express_validator_1 = require("express-validator");
const handleValidationErrors = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};
exports.handleValidationErrors = handleValidationErrors;
exports.validateLogin = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    exports.handleValidationErrors
];
exports.validateRegister = [
    (0, express_validator_1.body)('username')
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username must be 3-50 characters long and contain only letters, numbers, and underscores'),
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must be at least 6 characters long and have 1 uppercase, 1 lowercase, and 1 number'),
    (0, express_validator_1.body)('phoneNumber')
        .optional()
        .isLength({ min: 10, max: 15 })
        .withMessage('Phone number should be between 10 and 15 digits'),
    exports.handleValidationErrors
];
exports.validateMessage = [
    (0, express_validator_1.body)('content')
        .trim()
        .isLength({ min: 1, max: 500 })
        .withMessage('Message must be between 1 and 500 characters'),
    exports.handleValidationErrors
];
//# sourceMappingURL=validation.js.map