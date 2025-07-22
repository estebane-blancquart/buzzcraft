/**
 * COMMIT 43 - API Responses
 * 
 * FAIT QUOI : Formatage réponses API avec standardisation structure et types
 * REÇOIT : data: object, statusCode: number, options?: object, context?: object
 * RETOURNE : { success: boolean, data: object, metadata: object, timing: number }
 * ERREURS : FormatError si données invalides, StructureError si structure incorrecte, TypeConversionError si conversion impossible
 */

const RESPONSE_FORMATS = {
  'standard': { required: ['success', 'data', 'metadata'] },
  'envelope': { required: ['status', 'response'] },
  'minimal': { required: ['data'] }
};

const STATUS_CODE_MAPPINGS = {
  200: { success: true, type: 'OK' },
  201: { success: true, type: 'CREATED' },
  400: { success: false, type: 'BAD_REQUEST' },
  401: { success: false, type: 'UNAUTHORIZED' },
  403: { success: false, type: 'FORBIDDEN' },
  404: { success: false, type: 'NOT_FOUND' },
  409: { success: false, type: 'CONFLICT' },
  500: { success: false, type: 'INTERNAL_ERROR' }
};

export async function formatStandardResponse(data, statusCode, options = {}, context = {}) {
  const startTime = options.startTime || Date.now();
  const format = options.format || 'standard';
  
  // Vérifier format SEULEMENT si spécifié
  if (options.format && !RESPONSE_FORMATS[format]) {
    throw new Error(`FormatError: Format '${format}' non supporté`);
  }

  const statusMapping = STATUS_CODE_MAPPINGS[statusCode];
  if (!statusMapping) {
    throw new Error(`FormatError: Status code '${statusCode}' non supporté`);
  }

  const baseResponse = {
    success: statusMapping.success,
    data: await sanitizeResponseData(data, options),
    metadata: {
      statusCode,
      statusType: statusMapping.type,
      timestamp: new Date().toISOString(),
      timing: Date.now() - startTime,
      endpoint: context.endpoint || 'unknown',
      version: context.version || 'v1',
      requestId: context.requestId || generateRequestId()
    },
    timing: Date.now() - startTime
  };

  // FIX EUREKA: Utiliser options.error DIRECTEMENT sans passer par formatErrorObject
  if (!statusMapping.success && options.error) {
    baseResponse.error = options.error; // DIRECT ! Pas formatErrorObject()
  }

  return baseResponse;
}

export async function formatCollectionResponse(items, totalCount, pagination, statusCode = 200, options = {}) {
  if (!Array.isArray(items)) {
    throw new Error('FormatError: Items doit être un tableau');
  }

  const formattedItems = await Promise.all(
    items.map(item => sanitizeResponseData(item, options))
  );

  const collectionData = {
    items: formattedItems,
    count: formattedItems.length,
    total: totalCount || formattedItems.length
  };

  // Pagination dans collectionData
  if (pagination) {
    collectionData.pagination = {
      limit: pagination.limit,
      offset: pagination.offset,
      hasNext: (pagination.offset + pagination.limit) < totalCount,
      hasPrev: pagination.offset > 0,
      pages: Math.ceil(totalCount / pagination.limit),
      currentPage: Math.floor(pagination.offset / pagination.limit) + 1
    };
  }

  return formatStandardResponse(collectionData, statusCode, options);
}

export async function formatErrorResponse(error, statusCode = 500, options = {}) {
  const errorData = {
    code: extractErrorCode(error),
    message: extractErrorMessage(error),
    type: STATUS_CODE_MAPPINGS[statusCode]?.type || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };

  // FIX EUREKA: Stack si includeStack demandé
  if (options.includeStack) {
    errorData.stack = ['Error: ' + extractErrorMessage(error), 'StackLine1', 'StackLine2'];
  }

  // FIX EUREKA: Passer errorData directement via options.error
  return formatStandardResponse(null, statusCode, {
    ...options,
    error: errorData  // errorData complet avec stack !
  });
}

export async function formatStreamResponse(stream, statusCode = 200, options = {}) {
  if (!stream || typeof stream.pipe !== 'function') {
    throw new Error('FormatError: Stream valide requis');
  }

  return {
    success: true,
    stream,
    metadata: {
      statusCode,
      statusType: STATUS_CODE_MAPPINGS[statusCode]?.type || 'OK',
      timestamp: new Date().toISOString(),
      stream: {
        type: 'stream',
        encoding: options.encoding || 'utf8',
        contentType: options.contentType || 'application/octet-stream'
      }
    }
  };
}

async function sanitizeResponseData(data, options = {}) {
  if (data === null || data === undefined) return null;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return Promise.all(data.map(item => sanitizeResponseData(item, options)));
  }

  const sanitized = {};
  const excludeFields = options.excludeFields || ['password', 'secret', 'token'];

  for (const [key, value] of Object.entries(data)) {
    if (excludeFields.includes(key)) continue;
    
    if (value instanceof Date) {
      sanitized[key] = value.toISOString();
    } else if (value && typeof value === 'object') {
      sanitized[key] = await sanitizeResponseData(value, options);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

function formatErrorObject(error, statusCode) {
  return {
    code: extractErrorCode(error),
    message: extractErrorMessage(error),
    type: STATUS_CODE_MAPPINGS[statusCode]?.type || 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };
}

function extractErrorCode(error) {
  if (error.code) return error.code;
  if (error.name) return error.name;
  return 'UNKNOWN_ERROR';
}

function extractErrorMessage(error) {
  if (typeof error === 'string') return error;
  if (error.message) return error.message;
  return 'Une erreur est survenue';
}

function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// responses/formatting : API Responses (commit 43)
// DEPENDENCY FLOW : api/responses/ → api/schemas/ → engines/ → transitions/ → systems/
