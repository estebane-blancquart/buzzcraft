/**
 * Test COMMIT 28 - Transition Update
 */

import { validateUpdate } from '../../app-server/transitions/update/validation.js';
import { executeUpdate } from '../../app-server/transitions/update/action.js';
import { cleanupUpdate } from '../../app-server/transitions/update/cleanup.js';

describe('COMMIT 28 - Transition Update', () => {
  
  // === TESTS VALIDATION ===
  describe('validateUpdate', () => {
    
    test('valide transition OFFLINE→OFFLINE avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-789',
        deploymentId: 'deploy-update-456',
        updateConfig: {
          updateType: 'minor',
          createBackup: true,
          version: '2.1.0',
          rollbackOnFailure: true
        }
      };
      
      const result = await validateUpdate('OFFLINE', 'OFFLINE', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-OFFLINE', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-789',
        updateConfig: { updateType: 'patch', createBackup: true, version: '1.1.1', rollbackOnFailure: true }
      };
      
      await expect(validateUpdate('VOID', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateUpdate('DRAFT', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateUpdate('BUILT', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateUpdate('ONLINE', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-OFFLINE', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-789',
        updateConfig: { updateType: 'major', createBackup: true, version: '3.0.0', rollbackOnFailure: false }
      };
      
      await expect(validateUpdate('OFFLINE', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateUpdate('OFFLINE', 'BUILT', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-789'
        // manque updateConfig et deploymentId
      };
      
      const result = await validateUpdate('OFFLINE', 'OFFLINE', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'updateConfig manquant',
        'deploymentId manquant'
      ]);
    });
    
    test('détecte configuration mise à jour incomplète', async () => {
      const contextConfig = {
        projectId: 'test-789',
        deploymentId: 'deploy-456',
        updateConfig: {
          // manque updateType, createBackup, version et rollbackOnFailure
          description: 'Mise à jour de test'
        }
      };
      
      const result = await validateUpdate('OFFLINE', 'OFFLINE', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('updateConfig.updateType manquant');
      expect(result.requirements).toContain('updateConfig.createBackup manquant');
      expect(result.requirements).toContain('updateConfig.version manquant');
      expect(result.requirements).toContain('updateConfig.rollbackOnFailure manquant');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-789',
        updateConfig: { updateType: 'hotfix', createBackup: false, version: '1.0.1', rollbackOnFailure: true }
      };
      
      await expect(validateUpdate(null, 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateUpdate('OFFLINE', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateUpdate('OFFLINE', 'OFFLINE', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeUpdate', () => {
    
    test('exécute transition atomique OFFLINE→OFFLINE', async () => {
      const projectId = 'test-update-789';
      const context = {
        projectId: 'test-update-789',
        deploymentId: 'deploy-update-456',
        updateConfig: {
          updateType: 'major',
          createBackup: true,
          version: '3.0.0',
          rollbackOnFailure: true
        },
        previousVersion: '2.5.1'
      };
      
      const result = await executeUpdate(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('OFFLINE');
      expect(result.toState).toBe('OFFLINE');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.updateConfig).toEqual(context.updateConfig);
      expect(result.transitionData.context.previousVersion).toBe('2.5.1');
      expect(result.transitionData.context.deploymentId).toBe('deploy-update-456');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeUpdate('test-default', {
        projectId: 'test-default',
        deploymentId: 'deploy-default',
        updateConfig: { updateType: 'patch', createBackup: true, version: '1.0.1', rollbackOnFailure: true }
      });
      
      expect(result.transitionData.context.updateType).toBe('patch');
      expect(result.transitionData.context.backupCreated).toBe(true);
      expect(result.transitionData.context.rollbackEnabled).toBe(true);
      expect(result.transitionData.context.previousVersion).toBe('unknown');
    });
    
    test('gère options sans backup ni rollback', async () => {
      const result = await executeUpdate('test-no-safety', {
        projectId: 'test-no-safety',
        deploymentId: 'deploy-risky',
        updateConfig: { updateType: 'emergency', createBackup: false, version: '1.0.2', rollbackOnFailure: false },
        previousVersion: '1.0.0'
      });
      
      expect(result.transitionData.context.backupCreated).toBe(false);
      expect(result.transitionData.context.rollbackEnabled).toBe(false);
      expect(result.transitionData.context.updateType).toBe('emergency');
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { 
        projectId: 'test', 
        deploymentId: 'deploy-789',
        updateConfig: { updateType: 'minor', createBackup: true, version: '1.1.0', rollbackOnFailure: true }
      };
      
      await expect(executeUpdate(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeUpdate('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeUpdate('test-789', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeUpdate('test-structure', {
        projectId: 'test-structure',
        deploymentId: 'deploy-structure',
        updateConfig: { updateType: 'security', createBackup: true, version: '1.2.1', rollbackOnFailure: true }
      });
      
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('fromState');
      expect(result).toHaveProperty('toState');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('transitionData');
      
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.fromState).toBe('string');
      expect(typeof result.toState).toBe('string');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.transitionData).toBe('object');
    });
    
  });

  // === TESTS CLEANUP ===
  describe('cleanupUpdate', () => {
    
    test('nettoie après mise à jour réussie avec backup', async () => {
      const transitionResult = {
        success: true,
        fromState: 'OFFLINE',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            backupCreated: true,
            rollbackEnabled: true
          }
        }
      };
      
      const result = await cleanupUpdate(transitionResult, 'test-update-789');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('validate-post-update-integrity');
      expect(result.actions).toContain('archive-pre-update-backup');
      expect(result.actions).toContain('create-backup-retention-policy');
      expect(result.actions).toContain('update-system-configurations');
      expect(result.actions).toContain('cleanup-old-version-files');
      expect(result.actions).toContain('finalize-update-process');
      expect(result.actions).toContain('update-version-registry');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('cleanup-update-temp-files');
      expect(result.actions).toContain('optimize-storage-post-update');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après mise à jour réussie sans backup', async () => {
      const transitionResult = {
        success: true,
        fromState: 'OFFLINE',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            backupCreated: false,
            rollbackEnabled: false
          }
        }
      };
      
      const result = await cleanupUpdate(transitionResult, 'test-update-789');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).not.toContain('archive-pre-update-backup');
      expect(result.actions).toContain('validate-post-update-integrity');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie après mise à jour échouée avec rollback', async () => {
      const transitionResult = {
        success: false,
        fromState: 'OFFLINE',
        toState: 'OFFLINE',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            rollbackEnabled: true
          }
        }
      };
      
      const result = await cleanupUpdate(transitionResult, 'test-update-789');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('attempt-rollback-to-previous');
      expect(result.actions).toContain('restore-previous-backup');
      expect(result.actions).toContain('cleanup-partial-update-files');
      expect(result.actions).toContain('alert-update-failure');
      expect(result.actions).toContain('validate-system-integrity');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens de mise à jour', async () => {
      const oldTimestamp = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 min ago
      const transitionResult = {
        success: true,
        fromState: 'OFFLINE',
        toState: 'OFFLINE', 
        timestamp: oldTimestamp,
        transitionData: { context: { backupCreated: false } }
      };
      
      const result = await cleanupUpdate(transitionResult, 'test-update-789');
      
      expect(result.actions).toContain('cleanup-old-update-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString(),
        transitionData: { context: {} }
      };
      
      await expect(cleanupUpdate(null, 'test-789'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupUpdate(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupUpdate(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition UPDATE', async () => {
      const projectId = 'integration-update-789';
      const context = {
        projectId: 'integration-update-789',
        deploymentId: 'deploy-integration-456',
        updateConfig: {
          updateType: 'minor',
          createBackup: true,
          version: '2.3.0',
          rollbackOnFailure: true
        },
        previousVersion: '2.2.1'
      };
      
      // 1. Validation
      const validation = await validateUpdate('OFFLINE', 'OFFLINE', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeUpdate(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupUpdate(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('OFFLINE');
      expect(action.toState).toBe('OFFLINE');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        projectId: 'test-789'
        // manque prérequis
      };
      
      const validation = await validateUpdate('OFFLINE', 'OFFLINE', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition UPDATE');
    });
    
  });

});
