/**
 * TESTS COMMIT 69 - Panel Analytics
 * Validation exhaustive des modules analytics
 */

import { 
  createUsageAnalytics, 
  validateUsageData, 
  aggregateUsageMetrics, 
  generateUsageInsights 
} from '../../app-client/panels/analytics/usage.js';

import { 
  createPerformanceAnalytics, 
  validatePerformanceThresholds, 
  benchmarkPerformance, 
  optimizePerformanceProfile 
} from '../../app-client/panels/analytics/performance.js';

import { 
  createErrorAnalytics, 
  validateErrorPatterns, 
  categorizeErrorsByType, 
  generateErrorResolutionPlan 
} from '../../app-client/panels/analytics/errors.js';

import { 
  createAnalyticsInsights, 
  validateInsightQuality, 
  correlateInsights, 
  generateActionableRecommendations 
} from '../../app-client/panels/analytics/insights.js';

// === TESTS USAGE ===
describe('COMMIT 69 - Panel Analytics Usage', () => {
  test('createUsageAnalytics - validation complète', async () => {
    const timeRange = { start: Date.now() - 86400000, end: Date.now() };
    const result = await createUsageAnalytics(timeRange, {}, true);
    
    expect(result).toHaveProperty('usage');
    expect(result).toHaveProperty('sessions');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('metadata');
    expect(Array.isArray(result.usage)).toBe(true);
  });

  test('createUsageAnalytics - erreurs typées', async () => {
    await expect(createUsageAnalytics('invalid'))
      .rejects.toThrow('UsageError: TimeRange doit être object');
  });

  test('validateUsageData - structure valide', async () => {
    const usageData = {
      usage: [{ timestamp: new Date().toISOString(), users: 10 }],
      metrics: { totalUsers: 10 }
    };

    const result = await validateUsageData(usageData);
    expect(result.valid).toBe(true);
  });

  test('aggregateUsageMetrics - agrégation', async () => {
    const usageAnalytics = { usage: [] };
    const result = await aggregateUsageMetrics(usageAnalytics, 'daily');
    
    expect(result).toHaveProperty('aggregated');
    expect(result.metadata.aggregationType).toBe('daily');
  });

  test('generateUsageInsights - insights', async () => {
    const usageAnalytics = { usage: [{ users: 10 }] };
    const result = await generateUsageInsights(usageAnalytics, ['trends']);
    
    expect(Array.isArray(result.insights)).toBe(true);
  });
});

// === TESTS PERFORMANCE ===
describe('COMMIT 69 - Panel Analytics Performance', () => {
  test('createPerformanceAnalytics - métriques', async () => {
    const result = await createPerformanceAnalytics({}, ['response'], true);
    
    expect(result).toHaveProperty('performance');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('optimizations');
  });

  test('validatePerformanceThresholds - validation', async () => {
    const performanceData = { metrics: { averageResponseTime: 300 } };
    const result = await validatePerformanceThresholds(performanceData);
    
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('healthScore');
  });

  test('benchmarkPerformance - comparaison', async () => {
    const current = { metrics: { responseTime: 200 } };
    const baseline = { metrics: { responseTime: 300 } };
    const result = await benchmarkPerformance(current, baseline);
    
    expect(result).toHaveProperty('comparisons');
    expect(result).toHaveProperty('overallScore');
  });

  test('optimizePerformanceProfile - optimisation', async () => {
    const performanceData = { metrics: { averageResponseTime: 800 } };
    const result = await optimizePerformanceProfile(performanceData);
    
    expect(result).toHaveProperty('optimizations');
  });
});

// === TESTS ERRORS ===
describe('COMMIT 69 - Panel Analytics Errors', () => {
  test('createErrorAnalytics - analytics erreurs', async () => {
    const result = await createErrorAnalytics({}, {}, false);
    
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('classifications');
    expect(Array.isArray(result.errors)).toBe(true);
  });

  test('validateErrorPatterns - validation', async () => {
    const errorData = { errors: [], metadata: { totalRequests: 1000 } };
    const result = await validateErrorPatterns(errorData);
    
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('summary');
  });

  test('categorizeErrorsByType - catégorisation', async () => {
    const errors = [{ type: 'NETWORK_ERROR' }, { type: 'VALIDATION_ERROR' }];
    const result = await categorizeErrorsByType(errors);
    
    expect(result).toHaveProperty('categorized');
    expect(result).toHaveProperty('stats');
  });

  test('generateErrorResolutionPlan - résolution', async () => {
    const errorAnalytics = { errors: [{ severity: 'critical', id: 'e1' }] };
    const result = await generateErrorResolutionPlan(errorAnalytics);
    
    expect(result).toHaveProperty('resolutionPlan');
    expect(result).toHaveProperty('roi');
  });
});

// === TESTS INSIGHTS ===
describe('COMMIT 69 - Panel Analytics Insights', () => {
  test('createAnalyticsInsights - insights', async () => {
    const analyticsData = { usage: [{ users: 10 }] };
    const result = await createAnalyticsInsights(analyticsData, ['trends'], true);
    
    expect(result).toHaveProperty('insights');
    expect(result).toHaveProperty('recommendations');
    expect(result.metadata.aiEnabled).toBe(true);
  });

  test('validateInsightQuality - qualité', async () => {
    const insights = [{ confidence: 0.8, type: 'trends' }];
    const result = await validateInsightQuality(insights);
    
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('qualityScore');
  });

  test('correlateInsights - corrélations', async () => {
    const insights = [{ type: 'trends' }, { type: 'trends' }];
    const result = await correlateInsights(insights);
    
    expect(result).toHaveProperty('correlations');
    expect(Array.isArray(result.correlations)).toBe(true);
  });

  test('generateActionableRecommendations - recommandations', async () => {
    const insights = [{ confidence: 0.9, description: 'Test insight' }];
    const result = await generateActionableRecommendations(insights);
    
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('actionPlans');
  });
});

// === TESTS INTÉGRATION ===
describe('COMMIT 69 - Panel Analytics Integration', () => {
  test('workflow complet - analytics end-to-end', async () => {
    const timeRange = { start: Date.now() - 86400000, end: Date.now() };

    const usage = await createUsageAnalytics(timeRange);
    expect(usage.usage).toBeDefined();

    const performance = await createPerformanceAnalytics(timeRange);
    expect(performance.performance).toBeDefined();

    const errors = await createErrorAnalytics(timeRange);
    expect(errors.errors).toBeDefined();

    const insights = await createAnalyticsInsights({
      usage: usage.usage,
      performance: performance.performance,
      errors: errors.errors
    });
    expect(insights.insights).toBeDefined();

    // Validation timestamps
    expect(usage.metadata.timestamp).toBeDefined();
    expect(performance.metadata.timestamp).toBeDefined();
    expect(errors.metadata.timestamp).toBeDefined();
    expect(insights.metadata.timestamp).toBeDefined();
  });

  test('gestion erreurs cohérente', async () => {
    const errorTests = [
      () => createUsageAnalytics('invalid'),
      () => createPerformanceAnalytics('invalid'),
      () => createErrorAnalytics('invalid'),
      () => createAnalyticsInsights('invalid')
    ];

    for (const test of errorTests) {
      await expect(test()).rejects.toThrow(/Error:/);
    }
  });
});

console.log('✅ TESTS COMMIT 69 - Panel Analytics - SUCCÈS');
