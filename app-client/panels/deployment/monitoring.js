/**
 * COMMIT 66 - Panel Deployment
 * 
 * FAIT QUOI : Monitoring déploiement avec alertes temps réel et métriques performance
 * REÇOIT : deploymentId: string, metricsConfig?: object, alerting?: boolean
 * RETOURNE : { monitoring: object, metrics: object[], alerts: object[], dashboards: object }
 * ERREURS : MonitoringError si monitoring inaccessible, MetricsError si métriques invalides, AlertError si alertes échouent
 */

export async function createDeploymentMonitoring(deploymentId, metricsConfig = {}, alerting = true) {
  if (!deploymentId || typeof deploymentId !== 'string') {
    throw new Error('MonitoringError: DeploymentId requis string');
  }

  if (typeof metricsConfig !== 'object') {
    throw new Error('MonitoringError: MetricsConfig doit être object');
  }

  if (typeof alerting !== 'boolean') {
    throw new Error('MonitoringError: Alerting doit être boolean');
  }

  try {
    const monitoring = {
      deploymentId,
      enabled: true,
      interval: metricsConfig.interval || 30, // secondes
      retention: metricsConfig.retention || 24, // heures
      alerting
    };

    const metrics = await initializeMetrics(deploymentId, metricsConfig);
    const alerts = alerting ? await setupAlerting(deploymentId, metricsConfig) : [];
    const dashboards = await createMonitoringDashboards(deploymentId, metrics);

    return {
      monitoring,
      metrics,
      alerts,
      dashboards,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`MonitoringError: Création monitoring échouée: ${error.message}`);
  }
}

export async function validateMetricsThresholds(metrics, thresholds, options = {}) {
  if (!Array.isArray(metrics)) {
    throw new Error('MetricsError: Metrics doit être array');
  }

  if (!thresholds || typeof thresholds !== 'object') {
    throw new Error('MetricsError: Thresholds requis object');
  }

  const alertOnViolation = options.alertOnViolation !== false;
  const aggregateWindow = options.aggregateWindow || 300; // 5 minutes

  try {
    const violations = [];
    const warnings = [];

    for (const metric of metrics) {
      const thresholdConfig = thresholds[metric.name];
      if (!thresholdConfig) continue;

      // Validation seuil critique
      if (thresholdConfig.critical !== undefined) {
        const violatesCritical = checkThresholdViolation(metric, thresholdConfig.critical, 'critical');
        if (violatesCritical) {
          violations.push({
            metric: metric.name,
            level: 'critical',
            current: metric.value,
            threshold: thresholdConfig.critical,
            timestamp: metric.timestamp
          });
        }
      }

      // Validation seuil warning
      if (thresholdConfig.warning !== undefined) {
        const violatesWarning = checkThresholdViolation(metric, thresholdConfig.warning, 'warning');
        if (violatesWarning && !violations.some(v => v.metric === metric.name)) {
          warnings.push({
            metric: metric.name,
            level: 'warning',
            current: metric.value,
            threshold: thresholdConfig.warning,
            timestamp: metric.timestamp
          });
        }
      }
    }

    // Agrégation sur fenêtre de temps
    const aggregatedMetrics = aggregateWindow > 0 ? 
      aggregateMetricsOverWindow(metrics, aggregateWindow) : 
      metrics;

    return {
      valid: violations.length === 0,
      violations,
      warnings,
      metricsCount: metrics.length,
      thresholdsChecked: Object.keys(thresholds).length,
      aggregated: aggregateWindow > 0,
      alertOnViolation,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`MetricsError: Validation seuils échouée: ${error.message}`);
  }
}

export async function updateMonitoringConfiguration(monitoring, updates, options = {}) {
  if (!monitoring || typeof monitoring !== 'object') {
    throw new Error('MonitoringError: Monitoring requis object');
  }

  if (!updates || typeof updates !== 'object') {
    throw new Error('MonitoringError: Updates requis object');
  }

  const restartRequired = options.restartRequired !== false;
  const validateConfig = options.validateConfig !== false;

  try {
    // Validation configuration avant application
    if (validateConfig) {
      const validation = await validateMonitoringConfig(updates);
      if (!validation.valid) {
        throw new Error(`MonitoringError: Configuration invalide: ${validation.issues.join(', ')}`);
      }
    }

    const updatedMonitoring = {
      ...monitoring.monitoring,
      ...updates
    };

    // Gestion changements critiques
    const criticalChanges = [];
    if (updates.interval && updates.interval !== monitoring.monitoring.interval) {
      criticalChanges.push('interval_changed');
    }
    if (updates.alerting !== undefined && updates.alerting !== monitoring.monitoring.alerting) {
      criticalChanges.push('alerting_toggled');
    }

    // Reconfiguration métriques si nécessaire
    let updatedMetrics = monitoring.metrics;
    if (updates.metricsConfig) {
      updatedMetrics = await reconfigureMetrics(monitoring.deploymentId, updates.metricsConfig);
    }

    // Reconfiguration alertes si nécessaire
    let updatedAlerts = monitoring.alerts;
    if (updates.alerting !== undefined || updates.alertThresholds) {
      updatedAlerts = updates.alerting ? 
        await setupAlerting(monitoring.deploymentId, updates.alertThresholds || {}) : 
        [];
    }

    return {
      updated: true,
      monitoring: {
        ...monitoring,
        monitoring: updatedMonitoring,
        metrics: updatedMetrics,
        alerts: updatedAlerts
      },
      criticalChanges,
      restartRequired: restartRequired && criticalChanges.length > 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`MonitoringError: Mise à jour configuration échouée: ${error.message}`);
  }
}

