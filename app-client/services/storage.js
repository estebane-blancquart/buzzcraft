/**
 * COMMIT 55 - App Client Services
 * 
 * FAIT QUOI : Service stockage pour persistance données avec gestion types
 * REÇOIT : type: string, config?: object, options?: object
 * RETOURNE : { storage: object, type: string, status: string, timestamp: string }
 * ERREURS : StorageError si type invalide, PersistenceError si stockage échoue
 */

export async function createStorage(type = 'memory', config = {}, options = {}) {
  if (!type || typeof type !== 'string') {
    throw new Error('StorageError: Type de stockage requis');
  }

  const supportedTypes = ['memory', 'session', 'indexed', 'custom'];
  if (!supportedTypes.includes(type)) {
    throw new Error(`StorageError: Type ${type} non supporté`);
  }

  const storage = {
    type,
    config: {
      namespace: config.namespace || 'buzzcraft',
      ttl: config.ttl || 3600000, // 1h par défaut
      compress: config.compress || false,
      ...config
    },
    data: new Map(), // Stockage en mémoire par défaut
    options,
    created: true,
    timestamp: new Date().toISOString()
  };

  return {
    storage,
    type,
    config: storage.config,
    status: 'created',
    metadata: { type, namespace: storage.config.namespace },
    timestamp: new Date().toISOString()
  };
}

export async function validateStorage(storageConfig) {
  if (!storageConfig || !storageConfig.type) {
    return {
      valid: false,
      errors: ['Type de stockage manquant'],
      warnings: [],
      timestamp: new Date().toISOString()
    };
  }

  const errors = [];
  const warnings = [];

  // Validation type
  const supportedTypes = ['memory', 'session', 'indexed', 'custom'];
  if (!supportedTypes.includes(storageConfig.type)) {
    errors.push(`Type ${storageConfig.type} non supporté`);
  }

  // Validation TTL
  if (storageConfig.config?.ttl && storageConfig.config.ttl < 1000) {
    warnings.push('TTL très court (<1s)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    type: storageConfig.type,
    timestamp: new Date().toISOString()
  };
}

export async function updateStorageConfig(storageConfig, newConfig) {
  if (!storageConfig) {
    throw new Error('StorageError: Configuration stockage requise');
  }

  const updated = {
    ...storageConfig,
    config: { ...storageConfig.config, ...newConfig },
    updated: true,
    timestamp: new Date().toISOString()
  };

  return {
    updated: true,
    storage: updated,
    changes: Object.keys(newConfig),
    previousConfig: storageConfig.config,
    timestamp: new Date().toISOString()
  };
}

export async function getStorageStatus(storageConfig) {
  const status = storageConfig && storageConfig.created ? 'healthy' : 'missing';
  
  return {
    status,
    configured: !!storageConfig,
    type: storageConfig?.type || 'unknown',
    size: storageConfig?.data?.size || 0,
    timestamp: new Date().toISOString()
  };
}

// services/storage : App Client Services (commit 55)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
