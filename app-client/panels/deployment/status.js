/**
 * COMMIT 66 - Panel Deployment
 * 
 * FAIT QUOI : Status déploiement avec suivi temps réel et historique des versions
 * REÇOIT : deploymentId: string, projectId?: string, realTime?: boolean
 * RETOURNE : { status: object, history: object[], realTime: object, metrics: object }
 * ERREURS : DeploymentError si déploiement introuvable, StatusError si status inaccessible, RealtimeError si streaming échoue
 */

export async function getDeploymentStatus(deploymentId, projectId = null, realTime = false) {
  if (!deploymentId || typeof deploymentId !== 'string') {
    throw new Error('DeploymentError: DeploymentId requis string');
  }

  if (projectId && typeof projectId !== 'string') {
    throw new Error('DeploymentError: ProjectId doit être string ou null');
  }

  if (typeof realTime !== 'boolean') {
    throw new Error('DeploymentError: RealTime doit être boolean');
  }

  try {
    const status = await fetchDeploymentStatus(deploymentId);
    const history = await getDeploymentHistory(deploymentId, projectId);
    const metrics = await calculateDeploymentMetrics(status, history);
    const realtimeConfig = realTime ? await initializeRealTimeStatus(deploymentId) : null;

    return {
      status,
      history,
      realTime: realtimeConfig,
      metrics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`StatusError: Récupération status échouée: ${error.message}`);
  }
}

export async function validateDeploymentHealth(status, thresholds = {}) {
  if (!status || typeof status !== 'object') {
    throw new Error('DeploymentError: Status requis object');
  }

  if (typeof thresholds !== 'object') {
    throw new Error('DeploymentError: Thresholds doit être object');
  }

  try {
    const health = {
      overall: 'healthy',
      checks: [],
      warnings: [],
      errors: []
    };

    const defaultThresholds = {
      responseTime: 500,
      errorRate: 0.05,
      uptime: 0.99,
      memoryUsage: 0.85,
      ...thresholds
    };

    // Validation response time
    if (status.metrics?.responseTime > defaultThresholds.responseTime) {
      health.warnings.push(`response_time_high: ${status.metrics.responseTime}ms`);
      health.overall = 'degraded';
    }

    // Validation error rate
    if (status.metrics?.errorRate > defaultThresholds.errorRate) {
      health.errors.push(`error_rate_high: ${(status.metrics.errorRate * 100).toFixed(2)}%`);
      health.overall = 'unhealthy';
    }

    // Validation uptime
    if (status.metrics?.uptime < defaultThresholds.uptime) {
      health.errors.push(`uptime_low: ${(status.metrics.uptime * 100).toFixed(2)}%`);
      health.overall = 'unhealthy';
    }

    // Validation memory
    if (status.metrics?.memoryUsage > defaultThresholds.memoryUsage) {
      health.warnings.push(`memory_usage_high: ${(status.metrics.memoryUsage * 100).toFixed(1)}%`);
      if (health.overall === 'healthy') health.overall = 'degraded';
    }

    // Health checks
    health.checks = [
      { name: 'response_time', status: status.metrics?.responseTime <= defaultThresholds.responseTime ? 'pass' : 'fail' },
      { name: 'error_rate', status: status.metrics?.errorRate <= defaultThresholds.errorRate ? 'pass' : 'fail' },
      { name: 'uptime', status: status.metrics?.uptime >= defaultThresholds.uptime ? 'pass' : 'fail' },
      { name: 'memory', status: status.metrics?.memoryUsage <= defaultThresholds.memoryUsage ? 'pass' : 'fail' }
    ];

    return {
      valid: health.overall !== 'unhealthy',
      health,
      thresholds: defaultThresholds,
      checksCount: health.checks.length,
      passedChecks: health.checks.filter(c => c.status === 'pass').length,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`StatusError: Validation health échouée: ${error.message}`);
  }
}

export async function updateDeploymentMetrics(deploymentId, newMetrics, options = {}) {
  if (!deploymentId || typeof deploymentId !== 'string') {
    throw new Error('DeploymentError: DeploymentId requis string');
  }

  if (!newMetrics || typeof newMetrics !== 'object') {
    throw new Error('DeploymentError: NewMetrics requis object');
  }

  const aggregate = options.aggregate !== false;
  const persist = options.persist !== false;

  try {
    const currentStatus = await fetchDeploymentStatus(deploymentId);
    
    const updatedMetrics = aggregate ? 
      aggregateMetrics(currentStatus.metrics, newMetrics) : 
      { ...currentStatus.metrics, ...newMetrics };

    const updatedStatus = {
      ...currentStatus,
      metrics: updatedMetrics,
      lastUpdate: new Date().toISOString()
    };

    if (persist) {
      await persistDeploymentStatus(deploymentId, updatedStatus);
    }

    return {
      updated: true,
      status: updatedStatus,
      metrics: updatedMetrics,
      aggregated: aggregate,
      persisted: persist,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`StatusError: Mise à jour métriques échouée: ${error.message}`);
  }
}

