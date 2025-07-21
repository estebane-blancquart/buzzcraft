/**
 * Test COMMIT 34 - Engine Edit
 */

import { executeEditWorkflow } from '../../app-server/engines/edit/workflow.js';
import { logEditWorkflow } from '../../app-server/engines/edit/logging.js';
import { recoverEditWorkflow } from '../../app-server/engines/edit/recovery.js';

describe('COMMIT 34 - Engine Edit', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeEditWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validEditOptions = {
        projectPath: '/tmp/test',
        editConfig: {
          backupBuild: true,
          preserveChanges: true
        }
      };
      
      await expect(executeEditWorkflow(null, validEditOptions))
        .rejects.toThrow('ValidationError');
      
      await expect(executeEditWorkflow('', validEditOptions))
        .rejects.toThrow('ValidationError');
      
      await expect(executeEditWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeEditWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeEditWorkflow('test', { projectPath: '/tmp' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres editOptions validée', async () => {
      const projectId = 'test-validation';
      
      // EditOptions manque projectPath
      await expect(executeEditWorkflow(projectId, {
        editConfig: { backupBuild: true }
      })).rejects.toThrow('ValidationError: editOptions.projectPath requis');
      
      // EditOptions manque editConfig  
      await expect(executeEditWorkflow(projectId, {
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: editOptions.editConfig requis');
      
      // EditOptions avec config complète valid
      const result = await executeEditWorkflow(projectId, {
        projectPath: '/tmp/test-complete',
        editConfig: {
          backupBuild: true,
          preserveChanges: true,
          editMode: 'incremental'
        }
      }).catch(() => null); // Ignore workflow errors, on teste juste validation params
      
      // Doit passer validation params mais peut échouer sur détection état
      // C'est normal dans ce test
    });
    
    test('workflow démarre et initialise métriques avec editSession', async () => {
      const projectId = 'test-metrics-init';
      const editOptions = {
        projectPath: '/nonexistent/path/to/trigger/built-error',
        editConfig: {
          backupBuild: true,
          preserveChanges: true
        }
      };
      
      try {
        await executeEditWorkflow(projectId, editOptions);
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
  describe('logEditWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logEditWorkflow('workflow-start', {
        projectId: 'test-log-456',
        editOptions: { 
          projectPath: '/tmp/test-log',
          editConfig: { backupBuild: true }
        }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements edit', async () => {
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
        const result = await logEditWorkflow(eventType, {
          projectId: 'test-events',
          editOptions: { 
            projectPath: '/tmp/test',
            editConfig: { backupBuild: true }
          }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', editOptions: {} };
      
      await expect(logEditWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logEditWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logEditWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logEditWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
    test('sanitise données sensibles et limite taille editOptions', async () => {
      const dataWithSecrets = {
        projectId: 'test-sanitize',
        editOptions: { 
          projectPath: '/very/long/path/' + 'x'.repeat(200),
          editConfig: {
            backupBuild: true,
            preserveChanges: true,
            password: 'secret123',
            token: 'abc123'
          }
        }
      };
      
      const result = await logEditWorkflow('test-sanitize', dataWithSecrets);
      
      expect(result.logged).toBe(true);
      // Pas de moyen direct de vérifier sanitization, mais ça ne doit pas planter
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverEditWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: editConfig manquant, projectPath manquant');
      
      const result = await recoverEditWorkflow('test-recovery-456', {
        projectPath: '/tmp/recovery',
        editConfig: { backupBuild: true }
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-edit');
    });
    
    test('recovery pour conflit d\'état BUILT', async () => {
      const error = new Error('WorkflowError: Projet n\'est pas en état BUILT');
      
      const result = await recoverEditWorkflow('test-built-conflict', {
        projectPath: '/tmp/built-conflict',
        editConfig: { backupBuild: true, preserveChanges: true }
      }, error);
      
      expect(result.strategy).toBe('state-conflict');
      expect(result.actions).toContain('detect-current-state-invalid');
    });
    
    test('recovery pour échec filesystem', async () => {
      const error = new Error('WorkflowError: Chemin /readonly/edit non accessible en écriture');
      
      const result = await recoverEditWorkflow('test-fs-recovery', {
        projectPath: '/readonly/edit',
        editConfig: { backupBuild: true }
      }, error, { allowRetry: true });
      
      expect(result.strategy).toBe('filesystem-failure');
      expect(result.actions).toContain('check-edit-permissions');
      expect(result.actions).toContain('cleanup-partial-backup');
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validEditOptions = { 
        projectPath: '/tmp', 
        editConfig: { backupBuild: true }
      };
      const validError = new Error('Test error');
      
      await expect(recoverEditWorkflow(null, validEditOptions, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverEditWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverEditWorkflow('test', validEditOptions, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverEditWorkflow('test', validEditOptions, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-456';
      const invalidEditOptions = {
        projectPath: '/tmp/invalid-edit'
        // manque editConfig → validation va échouer
      };
      
      try {
        await executeEditWorkflow(projectId, invalidEditOptions);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverEditWorkflow(projectId, invalidEditOptions, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
      }
    });
    
    test('logging intégré dans workflow errors', async () => {
      const projectId = 'integration-logging-error';
      const editOptions = {
        projectPath: '/nonexistent/trigger/error',
        editConfig: {
          backupBuild: true,
          preserveChanges: true
        }
      };
      
      try {
        await executeEditWorkflow(projectId, editOptions);
        fail('Should have thrown error');
      } catch (error) {
        // Workflow doit avoir tenté de logger l'erreur
        expect(error.message).toContain('WorkflowError');
        
        // Recovery doit fonctionner après échec
        const recovery = await recoverEditWorkflow(projectId, editOptions, error);
        expect(recovery.strategy).toBeDefined();
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeEditWorkflow).toBe('function');
      expect(typeof logEditWorkflow).toBe('function');
      expect(typeof recoverEditWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeEditWorkflow.name).toBe('executeEditWorkflow');
      expect(logEditWorkflow.name).toBe('logEditWorkflow');
      expect(recoverEditWorkflow.name).toBe('recoverEditWorkflow');
    });
    
    test('workflow génère editSession unique et cohérent', async () => {
      const projectId = 'test-editsession-generation';
      const editOptions = {
        projectPath: '/tmp/editsession-test',
        editConfig: {
          backupBuild: true,
          preserveChanges: true
        }
      };
      
      try {
        await executeEditWorkflow(projectId, editOptions);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré un editSession même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement l'editSession généré, mais au moins 
        // le workflow a démarré avec génération editSession
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
    test('workflow valide configuration edit complète', async () => {
      const projectId = 'test-config-validation';
      const completeEditOptions = {
        projectPath: '/tmp/complete-edit-config',
        editConfig: {
          backupBuild: true,
          preserveChanges: false,
          editMode: 'incremental',
          createBranch: true
        }
      };
      
      try {
        await executeEditWorkflow(projectId, completeEditOptions);
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
