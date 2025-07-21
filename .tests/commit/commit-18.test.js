/**
 * Test COMMIT 18 - System Monitoring
 */

import { checkSystemHealth } from '../../app-server/systems/monitoring/health-checks.js';
import { checkBusinessMetrics } from '../../app-server/systems/monitoring/business-metrics.js';
import { checkAlertingSystem } from '../../app-server/systems/monitoring/alerts.js';

describe('COMMIT 18 - System Monitoring', () => {
  
  // === TESTS HEALTH CHECKS ===
  test('checkSystemHealth - structure retour correcte', async () => {
    const config = {
      service: 'api-gateway',
      interval: 60,
      checks: [
        { name: 'database', status: 'healthy' },
        { name: 'cache', status: 'healthy' }
      ]
    };
    const result = await checkSystemHealth(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('healthy');
    expect(result).toHaveProperty('service');
    expect(result).toHaveProperty('checks');
    expect(result).toHaveProperty('endpoints');
    expect(result).toHaveProperty('thresholds');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('notifications');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.healthy).toBe('boolean');
    expect(typeof result.service).toBe('string');
    expect(Array.isArray(result.checks)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkSystemHealth - accepte options personnalisées', async () => {
    const config = {
      service: 'database-cluster',
      endpoints: {
        liveness: '/db/health',
        readiness: '/db/ready'
      },
      thresholds: {
        responseTime: 500,
        availability: 0.995
      },
      notifications: true
    };
    const result = await checkSystemHealth(config, {
      checkEndpoints: true,
      validateThresholds: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.service).toBe('database-cluster');
    expect(result.endpoints.liveness).toBe('/db/health');
    expect(result.thresholds.responseTime).toBe(500);
    expect(result.notifications.enabled).toBe(true);
  });

  test('checkSystemHealth - validation entrées invalides', async () => {
    await expect(checkSystemHealth(null)).rejects.toThrow('ValidationError');
    await expect(checkSystemHealth('')).rejects.toThrow('ValidationError');
    await expect(checkSystemHealth({})).rejects.toThrow('ValidationError');
    await expect(checkSystemHealth({ service: '' })).rejects.toThrow('ValidationError');
    await expect(checkSystemHealth({ service: 'valid' }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS BUSINESS METRICS ===
  test('checkBusinessMetrics - structure retour correcte', () => {
    const config = {
      domain: 'sales',
      kpis: ['revenue', 'conversion_rate'],
      aggregation: {
        method: 'sum',
        interval: '1d'
      }
    };
    const result = checkBusinessMetrics(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('domain');
    expect(result).toHaveProperty('kpis');
    expect(result).toHaveProperty('aggregation');
    expect(result).toHaveProperty('alerting');
    expect(result).toHaveProperty('dashboards');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.operational).toBe('boolean');
    expect(Array.isArray(result.kpis)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.domain).toHaveProperty('name');
    expect(result.domain).toHaveProperty('supported');
    expect(result.domain).toHaveProperty('availableKPIs');
  });

  test('checkBusinessMetrics - accepte options personnalisées', () => {
    const config = {
      domain: 'product',
      kpis: [
        { name: 'dau', target: 10000 },
        { name: 'retention_rate', target: 0.8 }
      ],
      dashboards: true,
      realtime: true
    };
    const result = checkBusinessMetrics(config, {
      validateKPIs: true,
      checkAggregation: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.domain.name).toBe('product');
    expect(result.domain.supported).toBe(true);
    expect(result.kpis).toHaveLength(2);
    expect(result.dashboards.enabled).toBe(true);
    expect(result.dashboards.realtime).toBe(true);
  });

  test('checkBusinessMetrics - validation entrées invalides', () => {
    expect(() => checkBusinessMetrics(null)).toThrow('ValidationError');
    expect(() => checkBusinessMetrics('')).toThrow('ValidationError');
    expect(() => checkBusinessMetrics({})).toThrow('ValidationError');
    expect(() => checkBusinessMetrics({ domain: '' })).toThrow('ValidationError');
    expect(() => checkBusinessMetrics({ domain: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS ALERTS ===
  test('checkAlertingSystem - structure retour correcte', async () => {
    const config = {
      rules: [
        { name: 'high-cpu', condition: 'cpu > 80%', severity: 'warning' },
        { name: 'db-down', condition: 'db_status = down', severity: 'critical' }
      ],
      channels: {
        email: true,
        slack: true
      }
    };
    const result = await checkAlertingSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('configured');
    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('channels');
    expect(result).toHaveProperty('escalation');
    expect(result).toHaveProperty('suppression');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('defaultSeverity');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.configured).toBe('boolean');
    expect(Array.isArray(result.rules)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
  });

  test('checkAlertingSystem - accepte options personnalisées', async () => {
    const config = {
      rules: [
        'memory-alert',
        'disk-space-alert'
      ],
      defaultSeverity: 'critical',
      escalation: true,
      cooldown: 600
    };
    const result = await checkAlertingSystem(config, {
      validateRules: true,
      checkChannels: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.rules).toHaveLength(2);
    expect(result.defaultSeverity).toBe('critical');
    expect(result.escalation.enabled).toBe(true);
    expect(result.suppression.cooldown).toBe(600);
  });

  test('checkAlertingSystem - validation entrées invalides', async () => {
    await expect(checkAlertingSystem(null)).rejects.toThrow('ValidationError');
    await expect(checkAlertingSystem('')).rejects.toThrow('ValidationError');
    await expect(checkAlertingSystem({})).rejects.toThrow('ValidationError');
    await expect(checkAlertingSystem({ rules: 'invalid' })).rejects.toThrow('ValidationError');
    await expect(checkAlertingSystem({ rules: [] }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test health avec checks critiques
    const criticalHealthResult = await checkSystemHealth({
      service: 'critical-service',
      checks: [
        { name: 'database', status: 'critical', responseTime: 5000 }
      ]
    });
    expect(criticalHealthResult.healthy).toBe(false);

    // Test metrics avec domaine non supporté
    const metricsResult = checkBusinessMetrics({
      domain: 'unsupported-domain',
      kpis: ['invalid-kpi']
    });
    expect(metricsResult.domain.supported).toBe(false);
    expect(metricsResult.operational).toBe(false);

    // Test alerts sans règles
    const emptyAlertsResult = await checkAlertingSystem({
      rules: []
    });
    expect(emptyAlertsResult.configured).toBe(false);
    expect(emptyAlertsResult.metrics.totalRules).toBe(0);

    // Test aggregation méthode non supportée
    const invalidAggregationResult = checkBusinessMetrics({
      domain: 'sales',
      kpis: ['revenue'],
      aggregation: {
        method: 'unsupported-method'
      }
    }, { checkAggregation: true });
    expect(invalidAggregationResult.operational).toBe(false);
  });

});
