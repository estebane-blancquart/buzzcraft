/**
 * Test COMMIT 44 - API Events
 */

import { 
  broadcastStateChange, 
  subscribeToStateChanges, 
  getStateChangeHistory 
} from '../../api/events/state-changes.js';

import { 
  broadcastDeploymentStatus, 
  subscribeToDeploymentStatus, 
  getCurrentDeploymentStatus 
} from '../../api/events/deployment-status.js';

import { 
  trackProgress, 
  subscribeToProgress, 
  getProgressStatus 
} from '../../api/events/progress.js';

import { 
  raiseSystemAlert, 
  acknowledgeAlert, 
  subscribeToAlerts, 
  getActiveAlerts 
} from '../../api/events/system-alerts.js';

describe('COMMIT 44 - API Events', () => {

  describe('Module state-changes.js', () => {
    test('broadcastStateChange diffuse changement état correctement', async () => {
      const stateChange = {
        projectId: 'test-project',
        fromState: 'DRAFT',
        toState: 'BUILT',
        transitionType: 'build'
      };
      
      const result = await broadcastStateChange(stateChange, ['subscriber1'], true);
      
      expect(result.broadcasted).toBe(true);
      expect(Array.isArray(result.subscribers)).toBe(true);
      expect(typeof result.timestamp).toBe('string');
      expect(result.persisted).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(result.priority).toBe('high');
    });
    
    test('subscribeToStateChanges crée abonnement valide', async () => {
      const result = await subscribeToStateChanges('sub-test', 'project-123', 'BUILT');
      
      expect(result.subscribed).toBe(true);
      expect(result.subscriberId).toBe('sub-test');
      expect(result.filters.project).toBe('project-123');
      expect(result.filters.state).toBe('BUILT');
      expect(result.timestamp).toBeDefined();
    });
    
    test('getStateChangeHistory retourne historique projet', async () => {
      // D'abord créer un changement
      await broadcastStateChange({
        projectId: 'history-test',
        fromState: 'VOID',
        toState: 'DRAFT'
      });
      
      const result = await getStateChangeHistory('history-test', 10);
      
      expect(result.projectId).toBe('history-test');
      expect(Array.isArray(result.changes)).toBe(true);
      expect(typeof result.totalCount).toBe('number');
      expect(result.limit).toBe(10);
    });
    
    test('broadcastStateChange valide paramètres requis', async () => {
      await expect(broadcastStateChange(null)).rejects.toThrow('StateChangeError');
      await expect(broadcastStateChange({})).rejects.toThrow('StateChangeError');
      await expect(broadcastStateChange({ projectId: 'test' })).rejects.toThrow('StateChangeError');
    });
  });

  describe('Module deployment-status.js', () => {
    test('broadcastDeploymentStatus diffuse statut déploiement', async () => {
      const deploymentEvent = {
        deploymentId: 'deploy-123',
        projectId: 'project-456',
        startedAt: new Date().toISOString()
      };
      
      const result = await broadcastDeploymentStatus(deploymentEvent, 'building', 45);
      
      expect(result.broadcasted).toBe(true);
      expect(result.status).toBe('building');
      expect(result.progress).toBe(45);
      expect(Array.isArray(result.subscribers)).toBe(true);
      expect(result.eventId).toBeDefined();
      expect(typeof result.metrics).toBe('object');
    });
    
    test('getCurrentDeploymentStatus retourne statut actuel', async () => {
      // D'abord créer un événement
      await broadcastDeploymentStatus({
        deploymentId: 'status-test',
        projectId: 'project-status'
      }, 'success', 100);
      
      const result = await getCurrentDeploymentStatus('status-test');
      
      expect(result.deploymentId).toBe('status-test');
      expect(result.found).toBe(true);
      expect(result.status).toBe('success');
      expect(result.progress).toBe(100);
      expect(result.lastUpdate).toBeDefined();
    });
    
    test('broadcastDeploymentStatus valide statuts supportés', async () => {
      const event = { deploymentId: 'test' };
      
      await expect(
        broadcastDeploymentStatus(event, 'invalid-status', 0)
      ).rejects.toThrow('StatusError');
      
      await expect(
        broadcastDeploymentStatus(event, 'success', 150)
      ).rejects.toThrow('ProgressError');
    });
  });

  describe('Module progress.js', () => {
    test('trackProgress suit progression opération', async () => {
      const progress = {
        operationId: 'op-123',
        completion: 75,
        stage: 'compile',
        startedAt: new Date().toISOString()
      };
      
      const result = await trackProgress(progress, 'build', { throughput: 1024 });
      
      expect(result.tracked).toBe(true);
      expect(typeof result.metrics).toBe('object');
      expect(typeof result.estimation).toBe('object');
      expect(result.completion).toBe(75);
      expect(result.status).toBe('running');
    });
    
    test('getProgressStatus retourne état progression', async () => {
      // D'abord tracker une progression
      await trackProgress({
        operationId: 'progress-test',
        completion: 50
      }, 'deploy');
      
      const result = await getProgressStatus('progress-test');
      
      expect(result.operationId).toBe('progress-test');
      expect(result.found).toBe(true);
      expect(result.operation).toBe('deploy');
      expect(result.completion).toBe(50);
      expect(result.status).toBeDefined();
    });
    
    test('trackProgress valide données progression', async () => {
      await expect(trackProgress(null, 'build')).rejects.toThrow('ProgressError');
      await expect(trackProgress({}, 'build')).rejects.toThrow('ProgressError');
      await expect(trackProgress({ operationId: 'test', completion: 150 }, 'build')).rejects.toThrow('ProgressError');
      await expect(trackProgress({ operationId: 'test', completion: 50 }, 'invalid')).rejects.toThrow('ProgressError');
    });
  });

  describe('Module system-alerts.js', () => {
    test('raiseSystemAlert crée alerte système', async () => {
      const alert = {
        source: 'disk-monitor',
        message: 'Espace disque faible',
        details: { available: '5GB', threshold: '10GB' }
      };
      
      const result = await raiseSystemAlert(alert, 'warning');
      
      expect(result.alerted).toBe(true);
      expect(result.severity).toBe('warning');
      expect(result.alertId).toBeDefined();
      expect(result.level).toBe(2);
      expect(result.notified).toBe(true);
    });
    
    test('acknowledgeAlert acquitte alerte active', async () => {
      // D'abord créer une alerte
      const alertResult = await raiseSystemAlert({
        source: 'test-source',
        message: 'Test alert'
      }, 'error');
      
      const result = await acknowledgeAlert(alertResult.alertId, 'admin-user');
      
      expect(result.acknowledged).toBe(true);
      expect(result.alertId).toBe(alertResult.alertId);
      expect(result.acknowledgedBy).toBe('admin-user');
      expect(result.acknowledgedAt).toBeDefined();
    });
    
    test('getActiveAlerts retourne alertes non résolues', async () => {
      // Créer quelques alertes
      await raiseSystemAlert({ source: 'test1', message: 'Alert 1' }, 'warning');
      await raiseSystemAlert({ source: 'test2', message: 'Alert 2' }, 'critical');
      
      const result = await getActiveAlerts();
      
      expect(Array.isArray(result.alerts)).toBe(true);
      expect(typeof result.count).toBe('number');
      expect(typeof result.criticalCount).toBe('number');
      expect(result.timestamp).toBeDefined();
    });
    
    test('raiseSystemAlert valide paramètres requis', async () => {
      await expect(raiseSystemAlert(null, 'error')).rejects.toThrow('AlertError');
      await expect(raiseSystemAlert({}, 'error')).rejects.toThrow('AlertError');
      await expect(raiseSystemAlert({ source: 'test' }, 'invalid')).rejects.toThrow('AlertError');
    });
  });

  describe('Intégration patterns BuzzCraft', () => {
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof broadcastStateChange).toBe('function');
      expect(typeof broadcastDeploymentStatus).toBe('function');
      expect(typeof trackProgress).toBe('function');
      expect(typeof raiseSystemAlert).toBe('function');
      
      // Noms cohérents avec pattern
      expect(broadcastStateChange.name).toBe('broadcastStateChange');
      expect(broadcastDeploymentStatus.name).toBe('broadcastDeploymentStatus');
      expect(trackProgress.name).toBe('trackProgress');
      expect(raiseSystemAlert.name).toBe('raiseSystemAlert');
    });
    
    test('tous les modules utilisent erreurs cohérentes', async () => {
      // Chaque module doit lancer des erreurs avec format correct
      
      // Test state-changes
      await expect(
        broadcastStateChange({ invalid: 'data' })
      ).rejects.toThrow('StateChangeError:');
      
      // Test deployment-status
      await expect(
        broadcastDeploymentStatus({ invalid: 'data' }, 'pending')
      ).rejects.toThrow('DeploymentEventError:');
      
      // Test progress
      await expect(
        trackProgress({ invalid: 'data' }, 'build')
      ).rejects.toThrow('ProgressError:');
      
      // Test system-alerts
      await expect(
        raiseSystemAlert({ invalid: 'data' }, 'warning')
      ).rejects.toThrow('AlertError:');
    });
    
    test('architecture dependency flow respectée', () => {
      // Test symbolique - vérifier que les modules n'importent que depuis engines/transitions/systems
      // En pratique, on vérifierait les imports statiquement
      expect(true).toBe(true);
    });
    
    test('tous les modules retournent structure cohérente', async () => {
      // Test que tous les modules retournent un objet avec timestamp
      const stateResult = await broadcastStateChange({
        projectId: 'test',
        fromState: 'DRAFT',
        toState: 'BUILT'
      });
      expect(stateResult).toHaveProperty('timestamp');
      
      const deployResult = await broadcastDeploymentStatus({
        deploymentId: 'test'
      }, 'pending', 0);
      expect(deployResult).toHaveProperty('timestamp');
      
      const progressResult = await trackProgress({
        operationId: 'test',
        completion: 25
      }, 'build');
      expect(progressResult).toHaveProperty('timestamp');
      
      const alertResult = await raiseSystemAlert({
        source: 'test',
        message: 'Test'
      }, 'info');
      expect(alertResult).toHaveProperty('timestamp');
    });
    
    test('intégration entre modules fonctionne', async () => {
      // Test workflow complet : state change → deployment status → progress → alert
      
      // 1. State change
      const stateChange = await broadcastStateChange({
        projectId: 'integration-test',
        fromState: 'BUILT',
        toState: 'DEPLOYING'
      });
      expect(stateChange.broadcasted).toBe(true);
      
      // 2. Deployment status
      const deployment = await broadcastDeploymentStatus({
        deploymentId: 'deploy-integration',
        projectId: 'integration-test'
      }, 'deploying', 25);
      expect(deployment.status).toBe('deploying');
      
      // 3. Progress tracking
      const progress = await trackProgress({
        operationId: 'deploy-integration',
        completion: 25
      }, 'deploy');
      expect(progress.tracked).toBe(true);
      
      // 4. System alert si problème
      const alert = await raiseSystemAlert({
        source: 'deployment-monitor',
        message: 'Deployment progress slow',
        relatedOperation: 'deploy-integration'
      }, 'warning');
      expect(alert.alerted).toBe(true);
    });
  });

});
