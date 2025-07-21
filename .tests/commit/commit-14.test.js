/**
 * Test COMMIT 14 - System Analytics
 */

import { checkTrackingSystem } from '../../app-server/systems/analytics/tracking.js';
import { checkMetricsSystem } from '../../app-server/systems/analytics/metrics.js';
import { checkReportingSystem } from '../../app-server/systems/analytics/reporting.js';

describe('COMMIT 14 - System Analytics', () => {
  
  // === TESTS TRACKING ===
  test('checkTrackingSystem - structure retour correcte', async () => {
    const config = {
      provider: 'google-analytics',
      endpoints: ['https://analytics.google.com/collect'],
      events: ['pageview', 'click', 'conversion']
    };
    const result = await checkTrackingSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('operational');
    expect(result).toHaveProperty('endpoints');
    expect(result).toHaveProperty('events');
    expect(result).toHaveProperty('provider');
    expect(result).toHaveProperty('privacy');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.operational).toBe('boolean');
    expect(Array.isArray(result.endpoints)).toBe(true);
    expect(Array.isArray(result.events)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.provider).toHaveProperty('name');
    expect(result.provider).toHaveProperty('supported');
  });

  test('checkTrackingSystem - accepte options personnalisées', async () => {
    const config = {
      provider: 'mixpanel',
      endpoints: ['https://api.mixpanel.com/track'],
      gdpr: true,
      cookieConsent: true,
      anonymizeIP: true
    };
    const result = await checkTrackingSystem(config, {
      validateEndpoints: true,
      checkPrivacy: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.privacy.gdprCompliant).toBe(true);
    expect(result.privacy.cookieConsent).toBe(true);
    expect(result.privacy.anonymizeIP).toBe(true);
    expect(result.provider.supported).toBe(true);
  });

  test('checkTrackingSystem - validation entrées invalides', async () => {
    await expect(checkTrackingSystem(null)).rejects.toThrow('ValidationError');
    await expect(checkTrackingSystem('')).rejects.toThrow('ValidationError');
    await expect(checkTrackingSystem({})).rejects.toThrow('ValidationError');
    await expect(checkTrackingSystem({ provider: '' })).rejects.toThrow('ValidationError');
    await expect(checkTrackingSystem({ provider: 'valid' }, 'invalid')).rejects.toThrow('ValidationError');
  });

  // === TESTS METRICS ===
  test('checkMetricsSystem - structure retour correcte', () => {
    const config = {
      metrics: ['cpu_usage', 'memory_usage', 'response_time'],
      aggregation: 'avg',
      interval: '1m',
      thresholds: {
        cpu_usage: { warning: 70, critical: 90 },
        memory_usage: { warning: 80, critical: 95 }
      }
    };
    const result = checkMetricsSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('aggregation');
    expect(result).toHaveProperty('thresholds');
    expect(result).toHaveProperty('alerting');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.valid).toBe('boolean');
    expect(Array.isArray(result.metrics)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.aggregation).toHaveProperty('type');
    expect(result.aggregation).toHaveProperty('supported');
    expect(result.aggregation).toHaveProperty('interval');
  });

  test('checkMetricsSystem - accepte options personnalisées', () => {
    const config = {
      metrics: [
        { name: 'requests_per_second', type: 'counter' },
        { name: 'error_rate', type: 'gauge' }
      ],
      aggregation: 'sum',
      thresholds: {
        error_rate: 0.05
      },
      alerting: true,
      alertChannels: ['email', 'slack']
    };
    const result = checkMetricsSystem(config, {
      validateThresholds: true,
      checkAlerts: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.aggregation.type).toBe('sum');
    expect(result.aggregation.supported).toBe(true);
    expect(result.alerting.enabled).toBe(true);
    expect(result.alerting.channels).toContain('email');
  });

  test('checkMetricsSystem - validation entrées invalides', () => {
    expect(() => checkMetricsSystem(null)).toThrow('ValidationError');
    expect(() => checkMetricsSystem('')).toThrow('ValidationError');
    expect(() => checkMetricsSystem({})).toThrow('ValidationError');
    expect(() => checkMetricsSystem({ metrics: 'invalid' })).toThrow('ValidationError');
    expect(() => checkMetricsSystem({ metrics: [] }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS REPORTING ===
  test('checkReportingSystem - structure retour correcte', () => {
    const config = {
      type: 'dashboard',
      formats: ['pdf', 'html'],
      frequency: 'weekly',
      recipients: ['admin@example.com']
    };
    const result = checkReportingSystem(config);
    
    expect(result).toHaveProperty('config');
    expect(result).toHaveProperty('feasible');
    expect(result).toHaveProperty('formats');
    expect(result).toHaveProperty('schedule');
    expect(result).toHaveProperty('generation');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('accessible');
    expect(result).toHaveProperty('timestamp');
    expect(result.config).toEqual(config);
    expect(typeof result.feasible).toBe('boolean');
    expect(Array.isArray(result.formats)).toBe(true);
    expect(typeof result.accessible).toBe('boolean');
    expect(result.schedule).toHaveProperty('frequency');
    expect(result.schedule).toHaveProperty('recipients');
    expect(result.type).toHaveProperty('name');
    expect(result.type).toHaveProperty('supported');
  });

  test('checkReportingSystem - accepte options personnalisées', () => {
    const config = {
      type: 'summary',
      formats: ['csv', 'excel'],
      frequency: 'monthly',
      time: '08:00',
      timezone: 'Europe/Paris',
      recipients: ['report@company.com'],
      template: 'executive',
      dataSource: 'warehouse'
    };
    const result = checkReportingSystem(config, {
      validateSchedule: true,
      checkFormats: true
    });
    
    expect(result.config).toEqual(config);
    expect(result.schedule.frequency).toBe('monthly');
    expect(result.schedule.timezone).toBe('Europe/Paris');
    expect(result.generation.template).toBe('executive');
    expect(result.type.supported).toBe(true);
  });

  test('checkReportingSystem - validation entrées invalides', () => {
    expect(() => checkReportingSystem(null)).toThrow('ValidationError');
    expect(() => checkReportingSystem('')).toThrow('ValidationError');
    expect(() => checkReportingSystem({})).toThrow('ValidationError');
    expect(() => checkReportingSystem({ type: '' })).toThrow('ValidationError');
    expect(() => checkReportingSystem({ type: 'valid' }, 'invalid')).toThrow('ValidationError');
  });

  // === TESTS EDGE CASES ===
  test('Gestion des cas limites et erreurs', async () => {
    // Test tracking avec endpoints invalides
    const trackingResult = await checkTrackingSystem({
      provider: 'custom',
      endpoints: ['invalid-url', 'not-https']
    }, { validateEndpoints: true });
    expect(trackingResult.operational).toBe(false);

    // Test metrics avec aggregation non supportée
    const metricsResult = checkMetricsSystem({
      metrics: ['test'],
      aggregation: 'unsupported'
    });
    expect(metricsResult.valid).toBe(false);
    expect(metricsResult.aggregation.supported).toBe(false);

    // Test reporting avec format non supporté
    const reportingResult = checkReportingSystem({
      type: 'dashboard',
      formats: ['unsupported-format']
    }, { checkFormats: true });
    expect(reportingResult.feasible).toBe(false);

    // Test provider non supporté
    const unsupportedResult = await checkTrackingSystem({
      provider: 'unknown-provider',
      endpoints: []
    });
    expect(unsupportedResult.provider.supported).toBe(false);
    expect(unsupportedResult.operational).toBe(false);
  });

});
