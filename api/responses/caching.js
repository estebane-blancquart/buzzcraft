/**
 * COMMIT 43 - API Responses
 * 
 * FAIT QUOI : Mise en cache réponses API avec invalidation intelligente et stratégies multiples
 * REÇOIT : key: string, data: object, options?: object, context?: object
 * RETOURNE : { cached: boolean, hit: boolean, data: object, timing: number }
 * ERREURS : CacheError si cache défaillant, KeyError si clé invalide, ExpirationError si TTL invalide
 */

const CACHE_STRATEGIES = {
  'lru': {
    maxSize: 1000,
    algorithm: 'least-recently-used',
    evictionPolicy: 'size-based'
  },
  'lfu': {
    maxSize: 500,
    algorithm: 'least-frequently-used',
    evictionPolicy: 'frequency-based'
  },
  'ttl': {
    maxSize: 2000,
    algorithm: 'time-to-live',
    evictionPolicy: 'time-based'
  },
  'adaptive': {
    maxSize: 1500,
    algorithm: 'adaptive-replacement',
    evictionPolicy: 'hybrid'
  }
};

const CACHE_TIERS = {
  'memory': {
    capacity: 100 * 1024 * 1024, // 100MB
    latency: 1, // 1ms
    persistent: false
  },
  'redis': {
    capacity: 1024 * 1024 * 1024, // 1GB
    latency: 5, // 5ms
    persistent: true
  },
  'disk': {
    capacity: 10 * 1024 * 1024 * 1024, // 10GB
    latency: 50, // 50ms
    persistent: true
  }
};

// Mock cache storage
const memoryCache = new Map();
const cacheMetadata = new Map();
const cacheStats = {
  hits: 0,
  misses: 0,
  sets: 0,
  deletes: 0,
  evictions: 0
};

export async function cacheResponse(key, data, options = {}, context = {}) {
  const startTime = Date.now();
  
  if (!key || typeof key !== 'string') {
    throw new Error('KeyError: Clé cache doit être une string non vide');
  }

  try {
    const cacheKey = generateCacheKey(key, options, context);
    const ttl = options.ttl || 3600; // 1 heure par défaut
    const strategy = options.strategy || 'lru';
    const tier = options.tier || 'memory';

    if (ttl <= 0) {
      throw new Error('ExpirationError: TTL doit être positif');
    }

    if (!CACHE_STRATEGIES[strategy]) {
      throw new Error(`CacheError: Stratégie '${strategy}' non supportée`);
    }

    if (!CACHE_TIERS[tier]) {
      throw new Error(`CacheError: Tier '${tier}' non supporté`);
    }

    // Préparer données pour mise en cache
    const cacheData = await prepareCacheData(data, options);
    const size = calculateDataSize(cacheData);
    const expiresAt = Date.now() + (ttl * 1000);

    // Vérifier capacité et faire place si nécessaire
    await ensureCacheCapacity(size, strategy, tier);

    // Mettre en cache
    await setCacheData(cacheKey, cacheData, tier);
    
    // Stocker métadonnées
    const metadata = {
      key: cacheKey,
      originalKey: key,
      size,
      createdAt: Date.now(),
      expiresAt,
      ttl,
      strategy,
      tier,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags: options.tags || [],
      version: options.version || '1.0'
    };

    cacheMetadata.set(cacheKey, metadata);
    cacheStats.sets++;

    return {
      cached: true,
      key: cacheKey,
      size,
      expiresAt: new Date(expiresAt).toISOString(),
      tier,
      strategy,
      timing: Date.now() - startTime
    };

  } catch (cacheError) {
    throw new Error(`CacheError: Échec mise en cache: ${cacheError.message}`);
  }
}

export async function getCachedResponse(key, options = {}, context = {}) {
  const startTime = Date.now();
  
  try {
    const cacheKey = generateCacheKey(key, options, context);
    const tier = options.tier || 'memory';

    // Récupérer métadonnées
    const metadata = cacheMetadata.get(cacheKey);
    
    if (!metadata) {
      cacheStats.misses++;
      return {
        hit: false,
        key: cacheKey,
        timing: Date.now() - startTime,
        reason: 'key_not_found'
      };
    }

    // Vérifier expiration
    if (Date.now() > metadata.expiresAt) {
      // Nettoyer cache expiré
      await deleteCachedResponse(key, options, context);
      cacheStats.misses++;
      return {
        hit: false,
        key: cacheKey,
        timing: Date.now() - startTime,
        reason: 'expired',
        expiredAt: new Date(metadata.expiresAt).toISOString()
      };
    }

    // Récupérer données
    const cachedData = await getCacheData(cacheKey, tier);
    
    if (!cachedData) {
      cacheStats.misses++;
      return {
        hit: false,
        key: cacheKey,
        timing: Date.now() - startTime,
        reason: 'data_not_found'
      };
    }

    // Mettre à jour métadonnées d'accès
    metadata.accessCount++;
    metadata.lastAccessed = Date.now();
    cacheMetadata.set(cacheKey, metadata);

    cacheStats.hits++;

    return {
      hit: true,
      data: cachedData,
      key: cacheKey,
      metadata: {
        createdAt: new Date(metadata.createdAt).toISOString(),
        expiresAt: new Date(metadata.expiresAt).toISOString(),
        accessCount: metadata.accessCount,
        age: Date.now() - metadata.createdAt,
        remainingTtl: Math.max(0, metadata.expiresAt - Date.now())
      },
      timing: Date.now() - startTime
    };

  } catch (cacheError) {
    cacheStats.misses++;
    throw new Error(`CacheError: Échec récupération cache: ${cacheError.message}`);
  }
}

