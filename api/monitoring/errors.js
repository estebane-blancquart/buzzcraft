/**
 * COMMIT 49 - API Monitoring
 * 
 * FAIT QUOI : Monitoring erreurs API avec classification automatique et alertes
 * REÇOIT : error: object, endpoint: string, context?: object, severity?: string
 * RETOURNE : { logged: boolean, classified: boolean, alertSent: boolean, errorId: string }
 * ERREURS : LoggingError si logging échoue, ClassificationError si classification impossible, AlertError si alerte échoue
 */

const ERROR_CLASSIFICATIONS = {
  'validation': { severity: 'warning', category: 'client', autoAlert: false },
  'authentication': { severity: 'warning', category: 'security', autoAlert: true },
  'authorization': { severity: 'warning', category: 'security', autoAlert: true },
  'rate_limit': { severity: 'info', category: 'throttling', autoAlert: false },
  'internal': { severity: 'critical', category: 'system', autoAlert: true },
  'timeout': { severity: 'error', category: 'performance', autoAlert: true },
  'network': { severity: 'error', category: 'infrastructure', autoAlert: true }
};

const ERROR_LOG = new Map();
const ERROR_PATTERNS = new Map();
const ALERT_HISTORY = new Map();

export async function logAPIError(error, endpoint, context = {}, severity = 'error') {
  if (!error || typeof error !== 'object') {
    throw new Error('LoggingError: error requis');
  }

  if (!endpoint || typeof endpoint !== 'string') {
    throw new Error('LoggingError: endpoint requis');
  }

  const validSeverities = ['info', 'warning', 'error', 'critical'];
  if (!validSeverities.includes(severity)) {
    throw new Error(`LoggingError: severity doit être ${validSeverities.join(', ')}`);
  }

  try {
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const timestamp = new Date().toISOString();
    
    const errorEntry = {
      errorId,
      error: {
        message: error.message || 'Unknown error',
        stack: error.stack || null,
        code: error.code || 'UNKNOWN_ERROR'
      },
      endpoint,
      severity,
      context: {
        userAgent: context.userAgent || 'Unknown',
        ip: context.ip || 'Unknown',
        userId: context.userId || null,
        requestId: context.requestId || null,
        ...context
      },
      timestamp
    };

    ERROR_LOG.set(errorId, errorEntry);

    // Classification automatique
    const classification = await classifyError(errorEntry);
    
    // Alerte automatique si nécessaire
    let alertSent = false;
    if (classification.autoAlert) {
      alertSent = await sendErrorAlert(errorEntry, classification);
    }

    return {
      logged: true,
      errorId,
      endpoint,
      severity,
      classified: !!classification,
      alertSent,
      loggedAt: timestamp
    };

  } catch (error) {
    throw new Error(`LoggingError: ${error.message}`);
  }
}

export async function classifyErrorPatterns(timeWindow = 3600000, minOccurrences = 5) {
  try {
    const now = Date.now();
    const cutoffTime = now - timeWindow;
    const patterns = new Map();

    // Analyser erreurs récentes
    for (const [errorId, errorEntry] of ERROR_LOG.entries()) {
      const errorTime = new Date(errorEntry.timestamp).getTime();
      if (errorTime < cutoffTime) continue;

      const patternKey = `${errorEntry.endpoint}:${errorEntry.error.code}`;
      const pattern = patterns.get(patternKey) || {
        endpoint: errorEntry.endpoint,
        errorCode: errorEntry.error.code,
        occurrences: 0,
        firstSeen: errorEntry.timestamp,
        lastSeen: errorEntry.timestamp,
        severity: errorEntry.severity
      };

      pattern.occurrences++;
      pattern.lastSeen = errorEntry.timestamp;
      patterns.set(patternKey, pattern);
    }

    // Filtrer patterns significatifs
    const significantPatterns = Array.from(patterns.values())
      .filter(pattern => pattern.occurrences >= minOccurrences)
      .sort((a, b) => b.occurrences - a.occurrences);

    // Sauvegarder patterns détectés
    for (const pattern of significantPatterns) {
      ERROR_PATTERNS.set(`${pattern.endpoint}:${pattern.errorCode}`, pattern);
    }

    return {
      classified: true,
      timeWindow,
      patternsFound: significantPatterns.length,
      patterns: significantPatterns,
      classifiedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`ClassificationError: ${error.message}`);
  }
}

