/**
 * COMMIT 46 - API Authentication
 * 
 * FAIT QUOI : Gestion tokens JWT avec génération, validation, refresh et révocation
 * REÇOIT : tokenData: object, operation: string, options?: object, context?: object
 * RETOURNE : { token: string, valid: boolean, claims: object, expires: number }
 * ERREURS : TokenError si token invalide, ExpirationError si token expiré, SignatureError si signature incorrecte
 */

const TOKEN_TYPES = {
  'access': {
    algorithm: 'HS256',
    expiresIn: '15m',
    audience: 'buzzcraft-api',
    issuer: 'buzzcraft-server'
  },
  'refresh': {
    algorithm: 'HS256', 
    expiresIn: '7d',
    audience: 'buzzcraft-refresh',
    issuer: 'buzzcraft-server'
  },
  'api_key': {
    algorithm: 'HS256',
    expiresIn: '1y',
    audience: 'buzzcraft-api-key',
    issuer: 'buzzcraft-server'
  }
};

const JWT_SECRET = 'buzzcraft-secret-key-2024';
const REFRESH_SECRET = 'buzzcraft-refresh-secret-2024';

export async function generateToken(tokenData, tokenType = 'access', options = {}, context = {}) {
  if (!tokenData || typeof tokenData !== 'object') {
    throw new Error('TokenError: tokenData doit être un objet non vide');
  }

  // Vérifier que tokenData n'est pas un objet vide
  if (Object.keys(tokenData).length === 0) {
    throw new Error('TokenError: tokenData ne peut pas être un objet vide');
  }

  if (!TOKEN_TYPES[tokenType]) {
    throw new Error('TokenError: Type de token non supporté: ' + tokenType);
  }

  try {
    const config = TOKEN_TYPES[tokenType];
    const now = Math.floor(Date.now() / 1000);
    const expires = now + parseExpiration(options.expiresIn || config.expiresIn);

    const payload = {
      ...tokenData,
      iat: now,
      exp: expires,
      aud: config.audience,
      iss: config.issuer,
      jti: generateTokenId(),
      type: tokenType
    };

    // Simulation génération JWT (en production: jsonwebtoken library)
    const header = btoa(JSON.stringify({ alg: config.algorithm, typ: 'JWT' }));
    const payloadEncoded = btoa(JSON.stringify(payload));
    const signature = await generateSignature(header + '.' + payloadEncoded, getSecretForType(tokenType));
    
    const token = `${header}.${payloadEncoded}.${signature}`;

    // Stocker en cache pour révocation rapide
    if (context.cacheEnabled !== false) {
      await cacheToken(token, payload, expires);
    }

    return {
      token,
      type: tokenType,
      expiresIn: expires - now,
      expiresAt: new Date(expires * 1000).toISOString(),
      claims: payload,
      generated: true,
      timestamp: new Date().toISOString()
    };

  } catch (tokenError) {
    throw new Error(`TokenError: Échec génération token: ${tokenError.message}`);
  }
}

export async function validateToken(token, tokenType = 'access', options = {}, context = {}) {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new Error('TokenError: Token doit être une chaîne non vide');
  }

  if (!TOKEN_TYPES[tokenType]) {
    throw new Error('TokenError: Type de token non supporté: ' + tokenType);
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Format token JWT invalide');
    }

    const [headerEncoded, payloadEncoded, signature] = parts;

    // Vérifier signature
    const expectedSignature = await generateSignature(
      headerEncoded + '.' + payloadEncoded, 
      getSecretForType(tokenType)
    );

    if (signature !== expectedSignature) {
      throw new Error('Signature token invalide');
    }

    // Décoder payload
    const payload = JSON.parse(atob(payloadEncoded));
    const now = Math.floor(Date.now() / 1000);

    // Vérifier expiration
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expiré');
    }

    // Vérifier type
    if (payload.type !== tokenType) {
      throw new Error(`Type token incorrect, attendu: ${tokenType}, reçu: ${payload.type}`);
    }

    // Vérifier révocation en cache
    if (context.checkRevocation !== false) {
      const isRevoked = await isTokenRevoked(token);
      if (isRevoked) {
        throw new Error('Token révoqué');
      }
    }

    return {
      valid: true,
      claims: payload,
      expiresIn: payload.exp - now,
      type: tokenType,
      tokenId: payload.jti,
      userId: payload.sub || payload.userId,
      timestamp: new Date().toISOString()
    };

  } catch (validationError) {
    return {
      valid: false,
      error: validationError.message,
      type: tokenType,
      timestamp: new Date().toISOString()
    };
  }
}

