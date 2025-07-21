/**
 * COMMIT 9 - System Cache
 * 
 * FAIT QUOI : Gestion invalidation cache avec patterns et expiration intelligente
 * REÇOIT : invalidationType: string, pattern: string, options: { recursive?: boolean, dryRun?: boolean }
 * RETOURNE : { valid: boolean, invalidated: string[], remaining: string[], errors: string[] }
 * ERREURS : InvalidationError si pattern invalide, PatternError si regex incorrecte, CacheError si cache inaccessible
 */

export function validateCacheKey(cacheKey, options = {}) {
  // Validation
  if (!cacheKey || typeof cacheKey !== 'string') {
    throw new Error('ValidationError: cacheKey must be a non-empty string');
  }
  
  if (typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  const maxLength = options.maxLength || 250;
  const allowedPattern = options.pattern || /^[a-zA-Z0-9:_-]+$/;

  // Validation clé cache
  try {
    const validations = {
      length: cacheKey.length <= maxLength,
      pattern: allowedPattern.test(cacheKey),
      notEmpty: cacheKey.trim().length > 0,
      noSpaces: !cacheKey.includes(' ')
    };

    const isValid = Object.values(validations).every(v => v);
    const errors = [];

    if (!validations.length) errors.push('Key too long');
    if (!validations.pattern) errors.push('Invalid characters');
    if (!validations.notEmpty) errors.push('Key cannot be empty');
    if (!validations.noSpaces) errors.push('Key cannot contain spaces');

    return {
      key: cacheKey,
      valid: isValid,
      validations,
      errors,
      normalized: cacheKey.toLowerCase().replace(/[^a-z0-9:_-]/g, '-')
    };
  } catch {
    return {
      key: cacheKey,
      valid: false,
      validations: {},
      errors: ['Validation failed'],
      normalized: ''
    };
  }
}

// systems/cache/invalidation : System Cache (commit 9)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/