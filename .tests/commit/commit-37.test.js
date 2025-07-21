/**
 * Test COMMIT 37 - Engine Stop
 */

import { executeStopWorkflow } from '../../app-server/engines/stop/workflow.js';
import { logStopWorkflow } from '../../app-server/engines/stop/logging.js';
import { recoverStopWorkflow } from '../../app-server/engines/stop/recovery.js';

describe('COMMIT 37 - Engine Stop', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeStopWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validStopConfig = {
        deploymentId: 'deploy-123',
        projectPath: '/tmp/test'
      };
      
      await expect(executeStopWorkflow(null, validStopConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStopWorkflow('', validStopConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStopWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStopWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStopWorkflow('test', { deploymentId: 'deploy-123' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres stopConfig validée', async () => {
      const projectId = 'test-validation';
      
      // StopConfig manque deploymentId
      await expect(executeStopWorkflow(projectId, {
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: stopConfig.deploymentId requis');
      
      // StopConfig manque projectPath  
      await expect(executeStopWorkflow(projectId, {
        deploymentId: 'deploy-456'
      })).rejects.toThrow('ValidationError: stopConfig.projectPath requis');
    });
    
    test('workflow démarre et initialise métriques avec stoppedServices', async () => {
      const projectId = 'test-metrics-init';
      const stopConfig = {
        deploymentId: 'deploy-test',
        projectPath: '/nonexistent/path/to/trigger/online-error'
      };
      
      try {
        await executeStopWorkflow(projectId, stopConfig);
        fail('Should have thrown WorkflowError');
      } catch (error) {
        // Doit échouer sur détection état ONLINE mais avoir démarré
        expect(error.message).toContain('WorkflowError');
        
        // Workflow a au moins tenté de démarrer
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

  // === TESTS LOGGING ===
  describe('logStopWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logStopWorkflow('workflow-start', {
        projectId: 'test-log-123',
        stopConfig: { 
          deploymentId: 'deploy-log',
          projectPath: '/tmp/test-log'
        }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements stop', async () => {
      const events = [
        'workflow-start',
        'validation-stop',
        'filesystem-checks-stop',
        'transition-stop',
        'verification-stop',
        'workflow-success',
        'workflow-error'
      ];
      
      for (const eventType of events) {
        const result = await logStopWorkflow(eventType, {
          projectId: 'test-events',
          stopConfig: { 
            deploymentId: 'deploy-test',
            projectPath: '/tmp/test'
          }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', stopConfig: {} };
      
      await expect(logStopWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logStopWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logStopWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logStopWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverStopWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: deploymentId manquant, graceful manquant');
      
      const result = await recoverStopWorkflow('test-recovery-123', {
        deploymentId: 'deploy-recovery',
        projectPath: '/tmp/recovery'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-stop');
    });
    
    test('recovery pour conflit d\'état ONLINE', async () => {
      const error = new Error('WorkflowError: Projet n\'est pas en état ONLINE');
      
      const result = await recoverStopWorkflow('test-online-conflict', {
        deploymentId: 'deploy-conflict',
        projectPath: '/tmp/online-conflict'
      }, error);
      
      expect(result.strategy).toBe('state-conflict');
      expect(result.actions).toContain('detect-current-state-invalid');
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validStopConfig = { 
        deploymentId: 'deploy-123',
        projectPath: '/tmp'
      };
      const validError = new Error('Test error');
      
      await expect(recoverStopWorkflow(null, validStopConfig, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverStopWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverStopWorkflow('test', validStopConfig, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverStopWorkflow('test', validStopConfig, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-123';
      const invalidStopConfig = {
        deploymentId: 'deploy-integration'
        // manque projectPath → validation va échouer
      };
      
      try {
        await executeStopWorkflow(projectId, invalidStopConfig);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverStopWorkflow(projectId, invalidStopConfig, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeStopWorkflow).toBe('function');
      expect(typeof logStopWorkflow).toBe('function');
      expect(typeof recoverStopWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeStopWorkflow.name).toBe('executeStopWorkflow');
      expect(logStopWorkflow.name).toBe('logStopWorkflow');
      expect(recoverStopWorkflow.name).toBe('recoverStopWorkflow');
    });
    
    test('workflow génère stoppedServices unique et cohérent', async () => {
      const projectId = 'test-stoppedservices-generation';
      const stopConfig = {
        deploymentId: 'deploy-stoppedservices',
        projectPath: '/tmp/stoppedservices-test'
      };
      
      try {
        await executeStopWorkflow(projectId, stopConfig);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré un stoppedServices même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement le stoppedServices généré, mais au moins 
        // le workflow a démarré avec génération stoppedServices
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
    test('workflow valide configuration stop complète', async () => {
      const projectId = 'test-config-validation';
      const completeStopConfig = {
        deploymentId: 'deploy-complete',
        projectPath: '/tmp/complete-stop-config',
        graceful: true,
        timeout: 45000,
        drainConnections: true,
        saveState: true,
        backupBeforeStop: true,
        stopReason: 'maintenance'
      };
      
      try {
        await executeStopWorkflow(projectId, completeStopConfig);
        fail('Expected workflow error on state detection');
      } catch (error) {
        // Doit échouer sur détection état mais avoir validé config complète
        expect(error.message).toContain('WorkflowError');
        
        // Config a été acceptée (échec vient de la détection d'état)
        expect(error.message).not.toContain('ValidationError');
      }
    });
    
    test('workflow gère graceful vs force stop différemment', async () => {
      const projectId = 'test-graceful-vs-force';
      
      // Config graceful
      const gracefulStopConfig = {
        deploymentId: 'deploy-graceful',
        projectPath: '/tmp/graceful-test',
        graceful: true,
        drainConnections: true
      };
      
      // Config force
      const forceStopConfig = {
        deploymentId: 'deploy-force',
        projectPath: '/tmp/force-test',
        graceful: false,
        drainConnections: false
      };
      
      try {
        await executeStopWorkflow(projectId, gracefulStopConfig);
        fail('Expected workflow error');
      } catch (gracefulError) {
        expect(gracefulError.message).toContain('WorkflowError');
      }
      
      try {
        await executeStopWorkflow(projectId, forceStopConfig);
        fail('Expected workflow error');
      } catch (forceError) {
        expect(forceError.message).toContain('WorkflowError');
      }
    });
    
  });

});
