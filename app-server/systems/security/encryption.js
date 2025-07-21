/**
 * COMMIT 13 - System Security
 * 
 * FAIT QUOI : Analyse et vérification des capacités de chiffrement disponibles
 * REÇOIT : encryptionType: string, options: { keySize?: number, testMode?: boolean }
 * RETOURNE : { type: string, supported: boolean, strength: string, algorithms: array, accessible: boolean }
 * ERREURS : ValidationError si encryptionType invalide, CryptoError si chiffrement non supporté
 */

export function checkEncryptionSupport(encryptionType, options = {}) {
  // Validation OBLIGATOIRE (toujours ValidationError)
  if (!encryptionType || typeof encryptionType !== 'string') {
    throw new Error('ValidationError: encryptionType must be a non-empty string');
  }
  
  if (typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  // Validation types supportés
  const supportedTypes = ['aes', 'rsa', 'ecdsa', 'chacha20', 'blowfish'];
  if (!supportedTypes.includes(encryptionType.toLowerCase())) {
    throw new Error('ValidationError: encryptionType must be one of: ' + supportedTypes.join(', '));
  }

  // Logique minimale avec try/catch
  try {
    const keySize = options.keySize || 256;
    const testMode = options.testMode !== false;
    const type = encryptionType.toLowerCase();
    
    // Test encryption simple (simulation capacités crypto)
    const encryptionMap = {
      'aes': { strength: 'high', algorithms: ['AES-256-GCM', 'AES-128-CBC'], minKeySize: 128 },
      'rsa': { strength: 'high', algorithms: ['RSA-2048', 'RSA-4096'], minKeySize: 1024 },
      'ecdsa': { strength: 'high', algorithms: ['ECDSA-P256', 'ECDSA-P384'], minKeySize: 256 },
      'chacha20': { strength: 'high', algorithms: ['ChaCha20-Poly1305'], minKeySize: 256 },
      'blowfish': { strength: 'medium', algorithms: ['Blowfish-128'], minKeySize: 32 }
    };
    
    const config = encryptionMap[type];
    const isSupported = !!config && keySize >= config.minKeySize;
    
    return {
      type: encryptionType,
      supported: isSupported,
      strength: config?.strength || 'unknown',
      algorithms: config?.algorithms || [],
      keySize: {
        requested: keySize,
        minimum: config?.minKeySize || 0,
        valid: keySize >= (config?.minKeySize || 0)
      },
      accessible: true,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      type: encryptionType,
      supported: false,
      strength: 'unknown',
      algorithms: [],
      keySize: {
        requested: 0,
        minimum: 0,
        valid: false
      },
      accessible: false,
      timestamp: new Date().toISOString()
    };
  }
}

// systems/security/encryption : System Security (commit 13)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
