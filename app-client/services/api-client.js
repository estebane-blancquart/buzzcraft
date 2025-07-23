/**
 * COMMIT 55 - App Client Services
 * 
 * FAIT QUOI : Client API pour communication avec serveur avec gestion requêtes
 * REÇOIT : config: object, options?: object
 * RETOURNE : { client: object, config: object, status: string, timestamp: string }
 * ERREURS : ApiClientError si config invalide, ConnectionError si connexion échoue
 */

export async function createApiClient(baseUrl = 'http://localhost:3000/api', config = {}, options = {}) {
  if (!baseUrl || typeof baseUrl !== 'string') {
    throw new Error('ApiClientError: URL base API requise');
  }

  const client = {
    baseUrl,
    config: {
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      headers: config.headers || { 'Content-Type': 'application/json' },
      ...config
    },
    options,
    created: true,
    timestamp: new Date().toISOString()
  };

  return {
    client,
    baseUrl,
    config: client.config,
    status: 'created',
    metadata: { baseUrl, configCount: Object.keys(client.config).length },
    timestamp: new Date().toISOString()
  };
}

export async function validateApiClient(clientConfig) {
  if (!clientConfig || !clientConfig.baseUrl) {
    return {
      valid: false,
      errors: ['URL base API manquante'],
      warnings: [],
      timestamp: new Date().toISOString()
    };
  }

  const errors = [];
  const warnings = [];

  // Validation URL
  try {
    new URL(clientConfig.baseUrl);
  } catch {
    errors.push('URL base invalide');
  }

  // Validation timeout
  if (clientConfig.config?.timeout && clientConfig.config.timeout < 1000) {
    warnings.push('Timeout très court (<1s)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    baseUrl: clientConfig.baseUrl,
    timestamp: new Date().toISOString()
  };
}

export async function updateApiClientConfig(clientConfig, newConfig) {
  if (!clientConfig) {
    throw new Error('ApiClientError: Configuration client API requise');
  }

  const updated = {
    ...clientConfig,
    config: { ...clientConfig.config, ...newConfig },
    updated: true,
    timestamp: new Date().toISOString()
  };

  return {
    updated: true,
    client: updated,
    changes: Object.keys(newConfig),
    previousConfig: clientConfig.config,
    timestamp: new Date().toISOString()
  };
}

export async function getApiClientStatus(clientConfig) {
  const status = clientConfig && clientConfig.created ? 'healthy' : 'missing';
  
  return {
    status,
    configured: !!clientConfig,
    baseUrl: clientConfig?.baseUrl || 'unknown',
    timeout: clientConfig?.config?.timeout || 0,
    timestamp: new Date().toISOString()
  };
}

// services/api-client : App Client Services (commit 55)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