export async function refreshToken(refreshToken, options = {}, context = {}) {
  if (!refreshToken || typeof refreshToken !== 'string' || refreshToken.trim() === '') {
    throw new Error('ExpirationError: Refresh token requis et non vide');
  }

  // Valider refresh token
  const validation = await validateToken(refreshToken, 'refresh', options, context);
  
  if (!validation.valid) {
    throw new Error('ExpirationError: Refresh token invalide ou expiré');
  }

  try {
    // Révoquer ancien access token si fourni
    if (context.oldAccessToken) {
      await revokeToken(context.oldAccessToken);
    }

    // Générer nouveaux tokens
    const tokenData = {
      sub: validation.claims.sub,
      userId: validation.claims.userId,
      email: validation.claims.email,
      roles: validation.claims.roles
    };

    const newAccessToken = await generateToken(tokenData, 'access', options, context);
    
    // Optionnellement générer nouveau refresh token
    let newRefreshToken = null;
    if (options.rotateRefreshToken !== false) {
      await revokeToken(refreshToken);
      newRefreshToken = await generateToken(tokenData, 'refresh', options, context);
    }

    return {
      accessToken: newAccessToken.token,
      refreshToken: newRefreshToken?.token || refreshToken,
      expiresIn: newAccessToken.expiresIn,
      rotated: !!newRefreshToken,
      timestamp: new Date().toISOString()
    };

  } catch (refreshError) {
    throw new Error(`TokenError: Échec refresh: ${refreshError.message}`);
  }
}

export async function revokeToken(token, reason = 'manual', options = {}) {
  if (!token || typeof token !== 'string') {
    throw new Error('TokenError: Token requis pour révocation');
  }

  try {
    // Extraire ID token sans validation complète
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      const tokenId = payload.jti;
      
      // Marquer comme révoqué en cache
      await markTokenRevoked(token, tokenId, reason, options.expiresAt);
    }

    return {
      revoked: true,
      token: token.substring(0, 10) + '...', // Masquer token dans logs
      reason,
      timestamp: new Date().toISOString()
    };

  } catch (revokeError) {
    throw new Error(`TokenError: Échec révocation: ${revokeError.message}`);
  }
}

export async function introspectToken(token, options = {}) {
  try {
    const validation = await validateToken(token, 'access', options);
    
    if (!validation.valid) {
      return {
        active: false,
        error: validation.error
      };
    }

    return {
      active: true,
      client_id: validation.claims.aud,
      username: validation.claims.email,
      scope: validation.claims.roles?.join(' ') || '',
      exp: validation.claims.exp,
      iat: validation.claims.iat,
      sub: validation.claims.sub || validation.claims.userId,
      aud: validation.claims.aud,
      iss: validation.claims.iss,
      jti: validation.claims.jti
    };

  } catch (introspectError) {
    return {
      active: false,
      error: introspectError.message
    };
  }
}

// Fonctions utilitaires
function parseExpiration(expiresIn) {
  if (typeof expiresIn === 'number') return expiresIn;
  
  const units = { 
    's': 1, 'm': 60, 'h': 3600, 'd': 86400, 'w': 604800, 'y': 31536000 
  };
  
  const match = expiresIn.match(/^(\d+)([smhdwy])$/);
  if (!match) throw new Error('Format expiration invalide');
  
  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

function generateTokenId() {
  return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

async function generateSignature(data, secret) {
  // Simulation HMAC-SHA256 (en production: crypto.createHmac)
  const hash = btoa(data + secret).replace(/[+/=]/g, '').substring(0, 32);
  return hash;
}

function getSecretForType(tokenType) {
  return tokenType === 'refresh' ? REFRESH_SECRET : JWT_SECRET;
}

// Cache simplifié pour révocation tokens
const TOKEN_CACHE = new Map();
const REVOKED_TOKENS = new Set();

async function cacheToken(token, payload, expires) {
  TOKEN_CACHE.set(payload.jti, {
    token: token.substring(0, 10) + '...', // Masquer token
    expires,
    type: payload.type,
    userId: payload.sub
  });
  
  // Auto-cleanup après expiration
  setTimeout(() => {
    TOKEN_CACHE.delete(payload.jti);
  }, (expires - Math.floor(Date.now() / 1000)) * 1000);
}

async function isTokenRevoked(token) {
  return REVOKED_TOKENS.has(token);
}

async function markTokenRevoked(token, tokenId, reason, expiresAt) {
  REVOKED_TOKENS.add(token);
  
  // Auto-cleanup après expiration
  if (expiresAt) {
    const expiresMs = new Date(expiresAt).getTime() - Date.now();
    if (expiresMs > 0) {
      setTimeout(() => {
        REVOKED_TOKENS.delete(token);
      }, expiresMs);
    }
  }
}

// authentication/tokens : API Authentication (commit 46)
// DEPENDENCY FLOW : api/authentication/ → api/schemas/ → engines/ → transitions/ → systems/