export async function deleteCachedResponse(key, options = {}, context = {}) {
  const startTime = Date.now();
  
  try {
    const cacheKey = generateCacheKey(key, options, context);
    const tier = options.tier || 'memory';

    const metadata = cacheMetadata.get(cacheKey);
    const existed = !!metadata;

    if (metadata) {
      await deleteCacheData(cacheKey, tier);
      cacheMetadata.delete(cacheKey);
      cacheStats.deletes++;
    }

    return {
      deleted: existed,
      key: cacheKey,
      timing: Date.now() - startTime
    };

  } catch (cacheError) {
    throw new Error(`CacheError: Échec suppression cache: ${cacheError.message}`);
  }
}

export async function invalidateCache(pattern, options = {}) {
  const startTime = Date.now();
  let deleted = 0;

  try {
    const regex = new RegExp(pattern);
    const keysToDelete = [];

    // Trouver clés à supprimer
    for (const [cacheKey, metadata] of cacheMetadata.entries()) {
      if (regex.test(cacheKey) || regex.test(metadata.originalKey)) {
        keysToDelete.push(cacheKey);
      }

      // Invalidation par tags
      if (options.tags && metadata.tags) {
        const hasMatchingTag = options.tags.some(tag => metadata.tags.includes(tag));
        if (hasMatchingTag && !keysToDelete.includes(cacheKey)) {
          keysToDelete.push(cacheKey);
        }
      }
    }

    // Supprimer en lot
    for (const cacheKey of keysToDelete) {
      const metadata = cacheMetadata.get(cacheKey);
      if (metadata) {
        await deleteCacheData(cacheKey, metadata.tier);
        cacheMetadata.delete(cacheKey);
        deleted++;
      }
    }

    cacheStats.deletes += deleted;

    return {
      invalidated: deleted,
      pattern,
      tags: options.tags,
      timing: Date.now() - startTime
    };

  } catch (invalidationError) {
    throw new Error(`CacheError: Échec invalidation cache: ${invalidationError.message}`);
  }
}

export async function getCacheStats() {
  const totalEntries = cacheMetadata.size;
  const totalSize = Array.from(cacheMetadata.values())
    .reduce((sum, meta) => sum + meta.size, 0);

  const hitRate = cacheStats.hits + cacheStats.misses > 0 
    ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(1)
    : 0;

  // Analyse par tier
  const tierStats = {};
  for (const tier of Object.keys(CACHE_TIERS)) {
    const tierEntries = Array.from(cacheMetadata.values()).filter(meta => meta.tier === tier);
    tierStats[tier] = {
      entries: tierEntries.length,
      size: tierEntries.reduce((sum, meta) => sum + meta.size, 0),
      utilization: (tierEntries.reduce((sum, meta) => sum + meta.size, 0) / CACHE_TIERS[tier].capacity * 100).toFixed(1)
    };
  }

  // Top clés les plus accédées
  const topKeys = Array.from(cacheMetadata.values())
    .sort((a, b) => b.accessCount - a.accessCount)
    .slice(0, 10)
    .map(meta => ({
      key: meta.originalKey,
      accessCount: meta.accessCount,
      size: meta.size,
      age: Date.now() - meta.createdAt
    }));

  return {
    global: {
      ...cacheStats,
      hitRate: `${hitRate}%`,
      totalEntries,
      totalSize
    },
    tiers: tierStats,
    topKeys,
    generatedAt: new Date().toISOString()
  };
}

export async function warmupCache(entries, options = {}) {
  const startTime = Date.now();
  const results = [];

  for (const entry of entries) {
    try {
      const result = await cacheResponse(entry.key, entry.data, {
        ttl: entry.ttl || options.defaultTtl || 3600,
        strategy: entry.strategy || options.defaultStrategy || 'lru',
        tier: entry.tier || options.defaultTier || 'memory',
        tags: entry.tags
      });

      results.push({
        key: entry.key,
        success: true,
        result
      });

    } catch (warmupError) {
      results.push({
        key: entry.key,
        success: false,
        error: warmupError.message
      });
    }
  }

  const successful = results.filter(r => r.success).length;

  return {
    total: entries.length,
    successful,
    failed: entries.length - successful,
    results,
    timing: Date.now() - startTime
  };
}

