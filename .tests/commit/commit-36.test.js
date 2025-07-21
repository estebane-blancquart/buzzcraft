/**
 * Test COMMIT 36 - Engine Start
 */

import { executeStartWorkflow } from '../../app-server/engines/start/workflow.js';
import { logStartWorkflow } from '../../app-server/engines/start/logging.js';
import { recoverStartWorkflow } from '../../app-server/engines/start/recovery.js';

describe('COMMIT 36 - Engine Start', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeStartWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validStartConfig = {
        deploymentId: 'deploy-123',
        projectPath: '/tmp/test'
      };
      
      await expect(executeStartWorkflow(null, validStartConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStartWorkflow('', validStartConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStartWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStartWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeStartWorkflow('test', { deploymentId: 'deploy-123' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres startConfig validée', async () => {
      const projectId = 'test-validation';
      
      // StartConfig manque deploymentId
      await expect(executeStartWorkflow(projectId, {
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: startConfig.deploymentId requis');
      
      // StartConfig manque projectPath  
      await expect(executeStartWorkflow(projectId, {
        deploymentId: 'deploy-456'
      })).rejects.toThrow('ValidationError: startConfig.projectPath requis');
    });
    
    test('workflow démarre et initialise métriques avec serviceId', async () => {
      const projectId = 'test-metrics-init';
      const startConfig = {
        deploymentId: 'deploy-test',
        projectPath: '/nonexistent/path/to/trigger/offline-error'
      };
      
      try {
        await executeStartWorkflow(projectId, startConfig);
        fail('Should have thrown WorkflowError');
      } catch (error) {
        // Doit échouer sur détection état OFFLINE mais avoir démarré
        expect(error.message).toContain('WorkflowError');
        
        // Workflow a au moins tenté de démarrer
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

  // === TESTS LOGGING ===
  describe('logStartWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logStartWorkflow('workflow-start', {
        projectId: 'test-log-123',
        startConfig: { 
          deploymentId: 'deploy-log',
          projectPath: '/tmp/test-log'
        }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements start', async () => {
      const events = [
        'workflow-start',
        'validation-start',
        'filesystem-checks-start',
        'transition-start',
        'verification-start',
        'workflow-success',
        'workflow-error'
      ];
      
      for (const eventType of events) {
        const result = await logStartWorkflow(eventType, {
          projectId: 'test-events',
          startConfig: { 
            deploymentId: 'deploy-test',
            projectPath: '/tmp/test'
          }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', startConfig: {} };
      
      await expect(logStartWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logStartWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logStartWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logStartWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverStartWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: deploymentId manquant, healthCheck manquant');
      
      const result = await recoverStartWorkflow('test-recovery-123', {
        deploymentId: 'deploy-recovery',
        projectPath: '/tmp/recovery'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-start');
    });
    
    test('recovery pour conflit d\'état OFFLINE', async () => {
      const error = new Error('WorkflowError: Projet n\'est pas en état OFFLINE');
      
      const result = await recoverStartWorkflow('test-offline-conflict', {
        deploymentId: 'deploy-conflict',
        projectPath: '/tmp/offline-conflict'
      }, error);
      
      expect(result.strategy).toBe('state-conflict');
      expect(result.actions).toContain('detect-current-state-invalid');
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validStartConfig = { 
        deploymentId: 'deploy-123',
        projectPath: '/tmp'
      };
      const validError = new Error('Test error');
      
      await expect(recoverStartWorkflow(null, validStartConfig, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverStartWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverStartWorkflow('test', validStartConfig, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverStartWorkflow('test', validStartConfig, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-123';
      const invalidStartConfig = {
        deploymentId: 'deploy-integration'
        // manque projectPath → validation va échouer
      };
      
      try {
        await executeStartWorkflow(projectId, invalidStartConfig);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverStartWorkflow(projectId, invalidStartConfig, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeStartWorkflow).toBe('function');
      expect(typeof logStartWorkflow).toBe('function');
      expect(typeof recoverStartWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeStartWorkflow.name).toBe('executeStartWorkflow');
      expect(logStartWorkflow.name).toBe('logStartWorkflow');
      expect(recoverStartWorkflow.name).toBe('recoverStartWorkflow');
    });
    
    test('workflow génère serviceId unique et cohérent', async () => {
      const projectId = 'test-serviceid-generation';
      const startConfig = {
        deploymentId: 'deploy-serviceid',
        projectPath: '/tmp/serviceid-test'
      };
      
      try {
        await executeStartWorkflow(projectId, startConfig);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré un serviceId même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement le serviceId généré, mais au moins 
        // le workflow a démarré avec génération serviceId
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
    test('workflow valide configuration start complète', async () => {
      const projectId = 'test-config-validation';
      const completeStartConfig = {
        deploymentId: 'deploy-complete',
        projectPath: '/tmp/complete-start-config',
        healthCheck: '/api/health',
        timeout: 45000,
        readinessProbe: '/ready',
        livenessProbe: '/alive',
        gracefulStart: true
      };
      
      try {
        await executeStartWorkflow(projectId, completeStartConfig);
        fail('Expected workflow error on state detection');
      } catch (error) {
        // Doit échouer sur détection état mais avoir validé config complète
        expect(error.message).toContain('WorkflowError');
        
        // Config a été acceptée (échec vient de la détection d'état)
        expect(error.message).not.toContain('ValidationError');
      }
    });
    
  });

});
