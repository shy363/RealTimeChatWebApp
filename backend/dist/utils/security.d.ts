/**
 * UNIQUE SECURITY LAYER: "Double-Blind Request Signatures"
 * Not a regular JWT-only approach.
 * Every sensitive request requires a 'X-Sec-Auth' header containing:
 * HMAC_SHA256(timestamp + token, fingerprint)
 */
export declare const generateSecuritySignature: (timestamp: string, token: string, fingerprint: string) => string;
export declare const verifySecuritySignature: (signature: string, timestamp: string, token: string, fingerprint: string) => boolean;
/**
 * CUSTOM DYNAMIC CIPHER
 * A non-standard encryption layer for message contents.
 * Uses a combination of bitwise XOR and Caesar rotation with a dynamic salt.
 */
export declare const customEncrypt: (text: string, key: string) => string;
export declare const customDecrypt: (encrypted: string, key: string) => string;
//# sourceMappingURL=security.d.ts.map