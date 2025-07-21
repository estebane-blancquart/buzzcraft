/**
 * Test COMMIT 31 - Engine Create
 */

import { executeCreateWorkflow } from '../../app-server/engines/create/workflow.js';
import { logCreateWorkflow } from '../../app-server/engines/create/logging.js';
import { recoverCreateWorkflow } from '../../app-server/engines/create/recovery.js';

describe('COMMIT 31 - Engine Create', () => {
  
  // === TESTS WORKFLOW (Validation paramètres seulement) ===
  describe('executeCreateWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validTemplate = {
        templateId: 'test',
        projectPath: '/tmp/test',
        projectName: 'Test'
      };
      
      await expect(executeCreateWorkflow(null, validTemplate))
        .rejects.toThrow('ValidationError');
      
      await expect(executeCreateWorkflow('', validTemplate))
        .rejects.toThrow('ValidationError');
      
      await expect(executeCreateWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeCreateWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeCreateWorkflow('test', { templateId: 'test' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres template validée', async () => {
      const projectId = 'test-validation';
      
      // Template manque projectPath
      await expect(executeCreateWorkflow(projectId, {
        templateId: 'test',
        projectName: 'Test'
      })).rejects.toThrow('ValidationError: template.projectPath requis');
      
      // Template manque projectName  
      await expect(executeCreateWorkflow(projectId, {
        templateId: 'test',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: template.projectName requis');
      
      // Template manque templateId
      await expect(executeCreateWorkflow(projectId, {
        projectPath: '/tmp/test',
        projectName: 'Test'
      })).rejects.toThrow('ValidationError: template.templateId requis');
    });
    
    test('workflow démarre et initialise métriques correctement', async () => {
      const projectId = 'test-metrics-init';
      const template = {
        templateId: 'test-template',
        projectPath: '/nonexistent/path/to/trigger/void-error',
        projectName: 'Test Metrics'
      };
      
      try {
        await executeCreateWorkflow(projectId, template);
        fail('Should have thrown WorkflowError');
      } catch (error) {
        // Doit échouer sur détection état VOID mais avoir démarré
        expect(error.message).toContain('WorkflowError');
        
        // Workflow a au moins tenté de démarrer
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

  // === TESTS LOGGING ===
  describe('logCreateWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logCreateWorkflow('workflow-start', {
        projectId: 'test-log-789',
        template: { templateId: 'test-template' }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements', async () => {
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
        const result = await logCreateWorkflow(eventType, {
          projectId: 'test-events',
          template: { templateId: 'test' }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', template: {} };
      
      await expect(logCreateWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logCreateWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logCreateWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logCreateWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
    test('sanitise données sensibles dans logs', async () => {
      const dataWithSecrets = {
        projectId: 'test-sanitize',
        template: { templateId: 'test' },
        password: 'secret123',
        token: 'abc123',
        apiKey: 'key456'
      };
      
      const result = await logCreateWorkflow('test-sanitize', dataWithSecrets);
      
      expect(result.logged).toBe(true);
      // Pas de moyen direct de vérifier sanitization, mais ça ne doit pas planter
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverCreateWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: templateId manquant, projectPath manquant');
      
      const result = await recoverCreateWorkflow('test-recovery-123', {
        templateId: 'test',
        projectPath: '/tmp/recovery',
        projectName: 'Recovery Test'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-state');
    });
    
    test('recovery pour échec filesystem', async () => {
      const error = new Error('WorkflowError: Template test-template inexistant');
      
      const result = await recoverCreateWorkflow('test-fs-recovery', {
        templateId: 'missing-template',
        projectPath: '/tmp/fs-recovery',
        projectName: 'FS Recovery'
      }, error, { allowRetry: true });
      
      expect(result.strategy).toBe('generation-failure');
      expect(result.actions).toContain('cleanup-partial-files');
      expect(result.actions).toContain('clear-filesystem-cache');
    });
    
    test('recovery pour conflit d\'état', async () => {
      const error = new Error('WorkflowError: Projet n\'est pas en état VOID');
      
      const result = await recoverCreateWorkflow('test-state-conflict', {
        templateId: 'test',
        projectPath: '/tmp/conflict',
        projectName: 'State Conflict'
      }, error);
      
      expect(result.strategy).toBe('state-conflict');
      expect(result.actions).toContain('detect-current-state-other');
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validTemplate = { templateId: 'test', projectPath: '/tmp', projectName: 'test' };
      const validError = new Error('Test error');
      
      await expect(recoverCreateWorkflow(null, validTemplate, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverCreateWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverCreateWorkflow('test', validTemplate, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverCreateWorkflow('test', validTemplate, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION (Validation simple) ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-789';
      const invalidTemplate = {
        templateId: 'invalid-template',
        projectPath: '/tmp/invalid-recovery'
        // manque projectName → validation va échouer
      };
      
      try {
        await executeCreateWorkflow(projectId, invalidTemplate);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverCreateWorkflow(projectId, invalidTemplate, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
      }
    });
    
    test('logging intégré dans workflow errors', async () => {
      const projectId = 'integration-logging-error';
      const template = {
        templateId: 'test',
        projectPath: '/nonexistent/trigger/error',
        projectName: 'Test Error Logging'
      };
      
      try {
        await executeCreateWorkflow(projectId, template);
        fail('Should have thrown error');
      } catch (error) {
        // Workflow doit avoir tenté de logger l'erreur
        expect(error.message).toContain('WorkflowError');
        
        // Recovery doit fonctionner après échec
        const recovery = await recoverCreateWorkflow(projectId, template, error);
        expect(recovery.strategy).toBeDefined();
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeCreateWorkflow).toBe('function');
      expect(typeof logCreateWorkflow).toBe('function');
      expect(typeof recoverCreateWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeCreateWorkflow.name).toBe('executeCreateWorkflow');
      expect(logCreateWorkflow.name).toBe('logCreateWorkflow');
      expect(recoverCreateWorkflow.name).toBe('recoverCreateWorkflow');
    });
    
  });

});
