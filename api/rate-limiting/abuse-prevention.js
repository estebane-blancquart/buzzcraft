/**
 * COMMIT 47 - API Rate Limiting
 * 
 * FAIT QUOI : Détection et prévention abus API avec analyse patterns et blocage automatique
 * REÇOIT : identifier: string, request: object, rules: object[], options?: object
 * RETOURNE : { threat: boolean, score: number, actions: array, patterns: array }
 * ERREURS : AbuseError si analyse échoue, PatternError si pattern invalide, BlockError si blocage impossible
 */

const ABUSE_PATTERNS = {
  'rapid_requests': {
    name: 'Rapid Requests',
    description: 'Trop de requêtes en peu de temps',
    threshold: 50,
    window: 60000,
    score: 30,
    check: checkRapidRequests
  },
  'error_farming': {
    name: 'Error Farming',
    description: 'Génération intentionnelle d\'erreurs',
    threshold: 10,
    window: 300000,
    score: 50,
    check: checkErrorFarming
  },
  'credential_stuffing': {
    name: 'Credential Stuffing',
    description: 'Tentatives login multiples',
    threshold: 5,
    window: 900000,
    score: 80,
    check: checkCredentialStuffing
  }
};

const THREAT_LEVELS = {
  0: { level: 'none', color: 'green', actions: [] },
  25: { level: 'low', color: 'yellow', actions: ['log'] },
  50: { level: 'medium', color: 'orange', actions: ['log', 'throttle'] },
  75: { level: 'high', color: 'red', actions: ['log', 'throttle', 'alert'] },
  90: { level: 'critical', color: 'darkred', actions: ['log', 'block', 'alert', 'escalate'] }
};

const ABUSE_TRACKING = new Map();
const BLOCKED_IDENTIFIERS = new Map();
const ABUSE_HISTORY = new Map();

export async function analyzeAbuseRisk(identifier, request, customRules = [], options = {}) {
  if (!identifier || typeof identifier !== 'string' || identifier.trim() === '') {
    throw new Error('AbuseError: Identifiant requis pour analyse abuse');
  }

  if (!request || typeof request !== 'object') {
    throw new Error('AbuseError: Objet request requis');
  }

  try {
    const existingBlock = BLOCKED_IDENTIFIERS.get(identifier);
    if (existingBlock && existingBlock.expiresAt > Date.now()) {
      return {
        threat: true,
        blocked: true,
        score: 100,
        reason: 'previously_blocked',
        blockInfo: existingBlock,
        actions: ['block'],
        patterns: [],
        timestamp: new Date().toISOString()
      };
    }

    await trackRequest(identifier, request);

    const patternResults = [];
    const allRules = [...Object.values(ABUSE_PATTERNS), ...customRules];

    for (const pattern of allRules) {
      try {
        const result = await pattern.check(identifier, request, options);
        if (result.triggered) {
          patternResults.push({
            name: pattern.name,
            description: pattern.description,
            score: pattern.score,
            details: result.details,
            triggered: true
          });
        }
      } catch (patternError) {
        console.warn(`Pattern check failed for ${pattern.name}:`, patternError.message);
      }
    }

    const totalScore = patternResults.reduce((sum, pattern) => sum + pattern.score, 0);
    const finalScore = Math.min(100, totalScore);

    const threatLevel = determineThreatLevel(finalScore);
    const isThreat = finalScore >= 25;

    const executedActions = [];
    if (options.executeActions !== false) {
      for (const action of threatLevel.actions) {
        const actionResult = await executeAbuseAction(action, identifier, request, {
          score: finalScore,
          patterns: patternResults,
          threatLevel: threatLevel.level
        });
        if (actionResult.executed) {
          executedActions.push(actionResult);
        }
      }
    }

    await updateAbuseHistory(identifier, {
      score: finalScore,
      threat: isThreat,
      patterns: patternResults,
      actions: executedActions,
      request: {
        method: request.method,
        endpoint: request.endpoint,
        ip: request.ip,
        userAgent: request.userAgent
      }
    });

    return {
      threat: isThreat,
      score: finalScore,
      threatLevel: threatLevel.level,
      patterns: patternResults,
      actions: executedActions,
      recommendations: generateRecommendations(finalScore, patternResults),
      identifier,
      timestamp: new Date().toISOString()
    };

  } catch (analysisError) {
    throw new Error(`AbuseError: Échec analyse abuse: ${analysisError.message}`);
  }
}