function generateCacheKey(key, options, context) {
  const parts = [key];
  
  if (options.version) parts.push(`v:${options.version}`);
  if (context.userId) parts.push(`u:${context.userId}`);
  if (context.locale) parts.push(`l:${context.locale}`);
  if (options.variant) parts.push(`var:${options.variant}`);

  return parts.join('|');
}

async function prepareCacheData(data, options) {
  // Nettoyer données sensibles
  if (options.sanitize) {
    return sanitizeCacheData(data, options.sensitiveFields);
  }

  // Compression si données volumineuses
  if (options.compress && calculateDataSize(data) > 10240) { // > 10KB
    return compressCacheData(data);
  }

  return data;
}

function calculateDataSize(data) {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

async function ensureCacheCapacity(requiredSize, strategy, tier) {
  const tierConfig = CACHE_TIERS[tier];
  const currentSize = Array.from(cacheMetadata.values())
    .filter(meta => meta.tier === tier)
    .reduce((sum, meta) => sum + meta.size, 0);

  if (currentSize + requiredSize <= tierConfig.capacity) {
    return; // Capacité suffisante
  }

  // Éviction selon stratégie
  await evictCacheEntries(requiredSize, strategy, tier);
}

async function evictCacheEntries(requiredSize, strategy, tier) {
  const tierEntries = Array.from(cacheMetadata.entries())
    .filter(([key, meta]) => meta.tier === tier)
    .map(([key, meta]) => ({ key, ...meta }));

  let sortedEntries;
  
  switch (strategy) {
    case 'lru':
      sortedEntries = tierEntries.sort((a, b) => a.lastAccessed - b.lastAccessed);
      break;
    case 'lfu':
      sortedEntries = tierEntries.sort((a, b) => a.accessCount - b.accessCount);
      break;
    case 'ttl':
      sortedEntries = tierEntries.sort((a, b) => a.expiresAt - b.expiresAt);
      break;
    default:
      sortedEntries = tierEntries.sort((a, b) => a.createdAt - b.createdAt);
  }

  let freedSize = 0;
  for (const entry of sortedEntries) {
    if (freedSize >= requiredSize) break;

    await deleteCacheData(entry.key, tier);
    cacheMetadata.delete(entry.key);
    freedSize += entry.size;
    cacheStats.evictions++;
  }
}

// Mock implementations cache storage
async function setCacheData(key, data, tier) {
  switch (tier) {
    case 'memory':
      memoryCache.set(key, data);
      break;
    case 'redis':
      // Mock Redis storage
      memoryCache.set(`redis:${key}`, data);
      break;
    case 'disk':
      // Mock disk storage
      memoryCache.set(`disk:${key}`, data);
      break;
  }
}

async function getCacheData(key, tier) {
  switch (tier) {
    case 'memory':
      return memoryCache.get(key);
    case 'redis':
      return memoryCache.get(`redis:${key}`);
    case 'disk':
      return memoryCache.get(`disk:${key}`);
    default:
      return null;
  }
}

async function deleteCacheData(key, tier) {
  switch (tier) {
    case 'memory':
      return memoryCache.delete(key);
    case 'redis':
      return memoryCache.delete(`redis:${key}`);
    case 'disk':
      return memoryCache.delete(`disk:${key}`);
  }
}

function sanitizeCacheData(data, sensitiveFields = []) {
  const sanitized = JSON.parse(JSON.stringify(data));
  const defaultSensitive = ['password', 'secret', 'token', 'key', 'auth'];
  const fieldsToRemove = [...defaultSensitive, ...sensitiveFields];

  function removeSensitiveFields(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(removeSensitiveFields);
    }

    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!fieldsToRemove.includes(key.toLowerCase())) {
        cleaned[key] = removeSensitiveFields(value);
      }
    }
    return cleaned;
  }

  return removeSensitiveFields(sanitized);
}

function compressCacheData(data) {
  // Mock compression pour cache
  const jsonString = JSON.stringify(data);
  return {
    compressed: true,
    data: `COMPRESSED:${jsonString}`,
    originalSize: Buffer.byteLength(jsonString, 'utf8'),
    compressedSize: Math.floor(Buffer.byteLength(jsonString, 'utf8') * 0.7)
  };
}

// responses/caching : API Responses (commit 43)
// DEPENDENCY FLOW : api/responses/ → api/schemas/ → engines/ → transitions/ → systems/
