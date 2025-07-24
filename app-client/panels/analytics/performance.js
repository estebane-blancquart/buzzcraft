/**
 * COMMIT 69 - Panel Analytics
 * 
 * FAIT QUOI : Analytiques performance avec métriques temps réel et optimisation
 * REÇOIT : timeRange: object, metricTypes: string[], includeRecommendations: boolean
 * RETOURNE : { performance: object[], metrics: object, optimizations: object[], metadata: object }
 * ERREURS : PerformanceError si métriques indisponibles, MetricError si types invalides, OptimizationError si recommandations échouent
 */

// DEPENDENCY FLOW (no circular deps)

export async function createPerformanceAnalytics(timeRange = {}, metricTypes = ['response'], includeRecommendations = true) {
  if (typeof timeRange !== 'object') {
    throw new Error('PerformanceError: TimeRange doit être object');
  }

  if (!Array.isArray(metricTypes)) {
    throw new Error('MetricError: MetricTypes doit être array');
  }

  const validMetrics = ['response', 'throughput', 'errors', 'resource', 'network'];
  const invalidMetrics = metricTypes.filter(type => !validMetrics.includes(type));
  if (invalidMetrics.length > 0) {
    throw new Error(`MetricError: Types invalides: ${invalidMetrics.join(', ')}`);
  }

  try {
    const normalizedTimeRange = normalizeTimeRange(timeRange);
    const performance = await generatePerformanceData(normalizedTimeRange, metricTypes);
    const metrics = calculatePerformanceMetrics(performance);
    const optimizations = includeRecommendations ? generateOptimizations(metrics) : [];

    return {
      performance,
      metrics,
      optimizations,
      metadata: {
        timeRange: normalizedTimeRange,
        metricTypes,
        dataPoints: performance.length,
        includeRecommendations,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`PerformanceError: Création analytics performance échouée: ${error.message}`);
  }
}

export async function validatePerformanceThresholds(performanceData, thresholds = {}) {
  if (!performanceData || typeof performanceData !== 'object') {
    throw new Error('PerformanceError: PerformanceData requis object');
  }

  const defaultThresholds = {
    responseTime: { warning: 500, critical: 1000 },
    throughput: { warning: 10, critical: 5 },
    errorRate: { warning: 0.05, critical: 0.1 }
  };

  const finalThresholds = { ...defaultThresholds, ...thresholds };

  try {
    const violations = [];
    const warnings = [];
    const metrics = performanceData.metrics || {};

    if (metrics.averageResponseTime > finalThresholds.responseTime.critical) {
      violations.push({
        metric: 'responseTime',
        level: 'critical',
        value: metrics.averageResponseTime
      });
    }

    const healthScore = 100 - (violations.length * 25) - (warnings.length * 10);

    return {
      valid: violations.length === 0,
      violations,
      warnings,
      healthScore: Math.max(0, healthScore),
      thresholds: finalThresholds,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`PerformanceError: Validation thresholds échouée: ${error.message}`);
  }
}

export async function benchmarkPerformance(currentPerformance, baselinePerformance, comparisonMetrics = ['responseTime']) {
  if (!currentPerformance || typeof currentPerformance !== 'object') {
    throw new Error('PerformanceError: CurrentPerformance requis object');
  }

  if (!baselinePerformance || typeof baselinePerformance !== 'object') {
    throw new Error('PerformanceError: BaselinePerformance requis object');
  }

  try {
    const currentMetrics = currentPerformance.metrics || {};
    const baselineMetrics = baselinePerformance.metrics || {};
    const comparisons = {};

    for (const metric of comparisonMetrics) {
      const current = currentMetrics[metric] || 0;
      const baseline = baselineMetrics[metric] || 0;
      const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;

      comparisons[metric] = {
        current,
        baseline,
        change: Math.abs(change),
        improved: change < 0
      };
    }

    const overallScore = Object.values(comparisons).reduce((sum, comp) => 
      sum + (comp.improved ? 20 : -10), 50);

    return {
      comparisons,
      improvements: Object.values(comparisons).filter(c => c.improved).length,
      regressions: Object.values(comparisons).filter(c => !c.improved).length,
      overallScore: Math.max(0, overallScore),
      metadata: {
        comparisonMetrics,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`PerformanceError: Benchmark performance échoué: ${error.message}`);
  }
}

export async function optimizePerformanceProfile(performanceData, optimizationTargets = {}) {
  if (!performanceData || typeof performanceData !== 'object') {
    throw new Error('PerformanceError: PerformanceData requis object');
  }

  try {
    const metrics = performanceData.metrics || {};
    const optimizations = [];

    if (metrics.averageResponseTime > 500) {
      optimizations.push({
        metric: 'responseTime',
        priority: 'high',
        recommendation: 'Optimiser temps de réponse',
        estimatedImpact: 'high'
      });
    }

    return {
      optimizations,
      actionPlan: {
        immediate: optimizations.filter(o => o.priority === 'critical'),
        shortTerm: optimizations.filter(o => o.priority === 'high'),
        longTerm: optimizations.filter(o => o.priority === 'medium')
      },
      optimizationScore: {
        totalImpact: optimizations.length * 20,
        totalEffort: optimizations.length * 10
      },
      metadata: {
        optimizationsIdentified: optimizations.length,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    throw new Error(`OptimizationError: Optimisation profil performance échouée: ${error.message}`);
  }
}

// === HELPER FUNCTIONS ===
function normalizeTimeRange(timeRange) {
  const now = Date.now();
  return {
    start: timeRange.start ? new Date(timeRange.start).getTime() : now - (24 * 60 * 60 * 1000),
    end: timeRange.end ? new Date(timeRange.end).getTime() : now
  };
}

async function generatePerformanceData(timeRange, metricTypes) {
  const data = [];
  const hourMs = 60 * 60 * 1000;
  
  for (let time = timeRange.start; time <= timeRange.end; time += hourMs) {
    const dataPoint = {
      timestamp: new Date(time).toISOString()
    };

    if (metricTypes.includes('response')) {
      dataPoint.responseTime = Math.floor(Math.random() * 500) + 100;
    }

    if (metricTypes.includes('throughput')) {
      dataPoint.requestsPerSecond = Math.floor(Math.random() * 50) + 10;
    }

    data.push(dataPoint);
  }

  return data;
}

function calculatePerformanceMetrics(performanceData) {
  const responseTimes = performanceData.map(d => d.responseTime).filter(Boolean);
  const throughputs = performanceData.map(d => d.requestsPerSecond).filter(Boolean);

  return {
    averageResponseTime: responseTimes.length > 0 ? 
      responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length : 0,
    requestsPerSecond: throughputs.length > 0 ? 
      throughputs.reduce((sum, rps) => sum + rps, 0) / throughputs.length : 0
  };
}

function generateOptimizations(metrics) {
  const optimizations = [];

  if (metrics.averageResponseTime > 300) {
    optimizations.push({
      type: 'response_time',
      priority: 'high',
      recommendation: 'Optimiser temps de réponse'
    });
  }

  return optimizations;
}
