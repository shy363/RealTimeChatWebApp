/**
 * UNIQUE SECURITY LAYER - Frontend Implementation
 * Using Native SubtleCrypto for high-performance, non-standard handshaking.
 */

export const generateSecurityHeaders = async (token: string, fingerprint: string) => {
  const timestamp = Date.now().toString();
  const data = timestamp + token;
  
  // Custom HMAC using native crypto
  const encoder = new TextEncoder();
  const keyData = encoder.encode(fingerprint);
  const dataToSign = encoder.encode(data);
  
  const hmacKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await window.crypto.subtle.sign(
    'HMAC',
    hmacKey,
    dataToSign
  );
  
  const signature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return {
    'X-SF-Unique-Signature': signature,
    'X-SF-Timestamp': timestamp
  };
};

/**
 * CUSTOM DYNAMIC CIPHER (Match backend)
 */
export const customEncrypt = (text: string, key: string): string => {
  if (!key || !text) return text;
  const salt = key.substring(0, 8);
  const saltSum = Array.from(salt).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  return Array.from(text)
    .map((char, index) => {
      let code = char.charCodeAt(0);
      code = (code ^ (saltSum % 255)) + (index % 5);
      return String.fromCharCode(code);
    })
    .join('');
};

export const customDecrypt = (encrypted: string, key: string): string => {
  if (!key || !encrypted) return encrypted;
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
