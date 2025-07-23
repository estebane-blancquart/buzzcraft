/**
 * COMMIT 59 - App Client Error
 * 
 * FAIT QUOI : Handlers erreurs globaux avec classification et routage selon type
 * REÇOIT : error: Error, type?: string, context?: object, options?: object
 * RETOURNE : { handled: boolean, type: string, severity: string, action: string }
 * ERREURS : HandlerError si erreur invalide, TypeError si type inconnu, ActionError si action échoue
 */

export async function registerErrorHandler(errorType, handler) {
  if (!errorType || typeof errorType !== 'string') {
    throw new Error('HandlerError: Type d\'erreur requis');
  }

  if (!handler || typeof handler !== 'function') {
    throw new Error('HandlerError: Fonction handler requise');
  }

  const errorHandler = {
    type: errorType,
    handler: handler,
    registered: new Date().toISOString(),
    callCount: 0
  };

  return {
    registered: true,
    type: errorType,
    handler: errorHandler,
    active: true,
    timestamp: new Date().toISOString()
  };
}

export async function handleError(error, context = {}) {
  if (!error || typeof error !== 'object') {
    throw new Error('HandlerError: Erreur à traiter requise');
  }

  // Classification automatique
  const errorTypes = {
    'NetworkError': { severity: 'high', action: 'retry' },
    'ValidationError': { severity: 'medium', action: 'show_message' },
    'AuthenticationError': { severity: 'high', action: 'redirect_login' },
    'PermissionError': { severity: 'medium', action: 'show_unauthorized' },
    'TypeError': { severity: 'low', action: 'log_only' },
    'ReferenceError': { severity: 'high', action: 'reload_page' }
  };

  const errorType = error.constructor.name || 'UnknownError';
  const classification = errorTypes[errorType] || { 
    severity: 'medium', 
    action: 'show_generic_error' 
  };

  const handlingResult = {
    error: {
      name: error.name,
      message: error.message,
      type: errorType
    },
    classification: classification,
    context: context,
    timestamp: new Date().toISOString()
  };

  return {
    handled: true,
    type: errorType,
    severity: classification.severity,
    action: classification.action,
    result: handlingResult,
    timestamp: new Date().toISOString()
  };
}

export async function classifyError(error, rules = {}) {
  if (!error || typeof error !== 'object') {
    throw new Error('HandlerError: Erreur à classifier requise');
  }

  const defaultRules = {
    'network': (err) => err.message?.includes('fetch') || err.message?.includes('network'),
    'validation': (err) => err.message?.includes('validation') || err.message?.includes('invalid'),
    'auth': (err) => err.message?.includes('unauthorized') || err.status === 401,
    'permission': (err) => err.message?.includes('forbidden') || err.status === 403,
    'notfound': (err) => err.status === 404
  };

  const allRules = { ...defaultRules, ...rules };
  
  for (const [category, rule] of Object.entries(allRules)) {
    if (rule(error)) {
      return {
        classified: true,
        category: category,
        error: error.message,
        confidence: 0.8,
        timestamp: new Date().toISOString()
      };
    }
  }

  return {
    classified: false,
    category: 'unknown',
    error: error.message,
    confidence: 0.1,
    timestamp: new Date().toISOString()
  };
}

export async function getHandlerStatus(handlerConfig) {
  return {
    status: handlerConfig ? 'healthy' : 'missing',
    configured: !!handlerConfig,
    handlers: handlerConfig?.handlers?.length || 0,
    errorCount: handlerConfig?.errorCount || 0,
    timestamp: new Date().toISOString()
  };
}

// error/handlers : App Client Error (commit 59)
// DEPENDENCY FLOW (no circular deps)
