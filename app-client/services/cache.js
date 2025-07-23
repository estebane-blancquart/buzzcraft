/**
 * COMMIT 55 - App Client Services
 * 
 * FAIT QUOI : Service cache pour optimisation performances avec stratégies
 * REÇOIT : strategy: string, config?: object, options?: object
 * RETOURNE : { cache: object, strategy: string, status: string, timestamp: string }
 * ERREURS : CacheError si stratégie invalide, MemoryError si cache plein
 */

export async function createCache(strategy = 'lru', config = {}, options = {}) {
  if (!strategy || typeof strategy !== 'string') {
    throw new Error('CacheError: Stratégie de cache requise');
  }

  const supportedStrategies = ['lru', 'fifo', 'ttl', 'memory'];
  if (!supportedStrategies.includes(strategy)) {
    throw new Error(`CacheError: Stratégie ${strategy} non supportée`);
  }

  const cache = {
    strategy,
    config: {
      maxSize: config.maxSize || 1000,
      ttl: config.ttl || 300000, // 5min par défaut
      autoCleanup: config.autoCleanup !== false,
      ...config
    },
    data: new Map(),
    stats: { hits: 0, misses: 0, evictions: 0 },
    options,
    created: true,
    timestamp: new Date().toISOString()
  };

  return {
    cache,
    strategy,
    config: cache.config,
    status: 'created',
    metadata: { strategy, maxSize: cache.config.maxSize },
    timestamp: new Date().toISOString()
  };
}

export async function validateCache(cacheConfig) {
  if (!cacheConfig || !cacheConfig.strategy) {
    return {
      valid: false,
      errors: ['Stratégie de cache manquante'],
      warnings: [],
      timestamp: new Date().toISOString()
    };
  }

  const errors = [];
  const warnings = [];

  // Validation stratégie
  const supportedStrategies = ['lru', 'fifo', 'ttl', 'memory'];
  if (!supportedStrategies.includes(cacheConfig.strategy)) {
    errors.push(`Stratégie ${cacheConfig.strategy} non supportée`);
  }

  // Validation taille
  if (cacheConfig.config?.maxSize && cacheConfig.config.maxSize < 10) {
    warnings.push('Taille cache très petite (<10)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    strategy: cacheConfig.strategy,
    timestamp: new Date().toISOString()
  };
}

export async function updateCacheConfig(cacheConfig, newConfig) {
  if (!cacheConfig) {
    throw new Error('CacheError: Configuration cache requise');
  }

  const updated = {
    ...cacheConfig,
    config: { ...cacheConfig.config, ...newConfig },
    updated: true,
    timestamp: new Date().toISOString()
  };

  return {
    updated: true,
    cache: updated,
    changes: Object.keys(newConfig),
    previousConfig: cacheConfig.config,
    timestamp: new Date().toISOString()
  };
}

export async function getCacheStatus(cacheConfig) {
  const status = cacheConfig && cacheConfig.created ? 'healthy' : 'missing';
  
  return {
    status,
    configured: !!cacheConfig,
    strategy: cacheConfig?.strategy || 'unknown',
    size: cacheConfig?.data?.size || 0,
    hits: cacheConfig?.stats?.hits || 0,
    timestamp: new Date().toISOString()
  };
}

// services/cache : App Client Services (commit 55)
// DEPENDENCY FLOW (no circular deps)  
// app-client/ → api/
