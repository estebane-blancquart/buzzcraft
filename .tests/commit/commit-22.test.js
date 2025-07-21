/**
 * Test COMMIT 22 - Transition Save
 */

import { validateSave } from '../../app-server/transitions/save/validation.js';
import { executeSave } from '../../app-server/transitions/save/action.js';
import { cleanupSave } from '../../app-server/transitions/save/cleanup.js';

describe('COMMIT 22 - Transition Save', () => {
  
  // === TESTS VALIDATION ===
  describe('validateSave', () => {
    
    test('valide transition DRAFT→DRAFT avec contexte complet', async () => {
      const context = {
        projectId: 'test-project-123',
        projectPath: '/tmp/test-project',
        saveData: { content: 'test content' }
      };
      
      const result = await validateSave('DRAFT', 'DRAFT', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-DRAFT', async () => {
      const context = { projectId: 'test', saveData: {}, projectPath: '/tmp' };
      
      await expect(validateSave('VOID', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateSave('BUILT', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-DRAFT', async () => {
      const context = { projectId: 'test', saveData: {}, projectPath: '/tmp' };
      
      await expect(validateSave('DRAFT', 'BUILT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateSave('DRAFT', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        projectId: 'test-123'
        // manque saveData et projectPath
      };
      
      const result = await validateSave('DRAFT', 'DRAFT', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'saveData manquant',
        'projectPath manquant'
      ]);
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { projectId: 'test', saveData: {}, projectPath: '/tmp' };
      
      await expect(validateSave(null, 'DRAFT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateSave('DRAFT', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateSave('DRAFT', 'DRAFT', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeSave', () => {
    
    test('exécute transition atomique DRAFT→DRAFT', async () => {
      const projectId = 'test-project-456';
      const context = {
        projectId: 'test-project-456',
        projectPath: '/tmp/save-test',
        saveData: { content: 'updated content', version: '1.1.0' }
      };
      
      const result = await executeSave(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('DRAFT');
      expect(result.toState).toBe('DRAFT');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.saveData).toEqual(context.saveData);
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { projectId: 'test', saveData: {}, projectPath: '/tmp' };
      
      await expect(executeSave(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeSave('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeSave('test-123', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeSave('test-123', {
        projectId: 'test-123',
        projectPath: '/tmp/test-save', 
        saveData: { name: 'Test Save' }
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
  describe('cleanupSave', () => {
    
    test('nettoie après sauvegarde réussie', async () => {
      const transitionResult = {
        success: true,
        fromState: 'DRAFT',
        toState: 'DRAFT',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupSave(transitionResult, 'test-project-456');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('cleanup-old-save-versions');
      expect(result.actions).toContain('compact-save-data');
      expect(result.actions).toContain('finalize-save');
      expect(result.actions).toContain('clear-validation-cache');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après sauvegarde échouée', async () => {
      const transitionResult = {
        success: false,
        fromState: 'DRAFT',
        toState: 'DRAFT',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupSave(transitionResult, 'test-project-456');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('cleanup-partial-save-files');
      expect(result.actions).toContain('clear-save-cache');
      expect(result.actions).toContain('clear-validation-cache');
    });
    
    test('nettoie logs anciens de sauvegarde', async () => {
      const oldTimestamp = new Date(Date.now() - 15 * 60 * 1000).toISOString(); // 15 min ago
      const transitionResult = {
        success: true,
        fromState: 'DRAFT',
        toState: 'DRAFT', 
        timestamp: oldTimestamp
      };
      
      const result = await cleanupSave(transitionResult, 'test-project-456');
      
      expect(result.actions).toContain('cleanup-old-save-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString()
      };
      
      await expect(cleanupSave(null, 'test-456'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupSave(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupSave(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition SAVE', async () => {
      const projectId = 'integration-save-123';
      const context = {
        projectId: 'integration-save-123',
        projectPath: '/tmp/integration-save',
        saveData: { version: '1.2.0', content: 'saved content' }
      };
      
      // 1. Validation
      const validation = await validateSave('DRAFT', 'DRAFT', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeSave(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupSave(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('DRAFT');
      expect(action.toState).toBe('DRAFT');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        projectId: 'test-123'
        // manque prérequis
      };
      
      const validation = await validateSave('DRAFT', 'DRAFT', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition SAVE');
    });
    
  });

});
