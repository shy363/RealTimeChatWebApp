import crypto from 'crypto';

/**
 * UNIQUE SECURITY LAYER: "Double-Blind Request Signatures"
 * Not a regular JWT-only approach. 
 * Every sensitive request requires a 'X-Sec-Auth' header containing:
 * HMAC_SHA256(timestamp + token, fingerprint)
 */

export const generateSecuritySignature = (timestamp: string, token: string, fingerprint: string): string => {
  return crypto
    .createHmac('sha256', fingerprint)
    .update(timestamp + token)
    .digest('hex');
};

export const verifySecuritySignature = (
  signature: string, 
  timestamp: string, 
  token: string, 
  fingerprint: string
): boolean => {
  // 1. Time-decay check: signatures expire after 30 seconds to prevent replay
  const now = Date.now();
  const sigTime = parseInt(timestamp);
  if (isNaN(sigTime) || Math.abs(now - sigTime) > 30000) {
    return false;
  }

  // 2. Signature verification
  const expectedSignature = generateSecuritySignature(timestamp, token, fingerprint);
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
};

/**
 * CUSTOM DYNAMIC CIPHER
 * A non-standard encryption layer for message contents.
 * Uses a combination of bitwise XOR and Caesar rotation with a dynamic salt.
 */
export const customEncrypt = (text: string, key: string): string => {
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

export const customDecrypt = (encrypted: string, key: string): string => {
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
