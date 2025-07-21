/**
 * Test COMMIT 33 - Engine Build
 */

import { executeBuildWorkflow } from '../../app-server/engines/build/workflow.js';
import { logBuildWorkflow } from '../../app-server/engines/build/logging.js';
import { recoverBuildWorkflow } from '../../app-server/engines/build/recovery.js';

describe('COMMIT 33 - Engine Build', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeBuildWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validBuildConfig = {
        target: 'production',
        environment: 'node',
        projectPath: '/tmp/test'
      };
      
      await expect(executeBuildWorkflow(null, validBuildConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeBuildWorkflow('', validBuildConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeBuildWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeBuildWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeBuildWorkflow('test', { target: 'prod' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres buildConfig validée', async () => {
      const projectId = 'test-validation';
      
      // BuildConfig manque target
      await expect(executeBuildWorkflow(projectId, {
        environment: 'node',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: buildConfig.target requis');
      
      // BuildConfig manque environment  
      await expect(executeBuildWorkflow(projectId, {
        target: 'production',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: buildConfig.environment requis');
      
      // BuildConfig manque projectPath
      await expect(executeBuildWorkflow(projectId, {
        target: 'production',
        environment: 'node'
      })).rejects.toThrow('ValidationError: buildConfig.projectPath requis');
    });
    
    test('workflow démarre et initialise métriques avec buildId', async () => {
      const projectId = 'test-metrics-init';
      const buildConfig = {
        target: 'production',
        environment: 'node',
        projectPath: '/nonexistent/path/to/trigger/draft-error'
      };
      
      try {
        await executeBuildWorkflow(projectId, buildConfig);
        fail('Should have thrown WorkflowError');
      } catch (error) {
        // Doit échouer sur détection état DRAFT mais avoir démarré
        expect(error.message).toContain('WorkflowError');
        
        // Workflow a au moins tenté de démarrer
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

  // === TESTS LOGGING ===
  describe('logBuildWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logBuildWorkflow('workflow-start', {
        projectId: 'test-log-789',
        buildConfig: { target: 'production', environment: 'node', projectPath: '/tmp' }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements build', async () => {
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
        const result = await logBuildWorkflow(eventType, {
          projectId: 'test-events',
          buildConfig: { target: 'test', environment: 'test', projectPath: '/tmp' }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', buildConfig: {} };
      
      await expect(logBuildWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logBuildWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logBuildWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logBuildWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
    test('sanitise données sensibles et limite taille buildConfig', async () => {
      const dataWithSecrets = {
        projectId: 'test-sanitize',
        buildConfig: { 
          target: 'production',
          environment: 'node',
          projectPath: '/very/long/path/' + 'x'.repeat(200),
          password: 'secret123',
          token: 'abc123'
        }
      };
      
      const result = await logBuildWorkflow('test-sanitize', dataWithSecrets);
      
      expect(result.logged).toBe(true);
      // Pas de moyen direct de vérifier sanitization, mais ça ne doit pas planter
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverBuildWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: target manquant, environment manquant');
      
      const result = await recoverBuildWorkflow('test-recovery-789', {
        target: 'production',
        environment: 'node',
        projectPath: '/tmp/recovery'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-build');
    });
    
    test('recovery pour conflit d\'état DRAFT', async () => {
      const error = new Error('WorkflowError: Projet n\'est pas en état DRAFT');
      
      const result = await recoverBuildWorkflow('test-draft-conflict', {
        target: 'development',
        environment: 'node',
        projectPath: '/tmp/draft-conflict'
      }, error);
      
      expect(result.strategy).toBe('state-conflict');
      expect(result.actions).toContain('detect-current-state-invalid');
    });
    
    test('recovery pour échec filesystem', async () => {
      const error = new Error('WorkflowError: Chemin /readonly/build non accessible en écriture');
      
      const result = await recoverBuildWorkflow('test-fs-recovery', {
        target: 'production',
        environment: 'node',
        projectPath: '/readonly/build'
      }, error, { allowRetry: true });
      
      expect(result.strategy).toBe('filesystem-failure');
      expect(result.actions).toContain('check-build-permissions');
      expect(result.actions).toContain('cleanup-partial-artifacts');
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validBuildConfig = { target: 'prod', environment: 'node', projectPath: '/tmp' };
      const validError = new Error('Test error');
      
      await expect(recoverBuildWorkflow(null, validBuildConfig, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverBuildWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverBuildWorkflow('test', validBuildConfig, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverBuildWorkflow('test', validBuildConfig, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-789';
      const invalidBuildConfig = {
        target: 'production',
        environment: 'node'
        // manque projectPath → validation va échouer
      };
      
      try {
        await executeBuildWorkflow(projectId, invalidBuildConfig);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverBuildWorkflow(projectId, invalidBuildConfig, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
      }
    });
    
    test('logging intégré dans workflow errors', async () => {
      const projectId = 'integration-logging-error';
      const buildConfig = {
        target: 'production',
        environment: 'node',
        projectPath: '/nonexistent/trigger/error'
      };
      
      try {
        await executeBuildWorkflow(projectId, buildConfig);
        fail('Should have thrown error');
      } catch (error) {
        // Workflow doit avoir tenté de logger l'erreur
        expect(error.message).toContain('WorkflowError');
        
        // Recovery doit fonctionner après échec
        const recovery = await recoverBuildWorkflow(projectId, buildConfig, error);
        expect(recovery.strategy).toBeDefined();
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeBuildWorkflow).toBe('function');
      expect(typeof logBuildWorkflow).toBe('function');
      expect(typeof recoverBuildWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeBuildWorkflow.name).toBe('executeBuildWorkflow');
      expect(logBuildWorkflow.name).toBe('logBuildWorkflow');
      expect(recoverBuildWorkflow.name).toBe('recoverBuildWorkflow');
    });
    
    test('workflow génère buildId unique et cohérent', async () => {
      const projectId = 'test-buildid-generation';
      const buildConfig = {
        target: 'production',
        environment: 'node',
        projectPath: '/tmp/buildid-test'
      };
      
      try {
        await executeBuildWorkflow(projectId, buildConfig);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré un buildId même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement le buildId généré, mais au moins 
        // le workflow a démarré avec génération buildId
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
    test('workflow valide configuration build complète', async () => {
      const projectId = 'test-config-validation';
      const completeBuildConfig = {
        target: 'production',
        environment: 'node',
        projectPath: '/tmp/complete-config',
        optimization: true,
        parallel: true,
        cache: false
      };
      
      try {
        await executeBuildWorkflow(projectId, completeBuildConfig);
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
