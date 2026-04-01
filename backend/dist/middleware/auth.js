"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jwt_1 = require("../utils/jwt");
const database_1 = __importDefault(require("../utils/database"));
const security_1 = require("../utils/security");
const authenticateToken = async (req, res, next) => {
    const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
    const signature = req.headers['x-sf-unique-signature'];
    const timestamp = req.headers['x-sf-timestamp'];
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        // CUSTOM SECURITY: Verify session fingerprint binding
        const [sessions] = await database_1.default.execute('SELECT fingerprint FROM user_sessions WHERE userId = ? AND token = ? LIMIT 1', [decoded.userId, token]);
        if (sessions.length === 0) {
            return res.status(403).json({ message: 'Session expired or invalid fingerprint' });
        }
        const { fingerprint } = sessions[0];
        // UNIQUE SEC LAYER: Enhanced Cryptographic Handshake (Not a regular one)
        if (!signature || !timestamp || !(0, security_1.verifySecuritySignature)(signature, timestamp, token, fingerprint)) {
            return res.status(401).json({
                message: 'SECURITY VIOLATION: Handshake failed. Request signature mismatch.'
            });
        }
        req.user = {
            userId: decoded.userId,
            username: decoded.username,
            email: decoded.email
        };
        req.fingerprint = fingerprint;
        next();
    }
    catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticateToken = authenticateToken;
//# sourceMappingURL=auth.js.map