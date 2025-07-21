/**
 * Test COMMIT 29 - Transition Delete
 */

import { validateDelete } from '../../app-server/transitions/delete/validation.js';
import { executeDelete } from '../../app-server/transitions/delete/action.js';
import { cleanupDelete } from '../../app-server/transitions/delete/cleanup.js';

describe('COMMIT 29 - Transition Delete', () => {
  
  // === TESTS VALIDATION ===
  describe('validateDelete', () => {
    
    test('valide transition DRAFT→VOID avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-delete',
        confirmToken: 'delete-test-project-delete-confirm',
        deleteConfig: {
          forceDelete: false,
          createBackup: true,
          reason: 'obsolete-project',
          removeDependencies: true
        }
      };
      
      const result = await validateDelete('DRAFT', 'VOID', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('valide transition depuis tous les états vers VOID', async () => {
      const context = {
        projectId: 'test-all-states',
        confirmToken: 'delete-test-all-states-confirm',
        deleteConfig: {
          forceDelete: true,
          createBackup: false,
          reason: 'emergency-cleanup',
          removeDependencies: false
        }
      };
      
      const validStates = ['VOID', 'DRAFT', 'BUILT', 'OFFLINE', 'ONLINE'];
      
      for (const state of validStates) {
        const result = await validateDelete(state, 'VOID', context);
        expect(result.valid).toBe(true);
        expect(result.canTransition).toBe(true);
      }
    });
    
    test('rejette transition depuis état invalide', async () => {
      const context = {
        projectId: 'test-invalid',
        confirmToken: 'delete-test-invalid-confirm',
        deleteConfig: {
          forceDelete: false,
          createBackup: true,
          reason: 'test',
          removeDependencies: false
        }
      };
      
      await expect(validateDelete('INVALID', 'VOID', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateDelete('PENDING', 'VOID', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-VOID', async () => {
      const context = {
        projectId: 'test-wrong-target',
        confirmToken: 'delete-test-wrong-target-confirm',
        deleteConfig: {
          forceDelete: false,
          createBackup: true,
          reason: 'test',
          removeDependencies: false
        }
      };
      
      await expect(validateDelete('DRAFT', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateDelete('ONLINE', 'OFFLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-incomplete'
        // manque deleteConfig et confirmToken
      };
      
      const result = await validateDelete('DRAFT', 'VOID', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'deleteConfig manquant',
        'confirmToken manquant'
      ]);
    });
    
    test('détecte configuration suppression incomplète', async () => {
      const contextConfig = {
        projectId: 'test-incomplete-config',
        confirmToken: 'delete-test-incomplete-config-confirm',
        deleteConfig: {
          // manque tous les champs requis
        }
      };
      
      const result = await validateDelete('ONLINE', 'VOID', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('deleteConfig.forceDelete manquant');
      expect(result.requirements).toContain('deleteConfig.createBackup manquant');
      expect(result.requirements).toContain('deleteConfig.reason manquant');
      expect(result.requirements).toContain('deleteConfig.removeDependencies manquant');
    });
    
    test('valide token de confirmation', async () => {
      const contextWrongToken = {
        projectId: 'test-token-validation',
        confirmToken: 'wrong-token',
        deleteConfig: {
          forceDelete: true,
          createBackup: false,
          reason: 'test-token',
          removeDependencies: false
        }
      };
      
      const result = await validateDelete('BUILT', 'VOID', contextWrongToken);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('confirmToken invalide');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = {
        projectId: 'test-params',
        confirmToken: 'delete-test-params-confirm',
        deleteConfig: {
          forceDelete: false,
          createBackup: true,
          reason: 'test-validation',
          removeDependencies: true
        }
      };
      
      await expect(validateDelete(null, 'VOID', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateDelete('DRAFT', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateDelete('DRAFT', 'VOID', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeDelete', () => {
    
    test('exécute transition atomique ONLINE→VOID', async () => {
      const projectId = 'test-delete-execution';
      const context = {
        currentState: 'ONLINE',
        projectId: 'test-delete-execution',
        confirmToken: 'delete-test-delete-execution-confirm',
        deleteConfig: {
          forceDelete: false,
          createBackup: true,
          reason: 'project-completed',
          removeDependencies: true
        }
      };
      
      const result = await executeDelete(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('ONLINE');
      expect(result.toState).toBe('VOID');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.deleteConfig).toEqual(context.deleteConfig);
      expect(result.transitionData.context.deleteReason).toBe('project-completed');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeDelete('test-defaults', {
        projectId: 'test-defaults',
        confirmToken: 'test-token',
        deleteConfig: { forceDelete: false, createBackup: true, reason: 'cleanup', removeDependencies: true }
      });
      
      expect(result.transitionData.context.deleteReason).toBe('cleanup');
      expect(result.transitionData.context.backupRequested).toBe(true);
      expect(result.transitionData.context.forceDelete).toBe(false);
      expect(result.transitionData.context.removeDependencies).toBe(true);
    });
    
    test('gère suppression forcée sans backup', async () => {
      const result = await executeDelete('test-force-delete', {
        currentState: 'OFFLINE',
        projectId: 'test-force-delete',
        confirmToken: 'force-token',
        deleteConfig: { forceDelete: true, createBackup: false, reason: 'emergency', removeDependencies: false }
      });
      
      expect(result.transitionData.context.forceDelete).toBe(true);
      expect(result.transitionData.context.backupRequested).toBe(false);
      expect(result.transitionData.context.removeDependencies).toBe(false);
      expect(result.transitionData.context.deleteReason).toBe('emergency');
      expect(result.fromState).toBe('OFFLINE');
    });
    
    test('gère état inconnu', async () => {
      const result = await executeDelete('test-unknown-state', {
        // pas de currentState
        projectId: 'test-unknown-state',
        confirmToken: 'unknown-token',
        deleteConfig: { forceDelete: true, createBackup: true, reason: 'unknown', removeDependencies: true }
      });
      
      expect(result.fromState).toBe('UNKNOWN');
      expect(result.toState).toBe('VOID');
    });
    
    test('validation paramètres action stricte', async () => {
      const context = {
        projectId: 'test-params',
        confirmToken: 'test-token',
        deleteConfig: { forceDelete: false, createBackup: true, reason: 'test', removeDependencies: false }
      };
      
      await expect(executeDelete(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeDelete('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeDelete('test-project', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeDelete('test-structure', {
        currentState: 'BUILT',
        projectId: 'test-structure',
        confirmToken: 'structure-token',
        deleteConfig: { forceDelete: false, createBackup: true, reason: 'structure-test', removeDependencies: true }
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
  describe('cleanupDelete', () => {
    
    test('nettoie après suppression réussie avec backup', async () => {
      const transitionResult = {
        success: true,
        fromState: 'ONLINE',
        toState: 'VOID',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            backupRequested: true,
            removeDependencies: true
          }
        }
      };
      
      const result = await cleanupDelete(transitionResult, 'test-delete-cleanup');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('create-final-project-backup');
      expect(result.actions).toContain('archive-project-history');
      expect(result.actions).toContain('destroy-all-project-resources');
      expect(result.actions).toContain('remove-project-from-registries');
      expect(result.actions).toContain('release-all-network-resources');
      expect(result.actions).toContain('cleanup-project-dependencies');
      expect(result.actions).toContain('notify-dependent-projects');
      expect(result.actions).toContain('mark-project-destroyed');
      expect(result.actions).toContain('create-deletion-audit-log');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('cleanup-deletion-temp-files');
      expect(result.actions).toContain('optimize-storage-post-deletion');
      expect(result.actions).toContain('update-system-metrics');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après suppression réussie sans backup ni dépendances', async () => {
      const transitionResult = {
        success: true,
        fromState: 'DRAFT',
        toState: 'VOID',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            backupRequested: false,
            removeDependencies: false
          }
        }
      };
      
      const result = await cleanupDelete(transitionResult, 'test-delete-minimal');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).not.toContain('create-final-project-backup');
      expect(result.actions).not.toContain('cleanup-project-dependencies');
      expect(result.actions).toContain('destroy-all-project-resources');
      expect(result.actions).toContain('mark-project-destroyed');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie après suppression échouée', async () => {
      const transitionResult = {
        success: false,
        fromState: 'ONLINE',
        toState: 'VOID',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupDelete(transitionResult, 'test-delete-failed');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('alert-deletion-failure');
      expect(result.actions).toContain('analyze-deletion-failure-cause');
      expect(result.actions).toContain('maintain-previous-state');
      expect(result.actions).toContain('cleanup-partial-deletion-attempts');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens de suppression', async () => {
      const oldTimestamp = new Date(Date.now() - 90 * 60 * 1000).toISOString(); // 90 min ago
      const transitionResult = {
        success: true,
        fromState: 'OFFLINE',
        toState: 'VOID', 
        timestamp: oldTimestamp,
        transitionData: { context: { backupRequested: false, removeDependencies: false } }
      };
      
      const result = await cleanupDelete(transitionResult, 'test-delete-old-logs');
      
      expect(result.actions).toContain('cleanup-old-deletion-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString(),
        transitionData: { context: {} }
      };
      
      await expect(cleanupDelete(null, 'test-project'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupDelete(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupDelete(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition DELETE', async () => {
      const projectId = 'integration-delete-test';
      const context = {
        currentState: 'OFFLINE',
        projectId: 'integration-delete-test',
        confirmToken: 'delete-integration-delete-test-confirm',
        deleteConfig: {
          forceDelete: false,
          createBackup: true,
          reason: 'integration-test-complete',
          removeDependencies: true
        }
      };
      
      // 1. Validation
      const validation = await validateDelete('OFFLINE', 'VOID', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeDelete(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupDelete(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('OFFLINE');
      expect(action.toState).toBe('VOID');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque - token invalide', async () => {
      const context = {
        projectId: 'test-blocked',
        confirmToken: 'wrong-token',
        deleteConfig: {
          forceDelete: false,
          createBackup: true,
          reason: 'blocked-test',
          removeDependencies: false
        }
      };
      
      const validation = await validateDelete('DRAFT', 'VOID', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements).toContain('confirmToken invalide');
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition DELETE');
    });
    
  });

});
