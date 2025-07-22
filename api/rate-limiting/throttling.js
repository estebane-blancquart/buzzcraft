/**
 * COMMIT 47 - API Rate Limiting
 * 
 * FAIT QUOI : Throttling requêtes API avec algorithmes token bucket et sliding window
 * REÇOIT : identifier: string, algorithm: string, limits: object, options?: object
 * RETOURNE : { allowed: boolean, remaining: number, resetTime: number, retryAfter: number }
 * ERREURS : ThrottleError si limite dépassée, AlgorithmError si algorithme non supporté, IdentifierError si identifiant invalide
 */

const THROTTLE_ALGORITHMS = {
  'token_bucket': {
    name: 'Token Bucket',
    description: 'Tokens rechargés à intervalle fixe',
    implementation: tokenBucketThrottle
  },
  'sliding_window': {
    name: 'Sliding Window',
    description: 'Fenêtre glissante avec compteur précis',
    implementation: slidingWindowThrottle
  },
  'fixed_window': {
    name: 'Fixed Window',
    description: 'Fenêtre fixe simple et rapide',
    implementation: fixedWindowThrottle
  },
  'leaky_bucket': {
    name: 'Leaky Bucket',
    description: 'Débit constant avec lissage',
    implementation: leakyBucketThrottle
  }
};

const DEFAULT_LIMITS = {
  requests: 100,
  windowMs: 60 * 1000,
  burstSize: 10,
  refillRate: 1000
};

const THROTTLE_STATES = new Map();
const THROTTLE_STATS = new Map();

export async function checkThrottleLimit(identifier, algorithm = 'token_bucket', limits = {}, options = {}) {
  if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
    throw new Error('IdentifierError: Identifiant requis et non vide');
  }

  if (!THROTTLE_ALGORITHMS[algorithm]) {
    throw new Error(`AlgorithmError: Algorithme '${algorithm}' non supporté`);
  }

  try {
    const config = { ...DEFAULT_LIMITS, ...limits };
    const algorithmImpl = THROTTLE_ALGORITHMS[algorithm];
    const result = await algorithmImpl.implementation(identifier, config, options);

    updateThrottleStats(identifier, algorithm, result, config);

    const response = {
      ...result,
      identifier,
      algorithm: algorithm,
      algorithmName: algorithmImpl.name,
      limits: config,
      timestamp: new Date().toISOString()
    };

    if (!result.allowed && options.logBlocked !== false) {
      console.warn(`Rate limit exceeded for ${identifier} using ${algorithm}`);
    }

    return response;

  } catch (throttleError) {
    throw new Error(`ThrottleError: Échec vérification limite: ${throttleError.message}`);
  }
}

export async function resetThrottleCounter(identifier, algorithm = null, options = {}) {
  if (!identifier) {
    throw new Error('IdentifierError: Identifiant requis pour reset');
  }

  try {
    let resetsApplied = 0;

    if (algorithm) {
      const key = `${algorithm}:${identifier}`;
      if (THROTTLE_STATES.has(key)) {
        THROTTLE_STATES.delete(key);
        resetsApplied++;
      }
    } else {
      for (const algorithmName of Object.keys(THROTTLE_ALGORITHMS)) {
        const key = `${algorithmName}:${identifier}`;
        if (THROTTLE_STATES.has(key)) {
          THROTTLE_STATES.delete(key);
          resetsApplied++;
        }
      }
    }

    return {
      reset: true,
      identifier,
      algorithm: algorithm || 'all',
      resetsApplied,
      timestamp: new Date().toISOString()
    };

  } catch (resetError) {
    throw new Error(`ThrottleError: Échec reset compteur: ${resetError.message}`);
  }
}

export async function getThrottleStatus(identifier, algorithm = null, options = {}) {
  if (!identifier) {
    throw new Error('IdentifierError: Identifiant requis pour status');
  }

  try {
    const statuses = [];
    const algorithmsToCheck = algorithm ? [algorithm] : Object.keys(THROTTLE_ALGORITHMS);

    for (const algo of algorithmsToCheck) {
      const key = `${algo}:${identifier}`;
      const state = THROTTLE_STATES.get(key);
      const stats = THROTTLE_STATS.get(key);

      if (state || stats) {
        statuses.push({
          algorithm: algo,
          algorithmName: THROTTLE_ALGORITHMS[algo].name,
          state: state || { requests: 0, lastRefill: Date.now() },
          stats: stats || { totalRequests: 0, blockedRequests: 0, lastBlock: null },
          active: !!state
        });
      }
    }

    return {
      identifier,
      statuses,
      algorithmsChecked: algorithmsToCheck.length,
      timestamp: new Date().toISOString()
    };

  } catch (statusError) {
    throw new Error(`ThrottleError: Échec récupération status: ${statusError.message}`);
  }
}

export async function getThrottleStats(period = '1h', options = {}) {
  const now = Date.now();
  const periodMs = parsePeriod(period);
  const startTime = now - periodMs;

  const globalStats = {
    totalRequests: 0,
    allowedRequests: 0,
    blockedRequests: 0,
    uniqueIdentifiers: new Set(),
    algorithmsUsed: new Set(),
    period,
    startTime: new Date(startTime).toISOString(),
    endTime: new Date(now).toISOString()
  };

  for (const [key, stats] of THROTTLE_STATS) {
    const [algorithm, identifier] = key.split(':', 2);
    
    if (stats.lastRequest && stats.lastRequest >= startTime) {
      globalStats.totalRequests += stats.totalRequests || 0;
      globalStats.allowedRequests += (stats.totalRequests || 0) - (stats.blockedRequests || 0);
      globalStats.blockedRequests += stats.blockedRequests || 0;
      globalStats.uniqueIdentifiers.add(identifier);
      globalStats.algorithmsUsed.add(algorithm);
    }
  }

  return {
    ...globalStats,
    uniqueIdentifiers: globalStats.uniqueIdentifiers.size,
    algorithmsUsed: Array.from(globalStats.algorithmsUsed),
    blockRate: globalStats.totalRequests > 0 ? 
      (globalStats.blockedRequests / globalStats.totalRequests * 100).toFixed(2) + '%' : '0%',
    requestsPerSecond: periodMs > 0 ? 
      (globalStats.totalRequests / (periodMs / 1000)).toFixed(2) : '0',
    timestamp: new Date().toISOString()
  };
}

