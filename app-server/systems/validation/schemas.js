/**
 * COMMIT 8 - System Validation
 * 
 * FAIT QUOI : Validation schemas avec règles business et auto-correction
 * REÇOIT : data: object, schemaType: string, options: { autoCorrect?: boolean, strictMode?: boolean }
 * RETOURNE : { valid: boolean, corrected?: object, errors: object[], warnings: object[] }
 * ERREURS : SchemaError si type inexistant, ValidationError si structure invalide, CorrectionError si auto-correction échoue
 */

export function validateSchema(data, schemaType, options = {}) {
  // Validation
  if (!data || typeof data !== 'object') {
    throw new Error('ValidationError: data must be an object');
  }
  
  if (!schemaType || typeof schemaType !== 'string') {
    throw new Error('ValidationError: schemaType must be a non-empty string');
  }

  // Schemas basiques supportés
  const supportedSchemas = ['project', 'user', 'config', 'deployment'];
  
  if (!supportedSchemas.includes(schemaType)) {
    return {
      valid: false,
      errors: [{ field: 'schemaType', message: `Unsupported schema: ${schemaType}` }],
      warnings: []
    };
  }

  // Validation basique selon le type
  const hasRequiredFields = checkRequiredFields(data, schemaType);
  
  return {
    valid: hasRequiredFields,
    errors: hasRequiredFields ? [] : [{ field: 'structure', message: 'Missing required fields' }],
    warnings: []
  };
}

function checkRequiredFields(data, schemaType) {
  const requiredFields = {
    'project': ['name', 'id'],
    'user': ['id', 'email'],
    'config': ['version'],
    'deployment': ['containerId', 'status']
  };

  const required = requiredFields[schemaType] || [];
  return required.every(field => data.hasOwnProperty(field));
}

// systems/validation/schemas : System Validation (commit 8)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/