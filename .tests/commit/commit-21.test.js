/**
 * Test COMMIT 21 - Transition Create
 */

import { validateCreate } from '../../app-server/transitions/create/validation.js';
import { executeCreate } from '../../app-server/transitions/create/action.js';
import { cleanupCreate } from '../../app-server/transitions/create/cleanup.js';

describe('COMMIT 21 - Transition Create', () => {
  
  // === TESTS VALIDATION ===
  describe('validateCreate', () => {
    
    test('valide transition VOID→DRAFT avec contexte complet', async () => {
      const context = {
        templateId: 'react-template',
        projectPath: '/tmp/test-project',
        projectName: 'Mon Projet'
      };
      
      const result = await validateCreate('VOID', 'DRAFT', context);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(true);
      expect(result.requirements).toEqual([]);
    });
    
    test('rejette transition depuis état non-VOID', async () => {
      const context = { templateId: 'react', projectPath: '/tmp', projectName: 'test' };
      
      await expect(validateCreate('DRAFT', 'BUILT', context))
        .rejects.toThrow('ValidationError');
      
      await expect(validateCreate('BUILT', 'DRAFT', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('rejette transition vers état non-DRAFT', async () => {
      const context = { templateId: 'react', projectPath: '/tmp', projectName: 'test' };
      
      await expect(validateCreate('VOID', 'BUILT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateCreate('VOID', 'ONLINE', context))
        .rejects.toThrow('ValidationError');
    });
    
    test('détecte prérequis manquants', async () => {
      const contextIncomplet = {
        templateId: 'react-template'
        // manque projectPath et projectName
      };
      
      const result = await validateCreate('VOID', 'DRAFT', contextIncomplet);
      
      expect(result.valid).toBe(true);
      expect(result.canTransition).toBe(false);
      expect(result.requirements).toEqual([
        'projectPath manquant',
        'projectName manquant'
      ]);
    });
    
    test('validation paramètres entrée stricte', async () => {
      const context = { templateId: 'react', projectPath: '/tmp', projectName: 'test' };
      
      await expect(validateCreate(null, 'DRAFT', context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateCreate('VOID', null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(validateCreate('VOID', 'DRAFT', null))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS ACTION ===
  describe('executeCreate', () => {
    
    test('exécute transition atomique VOID→DRAFT', async () => {
      const projectId = 'test-project-123';
      const context = {
        templateId: 'react-template',
        projectPath: '/tmp/test-project',
        projectName: 'Mon Projet'
      };
      
      const result = await executeCreate(projectId, context);
      
      expect(result.success).toBe(true);
      expect(result.fromState).toBe('VOID');
      expect(result.toState).toBe('DRAFT');
      expect(result.timestamp).toBeDefined();
      expect(result.transitionData.projectId).toBe(projectId);
      expect(result.transitionData.context.templateId).toBe('react-template');
    });
    
    test('validation paramètres action stricte', async () => {
      const context = { templateId: 'react', projectPath: '/tmp', projectName: 'test' };
      
      await expect(executeCreate(null, context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeCreate('', context))
        .rejects.toThrow('ValidationError');
        
      await expect(executeCreate('test-123', null))
        .rejects.toThrow('ValidationError');
    });
    
    test('structure retour cohérente', async () => {
      const result = await executeCreate('test-123', {
        templateId: 'html-template',
        projectPath: '/tmp/html-project', 
        projectName: 'Site HTML'
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
  describe('cleanupCreate', () => {
    
    test('nettoie après transition réussie', async () => {
      const transitionResult = {
        success: true,
        fromState: 'VOID',
        toState: 'DRAFT',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupCreate(transitionResult, 'test-project-123');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('clear-validation-cache');
      expect(result.actions).toContain('finalize-transition');
      expect(Array.isArray(result.actions)).toBe(true);
    });
    
    test('nettoie après transition échouée', async () => {
      const transitionResult = {
        success: false,
        fromState: 'VOID',
        toState: 'DRAFT',
        timestamp: new Date().toISOString()
      };
      
      const result = await cleanupCreate(transitionResult, 'test-project-123');
      
      expect(result.cleaned).toBe(true);
      expect(result.actions).toContain('rollback-state-to-void');
      expect(result.actions).toContain('clear-temporary-references');
    });
    
    test('nettoie logs anciens', async () => {
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 min ago
      const transitionResult = {
        success: true,
        fromState: 'VOID',
        toState: 'DRAFT', 
        timestamp: oldTimestamp
      };
      
      const result = await cleanupCreate(transitionResult, 'test-project-123');
      
      expect(result.actions).toContain('cleanup-old-transition-logs');
    });
    
    test('validation paramètres cleanup stricte', async () => {
      const validTransition = {
        success: true,
        timestamp: new Date().toISOString()
      };
      
      await expect(cleanupCreate(null, 'test-123'))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupCreate(validTransition, null))
        .rejects.toThrow('ValidationError');
        
      await expect(cleanupCreate(validTransition, ''))
        .rejects.toThrow('ValidationError');
    });
    
  });

  // === TESTS INTÉGRATION ===
  describe('Intégration validation→action→cleanup', () => {
    
    test('workflow complet transition CREATE', async () => {
      const projectId = 'integration-test-123';
      const context = {
        templateId: 'vue-template',
        projectPath: '/tmp/integration-test',
        projectName: 'Test Intégration'
      };
      
      // 1. Validation
      const validation = await validateCreate('VOID', 'DRAFT', context);
      expect(validation.canTransition).toBe(true);
      
      // 2. Action
      const action = await executeCreate(projectId, context);
      expect(action.success).toBe(true);
      
      // 3. Cleanup 
      const cleanup = await cleanupCreate(action, projectId);
      expect(cleanup.cleaned).toBe(true);
      
      // Vérifier cohérence
      expect(action.fromState).toBe('VOID');
      expect(action.toState).toBe('DRAFT');
      expect(cleanup.actions.length).toBeGreaterThan(0);
    });
    
    test('workflow avec validation qui bloque', async () => {
      const context = {
        templateId: 'react-template'
        // manque prérequis
      };
      
      const validation = await validateCreate('VOID', 'DRAFT', context);
      expect(validation.canTransition).toBe(false);
      expect(validation.requirements.length).toBeGreaterThan(0);
      
      // Ne pas continuer si validation échoue
      console.log('✅ Validation bloque correctement la transition');
    });
    
  });

});