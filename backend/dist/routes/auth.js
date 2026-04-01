"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/login', validation_1.validateLogin, authController_1.login);
router.post('/register', validation_1.validateRegister, authController_1.register);
router.get('/validate', auth_1.authenticateToken, authController_1.validateToken);
router.get('/users', auth_1.authenticateToken, authController_1.getUsers);
exports.default = router;
//# sourceMappingURL=auth.js.map