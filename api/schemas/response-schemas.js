/**
 * COMMIT 41 - API Schemas
 * 
 * FAIT QUOI : Validation schemas réponses API avec auto-correction et versioning
 * REÇOIT : responseData: object, schemaType: string, version?: string, autoCorrect?: boolean
 * RETOURNE : { valid: boolean, corrected?: object, errors: object[], warnings: object[] }
 * ERREURS : SchemaError si type inexistant, ValidationError si structure invalide, CorrectionError si auto-correction échoue
 */

const RESPONSE_SCHEMAS = {
  'project': {
    v1: {
      required: ['id', 'name', 'status', 'createdAt'],
      optional: ['description', 'settings', 'updatedAt'],
      types: {
        id: 'string',
        name: 'string', 
        status: 'string',
        createdAt: 'string',
        description: 'string',
        settings: 'object',
        updatedAt: 'string'
      }
    },
    v2: {
      required: ['id', 'name', 'state', 'metadata'],
      optional: ['description', 'config'],
      types: {
        id: 'string',
        name: 'string',
        state: 'string', 
        metadata: 'object',
        description: 'string',
        config: 'object'
      }
    }
  },
  'error': {
    v1: {
      required: ['code', 'message', 'timestamp'],
      optional: ['details', 'stack'],
      types: {
        code: 'string',
        message: 'string',
        timestamp: 'string',
        details: 'object',
        stack: 'string'
      }
    }
  }
};

export async function validateResponseSchema(responseData, schemaType, version = 'v1', autoCorrect = false) {
  if (!RESPONSE_SCHEMAS[schemaType]) {
    throw new Error(`SchemaError: Type de schema '${schemaType}' inexistant`);
  }

  const schema = RESPONSE_SCHEMAS[schemaType][version];
  if (!schema) {
    throw new Error(`SchemaError: Version '${version}' inexistante pour schema '${schemaType}'`);
  }

  const errors = [];
  const warnings = [];
  let corrected = autoCorrect ? {} : undefined;

  // Vérifier champs requis
  for (const field of schema.required) {
    if (!(field in responseData)) {
      errors.push({
        field,
        error: 'REQUIRED_FIELD_MISSING',
        message: `Champ requis '${field}' manquant dans réponse`
      });

      // Auto-correction
      if (autoCorrect) {
        corrected[field] = getDefaultValue(schema.types[field]);
        warnings.push({
          field,
          warning: 'FIELD_AUTO_CORRECTED',
          message: `Champ '${field}' auto-corrigé avec valeur par défaut`
        });
      }
    }
  }

  // Valider types existants
  for (const [field, value] of Object.entries(responseData)) {
    const expectedType = schema.types[field];
    
    if (!expectedType) {
      warnings.push({
        field,
        warning: 'UNEXPECTED_FIELD',
        message: `Champ '${field}' non défini dans schema`
      });
      if (autoCorrect) corrected[field] = value;
      continue;
    }

    const actualType = typeof value;
    if (actualType !== expectedType) {
      errors.push({
        field,
        error: 'TYPE_MISMATCH', 
        message: `Type '${actualType}' attendu '${expectedType}' pour '${field}'`
      });

      // Tentative auto-correction
      if (autoCorrect) {
        try {
          corrected[field] = convertType(value, expectedType);
          warnings.push({
            field,
            warning: 'TYPE_AUTO_CORRECTED',
            message: `Type '${field}' auto-corrigé vers '${expectedType}'`
          });
        } catch (conversionError) {
          // FIX: Throw CorrectionError seulement pour objets complexes
          if (typeof value === 'object' && value !== null && expectedType === 'string') {
            throw new Error(`CorrectionError: Impossible de corriger '${field}': objet complexe vers string`);
          }
          // Sinon conversion normale avec String()
          corrected[field] = String(value);
          warnings.push({
            field,
            warning: 'TYPE_AUTO_CORRECTED',
            message: `Type '${field}' auto-corrigé vers '${expectedType}'`
          });
        }
      }
    } else {
      if (autoCorrect) corrected[field] = value;
    }
  }

  if (errors.length > 0 && !autoCorrect) {
    throw new Error(`ValidationError: ${errors.length} erreurs de validation dans réponse`);
  }

  return {
    valid: errors.length === 0,
    corrected,
    errors,
    warnings
  };
}

function getDefaultValue(type) {
  switch (type) {
    case 'string': return '';
    case 'number': return 0;
    case 'boolean': return false;
    case 'object': return {};
    case 'array': return [];
    default: return null;
  }
}

function convertType(value, targetType) {
  switch (targetType) {
    case 'string':
      // FIX: Détecter objets complexes pour throw CorrectionError
      if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        throw new Error(`Cannot convert complex object to string`);
      }
      return String(value);
    case 'number':
      const num = Number(value);
      if (isNaN(num)) throw new Error(`Cannot convert '${value}' to number`);
      return num;
    case 'boolean':
      return Boolean(value);
    default:
      throw new Error(`Cannot convert to type '${targetType}'`);
  }
}

// schemas/response-schemas : API Schemas (commit 41)
// DEPENDENCY FLOW : api/schemas/ → engines/ → transitions/ → systems/ → utils/