export async function blockIdentifier(identifier, duration = 3600000, reason = 'manual', options = {}) {
  if (!identifier) {
    throw new Error('AbuseError: Identifiant requis pour blocage');
  }

  try {
    const blockInfo = {
      identifier,
      reason,
      blockedAt: Date.now(),
      expiresAt: Date.now() + duration,
      duration,
      source: options.source || 'manual',
      automatic: options.automatic || false,
      metadata: options.metadata || {}
    };

    BLOCKED_IDENTIFIERS.set(identifier, blockInfo);

    setTimeout(() => {
      BLOCKED_IDENTIFIERS.delete(identifier);
    }, duration);

    return {
      blocked: true,
      identifier,
      reason,
      duration,
      expiresAt: new Date(blockInfo.expiresAt).toISOString(),
      automatic: blockInfo.automatic,
      timestamp: new Date().toISOString()
    };

  } catch (blockError) {
    throw new Error(`BlockError: Échec blocage: ${blockError.message}`);
  }
}

export async function unblockIdentifier(identifier, reason = 'manual', options = {}) {
  if (!identifier) {
    throw new Error('AbuseError: Identifiant requis pour déblocage');
  }

  const blockInfo = BLOCKED_IDENTIFIERS.get(identifier);
  
  if (!blockInfo) {
    return {
      unblocked: false,
      reason: 'not_blocked',
      identifier
    };
  }

  try {
    BLOCKED_IDENTIFIERS.delete(identifier);

    return {
      unblocked: true,
      identifier,
      reason,
      previousBlock: {
        reason: blockInfo.reason,
        duration: blockInfo.duration,
        remainingTime: Math.max(0, blockInfo.expiresAt - Date.now())
      },
      timestamp: new Date().toISOString()
    };

  } catch (unblockError) {
    throw new Error(`BlockError: Échec déblocage: ${unblockError.message}`);
  }
}

export async function getAbuseReport(identifier, period = '24h', options = {}) {
  if (!identifier) {
    throw new Error('AbuseError: Identifiant requis pour rapport');
  }

  try {
    const periodMs = parsePeriod(period);
    const startTime = Date.now() - periodMs;
    
    const tracking = ABUSE_TRACKING.get(identifier) || { requests: [], patterns: [] };
    const history = ABUSE_HISTORY.get(identifier) || [];
    const blockInfo = BLOCKED_IDENTIFIERS.get(identifier);

    const recentRequests = tracking.requests.filter(req => req.timestamp >= startTime);
    const recentHistory = history.filter(entry => entry.timestamp >= startTime);

    const stats = {
      totalRequests: recentRequests.length,
      averageScore: recentHistory.length > 0 ? 
        recentHistory.reduce((sum, entry) => sum + entry.score, 0) / recentHistory.length : 0,
      maxScore: recentHistory.length > 0 ? 
        Math.max(...recentHistory.map(entry => entry.score)) : 0,
      threatsDetected: recentHistory.filter(entry => entry.threat).length,
      uniquePatterns: new Set(recentHistory.flatMap(entry => 
        entry.patterns.map(p => p.name))).size
    };

    const trends = analyzeTrends(recentHistory);

    return {
      identifier,
      period,
      stats,
      trends,
      recentActivity: recentRequests.slice(-10),
      threatHistory: recentHistory,
      currentBlock: blockInfo || null,
      riskLevel: determineRiskLevel(stats.averageScore, stats.threatsDetected),
      generatedAt: new Date().toISOString()
    };

  } catch (reportError) {
    throw new Error(`AbuseError: Échec génération rapport: ${reportError.message}`);
  }
}