export async function getMonitoringStatus(monitoring, options = {}) {
  if (!monitoring || typeof monitoring !== 'object') {
    throw new Error('MonitoringError: Monitoring requis object');
  }

  try {
    const isEnabled = monitoring.monitoring?.enabled || false;
    const hasMetrics = monitoring.metrics && Array.isArray(monitoring.metrics);
    const hasAlerts = monitoring.alerts && Array.isArray(monitoring.alerts);

    const status = isEnabled ? 
      (hasMetrics ? 'active' : 'configured') : 
      'disabled';

    const health = await calculateMonitoringHealth(monitoring);
    const recentAlerts = hasAlerts ? 
      monitoring.alerts.filter(alert => isRecentAlert(alert)).length : 
      0;

    return {
      status,
      enabled: isEnabled,
      health: health.overall,
      metricsCount: monitoring.metrics?.length || 0,
      activeAlerts: recentAlerts,
      alertingEnabled: monitoring.monitoring?.alerting || false,
      interval: monitoring.monitoring?.interval || 30,
      retention: monitoring.monitoring?.retention || 24,
      lastUpdate: monitoring.timestamp || new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'error',
      enabled: false,
      issues: [`status_check_failed: ${error.message}`],
      lastUpdate: new Date().toISOString()
    };
  }
}

// Helper functions pour simulation
async function initializeMetrics(deploymentId, config) {
  // Simulation initialisation métriques
  const metrics = [
    {
      name: 'cpu_usage',
      type: 'gauge',
      unit: 'percent',
      value: Math.random() * 100,
      timestamp: new Date().toISOString()
    },
    {
      name: 'memory_usage',
      type: 'gauge',
      unit: 'percent',
      value: Math.random() * 100,
      timestamp: new Date().toISOString()
    },
    {
      name: 'response_time',
      type: 'histogram',
      unit: 'ms',
      value: Math.random() * 500 + 50,
      timestamp: new Date().toISOString()
    },
    {
      name: 'error_rate',
      type: 'counter',
      unit: 'percent',
      value: Math.random() * 5,
      timestamp: new Date().toISOString()
    }
  ];

  return metrics;
}

async function setupAlerting(deploymentId, config) {
  // Simulation configuration alertes
  return [
    {
      id: 'high_cpu',
      name: 'High CPU Usage',
      metric: 'cpu_usage',
      threshold: 80,
      condition: 'greater_than',
      enabled: true
    },
    {
      id: 'high_memory',
      name: 'High Memory Usage',
      metric: 'memory_usage',
      threshold: 85,
      condition: 'greater_than',
      enabled: true
    },
    {
      id: 'slow_response',
      name: 'Slow Response Time',
      metric: 'response_time',
      threshold: 1000,
      condition: 'greater_than',
      enabled: true
    }
  ];
}

async function createMonitoringDashboards(deploymentId, metrics) {
  // Simulation création dashboards
  return {
    overview: {
      name: 'Overview',
      widgets: ['cpu_chart', 'memory_chart', 'response_time_chart'],
      layout: 'grid'
    },
    performance: {
      name: 'Performance',
      widgets: ['response_time_histogram', 'throughput_chart', 'error_rate_chart'],
      layout: 'stack'
    }
  };
}

function checkThresholdViolation(metric, threshold, level) {
  // Simulation vérification seuil
  if (typeof threshold === 'number') {
    return metric.value > threshold;
  }
  
  if (typeof threshold === 'object') {
    const { operator, value } = threshold;
    switch (operator) {
      case 'greater_than': return metric.value > value;
      case 'less_than': return metric.value < value;
      case 'equals': return metric.value === value;
      default: return false;
    }
  }
  
  return false;
}

function aggregateMetricsOverWindow(metrics, windowSeconds) {
  // Simulation agrégation métriques
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);
  
  return metrics.filter(metric => 
    new Date(metric.timestamp) >= windowStart
  );
}

async function validateMonitoringConfig(config) {
  // Simulation validation config
  const issues = [];
  
  if (config.interval && (config.interval < 10 || config.interval > 3600)) {
    issues.push('interval_out_of_range');
  }
  
  if (config.retention && (config.retention < 1 || config.retention > 168)) {
    issues.push('retention_out_of_range');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    timestamp: new Date().toISOString()
  };
}

async function reconfigureMetrics(deploymentId, config) {
  // Simulation reconfiguration métriques
  return await initializeMetrics(deploymentId, config);
}

async function calculateMonitoringHealth(monitoring) {
  // Simulation calcul santé monitoring
  const issues = [];
  
  if (!monitoring.monitoring?.enabled) {
    issues.push('monitoring_disabled');
  }
  
  if (!monitoring.metrics || monitoring.metrics.length === 0) {
    issues.push('no_metrics');
  }
  
  const overall = issues.length === 0 ? 'healthy' : 
                 issues.length === 1 ? 'degraded' : 'unhealthy';
  
  return { overall, issues };
}

function isRecentAlert(alert) {
  // Simulation détection alerte récente (dernière heure)
  return Math.random() > 0.8; // 20% chance d'être récente
}

// panels/deployment/monitoring : Panel Deployment (commit 66)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
