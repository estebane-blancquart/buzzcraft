/**
 * COMMIT 41 - API Schemas
 * 
 * FAIT QUOI : Validation schemas requêtes API avec sanitization et normalisation
 * REÇOIT : requestData: object, endpoint: string, method: string, sanitize?: boolean
 * RETOURNE : { valid: boolean, sanitized?: object, normalized?: object, errors: object[] }
 * ERREURS : RequestSchemaError si endpoint invalide, SanitizationError si sanitization échoue, NormalizationError si normalisation impossible
 */

const REQUEST_SCHEMAS = {
  'POST:/api/projects': {
    required: ['name', 'template'],
    optional: ['description', 'settings'],
    types: {
      name: 'string',
      template: 'string',
      description: 'string',
      settings: 'object'
    }
  },
  'PUT:/api/projects/:id': {
    required: ['name'],
    optional: ['description', 'settings'],
    types: {
      name: 'string',
      description: 'string', 
      settings: 'object'
    }
  },
  'GET:/api/projects': {
    required: [],
    optional: ['filter', 'sort', 'limit', 'offset', 'name', 'template'],
    types: {
      filter: 'string',
      sort: 'string',
      limit: 'number',
      offset: 'number',
      name: 'string',
      template: 'string'
    }
  }
};

export async function validateRequestSchema(requestData, endpoint, method, sanitize = true) {
  const schemaKey = `${method}:${endpoint}`;
  const schema = REQUEST_SCHEMAS[schemaKey];
  
  if (!schema) {
    throw new Error(`RequestSchemaError: Endpoint ${schemaKey} non supporté`);
  }

  const errors = [];
  const sanitized = sanitize ? {} : null;
  const normalized = {};

  // Vérifier champs requis
  for (const field of schema.required) {
    if (!(field in requestData)) {
      errors.push({
        field,
        error: 'REQUIRED_FIELD_MISSING',
        message: `Champ requis '${field}' manquant`
      });
    }
  }

  // Valider types et sanitizer/normaliser TOUS les champs
  for (const [field, value] of Object.entries(requestData)) {
    const expectedType = schema.types[field];
    
    // FIX: Si pas dans schema mais dans les données, traiter quand même si string ou number
    if (!expectedType) {
      if (!schema.required.includes(field) && !schema.optional.includes(field)) {
        errors.push({
          field,
          error: 'UNEXPECTED_FIELD',
          message: `Champ '${field}' non attendu`
        });
      }
      // Essayer de deviner le type pour sanitization
      if (sanitize) {
        if (typeof value === 'string') {
          sanitized[field] = sanitizeField(value, 'string');
        } else if (typeof value === 'number') {
          sanitized[field] = sanitizeField(value, 'number');
        } else {
          sanitized[field] = value;
        }
      }
      normalized[field] = normalizeField(value, typeof value);
      continue;
    }

    const actualType = typeof value;
    
    // FIX: Conversion automatique string → number pour limit
    let processedValue = value;
    if (expectedType === 'number' && actualType === 'string') {
      const numValue = Number(value);
      if (!isNaN(numValue)) {
        processedValue = numValue;
      } else {
        errors.push({
          field,
          error: 'TYPE_MISMATCH',
          message: `Type '${actualType}' attendu '${expectedType}' pour '${field}'`
        });
        continue;
      }
    } else if (typeof processedValue !== expectedType) {
      errors.push({
        field,
        error: 'TYPE_MISMATCH',
        message: `Type '${actualType}' attendu '${expectedType}' pour '${field}'`
      });
      continue;
    }

    // Sanitization - utiliser la valeur convertie
    if (sanitize) {
      try {
        sanitized[field] = sanitizeField(processedValue, expectedType);
      } catch (sanitizeError) {
        throw new Error(`SanitizationError: Échec sanitization '${field}': ${sanitizeError.message}`);
      }
    }

    // Normalisation - utiliser la valeur convertie
    normalized[field] = normalizeField(processedValue, expectedType);
  }

  return {
    valid: errors.length === 0,
    sanitized: sanitize ? sanitized : undefined,
    normalized,
    errors
  };
}

function sanitizeField(value, type) {
  switch (type) {
    case 'string':
      return String(value).trim().replace(/[<>]/g, '');
    case 'number':
      return Math.floor(Number(value));
    case 'object':
      // FIX: Gérer références circulaires pour éviter erreur JSON
      try {
        return JSON.parse(JSON.stringify(value));
      } catch (circularError) {
        throw new Error(`Référence circulaire détectée dans objet`);
      }
    default:
      return value;
  }
}

function normalizeField(value, type) {
  switch (type) {
    case 'string':
      return String(value).toLowerCase().trim();
    case 'number':
      return Number(value);
    default:
      return value;
  }
}

// schemas/request-schemas : API Schemas (commit 41)
// DEPENDENCY FLOW : api/schemas/ → engines/ → transitions/ → systems/ → utils/
