/**
 * COMMIT 14 - System Analytics
 * 
 * FAIT QUOI : Analyse et vérification des systèmes de métriques et KPIs
 * REÇOIT : metricsConfig: object, options: { validateThresholds?: boolean, checkAlerts?: boolean }
 * RETOURNE : { config: object, valid: boolean, metrics: array, thresholds: object, accessible: boolean }
 * ERREURS : ValidationError si metricsConfig invalide, MetricsError si configuration incorrecte
 */

export function checkMetricsSystem(metricsConfig, options = {}) {
  // Validation OBLIGATOIRE (toujours ValidationError)
  if (!metricsConfig || typeof metricsConfig !== 'object') {
    throw new Error('ValidationError: metricsConfig must be a non-empty object');
  }
  
  if (typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  // Validation structure minimale
  if (!metricsConfig.metrics || !Array.isArray(metricsConfig.metrics)) {
    throw new Error('ValidationError: metricsConfig.metrics must be an array');
  }

  // Logique minimale avec try/catch
  try {
    const validateThresholds = options.validateThresholds !== false;
    const checkAlerts = options.checkAlerts !== false;
    
    // Test metrics simple (simulation validation métriques)
    const metrics = metricsConfig.metrics;
    const aggregation = metricsConfig.aggregation || 'sum';
    const interval = metricsConfig.interval || '5m';
    
    // Validation métriques basique
    const validMetrics = metrics.every(metric => 
      typeof metric === 'string' || 
      (typeof metric === 'object' && metric.name && metric.type)
    );
    
    // Simulation vérification thresholds
    const thresholds = metricsConfig.thresholds || {};
    const thresholdsValid = validateThresholds ? 
      Object.values(thresholds).every(threshold => 
        typeof threshold === 'number' || 
        (typeof threshold === 'object' && threshold.warning && threshold.critical)
      ) : true;
    
    // Simulation alerting
    const alerting = {
      enabled: checkAlerts && metricsConfig.alerting !== false,
      channels: metricsConfig.alertChannels || ['email'],
      rules: Object.keys(thresholds).length
    };
    
    const supportedAggregations = ['sum', 'avg', 'min', 'max', 'count'];
    const aggregationSupported = supportedAggregations.includes(aggregation);
    
    const isValid = validMetrics && thresholdsValid && aggregationSupported;
    
    return {
      config: metricsConfig,
      valid: isValid,
      metrics: metrics,
      aggregation: {
        type: aggregation,
        supported: aggregationSupported,
        interval: interval
      },
      thresholds: thresholds,
      alerting: alerting,
      accessible: true,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      config: metricsConfig,
      valid: false,
      metrics: [],
      aggregation: {
        type: 'unknown',
        supported: false,
        interval: 'unknown'
      },
      thresholds: {},
      alerting: {
        enabled: false,
        channels: [],
        rules: 0
      },
      accessible: false,
      timestamp: new Date().toISOString()
    };
  }
}

// systems/analytics/metrics : System Analytics (commit 14)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
