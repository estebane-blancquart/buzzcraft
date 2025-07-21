/**
 * Test COMMIT 24 - Transition Edit
 */

import { validateEdit } from '../../app-server/transitions/edit/validation.js';
import { executeEdit } from '../../app-server/transitions/edit/action.js';
import { cleanupEdit } from '../../app-server/transitions/edit/cleanup.js';

describe('COMMIT 24 - Transition Edit', () => {
  
  // === TESTS VALIDATION ===
  describe('validateEdit', () => {
    
    test('valide transition BUILT→DRAFT avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-456',
        projectPath: '/tmp/edit-project',
        editConfig: {
          backupBuild: true,
          preserveChanges: true,
          editMode: 'incremental'
        }
      };
      
      const result = await validateEdit('BUILT', 'DRAFT', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-BUILT', async () => {
      const context = { 
        projectId: 'test', 
        editConfig: { backupBuild: true, preserveChanges: true }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateEdit('VOID', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateEdit('DRAFT', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-DRAFT', async () => {
      const context = { 
        projectId: 'test', 
        editConfig: { backupBuild: true, preserveChanges: true }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateEdit('BUILT', 'BUILT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateEdit('BUILT', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-456'
        // manque editConfig et projectPath
      };
      
      const result = await validateEdit('BUILT', 'DRAFT', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'editConfig manquant',
        'projectPath manquant'
      ]);
    });
    
    test('détecte configuration édition incomplète', async () => {
      const contextConfig = {
        projectId: 'test-456',
        projectPath: '/tmp/test',
        editConfig: {
          // manque backupBuild et preserveChanges
          editMode: 'full'
        }
      };
      
      const result = await validateEdit('BUILT', 'DRAFT', contextConfig);
      
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toContain('editConfig.backupBuild manquant');
      expect(result.requirements).toContain('editConfig.preserveChanges manquant');
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { 
        projectId: 'test', 
        editConfig: { backupBuild: true, preserveChanges: false }, 
        projectPath: '/tmp' 
      };
      
      await expect(validateEdit(null, 'DRAFT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateEdit('BUILT', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateEdit('BUILT', 'DRAFT', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeEdit', () => {
    
    test('exécute transition atomique BUILT→DRAFT', async () => {
      const projectId = 'test-edit-456';
      const context = {
        projectId: 'test-edit-456',
        projectPath: '/tmp/edit-test',
        editConfig: {
          backupBuild: true,
          preserveChanges: false,
          editMode: 'incremental'
        },
        editMode: 'advanced'
      };
      
      const result = await executeEdit(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('BUILT');
      expect(result.toState).toBe('DRAFT');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.editConfig).toEqual(context.editConfig);
      expect(result.transitionData.context.editMode).toBe('advanced');
    });
    
    test('applique valeurs par défaut', async () => {
      const result = await executeEdit('test-default', {
        projectId: 'test-default',
        projectPath: '/tmp/default',
        editConfig: { backupBuild: false, preserveChanges: true }
      });
      
      expect(result.transitionData.context.editMode).toBe('full');
      expect(result.transitionData.context.backupCreated).toBe(false);
      expect(result.transitionData.context.preserveChanges).toBe(true);
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { 
        projectId: 'test', 
        editConfig: { backupBuild: true, preserveChanges: true }, 
        projectPath: '/tmp' 
      };
      
      await expect(executeEdit(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeEdit('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeEdit('test-456', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeEdit('test-structure', {
        projectId: 'test-structure',
        projectPath: '/tmp/structure', 
        editConfig: { backupBuild: false, preserveChanges: false }
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
  describe('cleanupEdit', () => {
    
    test('nettoie après édition réussie avec backup', async () => {
      const transitionResult = {
        success: true,
        fromState: 'BUILT',
        toState: 'DRAFT',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            backupCreated: true
          }
        }
      };
      
      const result = await cleanupEdit(transitionResult, 'test-edit-456');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('archive-previous-build');
      expect(result.actions).toContain('create-build-backup-reference');
      expect(result.actions).toContain('setup-edit-environment');
      expect(result.actions).toContain('index-editable-files');
      expect(result.actions).toContain('mark-project-editable');
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('optimize-edit-workspace');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après édition réussie sans backup', async () => {
      const transitionResult = {
        success: true,
        fromState: 'BUILT',
        toState: 'DRAFT',
        timestamp: new Date().toISOString(),
        transitionData: {
          context: {
            backupCreated: false
          }
        }
      };
      
      const result = await cleanupEdit(transitionResult, 'test-edit-456');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).not.toContain('archive-previous-build');
      expect(result.actions).toContain('setup-edit-environment');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie après édition échouée', async () => {
      const transitionResult = {
        success: false,
        fromState: 'BUILT',
        toState: 'DRAFT',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupEdit(transitionResult, 'test-edit-456');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('rollback-state-to-built');
      expect(result.actions).toContain('cleanup-partial-backup-attempts');
      expect(result.actions).toContain('clear-edit-cache');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens d\'édition', async () => {
      const oldTimestamp = new Date(Date.now() - 25 * 60 * 1000).toISOString(); // 25 min ago
      const transitionResult = {
        success: true,
        fromState: 'BUILT',
        toState: 'DRAFT', 
        timestamp: oldTimestamp,
        transitionData: { context: { backupCreated: false } }
      };
      
      const result = await cleanupEdit(transitionResult, 'test-edit-456');
      
      expect(result.actions).toContain('cleanup-old-edit-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString(),
        transitionData: { context: {} }
      };
      
      await expect(cleanupEdit(null, 'test-456'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupEdit(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupEdit(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition EDIT', async () => {
      const projectId = 'integration-edit-456';
      const context = {
        projectId: 'integration-edit-456',
        projectPath: '/tmp/integration-edit',
        editConfig: {
          backupBuild: true,
          preserveChanges: true,
          editMode: 'full'
        },
        editMode: 'advanced'
      };
      
      // 1. Validation
      const validation = await validateEdit('BUILT', 'DRAFT', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeEdit(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupEdit(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('BUILT');
      expect(action.toState).toBe('DRAFT');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        projectId: 'test-456'
        // manque prérequis
      };
      
      const validation = await validateEdit('BUILT', 'DRAFT', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition EDIT');
    });
    
  });

});