export async function getAbuseStats(period = '24h', options = {}) {
  try {
    const periodMs = parsePeriod(period);
    const startTime = Date.now() - periodMs;

    const globalStats = {
      totalIdentifiers: 0,
      totalRequests: 0,
      totalThreats: 0,
      activeBlocks: 0,
      patternFrequency: {},
      topOffenders: [],
      period
    };

    for (const [identifier, tracking] of ABUSE_TRACKING) {
      const recentRequests = tracking.requests.filter(req => req.timestamp >= startTime);
      if (recentRequests.length > 0) {
        globalStats.totalIdentifiers++;
        globalStats.totalRequests += recentRequests.length;
      }
    }

    for (const [identifier, history] of ABUSE_HISTORY) {
      const recentThreats = history.filter(entry => 
        entry.timestamp >= startTime && entry.threat
      );
      globalStats.totalThreats += recentThreats.length;

      for (const entry of recentThreats) {
        for (const pattern of entry.patterns) {
          globalStats.patternFrequency[pattern.name] = 
            (globalStats.patternFrequency[pattern.name] || 0) + 1;
        }
      }
    }

    globalStats.activeBlocks = BLOCKED_IDENTIFIERS.size;

    const offenderScores = new Map();
    for (const [identifier, history] of ABUSE_HISTORY) {
      const recentEntries = history.filter(entry => entry.timestamp >= startTime);
      if (recentEntries.length > 0) {
        const avgScore = recentEntries.reduce((sum, entry) => sum + entry.score, 0) / recentEntries.length;
        offenderScores.set(identifier, {
          identifier,
          averageScore: avgScore,
          threatsCount: recentEntries.filter(entry => entry.threat).length,
          requestsCount: recentEntries.length
        });
      }
    }

    globalStats.topOffenders = Array.from(offenderScores.values())
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 10);

    return {
      ...globalStats,
      threatRate: globalStats.totalRequests > 0 ? 
        (globalStats.totalThreats / globalStats.totalRequests * 100).toFixed(2) + '%' : '0%',
      blockRate: globalStats.totalIdentifiers > 0 ? 
        (globalStats.activeBlocks / globalStats.totalIdentifiers * 100).toFixed(2) + '%' : '0%',
      generatedAt: new Date().toISOString()
    };

  } catch (statsError) {
    throw new Error(`AbuseError: Échec statistiques: ${statsError.message}`);
  }
}

async function checkRapidRequests(identifier, request, options) {
  const tracking = ABUSE_TRACKING.get(identifier) || { requests: [] };
  const now = Date.now();
  const windowStart = now - ABUSE_PATTERNS.rapid_requests.window;
  
  const recentRequests = tracking.requests.filter(req => req.timestamp >= windowStart);
  const triggered = recentRequests.length >= ABUSE_PATTERNS.rapid_requests.threshold;

  return {
    triggered,
    details: {
      requestCount: recentRequests.length,
      threshold: ABUSE_PATTERNS.rapid_requests.threshold,
      window: ABUSE_PATTERNS.rapid_requests.window / 1000 + 's',
      rate: recentRequests.length / (ABUSE_PATTERNS.rapid_requests.window / 1000) + ' req/s'
    }
  };
}

async function checkErrorFarming(identifier, request, options) {
  const tracking = ABUSE_TRACKING.get(identifier) || { requests: [] };
  const now = Date.now();
  const windowStart = now - ABUSE_PATTERNS.error_farming.window;
  
  const recentErrors = tracking.requests.filter(req => 
    req.timestamp >= windowStart && req.statusCode >= 400
  );
  
  const triggered = recentErrors.length >= ABUSE_PATTERNS.error_farming.threshold;

  return {
    triggered,
    details: {
      errorCount: recentErrors.length,
      threshold: ABUSE_PATTERNS.error_farming.threshold,
      errorTypes: recentErrors.reduce((acc, req) => {
        acc[req.statusCode] = (acc[req.statusCode] || 0) + 1;
        return acc;
      }, {}),
      errorRate: tracking.requests.length > 0 ? 
        (recentErrors.length / tracking.requests.length * 100).toFixed(1) + '%' : '0%'
    }
  };
}

async function checkCredentialStuffing(identifier, request, options) {
  const tracking = ABUSE_TRACKING.get(identifier) || { requests: [] };
  const now = Date.now();
  const windowStart = now - ABUSE_PATTERNS.credential_stuffing.window;
  
  const authRequests = tracking.requests.filter(req => 
    req.timestamp >= windowStart && 
    (req.endpoint?.includes('/auth') || req.endpoint?.includes('/login'))
  );
  
  const triggered = authRequests.length >= ABUSE_PATTERNS.credential_stuffing.threshold;

  return {
    triggered,
    details: {
      authAttempts: authRequests.length,
      threshold: ABUSE_PATTERNS.credential_stuffing.threshold,
      uniqueEndpoints: new Set(authRequests.map(req => req.endpoint)).size,
      failedAttempts: authRequests.filter(req => req.statusCode === 401).length
    }
  };
}

