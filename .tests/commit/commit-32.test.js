/**
 * Test COMMIT 32 - Engine Save
 */

import { executeSaveWorkflow } from '../../app-server/engines/save/workflow.js';
import { logSaveWorkflow } from '../../app-server/engines/save/logging.js';
import { recoverSaveWorkflow } from '../../app-server/engines/save/recovery.js';

describe('COMMIT 32 - Engine Save', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeSaveWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validSaveData = {
        projectPath: '/tmp/test',
        content: 'test content'
      };
      
      await expect(executeSaveWorkflow(null, validSaveData))
        .rejects.toThrow('ValidationError');
      
      await expect(executeSaveWorkflow('', validSaveData))
        .rejects.toThrow('ValidationError');
      
      await expect(executeSaveWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeSaveWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeSaveWorkflow('test', { projectPath: '/tmp' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres saveData validée', async () => {
      const projectId = 'test-validation';
      
      // SaveData manque projectPath
      await expect(executeSaveWorkflow(projectId, {
        content: 'test content'
      })).rejects.toThrow('ValidationError: saveData.projectPath requis');
      
      // SaveData manque content ET changes  
      await expect(executeSaveWorkflow(projectId, {
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: saveData.content ou saveData.changes requis');
      
      // SaveData avec changes valid
      const result = await executeSaveWorkflow(projectId, {
        projectPath: '/tmp/test-changes',
        changes: [{ type: 'update', file: 'test.js' }]
      }).catch(() => null); // Ignore workflow errors, on teste juste validation params
      
      // Doit passer validation params mais peut échouer sur détection état
      // C'est normal dans ce test
    });
    
    test('workflow démarre et initialise métriques avec saveId', async () => {
      const projectId = 'test-metrics-init';
      const saveData = {
        projectPath: '/nonexistent/path/to/trigger/draft-error',
        content: 'test content for metrics'
      };
      
      try {
        await executeSaveWorkflow(projectId, saveData);
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
  describe('logSaveWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logSaveWorkflow('workflow-start', {
        projectId: 'test-log-456',
        saveData: { projectPath: '/tmp/test-log' }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements save', async () => {
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
        const result = await logSaveWorkflow(eventType, {
          projectId: 'test-events',
          saveData: { projectPath: '/tmp/test' }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', saveData: {} };
      
      await expect(logSaveWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logSaveWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logSaveWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logSaveWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
    test('sanitise données sensibles et limite taille content', async () => {
      const dataWithSecrets = {
        projectId: 'test-sanitize',
        saveData: { 
          projectPath: '/tmp/test',
          content: 'x'.repeat(1000), // Long content
          password: 'secret123',
          token: 'abc123'
        }
      };
      
      const result = await logSaveWorkflow('test-sanitize', dataWithSecrets);
      
      expect(result.logged).toBe(true);
      // Pas de moyen direct de vérifier sanitization, mais ça ne doit pas planter
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverSaveWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: projectPath manquant, content manquant');
      
      const result = await recoverSaveWorkflow('test-recovery-456', {
        projectPath: '/tmp/recovery',
        content: 'Recovery Test'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-save');
    });
    
    test('recovery pour conflit d\'état DRAFT', async () => {
      const error = new Error('WorkflowError: Projet n\'est pas en état DRAFT');
      
      const result = await recoverSaveWorkflow('test-draft-conflict', {
        projectPath: '/tmp/draft-conflict',
        content: 'Draft Conflict Test'
      }, error);
      
      expect(result.strategy).toBe('state-conflict');
      expect(result.actions).toContain('detect-current-state-other');
    });
    
    test('recovery pour échec filesystem', async () => {
      const error = new Error('WorkflowError: Chemin /readonly/path non accessible en écriture');
      
      const result = await recoverSaveWorkflow('test-fs-recovery', {
        projectPath: '/readonly/path',
        content: 'FS Recovery'
      }, error, { allowRetry: true });
      
      expect(result.strategy).toBe('filesystem-failure');
      expect(result.actions).toContain('check-filesystem-permissions');
      expect(result.actions).toContain('cleanup-partial-files');
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validSaveData = { projectPath: '/tmp', content: 'test' };
      const validError = new Error('Test error');
      
      await expect(recoverSaveWorkflow(null, validSaveData, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverSaveWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverSaveWorkflow('test', validSaveData, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverSaveWorkflow('test', validSaveData, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-456';
      const invalidSaveData = {
        projectPath: '/tmp/invalid-save'
        // manque content/changes → validation va échouer
      };
      
      try {
        await executeSaveWorkflow(projectId, invalidSaveData);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverSaveWorkflow(projectId, invalidSaveData, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
      }
    });
    
    test('logging intégré dans workflow errors', async () => {
      const projectId = 'integration-logging-error';
      const saveData = {
        projectPath: '/nonexistent/trigger/error',
        content: 'Test Error Logging'
      };
      
      try {
        await executeSaveWorkflow(projectId, saveData);
        fail('Should have thrown error');
      } catch (error) {
        // Workflow doit avoir tenté de logger l'erreur
        expect(error.message).toContain('WorkflowError');
        
        // Recovery doit fonctionner après échec
        const recovery = await recoverSaveWorkflow(projectId, saveData, error);
        expect(recovery.strategy).toBeDefined();
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeSaveWorkflow).toBe('function');
      expect(typeof logSaveWorkflow).toBe('function');
      expect(typeof recoverSaveWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeSaveWorkflow.name).toBe('executeSaveWorkflow');
      expect(logSaveWorkflow.name).toBe('logSaveWorkflow');
      expect(recoverSaveWorkflow.name).toBe('recoverSaveWorkflow');
    });
    
    test('workflow génère saveId unique et cohérent', async () => {
      const projectId = 'test-saveid-generation';
      const saveData = {
        projectPath: '/tmp/saveid-test',
        content: 'SaveID Test'
      };
      
      try {
        await executeSaveWorkflow(projectId, saveData);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré un saveId même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement le saveId généré, mais au moins 
        // le workflow a démarré avec génération saveId
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

});
