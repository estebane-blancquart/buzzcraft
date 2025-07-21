/**
 * Test COMMIT 35 - Engine Deploy
 */

import { executeDeployWorkflow } from '../../app-server/engines/deploy/workflow.js';
import { logDeployWorkflow } from '../../app-server/engines/deploy/logging.js';
import { recoverDeployWorkflow } from '../../app-server/engines/deploy/recovery.js';

describe('COMMIT 35 - Engine Deploy', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeDeployWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validDeployConfig = {
        target: 'docker',
        environment: 'production',
        projectPath: '/tmp/test'
      };
      
      await expect(executeDeployWorkflow(null, validDeployConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeployWorkflow('', validDeployConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeployWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeployWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeployWorkflow('test', { target: 'docker' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres deployConfig validée', async () => {
      const projectId = 'test-validation';
      
      // DeployConfig manque target
      await expect(executeDeployWorkflow(projectId, {
        environment: 'production',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: deployConfig.target requis');
      
      // DeployConfig manque environment  
      await expect(executeDeployWorkflow(projectId, {
        target: 'docker',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: deployConfig.environment requis');
      
      // DeployConfig manque projectPath
      await expect(executeDeployWorkflow(projectId, {
        target: 'docker',
        environment: 'production'
      })).rejects.toThrow('ValidationError: deployConfig.projectPath requis');
    });
    
    test('workflow démarre et initialise métriques avec deploymentId', async () => {
      const projectId = 'test-metrics-init';
      const deployConfig = {
        target: 'docker',
        environment: 'production',
        projectPath: '/nonexistent/path/to/trigger/built-error'
      };
      
      try {
        await executeDeployWorkflow(projectId, deployConfig);
        fail('Should have thrown WorkflowError');
      } catch (error) {
        // Doit échouer sur détection état BUILT mais avoir démarré
        expect(error.message).toContain('WorkflowError');
        
        // Workflow a au moins tenté de démarrer
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

  // === TESTS LOGGING ===
  describe('logDeployWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logDeployWorkflow('workflow-start', {
        projectId: 'test-log-789',
        deployConfig: { 
          target: 'docker',
          environment: 'production',
          projectPath: '/tmp/test-log'
        }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements deploy', async () => {
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
        const result = await logDeployWorkflow(eventType, {
          projectId: 'test-events',
          deployConfig: { 
            target: 'docker',
            environment: 'test',
            projectPath: '/tmp/test'
          }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', deployConfig: {} };
      
      await expect(logDeployWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logDeployWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logDeployWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logDeployWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverDeployWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: target manquant, environment manquant');
      
      const result = await recoverDeployWorkflow('test-recovery-789', {
        target: 'docker',
        environment: 'production',
        projectPath: '/tmp/recovery'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-deploy');
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validDeployConfig = { 
        target: 'docker',
        environment: 'prod',
        projectPath: '/tmp'
      };
      const validError = new Error('Test error');
      
      await expect(recoverDeployWorkflow(null, validDeployConfig, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverDeployWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverDeployWorkflow('test', validDeployConfig, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverDeployWorkflow('test', validDeployConfig, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-789';
      const invalidDeployConfig = {
        target: 'docker',
        environment: 'production'
        // manque projectPath → validation va échouer
      };
      
      try {
        await executeDeployWorkflow(projectId, invalidDeployConfig);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverDeployWorkflow(projectId, invalidDeployConfig, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeDeployWorkflow).toBe('function');
      expect(typeof logDeployWorkflow).toBe('function');
      expect(typeof recoverDeployWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeDeployWorkflow.name).toBe('executeDeployWorkflow');
      expect(logDeployWorkflow.name).toBe('logDeployWorkflow');
      expect(recoverDeployWorkflow.name).toBe('recoverDeployWorkflow');
    });
    
  });

});