export async function generateErrorReport(timeRange = 86400000, groupBy = 'endpoint') {
  const validGroupBy = ['endpoint', 'severity', 'category', 'time'];
  if (!validGroupBy.includes(groupBy)) {
    throw new Error(`LoggingError: groupBy doit être ${validGroupBy.join(', ')}`);
  }

  try {
    const now = Date.now();
    const cutoffTime = now - timeRange;
    const report = {
      summary: {
        totalErrors: 0,
        errorsByEndpoint: {},
        errorsBySeverity: { info: 0, warning: 0, error: 0, critical: 0 },
        mostCommonErrors: []
      },
      details: []
    };

    const groupedErrors = new Map();

    for (const [errorId, errorEntry] of ERROR_LOG.entries()) {
      const errorTime = new Date(errorEntry.timestamp).getTime();
      if (errorTime < cutoffTime) continue;

      report.summary.totalErrors++;

      // Compter par endpoint
      report.summary.errorsByEndpoint[errorEntry.endpoint] = 
        (report.summary.errorsByEndpoint[errorEntry.endpoint] || 0) + 1;

      // Compter par severity
      report.summary.errorsBySeverity[errorEntry.severity]++;

      // Grouper selon critère
      let groupKey;
      switch (groupBy) {
        case 'endpoint':
          groupKey = errorEntry.endpoint;
          break;
        case 'severity':
          groupKey = errorEntry.severity;
          break;
        case 'category':
          groupKey = await getErrorCategory(errorEntry);
          break;
        case 'time':
          groupKey = new Date(errorEntry.timestamp).toISOString().substring(0, 13); // Hour
          break;
      }

      const group = groupedErrors.get(groupKey) || [];
      group.push(errorEntry);
      groupedErrors.set(groupKey, group);
    }

    // Construire détails du rapport
    for (const [groupKey, errors] of groupedErrors.entries()) {
      report.details.push({
        [groupBy]: groupKey,
        errorCount: errors.length,
        errors: errors.map(e => ({
          errorId: e.errorId,
          message: e.error.message,
          timestamp: e.timestamp
        }))
      });
    }

    return {
      generated: true,
      timeRange,
      groupBy,
      report,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`LoggingError: ${error.message}`);
  }
}

export async function setupErrorAlerts(config = {}, options = {}) {
  try {
    const alertConfig = {
      thresholds: {
        criticalErrors: config.criticalErrors || 5,
        errorRate: config.errorRate || 0.1,
        timeWindow: config.timeWindow || 300000 // 5 minutes
      },
      channels: {
        email: config.email || false,
        slack: config.slack || false,
        webhook: config.webhook || null
      },
      enabled: config.enabled !== false
    };

    // Validation configuration
    if (alertConfig.thresholds.errorRate < 0 || alertConfig.thresholds.errorRate > 1) {
      throw new Error('AlertError: errorRate doit être entre 0 et 1');
    }

    return {
      configured: true,
      config: alertConfig,
      alertsEnabled: alertConfig.enabled,
      configuredAt: new Date().toISOString()
    };

  } catch (error) {
    throw new Error(`AlertError: ${error.message}`);
  }
}

// Helper functions
async function classifyError(errorEntry) {
  const errorMessage = errorEntry.error.message.toLowerCase();
  
  for (const [type, classification] of Object.entries(ERROR_CLASSIFICATIONS)) {
    if (errorMessage.includes(type) || errorEntry.error.code.toLowerCase().includes(type)) {
      return { type, ...classification };
    }
  }

  return { type: 'unknown', severity: 'error', category: 'unclassified', autoAlert: false };
}

async function sendErrorAlert(errorEntry, classification) {
  // Simulation envoi alerte
  const alertId = `alert_${Date.now()}`;
  ALERT_HISTORY.set(alertId, {
    errorId: errorEntry.errorId,
    classification,
    sentAt: new Date().toISOString()
  });
  
  return true;
}

async function getErrorCategory(errorEntry) {
  const classification = await classifyError(errorEntry);
  return classification.category;
}

// monitoring/errors : API Monitoring (commit 49)
// DEPENDENCY FLOW : api/monitoring/ → api/schemas/ → engines/ → transitions/ → systems/
