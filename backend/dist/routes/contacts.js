"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const contactController_1 = require("../controllers/contactController");
const router = express_1.default.Router();
router.use(auth_1.authenticateToken); // Protected routes
router.get('/', contactController_1.getContacts);
router.get('/search', contactController_1.searchUsers);
router.post('/add', contactController_1.addContact);
router.post('/invite', contactController_1.inviteByCode);
router.post('/accept', contactController_1.acceptContact);
exports.default = router;
//# sourceMappingURL=contacts.js.map