export async function getDeploymentStatusSummary(deploymentIds, options = {}) {
  if (!Array.isArray(deploymentIds)) {
    throw new Error('DeploymentError: DeploymentIds doit être array');
  }

  const includeHistory = options.includeHistory || false;
  const includeMetrics = options.includeMetrics !== false;

  try {
    const summaries = [];
    const aggregated = {
      total: deploymentIds.length,
      healthy: 0,
      degraded: 0,
      unhealthy: 0,
      offline: 0
    };

    for (const deploymentId of deploymentIds) {
      try {
        const status = await fetchDeploymentStatus(deploymentId);
        const health = includeMetrics ? await validateDeploymentHealth(status) : null;
        
        const summary = {
          deploymentId,
          status: status.state || 'unknown',
          health: health?.health?.overall || 'unknown',
          version: status.version || null,
          lastDeploy: status.lastDeploy || null
        };

        if (includeHistory) {
          summary.history = await getDeploymentHistory(deploymentId);
        }

        summaries.push(summary);

        // Agrégation
        switch (summary.health) {
          case 'healthy': aggregated.healthy++; break;
          case 'degraded': aggregated.degraded++; break;
          case 'unhealthy': aggregated.unhealthy++; break;
          default: aggregated.offline++; break;
        }
      } catch (error) {
        summaries.push({
          deploymentId,
          status: 'error',
          error: error.message
        });
        aggregated.offline++;
      }
    }

    return {
      summaries,
      aggregated,
      includeHistory,
      includeMetrics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`StatusError: Récupération summary échouée: ${error.message}`);
  }
}

// Helper functions pour simulation
async function fetchDeploymentStatus(deploymentId) {
  // Simulation récupération status
  const states = ['running', 'stopped', 'deploying', 'failed'];
  const randomState = states[Math.floor(Math.random() * states.length)];
  
  return {
    deploymentId,
    state: randomState,
    version: 'v1.2.3',
    environment: 'production',
    lastDeploy: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    metrics: {
      responseTime: Math.round(Math.random() * 200 + 100),
      errorRate: Math.random() * 0.1,
      uptime: 0.95 + Math.random() * 0.05,
      memoryUsage: 0.6 + Math.random() * 0.3
    }
  };
}

async function getDeploymentHistory(deploymentId, projectId) {
  // Simulation historique
  const history = [];
  for (let i = 0; i < 5; i++) {
    history.push({
      deploymentId: `${deploymentId}_${i}`,
      version: `v1.${i}.0`,
      status: i === 0 ? 'current' : 'previous',
      timestamp: new Date(Date.now() - i * 86400000).toISOString()
    });
  }
  return history;
}

async function calculateDeploymentMetrics(status, history) {
  // Simulation calcul métriques
  return {
    deploymentFrequency: history.length / 7, // déploiements par semaine
    averageResponseTime: status.metrics?.responseTime || 150,
    successRate: 0.95,
    rollbackRate: 0.05,
    mttr: 45 // minutes
  };
}

async function initializeRealTimeStatus(deploymentId) {
  // Simulation init real-time
  return {
    enabled: true,
    updateInterval: 5000,
    deploymentId,
    connected: true
  };
}

function aggregateMetrics(currentMetrics, newMetrics) {
  // Simulation agrégation métriques
  return {
    ...currentMetrics,
    responseTime: Math.round((currentMetrics.responseTime + newMetrics.responseTime) / 2),
    errorRate: (currentMetrics.errorRate + newMetrics.errorRate) / 2,
    uptime: Math.min(currentMetrics.uptime, newMetrics.uptime),
    memoryUsage: Math.max(currentMetrics.memoryUsage, newMetrics.memoryUsage)
  };
}

async function persistDeploymentStatus(deploymentId, status) {
  // Simulation persistance
  return true;
}

// panels/deployment/status : Panel Deployment (commit 66)
// DEPENDENCY FLOW (no circular deps)
// app-client/ → api/
