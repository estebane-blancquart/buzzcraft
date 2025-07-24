/**
 * TESTS COMMIT 66 - Panel Deployment
 * Tests simples du pattern BuzzCraft 4 fonctions par module
 */

import { describe, test, expect } from '@jest/globals';

// Status
import {
  getDeploymentStatus, validateDeploymentHealth, updateDeploymentMetrics, getDeploymentStatusSummary
} from '../../app-client/panels/deployment/status.js';

// Logs
import {
  getDeploymentLogs, filterDeploymentLogs, searchDeploymentLogs, getLogsStatus
} from '../../app-client/panels/deployment/logs.js';

// Rollback
import {
  createRollbackPlan, validateRollbackCompatibility, executeRollback, getRollbackStatus
} from '../../app-client/panels/deployment/rollback.js';

// Monitoring
import {
  createDeploymentMonitoring, validateMetricsThresholds, updateMonitoringConfiguration, getMonitoringStatus
} from '../../app-client/panels/deployment/monitoring.js';

describe('COMMIT 66 - Panel Deployment', () => {

  describe('Status', () => {
    test('getDeploymentStatus récupère status basique', async () => {
      const result = await getDeploymentStatus('deploy-123');
      
      expect(typeof result.status).toBe('object');
      expect(Array.isArray(result.history)).toBe(true);
      expect(typeof result.metrics).toBe('object');
      expect(result.realTime).toBeNull();
    });

    test('getDeploymentStatus avec realTime activé', async () => {
      const result = await getDeploymentStatus('deploy-123', 'proj-456', true);
      
      expect(result.realTime).not.toBeNull();
      expect(result.realTime.enabled).toBe(true);
      expect(result.realTime.deploymentId).toBe('deploy-123');
    });

    test('validateDeploymentHealth valide métriques', async () => {
      const status = {
        metrics: {
          responseTime: 200,
          errorRate: 0.02,
          uptime: 0.99,
          memoryUsage: 0.70
        }
      };
      const result = await validateDeploymentHealth(status);
      
      expect(result.valid).toBe(true);
      expect(result.health.overall).toBe('healthy');
      expect(Array.isArray(result.health.checks)).toBe(true);
    });

    test('détecte problèmes de santé', async () => {
      const status = {
        metrics: {
          responseTime: 1000, // trop élevé
          errorRate: 0.10,    // trop élevé
          uptime: 0.95,       // trop bas
          memoryUsage: 0.90   // trop élevé
        }
      };
      const result = await validateDeploymentHealth(status);
      
      expect(result.valid).toBe(false);
      expect(result.health.overall).toBe('unhealthy');
      expect(result.health.errors.length).toBeGreaterThan(0);
    });

    test('rejette paramètres invalides', async () => {
      await expect(getDeploymentStatus(null)).rejects.toThrow('DeploymentError');
      await expect(validateDeploymentHealth(null)).rejects.toThrow('DeploymentError');
    });
  });

  describe('Logs', () => {
    test('getDeploymentLogs récupère logs basiques', async () => {
      const result = await getDeploymentLogs('deploy-123');
      
      expect(Array.isArray(result.logs)).toBe(true);
      expect(typeof result.filters).toBe('object');
      expect(typeof result.search).toBe('object');
      expect(result.streaming).toBeNull();
    });

    test('filterDeploymentLogs filtre par niveau', async () => {
      const logs = [
        { level: 'error', message: 'Error message', timestamp: new Date().toISOString() },
        { level: 'info', message: 'Info message', timestamp: new Date().toISOString() },
        { level: 'debug', message: 'Debug message', timestamp: new Date().toISOString() }
      ];
      const filters = { level: 'error' };
      const result = await filterDeploymentLogs(logs, filters);
      
      expect(result.filtered).toBe(true);
      expect(result.logs.length).toBe(1);
      expect(result.logs[0].level).toBe('error');
    });

    test('searchDeploymentLogs trouve correspondances', async () => {
      const logs = [
        { message: 'Deployment started', source: 'deploy-service' },
        { message: 'Container created', source: 'container-manager' },
        { message: 'Health check passed', source: 'health-checker' }
      ];
      const result = await searchDeploymentLogs(logs, 'deploy');
      
      expect(result.searched).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].matches.length).toBeGreaterThan(0);
    });

    test('rejette logs invalides', async () => {
      await expect(getDeploymentLogs('')).rejects.toThrow('LogError');
      await expect(filterDeploymentLogs('invalid', {})).rejects.toThrow('LogError');
    });
  });

  describe('Rollback', () => {
    test('createRollbackPlan crée plan basique', async () => {
      const result = await createRollbackPlan('deploy-123');
      
      expect(typeof result.rollback).toBe('object');
      expect(Array.isArray(result.versions)).toBe(true);
      expect(typeof result.validation).toBe('object');
      expect(result.execution).toBeNull();
    });

    test('validateRollbackCompatibility valide versions', async () => {
      const result = await validateRollbackCompatibility('v2.1.0', 'v2.0.3');
      
      expect(result.valid).toBe(true);
      expect(result.compatible).toBeDefined();
      expect(typeof result.versionGap).toBe('number');
    });

    test('détecte incompatibilités version', async () => {
      const result = await validateRollbackCompatibility('v2.0.0', 'v2.1.0'); // target plus récent
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(issue => issue.includes('target_version_not_older'))).toBe(true);
    });

    test('executeRollback en mode dry run', async () => {
      const plan = {
        deploymentId: 'deploy-123',
        targetVersion: 'v2.0.3',
        steps: [
          { name: 'validation', estimated: 10 },
          { name: 'switch', estimated: 30 }
        ]
      };
      const result = await executeRollback(plan, 'confirm-token-deploy-123', { dryRun: true });
      
      expect(result.executed).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.execution.status).toBe('simulated');
    });
  });

  describe('Monitoring', () => {
    test('createDeploymentMonitoring initialise monitoring', async () => {
      const result = await createDeploymentMonitoring('deploy-123');
      
      expect(typeof result.monitoring).toBe('object');
      expect(Array.isArray(result.metrics)).toBe(true);
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(typeof result.dashboards).toBe('object');
    });

    test('validateMetricsThresholds détecte violations', async () => {
      const metrics = [
        { name: 'cpu_usage', value: 90, timestamp: new Date().toISOString() },
        { name: 'memory_usage', value: 95, timestamp: new Date().toISOString() }
      ];
      const thresholds = {
        cpu_usage: { critical: 80, warning: 70 },
        memory_usage: { critical: 90, warning: 80 }
      };
      const result = await validateMetricsThresholds(metrics, thresholds);
      
      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    test('updateMonitoringConfiguration met à jour config', async () => {
      const monitoring = {
        monitoring: { enabled: true, interval: 30, alerting: true },
        metrics: [],
        alerts: []
      };
      const updates = { interval: 60, alerting: false };
      const result = await updateMonitoringConfiguration(monitoring, updates);
      
      expect(result.updated).toBe(true);
      expect(result.monitoring.monitoring.interval).toBe(60);
      expect(result.monitoring.monitoring.alerting).toBe(false);
      expect(result.criticalChanges.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern BuzzCraft', () => {
    test('tous modules ont 4 fonctions', () => {
      // Status
      expect(typeof getDeploymentStatus).toBe('function');
      expect(typeof validateDeploymentHealth).toBe('function');
      expect(typeof updateDeploymentMetrics).toBe('function');
      expect(typeof getDeploymentStatusSummary).toBe('function');

      // Logs
      expect(typeof getDeploymentLogs).toBe('function');
      expect(typeof filterDeploymentLogs).toBe('function');
      expect(typeof searchDeploymentLogs).toBe('function');
      expect(typeof getLogsStatus).toBe('function');

      // Rollback
      expect(typeof createRollbackPlan).toBe('function');
      expect(typeof validateRollbackCompatibility).toBe('function');
      expect(typeof executeRollback).toBe('function');
      expect(typeof getRollbackStatus).toBe('function');

      // Monitoring
      expect(typeof createDeploymentMonitoring).toBe('function');
      expect(typeof validateMetricsThresholds).toBe('function');
      expect(typeof updateMonitoringConfiguration).toBe('function');
      expect(typeof getMonitoringStatus).toBe('function');
    });

    test('timestamps présents dans tous les retours', async () => {
      const status = await getDeploymentStatus('deploy-123');
      const logs = await getDeploymentLogs('deploy-123');
      const rollback = await createRollbackPlan('deploy-123');
      const monitoring = await createDeploymentMonitoring('deploy-123');

      expect(status.timestamp).toBeDefined();
      expect(logs.timestamp).toBeDefined();
      expect(rollback.timestamp).toBeDefined();
      expect(monitoring.timestamp).toBeDefined();

      // Validation format ISO
      expect(new Date(status.timestamp).toISOString()).toBe(status.timestamp);
      expect(new Date(logs.timestamp).toISOString()).toBe(logs.timestamp);
      expect(new Date(rollback.timestamp).toISOString()).toBe(rollback.timestamp);
      expect(new Date(monitoring.timestamp).toISOString()).toBe(monitoring.timestamp);
    });

    test('gestion erreurs typées cohérente', async () => {
      // Status
      await expect(getDeploymentStatus(null)).rejects.toThrow('DeploymentError');
      await expect(validateDeploymentHealth(null)).rejects.toThrow('DeploymentError');

      // Logs
      await expect(getDeploymentLogs('')).rejects.toThrow('LogError');
      await expect(filterDeploymentLogs('invalid', {})).rejects.toThrow('LogError');

      // Rollback
      await expect(createRollbackPlan('')).rejects.toThrow('RollbackError');
      await expect(validateRollbackCompatibility('', 'v1.0.0')).rejects.toThrow('VersionError');

      // Monitoring
      await expect(createDeploymentMonitoring('')).rejects.toThrow('MonitoringError');
      await expect(validateMetricsThresholds('invalid', {})).rejects.toThrow('MetricsError');
    });

    test('status functions retournent structure cohérente', async () => {
      const deployment = 'deploy-test';
      
      const status = await getDeploymentStatus(deployment);
      const logs = await getDeploymentLogs(deployment);
      const rollback = await createRollbackPlan(deployment);
      const monitoring = await createDeploymentMonitoring(deployment);

      const statusSummary = await getDeploymentStatusSummary([deployment]);
      const logsStatus = await getLogsStatus(logs);
      const rollbackStatus = await getRollbackStatus(deployment);
      const monitoringStatus = await getMonitoringStatus(monitoring);

      // Tous ont un status
      expect(statusSummary.aggregated).toBeDefined();
      expect(logsStatus.status).toBeDefined();
      expect(rollbackStatus.status).toBeDefined();
      expect(monitoringStatus.status).toBeDefined();

      // Propriétés cohérentes
      expect(typeof logsStatus.logsCount).toBe('number');
      expect(typeof rollbackStatus.canRollback).toBe('boolean');
      expect(typeof monitoringStatus.enabled).toBe('boolean');

      // Tous ont lastUpdate ou équivalent
      expect(statusSummary.timestamp).toBeDefined();
      expect(logsStatus.lastUpdate).toBeDefined();
      expect(rollbackStatus.timestamp).toBeDefined();
      expect(monitoringStatus.lastUpdate).toBeDefined();
    });

    test('validation functions détectent problèmes', async () => {
      // Status: métriques dégradées
      const badStatus = {
        metrics: {
          responseTime: 2000, // très lent
          errorRate: 0.20,    // taux d'erreur élevé
          uptime: 0.80,       // uptime faible
          memoryUsage: 0.95   // mémoire saturée
        }
      };
      const statusValidation = await validateDeploymentHealth(badStatus);
      expect(statusValidation.valid).toBe(false);
      expect(statusValidation.health.overall).toBe('unhealthy');

      // Logs: filtres vides
      const emptyLogs = [];
      const logFilters = { level: 'error' };
      const logsValidation = await filterDeploymentLogs(emptyLogs, logFilters);
      expect(logsValidation.filteredCount).toBe(0);

      // Rollback: versions incompatibles
      const rollbackValidation = await validateRollbackCompatibility('v1.0.0', 'v2.0.0');
      expect(rollbackValidation.valid).toBe(false);

      // Monitoring: seuils violés
      const badMetrics = [
        { name: 'cpu_usage', value: 95, timestamp: new Date().toISOString() }
      ];
      const strictThresholds = { cpu_usage: { critical: 80 } };
      const metricsValidation = await validateMetricsThresholds(badMetrics, strictThresholds);
      expect(metricsValidation.valid).toBe(false);
      expect(metricsValidation.violations.length).toBeGreaterThan(0);
    });

    test('fonctions avancées marchent correctement', async () => {
      // Status: summary multiple deployments
      const deployments = ['deploy-1', 'deploy-2', 'deploy-3'];
      const summary = await getDeploymentStatusSummary(deployments);
      expect(summary.summaries.length).toBe(3);
      expect(summary.aggregated.total).toBe(3);

      // Logs: recherche avec regex
      const logs = [
        { message: 'Error: Connection failed', source: 'api' },
        { message: 'Warning: Slow response', source: 'web' }
      ];
      const regexSearch = await searchDeploymentLogs(logs, 'Error|Warning', { useRegex: true });
      expect(regexSearch.totalMatches).toBe(2);

      // Rollback: exécution avec steps
      const plan = {
        deploymentId: 'deploy-test',
        targetVersion: 'v1.0.0',
        steps: [
          { name: 'backup', estimated: 30 },
          { name: 'switch', estimated: 60 }
        ]
      };
      const execution = await executeRollback(plan, 'confirm-deploy-test', { dryRun: true });
      expect(execution.execution.steps.length).toBe(2);

      // Monitoring: mise à jour configuration
      const monitoringConfig = {
        monitoring: { enabled: true, interval: 30 },
        metrics: [],
        alerts: []
      };
      const updates = { interval: 120, retention: 48 };
      const updated = await updateMonitoringConfiguration(monitoringConfig, updates);
      expect(updated.monitoring.monitoring.interval).toBe(120);
      expect(updated.criticalChanges.includes('interval_changed')).toBe(true);
    });
  });

});