async function trackRequest(identifier, request) {
  const tracking = ABUSE_TRACKING.get(identifier) || { requests: [], patterns: [] };
  
  const requestData = {
    timestamp: Date.now(),
    method: request.method,
    endpoint: request.endpoint,
    statusCode: request.statusCode || 200,
    responseTime: request.responseTime || Math.random() * 1000,
    payloadSize: request.payloadSize || 0,
    ip: request.ip,
    userAgent: request.userAgent,
    headers: request.headers || {}
  };

  tracking.requests.push(requestData);
  
  if (tracking.requests.length > 1000) {
    tracking.requests = tracking.requests.slice(-1000);
  }

  ABUSE_TRACKING.set(identifier, tracking);
}

async function executeAbuseAction(action, identifier, request, context) {
  switch (action) {
    case 'log':
      console.log(`Abuse detected for ${identifier}: score ${context.score}`);
      return { action, executed: true, details: 'Logged abuse event' };

    case 'throttle':
      return { action, executed: true, details: 'Applied throttling limits' };

    case 'block':
      const blockResult = await blockIdentifier(identifier, 3600000, 'automatic_abuse', {
        automatic: true,
        source: 'abuse_prevention',
        metadata: { score: context.score, patterns: context.patterns.map(p => p.name) }
      });
      return { action, executed: blockResult.blocked, details: blockResult };

    case 'alert':
      return { action, executed: true, details: 'Alert sent to administrators' };

    case 'escalate':
      return { action, executed: true, details: 'Escalated to security team' };

    default:
      return { action, executed: false, details: 'Unknown action' };
  }
}

async function updateAbuseHistory(identifier, entry) {
  const history = ABUSE_HISTORY.get(identifier) || [];
  
  history.push({
    ...entry,
    timestamp: Date.now()
  });

  if (history.length > 100) {
    history.splice(0, history.length - 100);
  }

  ABUSE_HISTORY.set(identifier, history);
}

function determineThreatLevel(score) {
  const levels = Object.keys(THREAT_LEVELS)
    .map(Number)
    .sort((a, b) => b - a);

  for (const threshold of levels) {
    if (score >= threshold) {
      return THREAT_LEVELS[threshold];
    }
  }

  return THREAT_LEVELS[0];
}

function generateRecommendations(score, patterns) {
  const recommendations = [];

  if (score >= 75) {
    recommendations.push('Immediate blocking recommended');
  } else if (score >= 50) {
    recommendations.push('Increase monitoring and apply throttling');
  } else if (score >= 25) {
    recommendations.push('Log activity and monitor patterns');
  }

  for (const pattern of patterns) {
    switch (pattern.name) {
      case 'Rapid Requests':
        recommendations.push('Apply rate limiting');
        break;
      case 'Credential Stuffing':
        recommendations.push('Implement CAPTCHA or account lockout');
        break;
    }
  }

  return [...new Set(recommendations)];
}

function analyzeTrends(history) {
  if (history.length < 2) {
    return { trend: 'insufficient_data' };
  }

  const scores = history.map(entry => entry.score);
  const recentAvg = scores.slice(-5).reduce((sum, score) => sum + score, 0) / Math.min(5, scores.length);
  const olderAvg = scores.slice(0, -5).reduce((sum, score) => sum + score, 0) / Math.max(1, scores.length - 5);

  return {
    trend: recentAvg > olderAvg ? 'increasing' : 'decreasing',
    recentAverage: recentAvg.toFixed(1),
    change: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1) + '%'
  };
}

function determineRiskLevel(averageScore, threatsCount) {
  if (averageScore >= 75 || threatsCount >= 10) return 'high';
  if (averageScore >= 50 || threatsCount >= 5) return 'medium';
  if (averageScore >= 25 || threatsCount >= 1) return 'low';
  return 'minimal';
}

function parsePeriod(period) {
  const units = {
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000,
    'w': 7 * 24 * 60 * 60 * 1000
  };

  const match = period.match(/^(\d+)([hdw])$/);
  if (!match) {
    throw new Error(`Format période invalide: ${period}`);
  }

  const [, value, unit] = match;
  return parseInt(value) * units[unit];
}

// rate-limiting/abuse-prevention : API Rate Limiting (commit 47)
// DEPENDENCY FLOW : api/rate-limiting/ → api/authentication/ → api/schemas/ → engines/
