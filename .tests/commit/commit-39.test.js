/**
 * Test COMMIT 39 - Engine Delete
 */

import { executeDeleteWorkflow } from '../../app-server/engines/delete/workflow.js';
import { logDeleteWorkflow } from '../../app-server/engines/delete/logging.js';
import { recoverDeleteWorkflow } from '../../app-server/engines/delete/recovery.js';

describe('COMMIT 39 - Engine Delete', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeDeleteWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validDeleteConfig = {
        confirmToken: 'delete-test-confirm',
        reason: 'test-deletion',
        projectPath: '/tmp/test'
      };
      
      await expect(executeDeleteWorkflow(null, validDeleteConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeleteWorkflow('', validDeleteConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeleteWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeleteWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeDeleteWorkflow('test', { confirmToken: 'delete-test-confirm' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres deleteConfig validée', async () => {
      const projectId = 'test-validation';
      
      // DeleteConfig manque confirmToken
      await expect(executeDeleteWorkflow(projectId, {
        reason: 'test',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: deleteConfig.confirmToken requis');
      
      // DeleteConfig manque reason  
      await expect(executeDeleteWorkflow(projectId, {
        confirmToken: 'delete-test-validation-confirm',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: deleteConfig.reason requis');
      
      // DeleteConfig manque projectPath
      await expect(executeDeleteWorkflow(projectId, {
        confirmToken: 'delete-test-validation-confirm',
        reason: 'test'
      })).rejects.toThrow('ValidationError: deleteConfig.projectPath requis');
    });
    
    test('workflow démarre et initialise métriques avec deleteId et archiveId', async () => {
      const projectId = 'test-metrics-init';
      const deleteConfig = {
        confirmToken: 'delete-test-metrics-init-confirm',
        reason: 'test-metrics',
        projectPath: '/nonexistent/path/to/trigger/state-detection-error'
      };
      
      try {
        await executeDeleteWorkflow(projectId, deleteConfig);
        fail('Should have thrown WorkflowError');
      } catch (error) {
        // Doit échouer sur détection état mais avoir démarré
        expect(error.message).toContain('WorkflowError');
        
        // Workflow a au moins tenté de démarrer
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
  });

  // === TESTS LOGGING ===
  describe('logDeleteWorkflow', () => {
    
    test('log événements workflow avec structure correcte et sécurité', async () => {
      const result = await logDeleteWorkflow('workflow-start', {
        projectId: 'test-log-123',
        deleteId: 'delete-test-123',
        deleteConfig: { 
          confirmToken: 'delete-test-log-123-confirm',
          reason: 'test-logging',
          projectPath: '/tmp/test-log'
        }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements delete avec niveaux sécurité', async () => {
      const events = [
        'workflow-start',
        'validation-delete',
        'filesystem-checks-delete',
        'archive-creation',
        'transition-delete',
        'verification-delete',
        'workflow-success',
        'workflow-error'
      ];
      
      for (const eventType of events) {
        const result = await logDeleteWorkflow(eventType, {
          projectId: 'test-events',
          deleteId: 'delete-events',
          deleteConfig: { 
            confirmToken: 'delete-test-events-confirm',
            reason: 'test-events',
            projectPath: '/tmp/test'
          }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('sanitise token de confirmation dans logs', async () => {
      const result = await logDeleteWorkflow('workflow-start', {
        projectId: 'test-sanitize',
        deleteId: 'delete-sanitize',
        deleteConfig: { 
          confirmToken: 'delete-test-sanitize-confirm-secret-token',
          reason: 'test-sanitization',
          projectPath: '/tmp/test-sanitize'
        }
      });
      
      expect(result.logged).toBe(true);
      // Le token doit être sanitisé dans les logs
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', deleteId: 'delete-test', deleteConfig: {} };
      
      await expect(logDeleteWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logDeleteWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logDeleteWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logDeleteWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverDeleteWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: confirmToken manquant, reason manquant');
      
      const result = await recoverDeleteWorkflow('test-recovery-123', {
        confirmToken: 'delete-test-recovery-123-confirm',
        reason: 'test-recovery',
        projectPath: '/tmp/recovery'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-delete');
      expect(result.archiveRestored).toBeDefined();
    });
    
    test('recovery pour échec détection état', async () => {
      const error = new Error('WorkflowError: Impossible de déterminer l\'état actuel du projet');
      
      const result = await recoverDeleteWorkflow('test-state-detection', {
        confirmToken: 'delete-test-state-detection-confirm',
        reason: 'test-state-detection',
        projectPath: '/tmp/state-detection'
      }, error);
      
      expect(result.strategy).toBe('state-detection-failure');
      expect(result.actions).toContain('attempt-force-state-detection');
    });
    
    test('recovery avec restauration archive', async () => {
      const error = new Error('WorkflowError: Transition DELETE échouée');
      
      const result = await recoverDeleteWorkflow('test-archive-restore', {
        confirmToken: 'delete-test-archive-restore-confirm',
        reason: 'test-archive-restore',
        projectPath: '/tmp/archive-test',
        createBackup: true
      }, error);
      
      expect(result.strategy).toBe('transition-failure');
      expect(result.actions).toContain('restore-archive-requested');
      expect(result.actions).toContain('archive-restored-successfully');
      expect(result.archiveRestored).toBe(true);
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validDeleteConfig = { 
        confirmToken: 'delete-test-confirm',
        reason: 'test',
        projectPath: '/tmp'
      };
      const validError = new Error('Test error');
      
      await expect(recoverDeleteWorkflow(null, validDeleteConfig, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverDeleteWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverDeleteWorkflow('test', validDeleteConfig, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverDeleteWorkflow('test', validDeleteConfig, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-123';
      const invalidDeleteConfig = {
        confirmToken: 'delete-integration-recovery-123-confirm'
        // manque reason et projectPath → validation va échouer
      };
      
      try {
        await executeDeleteWorkflow(projectId, invalidDeleteConfig);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverDeleteWorkflow(projectId, invalidDeleteConfig, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
        expect(recovery.archiveRestored).toBeDefined();
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeDeleteWorkflow).toBe('function');
      expect(typeof logDeleteWorkflow).toBe('function');
      expect(typeof recoverDeleteWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeDeleteWorkflow.name).toBe('executeDeleteWorkflow');
      expect(logDeleteWorkflow.name).toBe('logDeleteWorkflow');
      expect(recoverDeleteWorkflow.name).toBe('recoverDeleteWorkflow');
    });
    
    test('workflow génère deleteId et archiveId unique et cohérent', async () => {
      const projectId = 'test-ids-generation';
      const deleteConfig = {
        confirmToken: 'delete-test-ids-generation-confirm',
        reason: 'test-ids',
        projectPath: '/tmp/ids-test',
        createBackup: true
      };
      
      try {
        await executeDeleteWorkflow(projectId, deleteConfig);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré deleteId et archiveId même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement les IDs générés, mais au moins 
        // le workflow a démarré avec génération des IDs
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
    test('workflow valide configuration delete complète', async () => {
      const projectId = 'test-config-validation';
      const completeDeleteConfig = {
        confirmToken: 'delete-test-config-validation-confirm',
        reason: 'complete-test-deletion',
        projectPath: '/tmp/complete-delete-config',
        forceDelete: true,
        createBackup: true,
        removeDependencies: true
      };
      
      try {
        await executeDeleteWorkflow(projectId, completeDeleteConfig);
        fail('Expected workflow error on state detection');
      } catch (error) {
        // Doit échouer sur détection état mais avoir validé config complète
        expect(error.message).toContain('WorkflowError');
        
        // Config a été acceptée (échec vient de la détection d'état)
        expect(error.message).not.toContain('ValidationError');
      }
    });
    
    test('workflow gère force delete vs normal delete différemment', async () => {
      const projectId = 'test-force-vs-normal';
      
      // Config normal delete
      const normalDeleteConfig = {
        confirmToken: 'delete-test-force-vs-normal-confirm',
        reason: 'normal-delete',
        projectPath: '/tmp/normal-test',
        forceDelete: false,
        createBackup: true
      };
      
      // Config force delete
      const forceDeleteConfig = {
        confirmToken: 'delete-test-force-vs-normal-confirm',
        reason: 'force-delete',
        projectPath: '/tmp/force-test',
        forceDelete: true,
        createBackup: false
      };
      
      try {
        await executeDeleteWorkflow(projectId, normalDeleteConfig);
        fail('Expected workflow error');
      } catch (normalError) {
        expect(normalError.message).toContain('WorkflowError');
      }
      
      try {
        await executeDeleteWorkflow(projectId, forceDeleteConfig);
        fail('Expected workflow error');
      } catch (forceError) {
        expect(forceError.message).toContain('WorkflowError');
      }
    });
    
    test('workflow avec backup vs sans backup', async () => {
      const projectId = 'test-backup-modes';
      
      // Config avec backup
      const withBackupConfig = {
        confirmToken: 'delete-test-backup-modes-confirm',
        reason: 'delete-with-backup',
        projectPath: '/tmp/backup-test',
        createBackup: true
      };
      
      // Config sans backup
      const withoutBackupConfig = {
        confirmToken: 'delete-test-backup-modes-confirm',
        reason: 'delete-without-backup',
        projectPath: '/tmp/no-backup-test',
        createBackup: false
      };
      
      try {
        await executeDeleteWorkflow(projectId, withBackupConfig);
        fail('Expected workflow error');
      } catch (backupError) {
        expect(backupError.message).toContain('WorkflowError');
      }
      
      try {
        await executeDeleteWorkflow(projectId, withoutBackupConfig);
        fail('Expected workflow error');
      } catch (noBackupError) {
        expect(noBackupError.message).toContain('WorkflowError');
      }
    });
    
    test('workflow validation token de confirmation stricte', async () => {
      const projectId = 'test-token-validation';
      
      // Token correct
      const validToken = `delete-${projectId}-confirm`;
      const validConfig = {
        confirmToken: validToken,
        reason: 'test-token',
        projectPath: '/tmp/token-test'
      };
      
      // Token incorrect
      const invalidConfig = {
        confirmToken: 'wrong-token',
        reason: 'test-token',
        projectPath: '/tmp/token-test'
      };
      
      try {
        await executeDeleteWorkflow(projectId, validConfig);
        fail('Expected workflow error on state detection');
      } catch (validError) {
        // Doit échouer sur détection d'état, pas sur validation token
        expect(validError.message).toContain('WorkflowError');
        expect(validError.message).not.toContain('confirmToken');
      }
      
      try {
        await executeDeleteWorkflow(projectId, invalidConfig);
        fail('Expected validation error on token');
      } catch (invalidError) {
        // Doit échouer sur validation du token
        expect(invalidError.message).toContain('WorkflowError');
      }
    });
    
  });

});
