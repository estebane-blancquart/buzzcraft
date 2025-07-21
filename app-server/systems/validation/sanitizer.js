/**
 * COMMIT 8 - System Validation
 * 
 * FAIT QUOI : Sanitization données avec nettoyage et normalisation automatique
 * REÇOIT : data: object, sanitizationRules: object, options: { aggressive?: boolean, preserve?: string[] }
 * RETOURNE : { sanitized: object, removed: string[], warnings: string[], safe: boolean }
 * ERREURS : SanitizationError si règles invalides, DataError si données non sanitizables, PreservationError si préservation impossible
 */

export function sanitizeData(data, sanitizationRules = {}, options = {}) {
  // Validation
  if (!data || typeof data !== 'object') {
    throw new Error('ValidationError: data must be an object');
  }
  
  if (typeof sanitizationRules !== 'object') {
    throw new Error('ValidationError: sanitizationRules must be an object');
  }

  const sanitized = { ...data };
  const removed = [];
  const warnings = [];

  // Règles de base
  const defaultRules = {
    removeEmpty: true,
    trimStrings: true,
    removeScripts: true
  };

  const rules = { ...defaultRules, ...sanitizationRules };

  // Application des règles
  for (const [key, value] of Object.entries(sanitized)) {
    if (rules.removeEmpty && (value === '' || value === null || value === undefined)) {
      delete sanitized[key];
      removed.push(key);
      continue; // Important : skip autres règles sur champ supprimé
    }
    
    if (rules.trimStrings && typeof value === 'string') {
      sanitized[key] = value.trim();
    }
    
    if (rules.removeScripts && typeof value === 'string' && value.includes('<script>')) {
      sanitized[key] = value.replace(/<script>.*<\/script>/gi, '');
      warnings.push(`Removed script from ${key}`);
    }
  }

  return {
    sanitized,
    removed,
    warnings,
    safe: warnings.length === 0
  };
}

// systems/validation/sanitizer : System Validation (commit 8)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/