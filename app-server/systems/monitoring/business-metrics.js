/**
 * COMMIT 18 - System Monitoring
 * 
 * FAIT QUOI : Analyse et vérification des métriques business et KPIs de monitoring
 * REÇOIT : metricsConfig: object, options: { validateKPIs?: boolean, checkAggregation?: boolean }
 * RETOURNE : { config: object, operational: boolean, kpis: array, aggregation: object, accessible: boolean }
 * ERREURS : ValidationError si metricsConfig invalide, MetricsError si configuration incorrecte
 */

export function checkBusinessMetrics(metricsConfig, options = {}) {
  // Validation OBLIGATOIRE (toujours ValidationError)
  if (!metricsConfig || typeof metricsConfig !== 'object') {
    throw new Error('ValidationError: metricsConfig must be a non-empty object');
  }
  
  if (typeof options !== 'object') {
    throw new Error('ValidationError: options must be an object');
  }

  // Validation structure minimale
  if (!metricsConfig.domain || typeof metricsConfig.domain !== 'string') {
    throw new Error('ValidationError: metricsConfig.domain must be a string');
  }

  // Logique minimale avec try/catch
  try {
    const validateKPIs = options.validateKPIs !== false;
    const checkAggregation = options.checkAggregation !== false;
    
    // Test metrics simple (simulation validation métriques business)
    const domain = metricsConfig.domain.toLowerCase();
    const kpis = metricsConfig.kpis || [];
    
    const supportedDomains = ['sales', 'marketing', 'product', 'operations', 'finance', 'customer'];
    const isDomainSupported = supportedDomains.includes(domain);
    
    // Simulation validation KPIs
    const businessKPIs = {
      'sales': ['revenue', 'conversion_rate', 'average_order_value', 'customer_lifetime_value'],
      'marketing': ['cac', 'roi', 'lead_generation', 'brand_awareness'],
      'product': ['dau', 'mau', 'retention_rate', 'feature_adoption'],
      'operations': ['uptime', 'response_time', 'error_rate', 'throughput'],
      'finance': ['mrr', 'arr', 'churn_rate', 'gross_margin'],
      'customer': ['nps', 'csat', 'support_tickets', 'resolution_time']
    };
    
    const domainKPIs = businessKPIs[domain] || [];
    const validKPIs = validateKPIs ? 
      kpis.every(kpi => {
        const kpiName = typeof kpi === 'string' ? kpi : kpi.name;
        return kpiName && domainKPIs.includes(kpiName.toLowerCase());
      }) : true;
    
    // Simulation données métriques
    const metrics = kpis.map(kpi => ({
      name: typeof kpi === 'string' ? kpi : kpi.name,
      value: Math.random() * 1000,
      target: (typeof kpi === 'object' && kpi.target) || Math.random() * 1200,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      period: 'monthly'
    }));
    
    // Simulation aggregation
    const aggregation = checkAggregation ? {
      method: metricsConfig.aggregation?.method || 'average',
      interval: metricsConfig.aggregation?.interval || '1h',
      retention: metricsConfig.aggregation?.retention || '30d',
      groupBy: metricsConfig.aggregation?.groupBy || ['date', 'category']
    } : { method: 'unknown', interval: 'unknown', retention: 'unknown', groupBy: [] };
    
    const supportedMethods = ['sum', 'average', 'min', 'max', 'count', 'percentile'];
    const aggregationValid = supportedMethods.includes(aggregation.method);
    
    // Simulation alerting
    const alerting = {
      rules: metricsConfig.alerting?.rules || [],
      thresholds: metricsConfig.alerting?.thresholds || {},
      notifications: metricsConfig.alerting?.notifications !== false
    };
    
    // Simulation dashboards
    const dashboards = {
      enabled: metricsConfig.dashboards !== false,
      realtime: metricsConfig.realtime !== false,
      customizable: metricsConfig.customizable !== false,
      sharing: metricsConfig.sharing !== false
    };
    
    const isOperational = isDomainSupported && 
      validKPIs && 
      aggregationValid && 
      kpis.length > 0;
    
    return {
      config: metricsConfig,
      operational: isOperational,
      domain: {
        name: domain,
        supported: isDomainSupported,
        availableKPIs: domainKPIs
      },
      kpis: metrics,
      aggregation,
      alerting,
      dashboards,
      accessible: true,
      timestamp: new Date().toISOString()
    };
  } catch {
    return {
      config: metricsConfig,
      operational: false,
      domain: {
        name: 'unknown',
        supported: false,
        availableKPIs: []
      },
      kpis: [],
      aggregation: {
        method: 'unknown',
        interval: 'unknown',
        retention: 'unknown',
        groupBy: []
      },
      alerting: {
        rules: [],
        thresholds: {},
        notifications: false
      },
      dashboards: {
        enabled: false,
        realtime: false,
        customizable: false,
        sharing: false
      },
      accessible: false,
      timestamp: new Date().toISOString()
    };
  }
}

// systems/monitoring/business-metrics : System Monitoring (commit 18)
// DEPENDENCY FLOW (no circular deps)
// systems/ → utils/
