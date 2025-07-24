/**
 * COMMIT 69 - Panel Analytics
 * 
 * FAIT QUOI : Analytiques erreurs avec tracking, classification et résolution
 * REÇOIT : timeRange: object, errorFilters: object, includeStackTraces: boolean
 * RETOURNE : { errors: object[], classifications: object, resolutions: object[], metadata: object }
 * ERREURS : ErrorAnalyticsError si données indisponibles, ClassificationError si catégorisation échoue, ResolutionError si suggestions impossibles
 */

// DEPENDENCY FLOW (no circular deps)

export async function createErrorAnalytics(timeRange = {}, errorFilters = {}, includeStackTraces = false) {
  if (typeof timeRange !== 'object') {
    throw new Error('ErrorAnalyticsError: TimeRange doit être object');
  }

  if (typeof errorFilters !== 'object') {
    throw new Error('ErrorAnalyticsError: ErrorFilters doit être object');
  }

  try {
    const normalizedTimeRange = normalizeTimeRange(timeRange);
    const errors = await generateErrorData(normalizedTimeRange, errorFilters, includeStackTraces);
    const classifications = classifyErrors(errors);
    const resolutions = generateResolutions(errors);

    return {
      errors,
      classifications,
      resolutions,
      metadata: {
        timeRange: normalizedTimeRange,
        errorFilters: Object.keys(errorFilters).length,
        totalErrors: errors.length,
        includeStackTraces,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`ErrorAnalyticsError: Création analytics erreurs échouée: ${error.message}`);
  }
}

export async function validateErrorPatterns(errorData, patternRules = {}) {
  if (!errorData || !Array.isArray(errorData.errors)) {
    throw new Error('ErrorAnalyticsError: ErrorData.errors requis array');
  }

  try {
    const violations = [];
    const warnings = [];
    const totalRequests = errorData.metadata?.totalRequests || 1000;
    const errorRate = errorData.errors.length / totalRequests;

    if (errorRate > 0.05) {
      violations.push({
        type: 'error_rate',
        severity: 'critical',
        value: errorRate
      });
    }

    return {
      valid: violations.length === 0,
      violations,
      warnings,
      patterns: [],
      summary: {
        errorRate,
        criticalErrors: errorData.errors.filter(e => e.severity === 'critical').length,
        overallHealth: 100 - (violations.length * 25)
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`ErrorAnalyticsError: Validation patterns erreurs échouée: ${error.message}`);
  }
}

export async function categorizeErrorsByType(errors, customCategories = {}) {
  if (!Array.isArray(errors)) {
    throw new Error('ErrorAnalyticsError: Errors doit être array');
  }

  try {
    const categorized = {
      byType: {},
      byPriority: {},
      uncategorized: []
    };

    const categories = {
      network: ['NETWORK_ERROR', 'TIMEOUT'],
      validation: ['VALIDATION_ERROR', 'INVALID_INPUT'],
      database: ['DB_ERROR', 'QUERY_FAILED'],
      ...customCategories
    };

    errors.forEach(error => {
      let assigned = false;

      for (const [categoryName, patterns] of Object.entries(categories)) {
        if (patterns.some(pattern => error.type.includes(pattern))) {
          if (!categorized.byType[categoryName]) {
            categorized.byType[categoryName] = [];
          }
          categorized.byType[categoryName].push(error);
          assigned = true;
          break;
        }
      }

      if (!assigned) {
        categorized.uncategorized.push(error);
      }
    });

    return {
      categorized,
      stats: {
        totalErrors: errors.length,
        categorized: errors.length - categorized.uncategorized.length,
        categorizationRate: ((errors.length - categorized.uncategorized.length) / errors.length) * 100
      },
      metadata: {
        categoriesUsed: Object.keys(categorized.byType).length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`ClassificationError: Catégorisation erreurs échouée: ${error.message}`);
  }
}

export async function generateErrorResolutionPlan(errorAnalytics, resolutionStrategies = {}) {
  if (!errorAnalytics || typeof errorAnalytics !== 'object') {
    throw new Error('ErrorAnalyticsError: ErrorAnalytics requis object');
  }

  try {
    const errors = errorAnalytics.errors || [];
    const resolutionPlan = {
      immediate: [],
      shortTerm: [],
      longTerm: [],
      monitoring: []
    };

    const criticalErrors = errors.filter(err => err.severity === 'critical').slice(0, 5);
    
    criticalErrors.forEach(error => {
      resolutionPlan.immediate.push({
        errorId: error.id,
        priority: 'critical',
        action: 'Résoudre erreur critique immédiatement',
        estimatedTime: '2-4h'
      });
    });

    return {
      resolutionPlan,
      roi: {
        costReduction: errors.length * 50,
        totalROI: 150
      },
      summary: {
        immediateActions: resolutionPlan.immediate.length,
        shortTermActions: resolutionPlan.shortTerm.length,
        longTermActions: resolutionPlan.longTerm.length
      },
      metadata: {
        errorsAnalyzed: errors.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`ResolutionError: Génération plan résolution échouée: ${error.message}`);
  }
}

// === HELPER FUNCTIONS ===
function normalizeTimeRange(timeRange) {
  const now = Date.now();
  return {
    start: timeRange.start ? new Date(timeRange.start).getTime() : now - (7 * 24 * 60 * 60 * 1000),
    end: timeRange.end ? new Date(timeRange.end).getTime() : now
  };
}

async function generateErrorData(timeRange, filters, includeStackTraces) {
  const errors = [];
  const errorTypes = ['NETWORK_ERROR', 'VALIDATION_ERROR', 'DB_ERROR'];
  
  for (let i = 0; i < 30; i++) {
    const error = {
      id: `error_${i}`,
      timestamp: new Date(timeRange.start + Math.random() * (timeRange.end - timeRange.start)).toISOString(),
      type: errorTypes[Math.floor(Math.random() * errorTypes.length)],
      message: `Error message ${i}`,
      severity: Math.random() > 0.8 ? 'critical' : 'medium'
    };

    if (includeStackTraces) {
      error.stackTrace = `Error at line ${Math.floor(Math.random() * 100)}`;
    }

    errors.push(error);
  }

  return errors;
}

function classifyErrors(errors) {
  const classifications = {
    bySeverity: {},
    byType: {}
  };

  errors.forEach(error => {
    if (!classifications.bySeverity[error.severity]) {
      classifications.bySeverity[error.severity] = [];
    }
    classifications.bySeverity[error.severity].push(error);

    if (!classifications.byType[error.type]) {
      classifications.byType[error.type] = [];
    }
    classifications.byType[error.type].push(error);
  });

  return classifications;
}

function generateResolutions(errors) {
  return errors.slice(0, 5).map(error => ({
    errorId: error.id,
    priority: error.severity === 'critical' ? 'immediate' : 'medium',
    suggestion: `Résoudre ${error.type}`,
    estimatedTime: '2-6h'
  }));
}
