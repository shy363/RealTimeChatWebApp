"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const messageController_1 = require("../controllers/messageController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/', auth_1.authenticateToken, messageController_1.getMessages);
router.post('/send', auth_1.authenticateToken, messageController_1.sendMessageAPI);
exports.default = router;
//# sourceMappingURL=messages.js.map