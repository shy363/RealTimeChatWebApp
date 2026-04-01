"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.customDecrypt = exports.customEncrypt = exports.verifySecuritySignature = exports.generateSecuritySignature = void 0;
const crypto_1 = __importDefault(require("crypto"));
/**
 * UNIQUE SECURITY LAYER: "Double-Blind Request Signatures"
 * Not a regular JWT-only approach.
 * Every sensitive request requires a 'X-Sec-Auth' header containing:
 * HMAC_SHA256(timestamp + token, fingerprint)
 */
const generateSecuritySignature = (timestamp, token, fingerprint) => {
    return crypto_1.default
        .createHmac('sha256', fingerprint)
        .update(timestamp + token)
        .digest('hex');
};
exports.generateSecuritySignature = generateSecuritySignature;
const verifySecuritySignature = (signature, timestamp, token, fingerprint) => {
    // 1. Time-decay check: signatures expire after 30 seconds to prevent replay
    const now = Date.now();
    const sigTime = parseInt(timestamp);
    if (isNaN(sigTime) || Math.abs(now - sigTime) > 30000) {
        return false;
    }
    // 2. Signature verification
    const expectedSignature = (0, exports.generateSecuritySignature)(timestamp, token, fingerprint);
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};
exports.verifySecuritySignature = verifySecuritySignature;
/**
 * CUSTOM DYNAMIC CIPHER
 * A non-standard encryption layer for message contents.
 * Uses a combination of bitwise XOR and Caesar rotation with a dynamic salt.
 */
const customEncrypt = (text, key) => {
    const salt = key.substring(0, 8);
    const saltSum = Array.from(salt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from(text)
        .map((char, index) => {
        let code = char.charCodeAt(0);
        // Custom polymorphic shift
        code = (code ^ (saltSum % 255)) + (index % 5);
        return String.fromCharCode(code);
    })
        .join('');
};
exports.customEncrypt = customEncrypt;
const customDecrypt = (encrypted, key) => {
    const salt = key.substring(0, 8);
    const saltSum = Array.from(salt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return Array.from(encrypted)
        .map((char, index) => {
        let code = char.charCodeAt(0);
        code = (code - (index % 5)) ^ (saltSum % 255);
        return String.fromCharCode(code);
    })
        .join('');
};
exports.customDecrypt = customDecrypt;
//# sourceMappingURL=security.js.map