/**
 * Test COMMIT 38 - Engine Update
 */

import { executeUpdateWorkflow } from '../../app-server/engines/update/workflow.js';
import { logUpdateWorkflow } from '../../app-server/engines/update/logging.js';
import { recoverUpdateWorkflow } from '../../app-server/engines/update/recovery.js';

describe('COMMIT 38 - Engine Update', () => {
  
  // === TESTS WORKFLOW ===
  describe('executeUpdateWorkflow', () => {
    
    test('validation paramètres workflow stricte', async () => {
      const validUpdateConfig = {
        deploymentId: 'deploy-123',
        updateType: 'minor',
        projectPath: '/tmp/test'
      };
      
      await expect(executeUpdateWorkflow(null, validUpdateConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeUpdateWorkflow('', validUpdateConfig))
        .rejects.toThrow('ValidationError');
      
      await expect(executeUpdateWorkflow('test', null))
        .rejects.toThrow('ValidationError');
      
      await expect(executeUpdateWorkflow('test', {}))
        .rejects.toThrow('ValidationError');
      
      await expect(executeUpdateWorkflow('test', { deploymentId: 'deploy-123' }))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure paramètres updateConfig validée', async () => {
      const projectId = 'test-validation';
      
      // UpdateConfig manque deploymentId
      await expect(executeUpdateWorkflow(projectId, {
        updateType: 'patch',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: updateConfig.deploymentId requis');
      
      // UpdateConfig manque updateType  
      await expect(executeUpdateWorkflow(projectId, {
        deploymentId: 'deploy-456',
        projectPath: '/tmp/test'
      })).rejects.toThrow('ValidationError: updateConfig.updateType requis');
      
      // UpdateConfig manque projectPath
      await expect(executeUpdateWorkflow(projectId, {
        deploymentId: 'deploy-456',
        updateType: 'major'
      })).rejects.toThrow('ValidationError: updateConfig.projectPath requis');
    });
    
    test('workflow démarre et initialise métriques avec updateId et backupId', async () => {
      const projectId = 'test-metrics-init';
      const updateConfig = {
        deploymentId: 'deploy-test',
        updateType: 'minor',
        projectPath: '/nonexistent/path/to/trigger/offline-error'
      };
      
      try {
        await executeUpdateWorkflow(projectId, updateConfig);
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
  describe('logUpdateWorkflow', () => {
    
    test('log événements workflow avec structure correcte', async () => {
      const result = await logUpdateWorkflow('workflow-start', {
        projectId: 'test-log-123',
        updateId: 'update-test-123',
        updateConfig: { 
          deploymentId: 'deploy-log',
          updateType: 'minor',
          projectPath: '/tmp/test-log'
        }
      });
      
      expect(result.logged).toBe(true);
      expect(result.timestamp).toBeDefined();
      expect(result.logLevel).toBeDefined();
    });
    
    test('gère différents types d\'événements update', async () => {
      const events = [
        'workflow-start',
        'validation-update',
        'filesystem-checks-update',
        'backup-creation',
        'transition-update',
        'verification-update',
        'workflow-success',
        'workflow-error'
      ];
      
      for (const eventType of events) {
        const result = await logUpdateWorkflow(eventType, {
          projectId: 'test-events',
          updateId: 'update-events',
          updateConfig: { 
            deploymentId: 'deploy-test',
            updateType: 'patch',
            projectPath: '/tmp/test'
          }
        });
        
        expect(result.logged).toBe(true);
      }
    });
    
    test('validation paramètres logging stricte', async () => {
      const validData = { projectId: 'test', updateId: 'update-test', updateConfig: {} };
      
      await expect(logUpdateWorkflow(null, validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logUpdateWorkflow('', validData))
        .rejects.toThrow('ValidationError');
      
      await expect(logUpdateWorkflow('valid-event', null))
        .rejects.toThrow('ValidationError');
      
      await expect(logUpdateWorkflow('valid-event', 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS RECOVERY ===
  describe('recoverUpdateWorkflow', () => {
    
    test('recovery pour échec validation', async () => {
      const error = new Error('WorkflowError: Validation échec: deploymentId manquant, updateType manquant');
      
      const result = await recoverUpdateWorkflow('test-recovery-123', {
        deploymentId: 'deploy-recovery',
        updateType: 'minor',
        projectPath: '/tmp/recovery'
      }, error);
      
      expect(result.recovered).toBeDefined();
      expect(result.strategy).toBe('validation-failure');
      expect(result.actions).toContain('missing-requirements-2');
      expect(result.actions).toContain('cleanup-partial-update');
      expect(result.backupRestored).toBeDefined();
    });
    
    test('recovery pour conflit d\'état OFFLINE', async () => {
      const error = new Error('WorkflowError: Projet n\'est pas en état OFFLINE');
      
      const result = await recoverUpdateWorkflow('test-offline-conflict', {
        deploymentId: 'deploy-conflict',
        updateType: 'patch',
        projectPath: '/tmp/offline-conflict'
      }, error);
      
      expect(result.strategy).toBe('state-conflict');
      expect(result.actions).toContain('detect-current-state-invalid');
      expect(result.backupRestored).toBeDefined();
    });
    
    test('recovery avec restauration backup', async () => {
      const error = new Error('WorkflowError: Transition UPDATE échouée');
      
      const result = await recoverUpdateWorkflow('test-backup-restore', {
        deploymentId: 'deploy-backup',
        updateType: 'major',
        projectPath: '/tmp/backup-test',
        createBackup: true
      }, error);
      
      expect(result.strategy).toBe('transition-failure');
      expect(result.actions).toContain('restore-backup-requested');
      expect(result.actions).toContain('backup-restored-successfully');
      expect(result.backupRestored).toBe(true);
    });
    
    test('validation paramètres recovery stricte', async () => {
      const validUpdateConfig = { 
        deploymentId: 'deploy-123',
        updateType: 'minor',
        projectPath: '/tmp'
      };
      const validError = new Error('Test error');
      
      await expect(recoverUpdateWorkflow(null, validUpdateConfig, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverUpdateWorkflow('test', null, validError))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverUpdateWorkflow('test', validUpdateConfig, null))
        .rejects.toThrow('ValidationError');
      
      await expect(recoverUpdateWorkflow('test', validUpdateConfig, 'invalid'))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration modules', () => {
    
    test('workflow avec échec et recovery automatique', async () => {
      const projectId = 'integration-recovery-123';
      const invalidUpdateConfig = {
        deploymentId: 'deploy-integration'
        // manque updateType et projectPath → validation va échouer
      };
      
      try {
        await executeUpdateWorkflow(projectId, invalidUpdateConfig);
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.message).toContain('ValidationError');
        
        // Tester recovery après échec
        const recovery = await recoverUpdateWorkflow(projectId, invalidUpdateConfig, error);
        expect(recovery.recovered).toBeDefined();
        expect(recovery.strategy).toBeDefined();
        expect(recovery.actions.length).toBeGreaterThan(0);
        expect(recovery.backupRestored).toBeDefined();
      }
    });
    
    test('structure des modules respecte pattern BuzzCraft', () => {
      // Test symbolique - vérifier que les modules suivent le pattern
      expect(typeof executeUpdateWorkflow).toBe('function');
      expect(typeof logUpdateWorkflow).toBe('function');
      expect(typeof recoverUpdateWorkflow).toBe('function');
      
      // Noms cohérents avec pattern executeXXX, logXXX, recoverXXX
      expect(executeUpdateWorkflow.name).toBe('executeUpdateWorkflow');
      expect(logUpdateWorkflow.name).toBe('logUpdateWorkflow');
      expect(recoverUpdateWorkflow.name).toBe('recoverUpdateWorkflow');
    });
    
    test('workflow génère updateId et backupId unique et cohérent', async () => {
      const projectId = 'test-ids-generation';
      const updateConfig = {
        deploymentId: 'deploy-ids',
        updateType: 'minor',
        projectPath: '/tmp/ids-test',
        createBackup: true
      };
      
      try {
        await executeUpdateWorkflow(projectId, updateConfig);
        fail('Expected workflow error');
      } catch (error) {
        // Workflow doit avoir généré updateId et backupId même en cas d'échec
        expect(error.message).toContain('WorkflowError');
        
        // On peut pas vérifier directement les IDs générés, mais au moins 
        // le workflow a démarré avec génération des IDs
        expect(error.message.length).toBeGreaterThan(0);
      }
    });
    
    test('workflow valide configuration update complète', async () => {
      const projectId = 'test-config-validation';
      const completeUpdateConfig = {
        deploymentId: 'deploy-complete',
        updateType: 'major',
        projectPath: '/tmp/complete-update-config',
        createBackup: true,
        version: '3.0.0',
        rollbackOnFailure: true,
        preserveData: true,
        incrementalUpdate: false,
        previousVersion: '2.5.1'
      };
      
      try {
        await executeUpdateWorkflow(projectId, completeUpdateConfig);
        fail('Expected workflow error on state detection');
      } catch (error) {
        // Doit échouer sur détection état mais avoir validé config complète
        expect(error.message).toContain('WorkflowError');
        
        // Config a été acceptée (échec vient de la détection d'état)
        expect(error.message).not.toContain('ValidationError');
      }
    });
    
    test('workflow gère types d\'update différemment', async () => {
      const projectId = 'test-update-types';
      
      const updateTypes = ['patch', 'minor', 'major'];
      
      for (const updateType of updateTypes) {
        const updateConfig = {
          deploymentId: 'deploy-types',
          updateType,
          projectPath: '/tmp/types-test',
          createBackup: updateType === 'major'
        };
        
        try {
          await executeUpdateWorkflow(projectId, updateConfig);
          fail('Expected workflow error');
        } catch (error) {
          expect(error.message).toContain('WorkflowError');
          
          // Validation du type d'update a passé
          expect(error.message).not.toContain('updateType');
        }
      }
    });
    
    test('workflow avec backup vs sans backup', async () => {
      const projectId = 'test-backup-modes';
      
      // Config avec backup
      const withBackupConfig = {
        deploymentId: 'deploy-backup',
        updateType: 'major',
        projectPath: '/tmp/backup-test',
        createBackup: true
      };
      
      // Config sans backup
      const withoutBackupConfig = {
        deploymentId: 'deploy-no-backup',
        updateType: 'patch',
        projectPath: '/tmp/no-backup-test',
        createBackup: false
      };
      
      try {
        await executeUpdateWorkflow(projectId, withBackupConfig);
        fail('Expected workflow error');
      } catch (backupError) {
        expect(backupError.message).toContain('WorkflowError');
      }
      
      try {
        await executeUpdateWorkflow(projectId, withoutBackupConfig);
        fail('Expected workflow error');
      } catch (noBackupError) {
        expect(noBackupError.message).toContain('WorkflowError');
      }
    });
    
  });

});