async function tokenBucketThrottle(identifier, config, options) {
  const key = `token_bucket:${identifier}`;
  const now = Date.now();
  
  let state = THROTTLE_STATES.get(key) || {
    tokens: config.requests,
    lastRefill: now
  };

  const timePassed = now - state.lastRefill;
  const tokensToAdd = Math.floor(timePassed / config.refillRate);
  
  if (tokensToAdd > 0) {
    state.tokens = Math.min(config.requests, state.tokens + tokensToAdd);
    state.lastRefill = now;
  }

  const allowed = state.tokens > 0;
  
  if (allowed) {
    state.tokens--;
  }

  THROTTLE_STATES.set(key, state);

  return {
    allowed,
    remaining: state.tokens,
    resetTime: state.lastRefill + (config.requests - state.tokens) * config.refillRate,
    retryAfter: allowed ? 0 : config.refillRate
  };
}

async function slidingWindowThrottle(identifier, config, options) {
  const key = `sliding_window:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let state = THROTTLE_STATES.get(key) || { requests: [] };

  state.requests = state.requests.filter(timestamp => timestamp > windowStart);
  const allowed = state.requests.length < config.requests;

  if (allowed) {
    state.requests.push(now);
  }

  THROTTLE_STATES.set(key, state);

  return {
    allowed,
    remaining: Math.max(0, config.requests - state.requests.length),
    resetTime: state.requests.length > 0 ? state.requests[0] + config.windowMs : now + config.windowMs,
    retryAfter: allowed ? 0 : Math.max(1000, (state.requests[0] + config.windowMs) - now)
  };
}

async function fixedWindowThrottle(identifier, config, options) {
  const key = `fixed_window:${identifier}`;
  const now = Date.now();
  const windowStart = Math.floor(now / config.windowMs) * config.windowMs;

  let state = THROTTLE_STATES.get(key) || {
    windowStart: 0,
    requests: 0
  };

  if (windowStart > state.windowStart) {
    state = { windowStart, requests: 0 };
  }

  const allowed = state.requests < config.requests;

  if (allowed) {
    state.requests++;
  }

  THROTTLE_STATES.set(key, state);

  const windowEnd = windowStart + config.windowMs;

  return {
    allowed,
    remaining: Math.max(0, config.requests - state.requests),
    resetTime: windowEnd,
    retryAfter: allowed ? 0 : Math.max(1000, windowEnd - now)
  };
}

async function leakyBucketThrottle(identifier, config, options) {
  const key = `leaky_bucket:${identifier}`;
  const now = Date.now();

  let state = THROTTLE_STATES.get(key) || {
    queue: [],
    lastLeak: now
  };

  const timePassed = now - state.lastLeak;
  const leaksAllowed = Math.floor(timePassed / config.refillRate);
  
  if (leaksAllowed > 0) {
    state.queue = state.queue.slice(leaksAllowed);
    state.lastLeak = now;
  }

  const allowed = state.queue.length < config.requests;

  if (allowed) {
    state.queue.push(now);
  }

  THROTTLE_STATES.set(key, state);

  return {
    allowed,
    remaining: Math.max(0, config.requests - state.queue.length),
    resetTime: state.lastLeak + (state.queue.length * config.refillRate),
    retryAfter: allowed ? 0 : config.refillRate
  };
}

function updateThrottleStats(identifier, algorithm, result, config) {
  const key = `${algorithm}:${identifier}`;
  const stats = THROTTLE_STATS.get(key) || {
    totalRequests: 0,
    blockedRequests: 0,
    lastRequest: null,
    lastBlock: null,
    firstRequest: null
  };

  stats.totalRequests++;
  stats.lastRequest = Date.now();

  if (!stats.firstRequest) {
    stats.firstRequest = stats.lastRequest;
  }

  if (!result.allowed) {
    stats.blockedRequests++;
    stats.lastBlock = stats.lastRequest;
  }

  THROTTLE_STATS.set(key, stats);
}

function parsePeriod(period) {
  const units = {
    's': 1000,
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000
  };

  const match = period.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Format période invalide: ${period}`);
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

export function startThrottleCleanup(intervalMs = 5 * 60 * 1000) {
  return setInterval(() => {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000;

    for (const [key, state] of THROTTLE_STATES) {
      const lastActivity = state.lastRefill || state.lastLeak || now;
      if (now - lastActivity > maxAge) {
        THROTTLE_STATES.delete(key);
      }
    }

    for (const [key, stats] of THROTTLE_STATS) {
      if (stats.lastRequest && now - stats.lastRequest > maxAge) {
        THROTTLE_STATS.delete(key);
      }
    }
  }, intervalMs);
}

// rate-limiting/throttling : API Rate Limiting (commit 47)
// DEPENDENCY FLOW : api/rate-limiting/ → api/authentication/ → api/schemas/ → engines/
